// API Communication Layer
class RentalAPI {
    constructor() {
        this.baseURL = 'http://localhost:3001/api';
    }

    async request(endpoint, options = {}) {
        try {
            const url = `${this.baseURL}${endpoint}`;
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                },
                ...options
            };
            
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }

            return data;

        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Dashboard endpoints
    async getDashboardStats() {
        return this.request('/dashboard/stats');
    }

    async getRecentRentals() {
        return this.request('/rentals/recent');
    }

    // Equipment endpoints
    async getEquipment() {
        return this.request('/equipment');
    }

    async addEquipment(data) {
        return this.request('/equipment', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async deleteEquipment(id) {
        return this.request(`/equipment/${id}`, {
            method: 'DELETE'
        });
    }

    // Customer endpoints
    async getCustomers() {
        return this.request('/customers');
    }

    async addCustomer(data) {
        return this.request('/customers', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async deleteCustomer(id) {
        return this.request(`/customers/${id}`, {
            method: 'DELETE'
        });
    }

    // Rental endpoints
    async getActiveRentals() {
        return this.request('/rentals/active');
    }

    async createRental(customerId, equipmentId, rentalDays) {
        return this.request('/rentals', {
            method: 'POST',
            body: JSON.stringify({
                customer_id: parseInt(customerId),
                equipment_id: parseInt(equipmentId),
                rental_days: parseInt(rentalDays)
            })
        });
    }

    async getPendingReturns() {
        return this.request('/rentals/pending-returns');
    }

    async returnEquipment(rentalId) {
        return this.request(`/rentals/${rentalId}/return`, {
            method: 'POST'
        });
    }
}

// Create global API instance
const api = new RentalAPI();