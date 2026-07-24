import { useState, useEffect } from 'react'
import { getEquipment, addEquipment, deleteEquipment } from '../../api'
import toast from 'react-hot-toast'
import { Plus, Trash2, Search } from 'lucide-react'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import styles from './AdminShared.module.css'

export default function Equipment() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', category: '', daily_rate: '', stock_quantity: 10 })
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    getEquipment().then(r => setData(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = data.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.category.toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await addEquipment({ ...form, daily_rate: parseFloat(form.daily_rate), stock_quantity: parseInt(form.stock_quantity) })
      toast.success('Equipment added!')
      setShowModal(false)
      setForm({ name: '', category: '', daily_rate: '', stock_quantity: 10 })
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add equipment')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this equipment?')) return
    try {
      await deleteEquipment(id)
      toast.success('Equipment deleted')
      load()
    } catch { toast.error('Failed to delete') }
  }

  const columns = [
    { key: 'equipment_id', label: '#', style: { width: 60 } },
    { key: 'name', label: 'Name', render: (v) => <span className={styles.bold}>{v}</span> },
    { key: 'category', label: 'Category', render: (v) => <Badge variant="primary">{v}</Badge> },
    { key: 'daily_rate', label: 'Daily Rate', render: (v) => <span className={styles.rate}>₹{v}</span> },
    {
      key: 'available_quantity', label: 'Stock',
      render: (v, row) => (
        <div className={styles.stock}>
          <span className={styles.stockAvail}>{v}</span>
          <span className={styles.stockSep}>/</span>
          <span className={styles.stockTotal}>{row.stock_quantity}</span>
        </div>
      )
    },
    {
      key: 'status', label: 'Status',
      render: (v) => <Badge variant={v === 'Available' ? 'success' : v === 'Rented' ? 'warning' : 'danger'}>{v}</Badge>
    },
    {
      key: 'action', label: 'Actions',
      render: (_, row) => (
        <button className={styles.deleteBtn} onClick={() => handleDelete(row.equipment_id)}>
          <Trash2 size={14} /> Delete
        </button>
      )
    },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Equipment</h1>
          <p className={styles.sub}>Manage your rental inventory</p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowModal(true)}>
          <Plus size={18} /> Add Equipment
        </button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input
            className={styles.search}
            placeholder="Search equipment..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.count}>{filtered.length} items</div>
      </div>

      <div className={styles.tableCard}>
        <Table columns={columns} data={filtered} loading={loading} emptyMessage="No equipment found" />
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add New Equipment">
        <form onSubmit={handleAdd} className={styles.form}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label}>Equipment Name</label>
              <input className={styles.input} placeholder="e.g. Excavator" value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Category</label>
              <input className={styles.input} placeholder="e.g. Heavy Machinery" value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))} required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Daily Rate (₹)</label>
              <input className={styles.input} type="number" step="0.01" placeholder="500" value={form.daily_rate}
                onChange={e => setForm(p => ({ ...p, daily_rate: e.target.value }))} required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Stock Quantity</label>
              <input className={styles.input} type="number" min="1" value={form.stock_quantity}
                onChange={e => setForm(p => ({ ...p, stock_quantity: e.target.value }))} required />
            </div>
          </div>
          <div className={styles.formActions}>
            <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className={styles.submitBtn} disabled={saving}>
              {saving ? <span className={styles.spinner} /> : <><Plus size={16} /> Add Equipment</>}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
