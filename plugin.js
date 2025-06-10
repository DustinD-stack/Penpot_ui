// plugin.js - Penpot Plugin main code
// This runs in the Penpot environment and interacts with the design and the plugin UI.
 
console.log("Penpot-to-Godot UI Converter plugin started.");
 
// 1. Open the plugin UI (index.html) in a Penpot window:
penpot.ui.open(
  "Penpot to Godot Converter",
  "index.html",
  { width: 400, height: 500 }
 );
// Title of the plugin window
// Path to the UI HTML (relative path, or full URL if hosted) 
// Size of the plugin window
 

// 2. Listen for messages from the plugin UI (iframe):

window.addEventListener("message", async (event) => {
 const msg = event.data;
 if (msg.type === 'EXPORT') {
  // The user initiated an export from the UI, with given options.
  const scope = msg.scope; // "board", "page", or "project"
  const includeImages = msg.images; // boolean - whether to include image assets
  const includeDebug = msg.debug; // boolean - whether to include debug info in JSON
 
  try {
    // 3. Gather design data based on scope:
    let exportData = {};
    let fileName = "penpot_export.json";
 
    if (scope === 'board') {
      // Export the currently selected board (artboard) only
      const board = penpot.content.getSelectedBoard();
      if (!board) {
        throw new Error("No board selected. Please select a board or choose a broader scope.");
      }
      exportData = await exportBoard(board);
      fileName = sanitizeFilename(board.name) + ".json";
    } else if (scope === 'page') {
      // Export all boards on the current page
      const page = penpot.content.getCurrentPage();
      exportData = await exportPage(page);
      fileName = sanitizeFilename(page.name || "page") + ".json";
    } else if (scope === 'project') {
      // Export the entire project (all pages and boards)
      const project = penpot.content.getProject(); // get current project
      exportData = await exportProject(project);
      fileName = sanitizeFilename(project.name || "project") + ".json";
    }
 
    // If including images, gather image assets and incorporate (as separate downloads or as data URIs).
 
    if (includeImages) {
      await collectImages(exportData);
      // Note: We could package images in a ZIP, but for simplicity, assume images are added to exportData or downloaded separately.
    }

    // If debug info is requested, add extra debug markers/data in exportData
    if (includeDebug) {
      addDebugInfo(exportData);
    }


    // 4. Send the JSON data back to the UI for download
    parent.postMessage({ type: 'EXPORT_RESULT', json: exportData, fileName:
fileName }, '*');
    } catch (err) {
      console.error("Export error:", err);
      parent.postMessage({ type: 'ERROR', error: err.message }, '*');
    }
  }
});
 
// Utility function: exportBoard - exports a single board (artboard) and its layers to JSON
async function exportBoard(board) {
  const boardData = {
    name: board.name,
    width: board.width,
    height: board.height,
    layers: []
 };
 
 // Traverse all top-level layers of the board
 for (const layer of board.layers) {
   boardData.layers.push(await exportLayer(layer));
 }
 return boardData;
}

// Utility: exportPage - exports all boards in a page
async function exportPage(page) {
  const pageData = {
    name: page.name,
    boards: []
  };
  for (const board of page.boards) {
    pageData.boards.push(await exportBoard(board));
  }
  return pageData;
}

// Utility: exportProject - exports all pages in the project
async function exportProject(project) {
  const projectData = {
    name: project.name,
    pages: []
  };
  for (const page of project.pages) {
    projectData.pages.push(await exportPage(page));
  }
  return projectData;
}

// Recursive utility: exportLayer - exports a single layer (and children if any)
async function exportLayer(layer) {
  let layerInfo = {
    id: layer.id,
    name: layer.name || "",
    type:
layer.type, // e.g., "frame", "group", "rectangle", "text", "image", etc.
    x: layer.x,
    y: layer.y,
    width: layer.width,
    height: layer.height,
    rotation: layer.rotation || 0
    // Add more properties as needed (e.g., color, text content, font, etc. depending on type)
  };
 
// Specific properties by type:
if (layer.type === "text") {
  layerInfo.text = layer.text; // text content
  layerInfo.font = layer.fontFamily;
  layerInfo.fontSize = layer.fontSize;
  layerInfo.color = layer.fillColor; // e.g., an RGBA or hex
  layerInfo.bold = layer.fontWeight > 400; // simplistic check for bold
  layerInfo.italic = layer.fontItalic || false;
  // ... any other text properties
} else if (layer.type === "shape" || layer.type === "rectangle" || layer.type === "ellipse") {
  layerInfo.fillColor = layer.fillColor;
  layerInfo.strokeColor = layer.strokeColor;
  layerInfo.cornerRadius = layer.cornerRadius;
  // ... shape-specific properties
} else if (layer.type === "image") {
  // For images, perhaps store a reference or data URI; we'll handle actual data in collectImages.
  layerInfo.imageName = layer.name || `image_${layer.id}`;
  layerInfo.imageData = null; // placeholder for image data (set in collectImages)
}
// Check for children (if layer is a group/frame with nested layers)
if (layer.layers && layer.layers.length) {
  layerInfo.children = [];
  for (const child of layer.layers) {
    layerInfo.children.push(await exportLayer(child));
  }
}
return layerInfo;
}


// Utility: collectImages - find all image layers in exportData and get their binary data for export
async function collectImages(exportData) {
  // Traverse through the exportData structure to find image layers and retrieve their data
  const imageLayers = [];
  function findImages(node) {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach(findImages);
    } else if (typeof node === 'object') {
      if (node.type === "image") {
        imageLayers.push(node);
      }
      if (node.children) findImages(node.children);
      if (node.layers) findImages(node.layers);
      if (node.boards) findImages(node.boards);
      if (node.pages) findImages(node.pages);
    }
  }
  findImages(exportData);
  
  for (const imgLayer of imageLayers) {
    try {
      const blob = await penpot.content.getImageBlob(imgLayer.id);
      // Convert blob to data URL (or save for separate download)
      const arrayBuffer = await blob.arrayBuffer();
      const base64 = arrayBufferToBase64(arrayBuffer);
      imgLayer.imageData = "data:image/png;base64," + base64;
      // Alternatively, we could push these blobs to a zip file for download.
    } catch (e) {
      console.error("Could not get image data for layer", imgLayer.name, e);
      imgLayer.imageData = null;
    }
  }
}

// Helper: convert ArrayBuffer to Base64 (for images)
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
  binary += String.fromCharCode(bytes[i]);
 }
 return btoa(binary);
}

// Utility: addDebugInfo - injects debug markers into the exportData (for optional debug mode)
function addDebugInfo(data) {
  // Example: add a flag or outlines for each layer (in JSON, we might mark certain debug info)
  data.debug = true;
  // For each layer, we could add a property like debugBounds or similar. Keeping it simple:
  function tagLayers(node) {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach(tagLayers);
    } else if (typeof node === 'object') {
      if (node.width !== undefined && node.height !== undefined) {
        node._debugFrame = { x: node.x, y: node.y, w: node.width, h:
node.height };
      }
      if (node.children) tagLayers(node.children);
      if (node.layers) tagLayers(node.layers);
      if (node.boards) tagLayers(node.boards);
      if (node.pages) tagLayers(node.pages);
    }
  }
  tagLayers(data);
}
// Utility: sanitizeFilename - make a safe filename from a design name
function sanitizeFilename(name) {
  return name.replace(/[^a-z0-9_\-]/gi, '_').toLowerCase();
}