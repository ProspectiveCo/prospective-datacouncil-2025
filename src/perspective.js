// Perspective imports
// import perspective_viewer from "@finos/perspective-viewer";
// import perspective from "@finos/perspective";

// import SERVER_WASM from "@finos/perspective/dist/wasm/perspective-server.wasm?url";
// import CLIENT_WASM from "@finos/perspective-viewer/dist/wasm/perspective-viewer.wasm?url";

import "https://cdn.jsdelivr.net/npm/@finos/perspective-viewer@3.4.3/dist/cdn/perspective-viewer.js";
import "https://cdn.jsdelivr.net/npm/@finos/perspective-viewer-datagrid@3.4.3/dist/cdn/perspective-viewer-datagrid.js";
import "https://cdn.jsdelivr.net/npm/@finos/perspective-viewer-d3fc@3.4.3/dist/cdn/perspective-viewer-d3fc.js";

import perspective from "https://cdn.jsdelivr.net/npm/@finos/perspective@3.4.3/dist/cdn/perspective.js";

import {conn} from "./duckdb.js";


// await Promise.all([
//     perspective.init_server(fetch(SERVER_WASM)),
//     perspective_viewer.init_client(fetch(CLIENT_WASM)),
// ]);

// Now Perspective API will work!
const client = await perspective.worker();


async function loadPerspectiveTable() {
    if (!conn) {
        console.error("Database connection is not initialized.");
        return;
    }
    const viewer = document.querySelector("#viewer");
    const sql = `
        SELECT * 
        FROM generators
        ORDER BY report_date;
    `;
    const result = await conn.query(sql);
    console.log(`db rows: ${result.numRows}`);
    let data = [];
    for (let i = 0; i < result.numRows; i++) {
        const row = result.get(i);
        data.push({
            plant_name_eia: row['plant_name_eia'],
            report_date: new Date(row['report_date']).toISOString(),
            city: row['city'],
        });
    };
    const table = await client.table(data, {name: "generators", format: "json"});
    viewer.load(table);
    console.log(`viewer loaded: ${data.length} rows`);
}


document.querySelector("#load-table").addEventListener("click", loadPerspectiveTable);
