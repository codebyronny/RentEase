import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

// Auth
export const login = (data) => api.post('/auth/login', data)
export const register = (data) => api.post('/auth/register', data)

// Dashboard
export const getDashboardStats = () => api.get('/dashboard/stats')
export const getRecentRentals = () => api.get('/rentals/recent')

// Equipment
export const getEquipment = () => api.get('/equipment')
export const addEquipment = (data) => api.post('/equipment', data)
export const deleteEquipment = (id) => api.delete(`/equipment/${id}`)

// Customers
export const getCustomers = () => api.get('/customers')
export const addCustomer = (data) => api.post('/customers', data)
export const deleteCustomer = (id) => api.delete(`/customers/${id}`)
export const updateCustomer = (id, data) => api.put(`/customers/${id}`, data)

// Rentals
export const getActiveRentals = () => api.get('/rentals/active')
export const createRental = (data) => api.post('/rentals', data)
export const getPendingReturns = () => api.get('/rentals/pending-returns')
export const returnEquipment = (id) => api.post(`/rentals/${id}/return`)
