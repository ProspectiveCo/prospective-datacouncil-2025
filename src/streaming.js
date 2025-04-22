import { conn } from "./duckdb.js";
import { client } from "./perspective.js";


const PLANTS_URL = "https://perspective-demo-dataset.s3.us-east-1.amazonaws.com/pudl/generators_monthly_2020-2023.parquet";
const START_MONTH = new Date(2020, 0, 1);
const END_MONTH = new Date(2024, 0, 1);
let currDate = START_MONTH;
let viewSet = false;

const VIEW_CONFIG_1 = {
    plugin: "Datagrid",
    plugin_config: { edit_mode: "READ_ONLY" },
    settings: false,
    theme: "Pro Dark",
    title: "Power Plants by State and Fuel Type",
    group_by: ["state"],
    split_by: ["fuel_type"],
    columns: ["net_gen_mwh"],
    filter: [["net_gen_mwh", ">", 0]],
    sort: [["state", "asc"]],
    expressions: {},
    aggregates: {}
};


function setStatus(msg = "Ready", showSpinner = false) {
    const statusDiv = document.querySelector("#status");
    const spinner = document.querySelector("#spinner");
    spinner.style.display = showSpinner ? "inline-block" : "none";
    statusDiv.textContent = msg;
}


function addWholeMonths(date, months) {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() + months, 1); // Set to 1st of the target month
    return newDate;
}


async function loadDuckDB() {
    try {
        setStatus("Loading DuckDB...", true);
        await conn.query(`
            CREATE TABLE generators AS
            SELECT 
                CAST(plant_id as INT) as plant_id, plant_name, report_date, 
                city, state, county, lat, lon,
                status_code, net_gen_mwh, capacity, 
                fuel_type, tech_desc
            FROM '${PLANTS_URL}'
        `);
        const numRows = (await conn.query("SELECT COUNT(*) as 'numrows' FROM generators")).get(0)['numrows'];
        setStatus(`DuckDB loaded: ${numRows} rows`, false);
    } catch (error) {
        setStatus("Failed to load DuckDB", false);
    }
}


async function createPerspectiveTable() {
    const schema = {
        plant_id: "integer",
        plant_name: "string",
        report_date: "date",
        city: "string",
        state: "string",
        county: "string",
        lat: "float",
        lon: "float",
        status_code: "string",
        net_gen_mwh: "float",
        capacity: "float",
        fuel_type: "string",
        tech_desc: "string",
    };
    const table = await client.table(schema, { name: "generators", index: "plant_id" });
    const viewer = document.querySelector("#viewer");
    // const config = { ...await viewer.save(), settings: true, plugin_config: { edit_mode: "READ_ONLY" } };
    viewer.load(table);
    // viewer.restore(config);
    return table;
}


async function updatePerspectiveTable(table) {
    try {
        const sql = `
            SELECT 
                plant_id, plant_name, report_date, 
                city, state, county, lat, lon,
                status_code, net_gen_mwh, capacity, 
                fuel_type, tech_desc
            FROM generators
            WHERE report_date = '${new Date(currDate).toISOString().split('T')[0]}'
            ORDER BY plant_name, report_date, state, city;
        `;
        const result = await conn.query(sql);
        const data = result.toArray();

        table.update(data);
        setStatus(`Month: ${new Date(currDate).toISOString().split('T')[0]}, rows: ${data.length}`, false);

        // Update the current month for the next query
        currDate = addWholeMonths(currDate, 1);
        if (currDate >= END_MONTH) {
            currDate = START_MONTH;
        }
        if (!viewSet) {
            const viewer = document.querySelector("#viewer");
            viewer.restore(VIEW_CONFIG_1);
            viewSet = true;
        }
    } catch (error) {
        setStatus("Failed to load table", false);
        console.error("Failed to load Perspective table:", error);
    }
}


await loadDuckDB();
const table = await createPerspectiveTable();
setInterval(() => updatePerspectiveTable(table), 250);
