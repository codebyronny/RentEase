import { useState } from 'react'
import { updateCustomer } from '../../api'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { User, Mail, Phone, MapPin, Save } from 'lucide-react'
import styles from './CustomerShared.module.css'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({
    name: user.customer_name || '',
    email: user.email || '',
    phone: user.phone || '',
    address: user.address || '',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user.customer_id) return toast.error('Customer ID not found')
    setSaving(true)
    try {
      await updateCustomer(user.customer_id, form)
      updateUser({ customer_name: form.name, email: form.email, phone: form.phone, address: form.address })
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile')
    } finally { setSaving(false) }
  }

  const initial = (user.customer_name || user.username || 'U').charAt(0).toUpperCase()

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>My Profile</h1>
          <p className={styles.sub}>Manage your account information</p>
        </div>
      </div>

      <div className={styles.profileCard}>
        <div className={styles.profileTop}>
          <div className={styles.avatar}>{initial}</div>
          <div>
            <div className={styles.profileName}>{user.customer_name || user.username}</div>
            <div className={styles.profileEmail}>{user.email}</div>
            <div className={styles.profileRole}>Customer Account</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.profileForm}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label}><User size={13} /> Full Name</label>
              <input className={styles.input} value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}><Mail size={13} /> Email Address</label>
              <input className={styles.input} type="email" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}><Phone size={13} /> Phone Number</label>
              <input className={styles.input} value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}><MapPin size={13} /> Address</label>
              <input className={styles.input} value={form.address}
                onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
            </div>
          </div>
          <button type="submit" className={styles.saveBtn} disabled={saving}>
            {saving ? <span className={styles.spinner} /> : <><Save size={16} /> Save Changes</>}
          </button>
        </form>
      </div>
    </div>
  )
}
