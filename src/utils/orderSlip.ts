import { API_BASE } from "../config/env";

type SlipJsonResponse = {
  success?: boolean;
  order?: unknown;
  summaryHtml?: string;
  [key: string]: unknown;
};

const readErrorMessage = async (res: Response) => {
  const contentType = (res.headers.get("content-type") || "").toLowerCase();

  if (contentType.includes("application/json")) {
    const json = (await res.json().catch(() => null)) as
      | { message?: string }
      | null;
    return json?.message || `HTTP ${res.status}`;
  }

  const text = await res.text().catch(() => "");
  return text?.trim() || `HTTP ${res.status}`;
};

const getFilenameFromDisposition = (disposition: string | null, fallback: string) => {
  if (!disposition) return fallback;
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);
  const asciiMatch = disposition.match(/filename=\"?([^\";]+)\"?/i);
  if (asciiMatch?.[1]) return asciiMatch[1];
  return fallback;
};

const buildSlipUrl = (
  orderId: string,
  phone?: string,
  options?: { format?: "json" | "pdf"; admin?: boolean }
) => {
  const qs = new URLSearchParams();
  if (options?.format === "pdf") qs.set("format", "pdf");
  if (phone?.trim()) qs.set("phone", phone.trim());

  const base = options?.admin
    ? `${API_BASE}/v1/admin/orders/${encodeURIComponent(orderId)}/slip`
    : `${API_BASE}/v1/orders/${encodeURIComponent(orderId)}/slip`;
  const query = qs.toString();
  return query ? `${base}?${query}` : base;
};

export async function fetchOrderSlipJson(orderId: string, phone?: string, admin = false) {
  const res = await fetch(buildSlipUrl(orderId, phone, { format: "json", admin }), {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const message = await readErrorMessage(res);
    throw new Error(`Slip fetch failed: ${message}`);
  }
  return (await res.json()) as SlipJsonResponse;
}

export async function downloadOrderSlipPdf(orderId: string, phone?: string, admin = false) {
  const res = await fetch(buildSlipUrl(orderId, phone, { format: "pdf", admin }), {
    credentials: "include",
    headers: { Accept: "application/pdf" },
  });
  if (!res.ok) {
    const message = await readErrorMessage(res);
    throw new Error(`PDF download failed: ${message}`);
  }

  const contentType = (res.headers.get("content-type") || "").toLowerCase();
  if (!contentType.includes("application/pdf")) {
    const message = await readErrorMessage(res);
    throw new Error(
      `PDF download failed: expected application/pdf, got ${contentType || "unknown"} (${message})`
    );
  }

  const blob = await res.blob();
  if (!blob.size) throw new Error("PDF download failed: empty file");

  const filename = getFilenameFromDisposition(
    res.headers.get("content-disposition"),
    `zaikest-order-summary-${orderId}.pdf`
  );

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
