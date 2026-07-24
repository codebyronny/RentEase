const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());

// Serve React build (static assets)
const reactBuildPath = path.join(__dirname, 'frontend-react');
app.use(express.static(reactBuildPath));

// MySQL Database Configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'rentease'
};

const pool = mysql.createPool(dbConfig);

async function executeQuery(query, params = []) {
    try {
        const [rows] = await pool.execute(query, params);
        return rows;
    } catch (error) {
        console.error('Query execution error:', error);
        throw error;
    }
}

async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Connected to MySQL Database');
        connection.release();
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
    }
}

// ==================== AUTH ROUTES ====================

app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password, email, role = 'customer', name, phone, address } = req.body;

        const existingUser = await executeQuery(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, email]
        );
        if (existingUser.length > 0) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        let customerId = null;

        if (role === 'customer') {
            const customerName = name || username;
            const result = await executeQuery(
                'INSERT INTO customers (name, email, phone, address) VALUES (?, ?, ?, ?)',
                [customerName, email, phone || '', address || '']
            );
            customerId = result.insertId;
            await executeQuery(
                'INSERT INTO users (user_id, username, password, email, role, customer_id) VALUES (?, ?, ?, ?, ?, ?)',
                [customerId, customerName, hashedPassword, email, role, customerId]
            );
        } else {
            // Admin: find max user_id >= 9000 and increment
            const existing = await executeQuery(
                'SELECT MAX(user_id) as maxId FROM users WHERE user_id >= 9000'
            );
            const nextId = (existing[0].maxId || 8999) + 1;
            await executeQuery(
                'INSERT INTO users (user_id, username, password, email, role, customer_id) VALUES (?, ?, ?, ?, ?, ?)',
                [nextId, username, hashedPassword, email, role, null]
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
        const users = await executeQuery(`
            SELECT u.*, c.name as customer_name, c.phone, c.address
            FROM users u
            LEFT JOIN customers c ON u.customer_id = c.customer_id
            WHERE u.username = ?
        `, [username]);

        if (users.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

        const { password: _, ...userInfo } = user;
        res.json({ message: 'Login successful', user: userInfo });
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
            WHERE MONTH(rental_date) = MONTH(CURRENT_DATE()) AND YEAR(rental_date) = YEAR(CURRENT_DATE())
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
            ORDER BY r.rental_date DESC LIMIT 10
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
        res.status(500).json({ error: 'Failed to fetch equipment' });
    }
});

app.post('/api/equipment', async (req, res) => {
    try {
        const { name, category, daily_rate, stock_quantity = 10 } = req.body;
        await executeQuery(
            'INSERT INTO equipment (name, category, daily_rate, stock_quantity, available_quantity, status) VALUES (?, ?, ?, ?, ?, ?)',
            [name, category, daily_rate, stock_quantity, stock_quantity, 'Available']
        );
        res.json({ message: 'Equipment added successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add equipment' });
    }
});

app.delete('/api/equipment/:id', async (req, res) => {
    try {
        await executeQuery('DELETE FROM equipment WHERE equipment_id = ?', [req.params.id]);
        res.json({ message: 'Equipment deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete equipment' });
    }
});

// ==================== CUSTOMER ROUTES ====================

app.get('/api/customers', async (req, res) => {
    try {
        const customers = await executeQuery('SELECT * FROM customers ORDER BY customer_id');
        res.json(customers);
    } catch (error) {
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
        res.status(500).json({ error: 'Failed to add customer' });
    }
});

app.delete('/api/customers/:id', async (req, res) => {
    try {
        await executeQuery('DELETE FROM customers WHERE customer_id = ?', [req.params.id]);
        res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete customer' });
    }
});

app.put('/api/customers/:id', async (req, res) => {
    try {
        const { name, email, phone, address } = req.body;
        await executeQuery(
            'UPDATE customers SET name = ?, email = ?, phone = ?, address = ? WHERE customer_id = ?',
            [name, email, phone, address, req.params.id]
        );
        await executeQuery('UPDATE users SET email = ? WHERE customer_id = ?', [email, req.params.id]);
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
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
        res.status(500).json({ error: 'Failed to fetch active rentals' });
    }
});

app.post('/api/rentals', async (req, res) => {
    try {
        const { customer_id, equipment_id, rental_days } = req.body;
        const [equipment] = await executeQuery(
            'SELECT daily_rate, available_quantity FROM equipment WHERE equipment_id = ?',
            [equipment_id]
        );
        if (!equipment) return res.status(400).json({ error: 'Equipment not found' });
        if (equipment.available_quantity < 1) return res.status(400).json({ error: 'Equipment is not available' });

        const totalAmount = rental_days * equipment.daily_rate;
        await executeQuery(`
            INSERT INTO rentals (customer_id, equipment_id, due_date, total_amount, status)
            VALUES (?, ?, DATE_ADD(CURDATE(), INTERVAL ? DAY), ?, 'Active')
        `, [customer_id, equipment_id, rental_days, totalAmount]);
        await executeQuery(
            'UPDATE equipment SET available_quantity = available_quantity - 1, status = IF(available_quantity - 1 = 0, "Rented", "Available") WHERE equipment_id = ?',
            [equipment_id]
        );
        res.json({ message: 'Rental created successfully' });
    } catch (error) {
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
        res.status(500).json({ error: 'Failed to fetch pending returns' });
    }
});

app.post('/api/rentals/:id/return', async (req, res) => {
    try {
        const [rental] = await executeQuery(`
            SELECT r.*, e.daily_rate FROM rentals r
            JOIN equipment e ON r.equipment_id = e.equipment_id
            WHERE r.rental_id = ?
        `, [req.params.id]);
        if (!rental) return res.status(400).json({ error: 'Rental not found' });

        const lateDays = Math.max(0, Math.floor((new Date() - new Date(rental.due_date)) / 86400000));
        const lateFee = lateDays * rental.daily_rate * 0.5;

        await executeQuery(
            'UPDATE rentals SET return_date = CURDATE(), status = "Returned", late_fee = ? WHERE rental_id = ?',
            [lateFee, req.params.id]
        );
        await executeQuery(
            'UPDATE equipment SET available_quantity = available_quantity + 1, status = "Available" WHERE equipment_id = ?',
            [rental.equipment_id]
        );
        res.json({ message: 'Equipment returned successfully', lateFee });
    } catch (error) {
        res.status(500).json({ error: 'Failed to return equipment' });
    }
});

// ==================== SPA FALLBACK ====================
// Must be AFTER all API routes — serves React index.html for all non-API routes
app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(reactBuildPath, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 RentEase running on http://localhost:${PORT}`);
    testConnection();
});

process.on('SIGINT', async () => {
    await pool.end();
    process.exit(0);
});
