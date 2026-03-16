export function exportSVG(svgEl: SVGSVGElement, filename = "graph.svg") {
  const clone = svgEl.cloneNode(true) as SVGSVGElement;

  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(clone);

  const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

export function exportPNG(svgEl: SVGSVGElement, filename = "graph.png") {
  const clone = svgEl.cloneNode(true) as SVGSVGElement;

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clone);

  const img = new Image();
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = img.width * 2;
    canvas.height = img.height * 2;

    const ctx = canvas.getContext("2d")!;
    ctx.scale(2, 2);
    ctx.drawImage(img, 0, 0);

    canvas.toBlob(blob => {
      if (!blob) return;
      const pngUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = pngUrl;
      a.download = filename;
      a.click();

      URL.revokeObjectURL(pngUrl);
    });

    URL.revokeObjectURL(url);
  };

  img.src = url;
}
