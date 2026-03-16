export function renderClusterLegend(
  container: HTMLDivElement,
  clusters: string[],
  colorFor: (cluster: string) => string
) {
  container.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";
  wrapper.style.gap = "6px";
  wrapper.style.padding = "10px";
  wrapper.style.background = "rgba(255,255,255,0.9)";
  wrapper.style.border = "1px solid #ccc";
  wrapper.style.borderRadius = "6px";
  wrapper.style.fontSize = "12px";
  wrapper.style.color = "#333";

  clusters.forEach(cluster => {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.gap = "8px";

    const swatch = document.createElement("div");
    swatch.style.width = "14px";
    swatch.style.height = "14px";
    swatch.style.borderRadius = "3px";
    swatch.style.background = colorFor(cluster);
    swatch.style.border = "1px solid #666";

    const label = document.createElement("span");
    label.textContent = cluster;

    row.appendChild(swatch);
    row.appendChild(label);
    wrapper.appendChild(row);
  });

  container.appendChild(wrapper);
}
