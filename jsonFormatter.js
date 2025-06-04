export function exportToJSON(frame) {
  const simplified = {
    id: frame.id,
    name: frame.name,
    width: frame.width,
    height: frame.height,
    layers: frame.layers.map(layer => ({
      id: layer.id,
      name: layer.name,
      role: layer.role || "Control",
      x: layer.x,
      y: layer.y,
      width: layer.width,
      height: layer.height
    }))
  };

  return JSON.stringify(simplified, null, 2);
}
