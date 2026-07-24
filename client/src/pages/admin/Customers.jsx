import { useState, useEffect } from 'react'
import { getCustomers, addCustomer, deleteCustomer } from '../../api'
import toast from 'react-hot-toast'
import { Plus, Trash2, Search, Mail, Phone } from 'lucide-react'
import Table from '../../components/ui/Table'
import Modal from '../../components/ui/Modal'
import styles from './AdminShared.module.css'

export default function Customers() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' })
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    getCustomers().then(r => setData(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = data.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  )

  const handleAdd = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await addCustomer(form)
      toast.success('Customer added!')
      setShowModal(false)
      setForm({ name: '', email: '', phone: '', address: '' })
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add customer')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this customer? This will also delete their rentals.')) return
    try {
      await deleteCustomer(id)
      toast.success('Customer deleted')
      load()
    } catch { toast.error('Failed to delete') }
  }

  const columns = [
    { key: 'customer_id', label: '#', style: { width: 60 } },
    { key: 'name', label: 'Name', render: (v) => <span className={styles.bold}>{v}</span> },
    {
      key: 'email', label: 'Email',
      render: (v) => (
        <a href={`mailto:${v}`} className={styles.emailLink}>
          <Mail size={13} /> {v}
        </a>
      )
    },
    {
      key: 'phone', label: 'Phone',
      render: (v) => v ? <span className={styles.phone}><Phone size={13} /> {v}</span> : <span className={styles.na}>—</span>
    },
    {
      key: 'created_at', label: 'Joined',
      render: (v) => new Date(v).toLocaleDateString()
    },
    {
      key: 'action', label: 'Actions',
      render: (_, row) => (
        <button className={styles.deleteBtn} onClick={() => handleDelete(row.customer_id)}>
          <Trash2 size={14} /> Delete
        </button>
      )
    },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Customers</h1>
          <p className={styles.sub}>Manage registered customers</p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowModal(true)}>
          <Plus size={18} /> Add Customer
        </button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input className={styles.search} placeholder="Search customers..." value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <div className={styles.count}>{filtered.length} customers</div>
      </div>

      <div className={styles.tableCard}>
        <Table columns={columns} data={filtered} loading={loading} emptyMessage="No customers found" />
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add New Customer">
        <form onSubmit={handleAdd} className={styles.form}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label}>Full Name</label>
              <input className={styles.input} placeholder="John Doe" value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <input className={styles.input} type="email" placeholder="john@example.com" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Phone</label>
              <input className={styles.input} placeholder="+91 9876543210" value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Address</label>
              <input className={styles.input} placeholder="City, State" value={form.address}
                onChange={e => setForm(p => ({ ...p, address: e.target.value }))} required />
            </div>
          </div>
          <div className={styles.formActions}>
            <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className={styles.submitBtn} disabled={saving}>
              {saving ? <span className={styles.spinner} /> : <><Plus size={16} /> Add Customer</>}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
