export const downloadPdfFromHtml = async (html: string, filename: string) => {
  if (typeof window === "undefined") return;
  if (!html.trim()) return;

  const html2pdfModule: any = await import("html2pdf.js");
  const html2pdf = html2pdfModule?.default || html2pdfModule;

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-10000px";
  container.style.top = "0";
  container.style.width = "794px";
  container.style.padding = "24px";
  container.style.background = "#ffffff";

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const content = doc.body || doc;
  container.append(...Array.from(content.childNodes));
  document.body.appendChild(container);

  try {
    await html2pdf()
      .from(container)
      .set({
        margin: 10,
        filename,
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "pt", format: "a4", orientation: "portrait" },
      })
      .save();
  } finally {
    document.body.removeChild(container);
  }
};
