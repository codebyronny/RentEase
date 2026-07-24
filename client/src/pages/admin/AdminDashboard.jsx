import { useState, useEffect } from 'react'
import { getDashboardStats, getRecentRentals } from '../../api'
import { Package, AlertCircle, IndianRupee, Activity, CheckCircle } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import Badge from '../../components/ui/Badge'
import styles from './AdminDashboard.module.css'

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981']

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className={styles.statCard} style={{ '--accent': color }}>
      <div className={styles.statIcon}><Icon size={22} /></div>
      <div className={styles.statInfo}>
        <div className={styles.statValue}>{value}</div>
        <div className={styles.statLabel}>{label}</div>
        {sub && <div className={styles.statSub}>{sub}</div>}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getDashboardStats(), getRecentRentals()])
      .then(([s, r]) => {
        setStats(s.data)
        setRecent(r.data)
      })
      .finally(() => setLoading(false))
  }, [])

  // Build chart data from recent rentals
  const chartData = (() => {
    const map = {}
    recent.forEach(r => {
      const d = new Date(r.rental_date)
      const key = d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
      map[key] = (map[key] || 0) + 1
    })
    return Object.entries(map).slice(-7).map(([date, count]) => ({ date, count }))
  })()

  const pieData = stats ? [
    { name: 'Active', value: stats.activeRentals },
    { name: 'Available', value: stats.availableEquipment },
    { name: 'Total', value: stats.totalEquipment },
  ] : []

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <p className={styles.pageSubtitle}>Welcome back! Here's what's happening today.</p>
        </div>
        <div className={styles.dateBadge}>
          <Activity size={14} />
          {new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className={styles.statsGrid}>
        <StatCard
          label="Total Equipment"
          value={loading ? '—' : stats?.totalEquipment ?? 0}
          icon={Package}
          color="#6366f1"
          sub="All inventory items"
        />
        <StatCard
          label="Active Rentals"
          value={loading ? '—' : stats?.activeRentals ?? 0}
          icon={AlertCircle}
          color="#f59e0b"
          sub="Currently rented out"
        />
        <StatCard
          label="Available Units"
          value={loading ? '—' : stats?.availableEquipment ?? 0}
          icon={CheckCircle}
          color="#10b981"
          sub="Ready to rent"
        />
        <StatCard
          label="Monthly Revenue"
          value={loading ? '—' : `₹${Number(stats?.monthlyRevenue || 0).toLocaleString()}`}
          icon={IndianRupee}
          color="#06b6d4"
          sub="This month"
        />
      </div>

      <div className={styles.chartsRow}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3>Rental Activity</h3>
            <span className={styles.chartSub}>Last 7 days</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#f1f5f9' }}
                cursor={{ stroke: 'rgba(99,102,241,0.3)' }}
              />
              <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fill="url(#grad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3>Inventory Overview</h3>
            <span className={styles.chartSub}>Current status</span>
          </div>
          <div className={styles.pieWrap}>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#f1f5f9' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className={styles.pieLegend}>
              {pieData.map((d, i) => (
                <div key={i} className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: COLORS[i] }} />
                  <span>{d.name}: <strong>{d.value}</strong></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.recentCard}>
        <div className={styles.chartHeader}>
          <h3>Recent Rentals</h3>
          <span className={styles.chartSub}>Latest 10 transactions</span>
        </div>
        <div className={styles.recentList}>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={styles.recentSkeleton} />
            ))
          ) : recent.length === 0 ? (
            <div className={styles.empty}>No recent rentals</div>
          ) : (
            recent.map((r) => {
              const overdue = new Date(r.due_date) < new Date() && r.status === 'Active'
              return (
                <div key={r.rental_id} className={styles.recentItem}>
                  <div className={styles.recentIcon}>
                    <Package size={16} />
                  </div>
                  <div className={styles.recentInfo}>
                    <div className={styles.recentTitle}>{r.equipment_name}</div>
                    <div className={styles.recentSub}>by {r.customer_name} · Due {new Date(r.due_date).toLocaleDateString()}</div>
                  </div>
                  <Badge variant={overdue ? 'danger' : r.status === 'Active' ? 'warning' : 'success'}>
                    {overdue ? 'Overdue' : r.status}
                  </Badge>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
