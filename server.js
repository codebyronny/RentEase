const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

// MySQL Database Configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'rentease'
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Helper function to execute queries
async function executeQuery(query, params = []) {
    try {
        const [rows] = await pool.execute(query, params);
        return rows;
    } catch (error) {
        console.error('Query execution error:', error);
        throw error;
    }
}

// Test database connection
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Connected to MySQL Database');
        connection.release();
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.log('\n📋 Setup Instructions:');
        console.log('1. Make sure MySQL is installed and running');
        console.log('2. Update .env file with your MySQL credentials');
        console.log('3. Run: mysql -u root -p < database-setup.sql');
    }
}

// ==================== AUTHENTICATION ROUTES ====================

app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password, email, role = 'customer', name, phone, address } = req.body;
        
        // Check if user exists
        const existingUser = await executeQuery(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, email]
        );
        
        if (existingUser.length > 0) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        let customerId = null;
        
        // If registering as customer, create customer record first
        if (role === 'customer') {
            const customerName = name || username;
            const customerPhone = phone || '';
            const customerAddress = address || '';
            
            const result = await executeQuery(
                'INSERT INTO customers (name, email, phone, address) VALUES (?, ?, ?, ?)',
                [customerName, email, customerPhone, customerAddress]
            );
            
            customerId = result.insertId;
            
            // Create user with same ID as customer - use full name as username
            await executeQuery(
                'INSERT INTO users (user_id, username, password, email, role, customer_id) VALUES (?, ?, ?, ?, ?, ?)',
                [customerId, customerName, hashedPassword, email, role, customerId]
            );
        } else {
            // Admin user - use auto increment starting from 9999
            await executeQuery(
                'INSERT INTO users (user_id, username, password, email, role, customer_id) VALUES (9999, ?, ?, ?, ?, ?)',
                [username, hashedPassword, email, role, null]
            );
        }
        
        res.json({ message: 'User registered successfully' });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Get user with customer data if linked
        const users = await executeQuery(`
            SELECT u.*, c.name as customer_name, c.phone, c.address 
            FROM users u
            LEFT JOIN customers c ON u.customer_id = c.customer_id
            WHERE u.username = ?
        `, [username]);
        
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Return user info (without password)
        const { password: _, ...userInfo } = user;
        res.json({ 
            message: 'Login successful', 
            user: userInfo 
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// ==================== DASHBOARD ROUTES ====================

app.get('/api/dashboard/stats', async (req, res) => {
    try {
        const [totalEquipment] = await executeQuery('SELECT COUNT(*) as count FROM equipment');
        const [activeRentals] = await executeQuery('SELECT COUNT(*) as count FROM rentals WHERE status = "Active"');
        const [availableEquipment] = await executeQuery('SELECT COUNT(*) as count FROM equipment WHERE status = "Available"');
        const [monthlyRevenue] = await executeQuery(`
            SELECT COALESCE(SUM(total_amount + COALESCE(late_fee, 0)), 0) as revenue 
            FROM rentals 
            WHERE MONTH(rental_date) = MONTH(CURRENT_DATE())
            AND YEAR(rental_date) = YEAR(CURRENT_DATE())
        `);

        res.json({
            totalEquipment: totalEquipment.count,
            activeRentals: activeRentals.count,
            availableEquipment: availableEquipment.count,
            monthlyRevenue: monthlyRevenue.revenue
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
});

app.get('/api/rentals/recent', async (req, res) => {
    try {
        const rentals = await executeQuery(`
            SELECT r.rental_id, c.name as customer_name, e.name as equipment_name, 
                   r.rental_date, r.due_date, r.status
            FROM rentals r
            JOIN customers c ON r.customer_id = c.customer_id
            JOIN equipment e ON r.equipment_id = e.equipment_id
            ORDER BY r.rental_date DESC
            LIMIT 10
        `);
        res.json(rentals);
    } catch (error) {
        console.error('Recent rentals error:', error);
        res.status(500).json({ error: 'Failed to fetch recent rentals' });
    }
});

// ==================== EQUIPMENT ROUTES ====================

app.get('/api/equipment', async (req, res) => {
    try {
        const equipment = await executeQuery('SELECT * FROM equipment ORDER BY equipment_id');
        res.json(equipment);
    } catch (error) {
        console.error('Equipment fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch equipment' });
    }
});

app.post('/api/equipment', async (req, res) => {
    try {
        const { name, category, daily_rate, stock_quantity = 10, status = 'Available' } = req.body;
        
        await executeQuery(
            'INSERT INTO equipment (name, category, daily_rate, stock_quantity, available_quantity, status) VALUES (?, ?, ?, ?, ?, ?)',
            [name, category, daily_rate, stock_quantity, stock_quantity, status]
        );
        
        res.json({ message: 'Equipment added successfully' });
    } catch (error) {
        console.error('Add equipment error:', error);
        res.status(500).json({ error: 'Failed to add equipment' });
    }
});

app.delete('/api/equipment/:id', async (req, res) => {
    try {
        const equipmentId = req.params.id;
        await executeQuery('DELETE FROM equipment WHERE equipment_id = ?', [equipmentId]);
        res.json({ message: 'Equipment deleted successfully' });
    } catch (error) {
        console.error('Delete equipment error:', error);
        res.status(500).json({ error: 'Failed to delete equipment' });
    }
});

// ==================== CUSTOMER ROUTES ====================

app.get('/api/customers', async (req, res) => {
    try {
        const customers = await executeQuery('SELECT * FROM customers ORDER BY customer_id');
        res.json(customers);
    } catch (error) {
        console.error('Customers fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});

app.post('/api/customers', async (req, res) => {
    try {
        const { name, email, phone, address } = req.body;
        
        await executeQuery(
            'INSERT INTO customers (name, email, phone, address) VALUES (?, ?, ?, ?)',
            [name, email, phone, address]
        );
        
        res.json({ message: 'Customer added successfully' });
    } catch (error) {
        console.error('Add customer error:', error);
        res.status(500).json({ error: 'Failed to add customer' });
    }
});

app.delete('/api/customers/:id', async (req, res) => {
    try {
        const customerId = req.params.id;
        await executeQuery('DELETE FROM customers WHERE customer_id = ?', [customerId]);
        res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        console.error('Delete customer error:', error);
        res.status(500).json({ error: 'Failed to delete customer' });
    }
});

// Update customer profile
app.put('/api/customers/:id', async (req, res) => {
    try {
        const customerId = req.params.id;
        const { name, email, phone, address } = req.body;
        
        await executeQuery(
            'UPDATE customers SET name = ?, email = ?, phone = ?, address = ? WHERE customer_id = ?',
            [name, email, phone, address, customerId]
        );
        
        // Also update user email if changed
        await executeQuery(
            'UPDATE users SET email = ? WHERE customer_id = ?',
            [email, customerId]
        );
        
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update customer error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// ==================== RENTAL ROUTES ====================

app.get('/api/rentals/active', async (req, res) => {
    try {
        const rentals = await executeQuery(`
            SELECT r.*, c.name as customer_name, e.name as equipment_name, e.daily_rate
            FROM rentals r
            JOIN customers c ON r.customer_id = c.customer_id
            JOIN equipment e ON r.equipment_id = e.equipment_id
            WHERE r.status = 'Active'
            ORDER BY r.rental_id
        `);
        res.json(rentals);
    } catch (error) {
        console.error('Active rentals error:', error);
        res.status(500).json({ error: 'Failed to fetch active rentals' });
    }
});

app.post('/api/rentals', async (req, res) => {
    try {
        const { customer_id, equipment_id, rental_days } = req.body;
        
        // Get equipment details
        const [equipment] = await executeQuery(
            'SELECT daily_rate, available_quantity FROM equipment WHERE equipment_id = ?',
            [equipment_id]
        );
        
        if (!equipment) {
            return res.status(400).json({ error: 'Equipment not found' });
        }
        
        if (equipment.available_quantity < 1) {
            return res.status(400).json({ error: 'Equipment is not available' });
        }
        
        const totalAmount = rental_days * equipment.daily_rate;
        
        // Create rental
        await executeQuery(`
            INSERT INTO rentals (customer_id, equipment_id, due_date, total_amount, status) 
            VALUES (?, ?, DATE_ADD(CURDATE(), INTERVAL ? DAY), ?, 'Active')
        `, [customer_id, equipment_id, rental_days, totalAmount]);
        
        // Decrease available quantity
        await executeQuery(
            'UPDATE equipment SET available_quantity = available_quantity - 1, status = IF(available_quantity - 1 = 0, "Rented", "Available") WHERE equipment_id = ?',
            [equipment_id]
        );
        
        res.json({ message: 'Rental created successfully' });
    } catch (error) {
        console.error('Create rental error:', error);
        res.status(500).json({ error: 'Failed to create rental' });
    }
});

app.get('/api/rentals/pending-returns', async (req, res) => {
    try {
        const rentals = await executeQuery(`
            SELECT r.rental_id, c.name as customer_name, e.name as equipment_name, 
                   r.due_date, r.rental_date
            FROM rentals r
            JOIN customers c ON r.customer_id = c.customer_id
            JOIN equipment e ON r.equipment_id = e.equipment_id
            WHERE r.status = 'Active'
            ORDER BY r.due_date
        `);
        res.json(rentals);
    } catch (error) {
        console.error('Pending returns error:', error);
        res.status(500).json({ error: 'Failed to fetch pending returns' });
    }
});

app.post('/api/rentals/:id/return', async (req, res) => {
    try {
        const rentalId = req.params.id;
        
        // Get rental details
        const [rental] = await executeQuery(`
            SELECT r.*, e.daily_rate 
            FROM rentals r 
            JOIN equipment e ON r.equipment_id = e.equipment_id 
            WHERE r.rental_id = ?
        `, [rentalId]);
        
        if (!rental) {
            return res.status(400).json({ error: 'Rental not found' });
        }
        
        // Calculate late fee
        const dueDate = new Date(rental.due_date);
        const today = new Date();
        const lateDays = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)));
        const lateFee = lateDays * rental.daily_rate * 0.5;
        
        // Update rental
        await executeQuery(`
            UPDATE rentals 
            SET return_date = CURDATE(), status = 'Returned', late_fee = ? 
            WHERE rental_id = ?
        `, [lateFee, rentalId]);
        
        // Increase available quantity
        await executeQuery(
            'UPDATE equipment SET available_quantity = available_quantity + 1, status = "Available" WHERE equipment_id = ?',
            [rental.equipment_id]
        );
        
        res.json({ message: 'Equipment returned successfully', lateFee });
    } catch (error) {
        console.error('Return equipment error:', error);
        res.status(500).json({ error: 'Failed to return equipment' });
    }
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 RentEase Server running on http://localhost:${PORT}`);
    console.log('📊 Database: MySQL');
    testConnection();
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down server...');
    await pool.end();
    console.log('Database connection closed.');
    process.exit(0);
});
