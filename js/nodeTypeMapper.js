console.debug("[nodeTypeMapper] Loaded")

function mapNodeType(layer) {
  console.debug(`[nodeTypeMapper] Mapping node type for: ${layer.name}`)

  const typeMap = {
    "button": "Button",
    "label": "Label",
    "image": "TextureRect",
    "background": "ColorRect"
  };

  const guess = typeMap[layer.role?.toLowerCase()] || "Control";
  console.debug(`[nodeTypeMapper] Mapped to: ${guess}`)
  return guess;
}
