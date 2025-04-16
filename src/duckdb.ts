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
const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
const worker = new Worker(bundle.mainWorker!);
const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.INFO);
const db = new duckdb.AsyncDuckDB(logger, worker);
await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
const conn = await db.connect();
console.log('duckdb-wasm initialized');
export { db, conn };


const statusDiv = document.querySelector('#status')!;
statusDiv.innerHTML = 'initializing duckdb wasm...';


// insert data from parquet file
const dataFile = 'https://perspective-demo-dataset.s3.us-east-1.amazonaws.com/pudl/generators_monthly_2022-2023_lg.parquet';
await conn.query(`
    CREATE TABLE generators AS
        SELECT * FROM '${dataFile}'
`);

statusDiv.innerHTML = 'loading duckdb...';



const result = await conn.query("SELECT COUNT(*) as 'numrows' FROM generators limit 10;");
console.log(`rows: ${result.numRows}`);
console.log(result.toString());

const nrows = result.get(0)!['numrows'];
statusDiv.innerHTML = `duckdb loaded: ${nrows.toLocaleString()} rows`;


