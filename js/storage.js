export function saveFlow(graph) {
  localStorage.setItem("flowchart", JSON.stringify(graph));
}

export function loadFlow() {
  return JSON.parse(localStorage.getItem("flowchart"));
}

export function exportToImage() {
  // Convert canvas to image
  console.log("Exporting to image...");
}
