let inventoryIndex = [];
let dataTable = null;

// Define columns that can be toggled
const toggleColumns = [
    { index: 2, name: 'Start Folio' },
    { index: 3, name: 'End Folio' },
    { index: 7, name: 'Geographical Coverage' }
];

// Load the inventory index on page load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        showLoading();
        const response = await fetch('inventory_index.json');
        if (!response.ok) throw new Error('Failed to load inventory index');
        
        inventoryIndex = await response.json();
        populateInventorySelect();
        createColumnToggles();
    } catch (error) {
        showError('Error loading inventory index: ' + error.message);
    } finally {
        hideLoading();
    }
});

// Populate the inventory select dropdown
function populateInventorySelect() {
    const select = document.getElementById('inventorySelect');
    select.innerHTML = '<option value="">Select an inventory</option>'; // Reset options

    inventoryIndex.forEach(inv => {
        const option = document.createElement('option');
        option.value = inv.filename;
        option.textContent = `Inventory ${inv.inventory_number} (${inv.item_count} items)`;
        option.dataset.itemCount = inv.item_count;
        option.dataset.inventoryNumber = inv.inventory_number;
        select.appendChild(option);
    });

    select.addEventListener('change', handleInventorySelection);
}

// Handle inventory selection
async function handleInventorySelection(event) {
    const filename = event.target.value;

    if (!filename) {
        hideTable();
        return;
    }

    const selectedOption = event.target.selectedOptions[0];
    const itemCount = selectedOption.dataset.itemCount;
    const inventoryNumber = selectedOption.dataset.inventoryNumber;

    updateItemCount(itemCount, inventoryNumber);
    showLoading();
    hideError();

    try {
        const response = await fetch(`inventories/${filename}`);
        if (!response.ok) throw new Error('Failed to load inventory file');

        const inventoryData = await response.json();
        displayInventoryData(inventoryData);
    } catch (error) {
        showError('Error loading inventory: ' + error.message);
        hideTable();
    } finally {
        hideLoading();
    }
}

// Display inventory data in DataTable
function displayInventoryData(data) {
    // Initialize DataTable if it doesn't exist
    if (!dataTable) {
        dataTable = $('#inventoryTable').DataTable({
            pageLength: 25,
            lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
            order: [[0, 'asc']],
            columnDefs: [
                { width: "50px", targets: 0 },                         // ID
                { width: "300px", targets: 1 },                        // DESCRIPTION
                { width: "80px", targets: 2, visible: false },         // Start Folio
                { width: "80px", targets: 3, visible: false },         // End Folio
                { width: "100px", targets: 4 },                        // YEAR RANGE
                { width: "150px", targets: 5 },                        // SETTLEMENT
                { width: "150px", targets: 6 },                        // LOCATION
                { targets: 7, visible: false },                        // Geographical Coverage
                { width: "150px", targets: 8 }                         // DOCUMENT TYPE
            ]
        });
    }

    // Clear previous data
    dataTable.clear();

    // Add new rows
    data.forEach(item => {
        const yearRange = item['YEAR (EARLIEST)'] === item['YEAR (LATEST)'] 
            ? item['YEAR (EARLIEST)'] 
            : `${item['YEAR (EARLIEST)']} - ${item['YEAR (LATEST)']}`;

        dataTable.row.add([
            item.ID || '',
            item.DESCRIPTION || '',
            item['FOLIONUMBER (START OF DOCUMENT)'] || '',
            item['FOLIONUMBER (END OF DOCUMENT)'] || '',
            yearRange,
            item.SETTLEMENT || '',
            item['LOCATION (TANAP)'] || '',
            item['GEOGRAPHICAL COVERAGE OF INV NUMBER'] || '',
            item['DOCUMENT TYPE (TANAP)'] || ''
        ]);
    });

    dataTable.draw();
    showTable();
}

// Create column toggle checkboxes
function createColumnToggles() {
    const container = document.getElementById('columnToggles');
    if (!container) return; // skip if container doesn't exist

    toggleColumns.forEach(col => {
        const label = document.createElement('label');
        label.style.marginRight = '10px';
        label.innerHTML = `
            <input type="checkbox" data-index="${col.index}" />
            ${col.name}
        `;
        container.appendChild(label);
    });

    // Add event listeners
    container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', event => {
            const colIndex = parseInt(event.target.dataset.index, 10);
            const column = dataTable.column(colIndex);
            column.visible(event.target.checked);
        });
    });
}

// UI Helper Functions
function showLoading() {
    document.getElementById('loadingIndicator').style.display = 'block';
}

function hideLoading() {
    document.getElementById('loadingIndicator').style.display = 'none';
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function hideError() {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.style.display = 'none';
}

function showTable() {
    document.getElementById('tableContainer').style.display = 'block';
}

function hideTable() {
    document.getElementById('tableContainer').style.display = 'none';
    document.getElementById('itemCount').textContent = '';
}

function updateItemCount(count, inventoryNumber) {
    const itemCountSpan = document.getElementById('itemCount');
    itemCountSpan.textContent = `${count} documents in inventory ${inventoryNumber}`;
}
