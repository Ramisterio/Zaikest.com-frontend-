export const downloadPdfFromHtml = async (
  html: string,
  filename: string,
  options?: { stripImages?: boolean }
) => {
  if (typeof window === "undefined") return;
  if (!html.trim()) return;

  const html2pdfModule: any = await import("html2pdf.js");
  const html2pdf = html2pdfModule?.default || html2pdfModule;

  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "794px";
  container.style.padding = "24px";
  container.style.background = "#ffffff";
  container.style.color = "#111111";
  container.style.opacity = "1";

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const content = doc.body || doc;
  const images = content.querySelectorAll?.("img") || [];
  images.forEach((img: any) => {
    try {
      if (options?.stripImages) {
        img.remove();
      } else {
        img.crossOrigin = "anonymous";
      }
    } catch {
      // ignore
    }
  });
  container.append(...Array.from(content.childNodes));
  document.body.appendChild(container);
  await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

  try {
    const blob: Blob = await html2pdf()
      .from(container)
      .set({
        margin: 10,
        filename,
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          windowWidth: Math.max(container.scrollWidth, 794),
          windowHeight: container.scrollHeight,
          imageTimeout: 15000,
        },
        jsPDF: { unit: "pt", format: "a4", orientation: "portrait" },
      })
      .outputPdf("blob");

    if (blob.size < 1000) {
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      document.body.appendChild(iframe);
      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
        iframe.onload = () => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          document.body.removeChild(iframe);
        };
      } else {
        document.body.removeChild(iframe);
      }
      return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } finally {
    document.body.removeChild(container);
  }
};
