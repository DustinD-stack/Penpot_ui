// Open the plugin UI panel in Penpot
penpot.ui.open("Penpot to Godot Exporter", "", {
  width: 500,
  height: 600
});

// Listen for messages from Penpot (e.g., frame/layer data)
window.addEventListener("message", (event) => {
  console.log("[plugin.js] Message received from Penpot:", event.data);

  // Example: display layer data
  if (event.data && event.data.layers) {
    const layers = event.data.layers;
    console.log("[plugin.js] Layers:", layers);

    // You can add DOM updates here (e.g., fill in a list or UI)
  }
});

// Example function: Send data back to Penpot (if needed)
function sendMessageToPenpot() {
  const message = { type: "export-confirmed", status: "ready" };
  parent.postMessage(message, "*");
}



