import { conn, db } from "./duckdb.js";
import { client } from "./perspective.js";
import { getPredicates } from "./query.js";


const PLANTS_URL = "https://perspective-demo-dataset.s3.us-east-1.amazonaws.com/pudl/generators_monthly_2020-2023.parquet";


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
            SELECT * FROM '${PLANTS_URL}'
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
                plant_name, report_date, 
                city, state, county, lat, lon,
                status_code, net_gen_mwh, capacity, 
                fuel_type, tech_desc
            FROM generators
            ${getPredicates()}
            ORDER BY report_date;
        `;
        console.log("SQL:", sql);
        const result = await conn.query(sql);
        const data = result.toArray();
        console.log(`db rows: ${result.numRows}`);
        
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
