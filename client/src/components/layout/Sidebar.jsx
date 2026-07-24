import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, Package, Users, ClipboardList,
  RotateCcw, LogOut, Wrench, ShoppingBag, User, Menu, X
} from 'lucide-react'
import styles from './Sidebar.module.css'
import { useState } from 'react'

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/equipment', label: 'Equipment', icon: Package },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/rentals', label: 'Rentals', icon: ClipboardList },
  { to: '/admin/returns', label: 'Returns', icon: RotateCcw },
]

const customerLinks = [
  { to: '/customer', label: 'Browse', icon: ShoppingBag, end: true },
  { to: '/customer/my-rentals', label: 'My Rentals', icon: ClipboardList },
  { to: '/customer/profile', label: 'Profile', icon: User },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const links = user?.role === 'admin' ? adminLinks : customerLinks

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      <button className={styles.menuBtn} onClick={() => setOpen(true)}>
        <Menu size={22} />
      </button>

      {open && <div className={styles.backdrop} onClick={() => setOpen(false)} />}

      <aside className={[styles.sidebar, open ? styles.open : ''].join(' ')}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}><Wrench size={20} /></div>
          <div>
            <div className={styles.logoText}>RentEase</div>
            <div className={styles.logoSub}>{user?.role === 'admin' ? 'Admin Panel' : 'Customer Portal'}</div>
          </div>
          <button className={styles.closeBtn} onClick={() => setOpen(false)}><X size={18} /></button>
        </div>

        <div className={styles.userCard}>
          <div className={styles.avatar}>
            {(user?.customer_name || user?.username || 'U').charAt(0).toUpperCase()}
          </div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{user?.customer_name || user?.username}</div>
            <div className={styles.userRole}>{user?.role}</div>
          </div>
        </div>

        <nav className={styles.nav}>
          <div className={styles.navLabel}>Navigation</div>
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => [styles.link, isActive ? styles.active : ''].join(' ')}
              onClick={() => setOpen(false)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <button className={styles.logout} onClick={handleLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </aside>
    </>
  )
}
