import { conn, db } from "./duckdb.js";
import { client } from "./perspective.js";
import { getPredicates } from "./query.js";

const GENERATORS_URL = "https://perspective-demo-dataset.s3.us-east-1.amazonaws.com/pudl/generators_monthly_2022-2023_lg.parquet";


function setStatus(msg = "Ready", showSpinner = false) {
    const statusDiv = document.querySelector("#status");
    const spinner = document.querySelector("#spinner");
    spinner.style.display = showSpinner ? "inline-block" : "none";
    statusDiv.textContent = msg;
}


document.querySelector("#load").addEventListener("click", async (event) => {
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


document.querySelector("#query").addEventListener("click", async () => {
    try {
        setStatus(`Running query...`, true);
        const sql = `
            SELECT 
                plant_name_eia as plant_name, report_date, 
                city, state, county, latitude, longitude, timezone,
                net_generation_mwh, capacity_mw, 
                energy_source, fuel_type, technology_description, primary_mover
            FROM generators
            ${getPredicates()}
            ORDER BY report_date;
        `;
        console.log("SQL:", sql);
        const result = await conn.query(sql);
        console.log(`db rows: ${result.numRows}`);

        setStatus(`Loaded ${result.numRows} rows. Converting data...`, true);
        const data = Array.from({ length: result.numRows }, (_, i) => {
            const row = result.get(i);
            return { ...row, report_date: new Date(row['report_date']).toISOString() };
        });
        let viewer = document.querySelector("#viewer");
        const table = await client.table(data, { format: "json" });
        const config = { ...await viewer.save(), settings: true, plugin_config: { edit_mode: "READ_ONLY" } };
        viewer.load(table);
        viewer.restore(config);
        setStatus(`Loaded ${data.length} rows.`, false);
    } catch (error) {
        setStatus("Failed to load table", false);
        console.error("Failed to load Perspective table:", error);
    }
});
