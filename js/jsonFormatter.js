console.debug("[jsonFormatter] Loaded")

function exportToJSON(frame) {
  console.debug("[jsonFormatter] Starting export")

  const layers = getFrameLayers(frame);
  const json = JSON.stringify(layers, null, 2);

  console.debug("[jsonFormatter] Final JSON:", json)
  return json;
}
