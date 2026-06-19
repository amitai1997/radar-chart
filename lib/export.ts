/**
 * Rasterize a live <svg> element to a high-resolution PNG and download it.
 *
 * Crispness comes from serializing the SVG at `scale x` its logical size so the
 * browser rasterizes the *vector* at high resolution — not from upscaling a
 * bitmap. The chart uses a system-font stack and no external resources, so the
 * canvas is never tainted and no @font-face embedding is required.
 */
export async function exportSvgToPng(
  svg: SVGSVGElement,
  opts: { width: number; height: number; scale?: number; fileName?: string },
): Promise<void> {
  const { width, height, scale = 2, fileName = "radar-chart.png" } = opts;

  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("width", String(width * scale));
  clone.setAttribute("height", String(height * scale));
  clone.setAttribute("viewBox", `0 0 ${width} ${height}`);
  if (!clone.getAttribute("xmlns")) {
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  }

  const xml = new XMLSerializer().serializeToString(clone);
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;

  const img = await loadImage(url);

  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2D canvas context.");
  ctx.drawImage(img, 0, 0, width * scale, height * scale);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("PNG encoding failed."))),
      "image/png",
    );
  });

  triggerDownload(blob, fileName);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to render SVG to image."));
    img.src = src;
  });
}

function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick so the download has a chance to start.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "radar-chart"
  );
}
