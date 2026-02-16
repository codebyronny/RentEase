// Customer Dashboard JavaScript
let currentSection = 'browse';
let selectedEquipment = null;

// Check customer access
function checkCustomerAccess() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser.user_id) {
        alert('Please log in to access the customer dashboard.');
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
        case 'browse':
            loadAvailableEquipment();
            break;
        case 'my-rentals':
            loadMyRentals();
            break;
        case 'profile':
            loadProfile();
            break;
    }
}

// Load profile
async function loadProfile() {
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        
        // Set avatar initial
        const initial = currentUser.customer_name ? currentUser.customer_name.charAt(0).toUpperCase() : 'U';
        document.getElementById('profile-avatar').textContent = initial;
        
        // Set profile info
        document.getElementById('profile-name').textContent = currentUser.customer_name || 'User';
        document.getElementById('profile-email').textContent = currentUser.email || '';
        
        // Set form values
        document.getElementById('edit-name').value = currentUser.customer_name || '';
        document.getElementById('edit-email').value = currentUser.email || '';
        document.getElementById('edit-phone').value = currentUser.phone || '';
        document.getElementById('edit-address').value = currentUser.address || '';
        
    } catch (error) {
        console.error('Profile loading error:', error);
        showNotification('Failed to load profile', 'error');
    }
}

// Update profile
async function updateProfile(event) {
    event.preventDefault();
    
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const customerId = currentUser.customer_id;
        
        if (!customerId) {
            showNotification('Customer ID not found', 'error');
            return;
        }
        
        const profileData = {
            name: document.getElementById('edit-name').value,
            email: document.getElementById('edit-email').value,
            phone: document.getElementById('edit-phone').value,
            address: document.getElementById('edit-address').value
        };
        
        const response = await fetch(`${api.baseURL}/customers/${customerId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(profileData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to update profile');
        }
        
        // Update localStorage
        currentUser.customer_name = profileData.name;
        currentUser.email = profileData.email;
        currentUser.phone = profileData.phone;
        currentUser.address = profileData.address;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        showNotification('Profile updated successfully!', 'success');
        loadProfile(); // Reload profile to show updated data
        
    } catch (error) {
        console.error('Profile update error:', error);
        showNotification('Failed to update profile', 'error');
    }
}

// Load available equipment
async function loadAvailableEquipment() {
    try {
        const equipment = await api.getEquipment();
        const availableEquipment = equipment.filter(item => item.available_quantity > 0);
        displayAvailableEquipment(availableEquipment);
    } catch (error) {
        console.error('Equipment loading error:', error);
        document.getElementById('equipment-grid').innerHTML = 
            '<div class="text-center text-danger">Failed to load equipment. Please try again.</div>';
    }
}

function displayAvailableEquipment(equipment) {
    const container = document.getElementById('equipment-grid');
    
    if (!equipment || equipment.length === 0) {
        container.innerHTML = '<div class="text-center">No equipment available for rent at the moment.</div>';
        return;
    }

    container.innerHTML = equipment.map(item => `
        <div class="equipment-card">
            <h3>${item.name}</h3>
            <div class="info"><strong>Category:</strong> ${item.category}</div>
            <div class="info"><strong>Available:</strong> <span style="color: #38a169; font-weight: 600;">${item.available_quantity || 0} units</span></div>
            <div class="price">₹${item.daily_rate}/day</div>
            <button class="rent-btn" onclick="openRentalModal(${item.equipment_id}, '${item.name}', ${item.daily_rate})">
                🚜 Rent Now
            </button>
        </div>
    `).join('');
}

// Load my rentals
async function loadMyRentals() {
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const customerId = currentUser.customer_id;
        
        if (!customerId) {
            document.getElementById('my-rentals-list').innerHTML = 
                '<tr><td colspan="5" class="text-center text-danger">Please login again</td></tr>';
            return;
        }
        
        // Get all rentals and filter by customer ID
        const allRentals = await api.getActiveRentals();
        const myRentals = allRentals.filter(rental => rental.customer_id === customerId);
        
        displayMyRentals(myRentals);
    } catch (error) {
        console.error('Rentals loading error:', error);
        document.getElementById('my-rentals-list').innerHTML = 
            '<tr><td colspan="5" class="text-center text-danger">Failed to load your rentals</td></tr>';
    }
}

function displayMyRentals(rentals) {
    const tbody = document.getElementById('my-rentals-list');
    
    if (!rentals || rentals.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">You have no active rentals.</td></tr>';
        return;
    }

    tbody.innerHTML = rentals.map(rental => {
        const dueDate = new Date(rental.due_date);
        const isOverdue = dueDate < new Date();
        
        return `
            <tr>
                <td>${rental.equipment_name}</td>
                <td>${new Date(rental.rental_date).toLocaleDateString()}</td>
                <td class="${isOverdue ? 'text-danger' : ''}">${dueDate.toLocaleDateString()}</td>
                <td>$${rental.total_amount}</td>
                <td>
                    <span class="text-${isOverdue ? 'danger' : 'warning'}">
                        ${isOverdue ? 'Overdue' : rental.status}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}

// Rental modal functions
function openRentalModal(equipmentId, equipmentName, dailyRate) {
    selectedEquipment = { id: equipmentId, name: equipmentName, rate: dailyRate };
    
    document.getElementById('selected-equipment-info').innerHTML = `
        <div class="equipment-info">
            <h4>${equipmentName}</h4>
            <p><strong>Daily Rate:</strong> $${dailyRate}</p>
        </div>
    `;
    
    document.getElementById('rental-days').value = '';
    document.getElementById('rental-calculation').innerHTML = '';
    document.getElementById('rental-modal').style.display = 'block';
}

function closeRentalModal() {
    document.getElementById('rental-modal').style.display = 'none';
    selectedEquipment = null;
}

// Calculate rental cost
function calculateRentalCost() {
    const days = parseInt(document.getElementById('rental-days').value);
    if (!days || !selectedEquipment) return;
    
    const totalCost = days * selectedEquipment.rate;
    document.getElementById('rental-calculation').innerHTML = `
        <div class="calculation-info">
            <p><strong>Calculation:</strong></p>
            <p>${days} days × $${selectedEquipment.rate} = <strong>$${totalCost}</strong></p>
        </div>
    `;
}

// Confirm rental
async function confirmRental(event) {
    event.preventDefault();
    
    const days = parseInt(document.getElementById('rental-days').value);
    if (!days || !selectedEquipment) {
        showNotification('Please enter the number of days', 'error');
        return;
    }
    
    try {
        // Get logged-in customer ID from localStorage
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const customerId = currentUser.customer_id;
        
        if (!customerId) {
            showNotification('Customer ID not found. Please login again.', 'error');
            logout();
            return;
        }
        
        await api.createRental(customerId, selectedEquipment.id, days);
        
        showNotification('Equipment rented successfully!', 'success');
        closeRentalModal();
        
        // Refresh data
        loadAvailableEquipment();
        if (currentSection === 'my-rentals') {
            loadMyRentals();
        }
        
    } catch (error) {
        console.error('Rental creation error:', error);
        showNotification('Failed to rent equipment: ' + error.message, 'error');
    }
}

// Utility functions
function showNotification(message, type) {
    // Create notification element
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
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    if (!checkCustomerAccess()) return;
    
    loadAvailableEquipment();
    
    // Add event listener for rental days input
    document.getElementById('rental-days').addEventListener('input', calculateRentalCost);
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('rental-modal');
        if (event.target === modal) {
            closeRentalModal();
        }
    });
    
    // Add CSS for modal and notifications
    const style = document.createElement('style');
    style.textContent = `
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
        }
        
        .modal-content {
            background-color: white;
            margin: 10% auto;
            padding: 0;
            border-radius: 15px;
            width: 90%;
            max-width: 500px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.2);
        }
        
        .modal-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 15px 15px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .modal-header h3 {
            margin: 0;
        }
        
        .close {
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
            opacity: 0.8;
        }
        
        .close:hover {
            opacity: 1;
        }
        
        .modal-body {
            padding: 30px;
        }
        
        .equipment-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        .equipment-info h4 {
            color: #667eea;
            margin-bottom: 10px;
        }
        
        .calculation-info {
            background: #e8f5e8;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            border-left: 4px solid #27ae60;
        }
        
        .modal-actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
            margin-top: 20px;
        }
        
        .btn-secondary {
            background: #6c757d;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
        }
        
        .btn-secondary:hover {
            background: #5a6268;
        }
        
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