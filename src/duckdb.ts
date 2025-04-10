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
const datafileUrl = 'https://perspective-demo-dataset.s3.us-east-1.amazonaws.com/pudl/generators_monthly_2022-2023_lg.parquet';
await conn.query(`
    CREATE TABLE generators AS
        SELECT * FROM '${datafileUrl}'
`);
const result2 = await conn.query("SELECT COUNT(*) FROM generators limit 10;");
console.log(`rows: ${result2.numRows}`);
console.log(result2.toString());
