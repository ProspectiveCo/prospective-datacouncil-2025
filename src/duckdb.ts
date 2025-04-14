import * as duckdb from '@duckdb/duckdb-wasm';
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import mvp_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import duckdb_wasm_eh from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import eh_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';

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
const logger = new duckdb.ConsoleLogger();
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


let result = await conn.query("SELECT * FROM generators ORDER BY report_date;");
console.log(`rows: ${result.numRows}`);
for (let i = 0; i < result.numRows; i++) {
    const row = result.get(i)!;
    if (i >= 554540) {
        const report_date = new Date(row['report_date']).toISOString();
        console.log(`row ${i}: plant_name: ${row['plant_name_eia']}, date: ${report_date}, city: ${row['city']}`);
    }
}

result = await conn.query("SELECT COUNT(*) as 'numrows' FROM generators limit 10;");
console.log(`rows: ${result.numRows}`);
console.log(result.toString());

const statusDiv = document.querySelector<HTMLDivElement>('#status')!;
const firstRow = result.get(0)!['numrows'];
statusDiv.innerHTML = `duckdb loaded: ${firstRow}`;
