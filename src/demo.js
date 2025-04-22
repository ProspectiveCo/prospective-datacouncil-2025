import { conn } from "./duckdb.js";
import { client } from "./perspective.js";
import { getPredicates } from "./query.js";


const PLANTS_URL = "https://perspective-demo-dataset.s3.us-east-1.amazonaws.com/pudl/generators_monthly_2020-2023.parquet";
const QUERY_TEMPLATE = `
    SELECT 
        plant_name, report_date, 
        city, state, county, lat, lon,
        status_code, net_gen_mwh, capacity, 
        fuel_type, tech_desc
    FROM generators
    WHERE report_date = '2021-01-01'
    ORDER BY report_date;
    `;


function setStatus(msg = "Ready", showSpinner = false) {
    const statusDiv = document.querySelector("#status");
    const spinner = document.querySelector("#spinner");
    spinner.style.display = showSpinner ? "inline-block" : "none";
    statusDiv.textContent = msg;
}


document.querySelector("#load").addEventListener("click", async (event) => {
});

document.querySelector("#query").addEventListener("click", async (event) => {

});
