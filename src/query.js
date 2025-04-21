
const START_DATE = new Date(2022, 0, 1); // December 1, 2021

/**
 * Adds a specified number of whole months to a given date.
 */
function addWholeMonths(date, months) {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() + months, 1); // Set to 1st of the target month
    return newDate;
}

/**
 * Setting up the month picker tooltip.
 * The tooltip will show the month and year of the selected date.
 */
const monthPicker = document.querySelector('#month-picker');
monthPicker.tooltipFormatter = value => {
    const selectedDate = addWholeMonths(START_DATE, value);
    return selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' });
};

/**
 * Getting the fuel type predicate based on the selected fuel types.
 */
export function getFuelTypePredicate() {
    const fuelType = String(document.querySelector("#fuel-type").value);
    if (!fuelType) {
        return "";
    }
    const fuelTypes = fuelType.split(",").map(type => `'${type.trim()}'`).join(", ");
    const fuelTypePredicate = `fuel_type IN (${fuelTypes})`;
    return fuelTypePredicate;
}

/**
 * Getting the month predicate based on the selected month.
 */
export function getMonthPredicate() {
    const monthPicker = document.querySelector('#month-picker');
    const monthPicked = addWholeMonths(START_DATE, monthPicker.value);
    if (monthPicked.toISOString().split('T')[0] === '2021-12-01') {
        return "";
    }
    const monthPredicate = `report_date = '${monthPicked.toISOString().split('T')[0]}'`;
    return monthPredicate;
}

/**
 * Constructing the WHERE clause for the SQL query based on selected filters.
 * It combines month and fuel type predicates if they are set.
 */
export function getPredicates() {
    const monthPredicate = getMonthPredicate();
    const fuelTypePredicate = getFuelTypePredicate();

    let whereClause = `WHERE 1=1`;
    whereClause += monthPredicate ? ` AND ${monthPredicate}` : '';
    whereClause += fuelTypePredicate ? ` AND ${fuelTypePredicate}` : '';
    return whereClause;
}
