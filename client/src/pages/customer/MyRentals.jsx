import { useState, useEffect } from 'react'
import { getActiveRentals } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { ClipboardList } from 'lucide-react'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import styles from './CustomerShared.module.css'

export default function MyRentals() {
  const { user } = useAuth()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getActiveRentals()
      .then(r => setData(r.data.filter(rental => rental.customer_id === user.customer_id)))
      .finally(() => setLoading(false))
  }, [user.customer_id])

  const columns = [
    { key: 'equipment_name', label: 'Equipment', render: v => <span className={styles.bold}>{v}</span> },
    { key: 'rental_date', label: 'Start Date', render: v => new Date(v).toLocaleDateString() },
    {
      key: 'due_date', label: 'Due Date',
      render: (v) => {
        const overdue = new Date(v) < new Date()
        return <span className={overdue ? styles.overdue : styles.ok}>{new Date(v).toLocaleDateString()}</span>
      }
    },
    { key: 'total_amount', label: 'Amount', render: v => <span className={styles.amount}>₹{v}</span> },
    {
      key: 'status', label: 'Status',
      render: (_, row) => {
        const overdue = new Date(row.due_date) < new Date()
        return <Badge variant={overdue ? 'danger' : 'warning'}>{overdue ? 'Overdue' : row.status}</Badge>
      }
    },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>My Rentals</h1>
          <p className={styles.sub}>Your active rental history</p>
        </div>
        <div className={styles.countBadge}>
          <ClipboardList size={16} />
          {data.length} active
        </div>
      </div>

      <div className={styles.tableCard}>
        <Table columns={columns} data={data} loading={loading} emptyMessage="You have no active rentals" />
      </div>
    </div>
  )
}
