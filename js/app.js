// Archive Explorer - Main Application
let inventoryIndex = [];
let currentTable = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadInventoryIndex();
    setupEventListeners();
});

function setupEventListeners() {
    const loadBtn = document.getElementById('loadBtn');
    const select = document.getElementById('inventorySelect');
    
    loadBtn.addEventListener('click', loadSelectedInventory);
    
    select.addEventListener('change', (e) => {
        const selected = inventoryIndex.find(inv => Number(inv.inventory_number) === Number(e.target.value));
        if (selected) {
            document.getElementById('itemCount').textContent = 
                `(${selected.item_count.toLocaleString()} items)`;
            loadBtn.disabled = false;
        } else {
            document.getElementById('itemCount').textContent = '';
            loadBtn.disabled = true;
        }
    });
    
    // Allow Enter key to load
    select.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !loadBtn.disabled) {
            loadSelectedInventory();
        }
    });
}

async function loadInventoryIndex() {
    try {
        showLoading(true);
        const response = await fetch('data/inventory_index.json');
        
        if (!response.ok) {
            throw new Error(`Failed to load index: ${response.status}`);
        }
        
        inventoryIndex = await response.json();
        
        // Sort by inventory number
        inventoryIndex.sort((a, b) => 
            String(a.inventory_number).localeCompare(String(b.inventory_number))
        );
        
        populateDropdown();
        showLoading(false);
        
    } catch (error) {
        showError(`Could not load inventory list: ${error.message}`);
        showLoading(false);
    }
}

function populateDropdown() {
    const select = document.getElementById('inventorySelect');
    select.innerHTML = '<option value="">-- Select an inventory --</option>';
    
    inventoryIndex.forEach(inv => {
        const option = document.createElement('option');
        option.value = inv.inventory_number;
        option.textContent = `${inv.inventory_number} (${inv.item_count.toLocaleString()} items)`;
        select.appendChild(option);
    });
    
    select.disabled = false;
}

async function loadSelectedInventory() {
    const select = document.getElementById('inventorySelect');
    const inventoryNum = select.value;
    
    if (!inventoryNum) return;
    
    const inventory = inventoryIndex.find(inv => inv.inventory_number === inventoryNum);
    
    if (!inventory) {
        showError('Inventory not found');
        return;
    }
    
    try {
        showLoading(true);
        hideError();
        
        const response = await fetch(`data/inventories/${inventory.filename}`);
        
        if (!response.ok) {
            throw new Error(`Failed to load data: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Destroy existing table if it exists
        if (currentTable) {
            currentTable.destroy();
            currentTable = null;
        }
        
        renderTable(inventoryNum, data);
        showLoading(false);
        
    } catch (error) {
        showError(`Could not load inventory data: ${error.message}`);
        showLoading(false);
    }
}

function renderTable(inventoryNum, data) {
    if (!data || data.length === 0) {
        showError('No data found for this inventory');
        return;
    }
    
    // Get column names from first row
    const columns = Object.keys(data[0]).map(key => ({
        data: key,
        title: formatColumnName(key)
    }));
    
    // Show table container
    document.getElementById('tableContainer').classList.remove('hidden');
    document.getElementById('currentInventory').textContent = 
        `Inventory: ${inventoryNum} (${data.length.toLocaleString()} records)`;
    
    // Initialize DataTable
    currentTable = $('#dataTable').DataTable({
        data: data,
        columns: columns,
        pageLength: 25,
        lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
        order: [[0, 'asc']],
        dom: 'Blfrtip',
        buttons: [
            {
                extend: 'excel',
                text: 'Export to Excel',
                filename: `archive_${inventoryNum}_${getDateString()}`
            }
        ],
        responsive: true,
        language: {
            search: "Search records:",
            lengthMenu: "Show _MENU_ records per page",
            info: "Showing _START_ to _END_ of _TOTAL_ records",
            infoEmpty: "No records available",
            infoFiltered: "(filtered from _MAX_ total records)"
        }
    });
}

function formatColumnName(name) {
    // Convert snake_case or camelCase to Title Case
    return name
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
}

function showLoading(show) {
    const loading = document.getElementById('loading');
    if (show) {
        loading.classList.remove('hidden');
    } else {
        loading.classList.add('hidden');
    }
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = `⚠️ ${message}`;
    errorDiv.classList.remove('hidden');
}

function hideError() {
    document.getElementById('errorMessage').classList.add('hidden');
}

function getDateString() {
    const now = new Date();
    return now.toISOString().split('T')[0];
}