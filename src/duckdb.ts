import * as duckdb from '@duckdb/duckdb-wasm';
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import mvp_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import duckdb_wasm_eh from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import eh_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';


// Perspective imports
// import perspective_viewer from "@finos/perspective-viewer";
// import perspective from "@finos/perspective";

// import SERVER_WASM from "@finos/perspective/dist/wasm/perspective-server.wasm?url";
// import CLIENT_WASM from "@finos/perspective-viewer/dist/wasm/perspective-viewer.wasm?url";
// import { PerspectiveViewerElement } from '@finos/perspective-viewer/dist/wasm/perspective-viewer.js';
// import { PerspectiveViewerElementExt } from '@finos/perspective-viewer/src/ts/extensions.js';

import "https://cdn.jsdelivr.net/npm/@finos/perspective-viewer@3.5.1/dist/cdn/perspective-viewer.js";
import "https://cdn.jsdelivr.net/npm/@finos/perspective-viewer-datagrid@3.5.1/dist/cdn/perspective-viewer-datagrid.js";
import "https://cdn.jsdelivr.net/npm/@finos/perspective-viewer-d3fc@3.5.1/dist/cdn/perspective-viewer-d3fc.js";

import perspective from "https://cdn.jsdelivr.net/npm/@finos/perspective@3.5.1/dist/cdn/perspective.js";


// await Promise.all([
//     perspective.init_server(fetch(SERVER_WASM)),
//     perspective_viewer.init_client(fetch(CLIENT_WASM)),
// ]);

// Now Perspective API will work!
const client = await perspective.worker();



const statusDiv = document.querySelector<HTMLDivElement>('#status')!;
statusDiv.innerHTML = 'initializing duckdb wasm...';


const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
    mvp: {
        mainModule: duckdb_wasm,
        mainWorker: mvp_worker,
    },
    eh: {
        mainModule: duckdb_wasm_eh,
        mainWorker: eh_worker,
    },
};
// Select a bundle based on browser checks
const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
// Instantiate the asynchronus version of DuckDB-wasm
const worker = new Worker(bundle.mainWorker!);
// const logger = new duckdb.ConsoleLogger();
const logger = new duckdb.VoidLogger();
const db = new duckdb.AsyncDuckDB(logger, worker);
await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
const conn = await db.connect();
console.log('DuckDB-wasm instantiated');

// Export db and conn to make them accessible globally
(globalThis as any).db = db;
(globalThis as any).conn = conn;

// do stuff
// Create a new connection
// await conn.query("CREATE TABLE test (a INTEGER, b VARCHAR);");
// await conn.query("INSERT INTO test VALUES (1, 'foo'), (2, 'bar');");
// const result = await conn.query("SELECT * FROM test;");
// console.log(`rows: ${result.numRows}`);
// console.log(result.toString());




// insert data from parquet file
const dataFile = 'https://perspective-demo-dataset.s3.us-east-1.amazonaws.com/pudl/generators_monthly_2022-2023_lg.parquet';
await conn.query(`
    CREATE TABLE generators AS
        SELECT * FROM '${dataFile}'
`);

statusDiv.innerHTML = 'loading duckdb...';

let result;



result = await conn.query("SELECT COUNT(*) as 'numrows' FROM generators limit 10;");
console.log(`rows: ${result.numRows}`);
console.log(result.toString());

const nrows = result.get(0)!['numrows'];
statusDiv.innerHTML = `duckdb loaded: ${nrows.toLocaleString()} rows`;


// const viewer = document.createElement("perspective-viewer");
const viewer = document.getElementById("viewer")! as unknown as PerspectiveViewerElement;
// const viewer = document.querySelector<PerspectiveViewerElement>('#viewer')!;
// read the generators table from duckdb
result = await conn.query("SELECT * FROM generators ORDER BY report_date;");

let data = [];
for (let i = 0; i < result.numRows; i++) {
    const row = result.get(i)!;
    data.push({
        plant_name_eia: row['plant_name_eia'],
        report_date: new Date(row['report_date']).toISOString(),
        city: row['city'],
    });
}

const table = await client.table(data, {name: "generators", format: "json"});
viewer.load(table);
console.log(`viewer loaded: ${data.length} rows`);
// const container = document.querySelector<HTMLDivElement>('#perspective-container')!;
// container.appendChild(viewer);
// viewer.setAttribute("theme", "Pro Dark");


// console.log(data);
// result.schema.fields.forEach((field) => {
//     console.log(`field: ${field.name}, type: ${field.type}`);
// });
// console.log(`rows: ${result.numRows}`);
// for (let i = 0; i < result.numRows; i++) {
//     const row = result.get(i)!;
//     if (i >= 554540) {
//         const report_date = new Date(row['report_date']).toISOString();
//         console.log(`row ${i}: plant_name: ${row['plant_name_eia']}, date: ${report_date}, city: ${row['city']}`);
//     }
// }

