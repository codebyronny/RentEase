// Admin Dashboard JavaScript
let currentSection = 'dashboard';

// Check admin access
function checkAdminAccess() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser.role !== 'admin') {
        alert('Access denied. Admin privileges required.');
        logout();
        return false;
    }
    return true;
}

// Show section
function showSection(section) {
    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Update content
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.classList.remove('active');
    });
    document.getElementById(section).classList.add('active');

    currentSection = section;
    loadSectionData(section);
}

// Load section data
function loadSectionData(section) {
    switch(section) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'equipment':
            loadEquipment();
            break;
        case 'customers':
            loadCustomers();
            break;
        case 'rentals':
            loadRentals();
            loadRentalDropdowns();
            break;
        case 'returns':
            loadPendingReturns();
            break;
    }
}

// Dashboard functions
async function loadDashboard() {
    try {
        const stats = await api.getDashboardStats();
        
        document.getElementById('total-equipment').textContent = stats.totalEquipment || 0;
        document.getElementById('active-rentals').textContent = stats.activeRentals || 0;
        document.getElementById('available-equipment').textContent = stats.availableEquipment || 0;
        document.getElementById('monthly-revenue').textContent = `₹${stats.monthlyRevenue || 0}`;
        
        const recentRentals = await api.getRecentRentals();
        displayRecentRentals(recentRentals);
        
    } catch (error) {
        console.error('Dashboard loading error:', error);
        showNotification('Failed to load dashboard data', 'error');
    }
}

function displayRecentRentals(rentals) {
    const container = document.getElementById('recent-rentals');
    
    if (!rentals || rentals.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 20px; color: #718096;">No recent rentals found.</p>';
        return;
    }

    container.innerHTML = `
        <div style="display: grid; gap: 15px;">
            ${rentals.map(rental => {
                const dueDate = new Date(rental.due_date);
                const isOverdue = dueDate < new Date() && rental.status === 'Active';
                
                return `
                    <div style="padding: 15px; background: ${isOverdue ? '#fed7d7' : '#f7fafc'}; border-radius: 10px; border-left: 4px solid ${isOverdue ? '#fc8181' : '#667eea'};">
                        <div style="font-weight: 600; color: #2d3748; margin-bottom: 5px;">
                            ${rental.equipment_name}
                        </div>
                        <div style="font-size: 14px; color: #718096;">
                            Customer: ${rental.customer_name}<br>
                            Due: ${dueDate.toLocaleDateString()} | Status: <span style="color: ${isOverdue ? '#c53030' : '#38a169'};">${rental.status}</span>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// Equipment functions
async function loadEquipment() {
    try {
        const equipment = await api.getEquipment();
        displayEquipment(equipment);
    } catch (error) {
        console.error('Equipment loading error:', error);
        document.getElementById('equipment-list').innerHTML = 
            '<tr><td colspan="7" style="text-align: center; color: #e53e3e;">Failed to load equipment</td></tr>';
    }
}

function displayEquipment(equipment) {
    const tbody = document.getElementById('equipment-list');
    
    if (!equipment || equipment.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No equipment found</td></tr>';
        return;
    }

    tbody.innerHTML = equipment.map(item => `
        <tr>
            <td>${item.equipment_id}</td>
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>₹${item.daily_rate}</td>
            <td><strong>${item.available_quantity || 0}</strong> / ${item.stock_quantity || 10}</td>
            <td><span style="color: ${item.status === 'Available' ? '#38a169' : '#d69e2e'};">${item.status}</span></td>
            <td>
                <button class="delete-btn" onclick="deleteEquipment(${item.equipment_id})">
                    Delete
                </button>
            </td>
        </tr>
    `).join('');
}

async function addEquipment(event) {
    event.preventDefault();
    
    const name = document.getElementById('equip-name').value;
    const category = document.getElementById('equip-category').value;
    const daily_rate = parseFloat(document.getElementById('equip-rate').value);
    
    try {
        await api.addEquipment({ name, category, daily_rate });
        showNotification('Equipment added successfully!', 'success');
        
        event.target.reset();
        loadEquipment();
        
    } catch (error) {
        console.error('Add equipment error:', error);
        showNotification('Failed to add equipment: ' + error.message, 'error');
    }
}

async function deleteEquipment(id) {
    if (!confirm('Are you sure you want to delete this equipment?')) return;
    
    try {
        await api.deleteEquipment(id);
        showNotification('Equipment deleted successfully!', 'success');
        loadEquipment();
    } catch (error) {
        console.error('Delete equipment error:', error);
        showNotification('Failed to delete equipment: ' + error.message, 'error');
    }
}

// Customer functions
async function loadCustomers() {
    try {
        const customers = await api.getCustomers();
        displayCustomers(customers);
    } catch (error) {
        console.error('Customers loading error:', error);
        document.getElementById('customer-list').innerHTML = 
            '<tr><td colspan="5" style="text-align: center; color: #e53e3e;">Failed to load customers</td></tr>';
    }
}

function displayCustomers(customers) {
    const tbody = document.getElementById('customer-list');
    
    if (!customers || customers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No customers found</td></tr>';
        return;
    }

    tbody.innerHTML = customers.map(customer => `
        <tr>
            <td>${customer.customer_id}</td>
            <td>${customer.name}</td>
            <td>${customer.email}</td>
            <td>${customer.phone}</td>
            <td>
                <button class="delete-btn" onclick="deleteCustomer(${customer.customer_id})">
                    Delete
                </button>
            </td>
        </tr>
    `).join('');
}

async function addCustomer(event) {
    event.preventDefault();
    
    const name = document.getElementById('customer-name').value;
    const email = document.getElementById('customer-email').value;
    const phone = document.getElementById('customer-phone').value;
    const address = document.getElementById('customer-address').value;
    
    try {
        await api.addCustomer({ name, email, phone, address });
        showNotification('Customer added successfully!', 'success');
        
        event.target.reset();
        loadCustomers();
        
    } catch (error) {
        console.error('Add customer error:', error);
        showNotification('Failed to add customer: ' + error.message, 'error');
    }
}

async function deleteCustomer(id) {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    
    try {
        await api.deleteCustomer(id);
        showNotification('Customer deleted successfully!', 'success');
        loadCustomers();
    } catch (error) {
        console.error('Delete customer error:', error);
        showNotification('Failed to delete customer: ' + error.message, 'error');
    }
}

// Rental functions
async function loadRentals() {
    try {
        const rentals = await api.getActiveRentals();
        displayRentals(rentals);
    } catch (error) {
        console.error('Rentals loading error:', error);
        document.getElementById('rental-list').innerHTML = 
            '<tr><td colspan="7" style="text-align: center; color: #e53e3e;">Failed to load rentals</td></tr>';
    }
}

function displayRentals(rentals) {
    const tbody = document.getElementById('rental-list');
    
    if (!rentals || rentals.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No active rentals found</td></tr>';
        return;
    }

    tbody.innerHTML = rentals.map(rental => `
        <tr>
            <td>${rental.rental_id}</td>
            <td>${rental.customer_name}</td>
            <td>${rental.equipment_name}</td>
            <td>${new Date(rental.rental_date).toLocaleDateString()}</td>
            <td>${new Date(rental.due_date).toLocaleDateString()}</td>
            <td>₹${rental.total_amount}</td>
            <td>
                <button class="return-btn" onclick="returnEquipment(${rental.rental_id})">
                    Return
                </button>
            </td>
        </tr>
    `).join('');
}

async function loadRentalDropdowns() {
    try {
        const [customers, equipment] = await Promise.all([
            api.getCustomers(),
            api.getEquipment()
        ]);
        
        const customerSelect = document.getElementById('rental-customer');
        customerSelect.innerHTML = '<option value="">Select Customer</option>' +
            customers.map(c => `<option value="${c.customer_id}">${c.name}</option>`).join('');
        
        const equipmentSelect = document.getElementById('rental-equipment');
        const availableEquipment = equipment.filter(e => e.available_quantity > 0);
        equipmentSelect.innerHTML = '<option value="">Select Equipment</option>' +
            availableEquipment.map(e => `<option value="${e.equipment_id}">${e.name} - ₹${e.daily_rate}/day (${e.available_quantity} available)</option>`).join('');
            
    } catch (error) {
        console.error('Dropdown loading error:', error);
    }
}

async function createRental(event) {
    event.preventDefault();
    
    const customerId = document.getElementById('rental-customer').value;
    const equipmentId = document.getElementById('rental-equipment').value;
    const rentalDays = parseInt(document.getElementById('rental-days').value);
    
    if (!customerId || !equipmentId || !rentalDays) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    try {
        await api.createRental(customerId, equipmentId, rentalDays);
        showNotification('Rental created successfully!', 'success');
        
        event.target.reset();
        loadRentals();
        loadRentalDropdowns();
        
    } catch (error) {
        console.error('Create rental error:', error);
        showNotification('Failed to create rental: ' + error.message, 'error');
    }
}

// Return functions
async function loadPendingReturns() {
    try {
        const returns = await api.getPendingReturns();
        displayPendingReturns(returns);
    } catch (error) {
        console.error('Pending returns loading error:', error);
        document.getElementById('pending-returns').innerHTML = 
            '<tr><td colspan="6" style="text-align: center; color: #e53e3e;">Failed to load pending returns</td></tr>';
    }
}

function displayPendingReturns(returns) {
    const tbody = document.getElementById('pending-returns');
    
    if (!returns || returns.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No pending returns found</td></tr>';
        return;
    }

    tbody.innerHTML = returns.map(rental => {
        const dueDate = new Date(rental.due_date);
        const today = new Date();
        const daysOverdue = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)));
        
        return `
            <tr>
                <td>${rental.rental_id}</td>
                <td>${rental.customer_name}</td>
                <td>${rental.equipment_name}</td>
                <td>${dueDate.toLocaleDateString()}</td>
                <td><span style="color: ${daysOverdue > 0 ? '#e53e3e' : '#38a169'};">${daysOverdue}</span></td>
                <td>
                    <button class="return-btn" onclick="returnEquipment(${rental.rental_id})">
                        Process Return
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

async function returnEquipment(rentalId) {
    if (!confirm('Process equipment return?')) return;
    
    try {
        const result = await api.returnEquipment(rentalId);
        
        let message = 'Equipment returned successfully!';
        if (result.lateFee > 0) {
            message += ` Late fee: ₹${result.lateFee}`;
        }
        
        showNotification(message, 'success');
        
        loadRentals();
        loadPendingReturns();
        if (currentSection === 'dashboard') {
            loadDashboard();
        }
        
    } catch (error) {
        console.error('Return equipment error:', error);
        showNotification('Failed to return equipment: ' + error.message, 'error');
    }
}

// Utility functions
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
        background: ${type === 'success' ? '#27ae60' : '#e74c3c'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    if (!checkAdminAccess()) return;
    
    loadDashboard();
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
});
