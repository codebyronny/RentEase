# RentEase — Equipment Rental Management System

A full-stack equipment rental management system built with **React 18**, **Node.js**, and **MySQL**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, React Router 6, Recharts, Lucide Icons, CSS Modules |
| Backend | Node.js, Express 4 |
| Database | MySQL 8 (mysql2) |
| Auth | bcrypt password hashing |
| HTTP Client | Axios |

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [MySQL](https://dev.mysql.com/downloads/) v8 or higher

---

## Setup

### 1. Install dependencies

```bash
# Backend dependencies (Express, MySQL, bcrypt, etc.)
npm install

# Frontend dependencies (React, Vite, Recharts, etc.)
npm install --prefix client
```

### 2. Configure environment

Edit `.env` in the root directory with your MySQL credentials:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=rentease
PORT=3001
```

### 3. Create the database

```bash
mysql -u root -p < database-setup.sql
```

### 4. Create the admin account

Start the server first, then run this command once to create the admin user:

**Windows (PowerShell):**
```powershell
Invoke-WebRequest -Uri "http://localhost:3001/api/auth/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"username":"admin","email":"admin@rentease.com","password":"admin123","role":"admin"}'
```

**Mac / Linux:**
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"admin@rentease.com","password":"admin123","role":"admin"}'
```

> Only needs to be done once. After this, login at http://localhost:3001.

---

## Running the App

### Production (recommended)

Builds the React frontend then serves everything from Node on a single port:

```bash
npm run build
npm start (recommended)
```

Open **http://localhost:3001**

### Development (hot reload)

```bash
# Terminal 1 — Node backend (auto-restarts on changes)
npm run dev

# Terminal 2 — Vite frontend (instant HMR)
npm run dev:client
```

Open **http://localhost:5173**

---

## Login Credentials

### Admin

| Field | Value |
|---|---|
| Username | `Ronny` |
| Password | `mbt23@Ronny` |
| Client Username | `Name` |
| Client Password | `password@123` |

> Created using the setup command above. Only one admin account needed.

### Customer

Register directly from the app's login page using the **Register** tab. No pre-existing account needed — any username, email, and password (min 6 chars) works.

---

## Features

### Admin Panel (`/admin`)

| Section | What it does |
|---|---|
| Dashboard | Live stat cards (total equipment, active rentals, available units, monthly revenue), area chart of rental activity over last 7 days, donut chart of inventory status, scrollable recent rentals feed |
| Equipment | Add equipment (name, category, daily rate, stock quantity), live search by name/category, available vs total stock display, status badges, delete |
| Customers | Add customers, search by name/email/phone, view join date, delete |
| Rentals | Create rental (select customer + equipment, enter days, live cost preview), view all active rentals with overdue date highlighting |
| Returns | View all pending returns, days-overdue per row, process return with automatic late fee (50% of daily rate per overdue day) |

### Customer Portal (`/customer`)

| Section | What it does |
|---|---|
| Browse | Card grid of all equipment, search by name, filter by category chips, availability badge, daily rate, Rent Now button with modal |
| Rent | Enter number of days, see real-time total cost, confirm |
| My Rentals | Table of your active rentals, overdue date highlighting, status badge |
| Profile | View account details with avatar, edit name/email/phone/address |

---

## Project Structure

```
RentEase/
├── server.js                 # Express server — all API routes
├── database-setup.sql        # MySQL schema (run once to create DB)
├── package.json              # Backend dependencies + npm scripts
├── .env                      # DB credentials (not committed)
├── README.md                 # This file
├── frontend-react/           # Production build output (git-ignored)
└── client/                   # React source code
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx           # App entry point
        ├── App.jsx            # Routes + auth guards
        ├── index.css          # Global reset + CSS variables
        ├── api/
        │   └── index.js       # All Axios API functions
        ├── context/
        │   └── AuthContext.jsx
        ├── components/
        │   ├── ErrorBoundary.jsx
        │   ├── layout/
        │   │   ├── Sidebar.jsx
        │   │   └── DashboardLayout.jsx
        │   └── ui/
        │       ├── Badge.jsx
        │       ├── Modal.jsx
        │       └── Table.jsx
        └── pages/
            ├── Login.jsx
            ├── admin/
            │   ├── AdminDashboard.jsx
            │   ├── Equipment.jsx
            │   ├── Customers.jsx
            │   ├── Rentals.jsx
            │   └── Returns.jsx
            └── customer/
                ├── Browse.jsx
                ├── MyRentals.jsx
                └── Profile.jsx
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns user object |
| GET | `/api/dashboard/stats` | Total equipment, active rentals, revenue |
| GET | `/api/rentals/recent` | Latest 10 rentals |
| GET | `/api/equipment` | All equipment |
| POST | `/api/equipment` | Add equipment |
| DELETE | `/api/equipment/:id` | Delete equipment |
| GET | `/api/customers` | All customers |
| POST | `/api/customers` | Add customer |
| DELETE | `/api/customers/:id` | Delete customer |
| PUT | `/api/customers/:id` | Update customer profile |
| GET | `/api/rentals/active` | All active rentals |
| POST | `/api/rentals` | Create rental |
| GET | `/api/rentals/pending-returns` | Rentals awaiting return |
| POST | `/api/rentals/:id/return` | Process return + calculate late fee |

---

## npm Scripts

| Script | Command | What it does |
|---|---|---|
| `npm start` | `node server.js` | Production server on :3001 |
| `npm run dev` | `nodemon server.js` | Dev backend with auto-restart |
| `npm run build` | `vite build` in client/ | Compile React to frontend-react/ |
| `npm run dev:client` | `vite` in client/ | Dev frontend on :5173 with HMR |
