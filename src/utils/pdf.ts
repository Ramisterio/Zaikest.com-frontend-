export const downloadPdfFromHtml = async (
  html: string,
  filename: string,
  options?: { stripImages?: boolean; forcePlainText?: boolean }
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
  if (options?.forcePlainText) {
    const pre = document.createElement("pre");
    pre.style.whiteSpace = "pre-wrap";
    pre.style.wordBreak = "break-word";
    pre.style.fontFamily = "Arial, sans-serif";
    pre.style.fontSize = "13px";
    pre.style.lineHeight = "1.5";
    pre.textContent =
      (content.textContent || "").trim() ||
      "Order summary slip is available but content could not be rendered.";
    container.appendChild(pre);
  } else {
    container.append(...Array.from(content.childNodes));
  }
  document.body.appendChild(container);
  await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
  await Promise.all(
    Array.from(container.querySelectorAll("img")).map(
      (img) =>
        new Promise<void>((resolve) => {
          const image = img as HTMLImageElement;
          if (image.complete && image.naturalWidth > 0) {
            resolve();
            return;
          }
          const timeoutId = window.setTimeout(() => resolve(), 3000);
          const done = () => {
            window.clearTimeout(timeoutId);
            resolve();
          };
          image.onload = done;
          image.onerror = done;
        })
    )
  );

  try {
    let blob: Blob = await html2pdf()
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

    // If render is unexpectedly tiny/blank, retry with a plain-text fallback
    // to guarantee the downloaded PDF contains slip details.
    if (blob.size < 1000) {
      const fallbackContainer = document.createElement("div");
      fallbackContainer.style.position = "absolute";
      fallbackContainer.style.left = "-9999px";
      fallbackContainer.style.top = "0";
      fallbackContainer.style.width = "794px";
      fallbackContainer.style.padding = "24px";
      fallbackContainer.style.background = "#ffffff";
      fallbackContainer.style.color = "#111111";

      const plain = (content.textContent || "").trim();
      const pre = document.createElement("pre");
      pre.style.whiteSpace = "pre-wrap";
      pre.style.wordBreak = "break-word";
      pre.style.fontFamily = "Arial, sans-serif";
      pre.style.fontSize = "13px";
      pre.style.lineHeight = "1.5";
      pre.textContent = plain || "Order summary slip is available but content could not be rendered.";
      fallbackContainer.appendChild(pre);
      document.body.appendChild(fallbackContainer);

      try {
        blob = await html2pdf()
          .from(fallbackContainer)
          .set({
            margin: 10,
            filename,
            html2canvas: {
              scale: 2,
              useCORS: true,
              backgroundColor: "#ffffff",
              windowWidth: 794,
              windowHeight: fallbackContainer.scrollHeight,
              imageTimeout: 15000,
            },
            jsPDF: { unit: "pt", format: "a4", orientation: "portrait" },
          })
          .outputPdf("blob");
      } finally {
        document.body.removeChild(fallbackContainer);
      }
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
