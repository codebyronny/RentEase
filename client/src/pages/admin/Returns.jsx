import { useState, useEffect } from 'react'
import { getPendingReturns, returnEquipment } from '../../api'
import toast from 'react-hot-toast'
import { RotateCcw, Search, AlertTriangle } from 'lucide-react'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import styles from './AdminShared.module.css'

export default function Returns() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [processing, setProcessing] = useState(null)

  const load = () => {
    setLoading(true)
    getPendingReturns().then(r => setData(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = data.filter(r =>
    r.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    r.equipment_name.toLowerCase().includes(search.toLowerCase())
  )

  const handleReturn = async (id) => {
    if (!confirm('Process this return?')) return
    setProcessing(id)
    try {
      const res = await returnEquipment(id)
      const fee = res.data.lateFee
      toast.success(fee > 0 ? `Returned! Late fee: ₹${fee}` : 'Equipment returned successfully!')
      load()
    } catch { toast.error('Failed to process return') }
    finally { setProcessing(null) }
  }

  const overdueCount = data.filter(r => new Date(r.due_date) < new Date()).length

  const columns = [
    { key: 'rental_id', label: '#', style: { width: 60 } },
    { key: 'customer_name', label: 'Customer', render: v => <span className={styles.bold}>{v}</span> },
    { key: 'equipment_name', label: 'Equipment' },
    { key: 'rental_date', label: 'Rented', render: v => new Date(v).toLocaleDateString() },
    {
      key: 'due_date', label: 'Due Date',
      render: (v) => {
        const overdue = new Date(v) < new Date()
        return (
          <span className={overdue ? styles.overdueText : styles.okText}>
            {new Date(v).toLocaleDateString()}
          </span>
        )
      }
    },
    {
      key: 'due_date_overdue', label: 'Overdue',
      render: (_, row) => {
        const days = Math.max(0, Math.floor((new Date() - new Date(row.due_date)) / 86400000))
        return days > 0
          ? <Badge variant="danger">{days}d overdue</Badge>
          : <Badge variant="success">On time</Badge>
      }
    },
    {
      key: 'action', label: 'Action',
      render: (_, row) => (
        <button
          className={styles.returnBtn}
          onClick={() => handleReturn(row.rental_id)}
          disabled={processing === row.rental_id}
        >
          {processing === row.rental_id ? <span className={styles.spinner} /> : <><RotateCcw size={14} /> Return</>}
        </button>
      )
    },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Returns</h1>
          <p className={styles.sub}>Process pending equipment returns</p>
        </div>
        {overdueCount > 0 && (
          <div className={styles.alertBadge}>
            <AlertTriangle size={16} />
            {overdueCount} overdue
          </div>
        )}
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input className={styles.search} placeholder="Search returns..." value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <div className={styles.count}>{filtered.length} pending</div>
      </div>

      <div className={styles.tableCard}>
        <Table columns={columns} data={filtered} loading={loading} emptyMessage="No pending returns" />
      </div>
    </div>
  )
}
