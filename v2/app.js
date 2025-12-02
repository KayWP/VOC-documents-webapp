let inventoryIndex = [];
let dataTable = null;

// Load the inventory index on page load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('inventory_index.json');
        if (!response.ok) throw new Error('Failed to load inventory index');
        
        inventoryIndex = await response.json();
        populateInventorySelect();
        hideLoading();
    } catch (error) {
        showError('Error loading inventory index: ' + error.message);
        hideLoading();
    }
});

// Populate the inventory select dropdown
function populateInventorySelect() {
    const select = document.getElementById('inventorySelect');
    
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
        hideLoading();
    } catch (error) {
        showError('Error loading inventory: ' + error.message);
        hideLoading();
        hideTable();
    }
}

// Display inventory data in DataTable
function displayInventoryData(data) {
    const tableBody = document.querySelector('#inventoryTable tbody');
    tableBody.innerHTML = '';
    
    // Destroy existing DataTable if it exists
    if (dataTable) {
        dataTable.destroy();
    }
    
    // Populate table with data
    data.forEach(item => {
        const row = document.createElement('tr');
        
        const yearRange = item['YEAR (EARLIEST)'] === item['YEAR (LATEST)'] 
            ? item['YEAR (EARLIEST)']
            : `${item['YEAR (EARLIEST)']} - ${item['YEAR (LATEST)']}`;
        
        row.innerHTML = `
            <td>${item.ID || ''}</td>
            <td>${item.DESCRIPTION || ''}</td>
            <td>${item['FOLIONUMBER (START OF DOCUMENT)'] || ''}</td>
            <td>${item['FOLIONUMBER (END OF DOCUMENT)'] || ''}</td>
            <td>${yearRange}</td>
            <td>${item.SETTLEMENT || ''}</td>
            <td>${item['LOCATION (TANAP)'] || ''}</td>
            <td>${item['GEOGRAPHICAL COVERAGE OF INV NUMBER'] || ''}</td>
            <td>${item['DOCUMENT TYPE (TANAP)'] || ''}</td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Initialize DataTable
    dataTable = $('#inventoryTable').DataTable({
        pageLength: 25,
        lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
        order: [[0, 'asc']],
        columnDefs: [
            { width: "50px", targets: 0 },
            { width: "300px", targets: 1 },
            { width: "80px", targets: 2 },
            { width: "80px", targets: 3 },
            { width: "100px", targets: 4 }
        ]
    });
    
    showTable();
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
    document.getElementById('errorMessage').style.display = 'none';
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