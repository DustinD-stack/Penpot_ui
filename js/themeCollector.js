console.debug("[themeCollector] Loaded")

function extractTheme(layer) {
  console.debug(`[themeCollector] Extracting theme for: ${layer.name}`)

  return {
    font_color: layer.style?.textColor || "#FFFFFF",
    background_color: layer.style?.backgroundColor || "#000000",
    font_size: layer.style?.fontSize || 14,
    border_radius: layer.style?.borderRadius || 0
  };
}
