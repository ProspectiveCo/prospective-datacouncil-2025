import "https://cdn.jsdelivr.net/npm/@finos/perspective-viewer@3.4.3/dist/cdn/perspective-viewer.js";
import "https://cdn.jsdelivr.net/npm/@finos/perspective-viewer-datagrid@3.4.3/dist/cdn/perspective-viewer-datagrid.js";
import "https://cdn.jsdelivr.net/npm/@finos/perspective-viewer-d3fc@3.4.3/dist/cdn/perspective-viewer-d3fc.js";
import perspective from "https://cdn.jsdelivr.net/npm/@finos/perspective@3.4.3/dist/cdn/perspective.js";

// Now Perspective API will work!
const client = await perspective.worker();
export {client};

