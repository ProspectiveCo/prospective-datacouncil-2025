import { client } from "./perspective.js";
import { conn, db } from "./duckdb.js";


const GENERATORS_URL = "https://perspective-demo-dataset.s3.us-east-1.amazonaws.com/pudl/generators_monthly_2022-2023_lg.parquet";


export function setStatus(msg = "Ready", showSpinner = false) {
    const statusDiv = document.querySelector("#status");
    const spinner = document.querySelector("#spinner");
    spinner.style.display = showSpinner ? "inline-block" : "none";
    statusDiv.textContent = msg;
}


document.querySelector("#load-duckdb").addEventListener("click", async (event) => {
    try {
        setStatus("Loading DuckDB...", true);
        await conn.query(`
            CREATE TABLE generators AS
            SELECT * FROM '${GENERATORS_URL}'
        `);
        const numRows = (await conn.query("SELECT COUNT(*) as 'numrows' FROM generators")).get(0)['numrows'];
        setStatus(`DuckDB loaded: ${numRows} rows`, false);
        event.target.disabled = true;
    } catch (error) {
        setStatus("Failed to load DuckDB", false);
    }
});



document.querySelector("#load-table").addEventListener("click", async () => {
    try {
        setStatus(`Running query...`, true);
        const sql = `
            SELECT plant_name_eia, report_date, city, state, capacity_mw, energy_source, fuel_type
            FROM generators
            ORDER BY report_date;
        `;
        const result = await conn.query(sql);
        console.log(`db rows: ${result.numRows}`);

        setStatus(`Loaded ${result.numRows} rows. Converting data...`, true);
        const data = Array.from({ length: result.numRows }, (_, i) => {
            const row = result.get(i);
            return { ...row, report_date: new Date(row['report_date']).toISOString() };
        });

        const viewer = document.querySelector("#viewer");
        const table = await client.table(data, { name: "generators", format: "json" });
        viewer.load(table);
        console.log(`viewer loaded: ${data.length} rows`);
        setStatus(`Loaded ${data.length} rows.`, false);
    } catch (error) {
        console.error("Failed to load Perspective table:", error);
    }
});
