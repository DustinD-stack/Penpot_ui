// jsonFormatter.js - Utility to format JSON data (e.g., pretty-print) before 
download
 const JSONFormatter = {
 format: function(jsonObject) {
 // Pretty-print JSON with 2-space indentation
 try {
 if (typeof jsonObject === 'string') {
 // If already a string, parse and re-stringify for formatting
 jsonObject = JSON.parse(jsonObject);
 }
 return JSON.stringify(jsonObject, null, 2);
 } catch (e) {
 console.error("JSON format error:", e);
 return JSON.stringify(jsonObject); // fallback to raw stringify
 }
 }
 };