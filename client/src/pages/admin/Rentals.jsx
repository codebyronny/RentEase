import { useState, useEffect } from 'react'
import { getActiveRentals, createRental, getCustomers, getEquipment } from '../../api'
import toast from 'react-hot-toast'
import { Plus, Search } from 'lucide-react'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import styles from './AdminShared.module.css'

export default function Rentals() {
  const [data, setData] = useState([])
  const [customers, setCustomers] = useState([])
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ customer_id: '', equipment_id: '', rental_days: '' })
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([getActiveRentals(), getCustomers(), getEquipment()])
      .then(([r, c, e]) => {
        setData(r.data)
        setCustomers(c.data)
        setEquipment(e.data.filter(eq => eq.available_quantity > 0))
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = data.filter(r =>
    r.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    r.equipment_name.toLowerCase().includes(search.toLowerCase())
  )

  const selectedEquip = equipment.find(e => e.equipment_id === parseInt(form.equipment_id))
  const totalCost = selectedEquip && form.rental_days
    ? (parseFloat(selectedEquip.daily_rate) * parseInt(form.rental_days)).toFixed(2)
    : null

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await createRental({
        customer_id: parseInt(form.customer_id),
        equipment_id: parseInt(form.equipment_id),
        rental_days: parseInt(form.rental_days)
      })
      toast.success('Rental created!')
      setShowModal(false)
      setForm({ customer_id: '', equipment_id: '', rental_days: '' })
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create rental')
    } finally { setSaving(false) }
  }

  const columns = [
    { key: 'rental_id', label: '#', style: { width: 60 } },
    { key: 'customer_name', label: 'Customer', render: v => <span className={styles.bold}>{v}</span> },
    { key: 'equipment_name', label: 'Equipment' },
    { key: 'rental_date', label: 'Start', render: v => new Date(v).toLocaleDateString() },
    {
      key: 'due_date', label: 'Due',
      render: (v) => {
        const overdue = new Date(v) < new Date()
        return <span className={overdue ? styles.overdueText : ''}>{new Date(v).toLocaleDateString()}</span>
      }
    },
    { key: 'total_amount', label: 'Amount', render: v => <span className={styles.rate}>₹{v}</span> },
    {
      key: 'status', label: 'Status',
      render: v => <Badge variant={v === 'Active' ? 'warning' : 'success'}>{v}</Badge>
    },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Rentals</h1>
          <p className={styles.sub}>View and create active rentals</p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowModal(true)}>
          <Plus size={18} /> New Rental
        </button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input className={styles.search} placeholder="Search rentals..." value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <div className={styles.count}>{filtered.length} active rentals</div>
      </div>

      <div className={styles.tableCard}>
        <Table columns={columns} data={filtered} loading={loading} emptyMessage="No active rentals" />
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create New Rental">
        <form onSubmit={handleCreate} className={styles.form}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label}>Customer</label>
              <select className={styles.input} value={form.customer_id}
                onChange={e => setForm(p => ({ ...p, customer_id: e.target.value }))} required>
                <option value="">Select customer</option>
                {customers.map(c => <option key={c.customer_id} value={c.customer_id}>{c.name}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Equipment</label>
              <select className={styles.input} value={form.equipment_id}
                onChange={e => setForm(p => ({ ...p, equipment_id: e.target.value }))} required>
                <option value="">Select equipment</option>
                {equipment.map(e => (
                  <option key={e.equipment_id} value={e.equipment_id}>
                    {e.name} — ₹{e.daily_rate}/day ({e.available_quantity} avail.)
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Rental Days</label>
              <input className={styles.input} type="number" min="1" placeholder="e.g. 7" value={form.rental_days}
                onChange={e => setForm(p => ({ ...p, rental_days: e.target.value }))} required />
            </div>
          </div>
          {totalCost && (
            <div className={styles.calcBox}>
              {form.rental_days} days × ₹{selectedEquip.daily_rate} = <strong>₹{totalCost}</strong>
            </div>
          )}
          <div className={styles.formActions}>
            <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className={styles.submitBtn} disabled={saving}>
              {saving ? <span className={styles.spinner} /> : <><Plus size={16} /> Create Rental</>}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
