import { useState, useEffect } from 'react'
import { getEquipment, createRental } from '../../api'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { Search, ShoppingCart, Tag, Layers, IndianRupee } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import styles from './Browse.module.css'

function EquipmentCard({ item, onRent }) {
  const available = item.available_quantity > 0
  return (
    <div className={[styles.card, !available ? styles.unavailable : ''].join(' ')}>
      <div className={styles.cardTop}>
        <div className={styles.cardIcon}>
          <Layers size={24} />
        </div>
        <Badge variant={available ? 'success' : 'danger'}>
          {available ? `${item.available_quantity} available` : 'Unavailable'}
        </Badge>
      </div>
      <h3 className={styles.cardName}>{item.name}</h3>
      <div className={styles.cardMeta}>
        <span className={styles.metaItem}><Tag size={13} /> {item.category}</span>
      </div>
      <div className={styles.cardRate}>
        <IndianRupee size={16} />
        <span>{item.daily_rate}</span>
        <span className={styles.perDay}>/day</span>
      </div>
      <button
        className={[styles.rentBtn, !available ? styles.rentBtnDisabled : ''].join(' ')}
        onClick={() => available && onRent(item)}
        disabled={!available}
      >
        <ShoppingCart size={16} />
        {available ? 'Rent Now' : 'Not Available'}
      </button>
    </div>
  )
}

export default function Browse() {
  const { user } = useAuth()
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [selected, setSelected] = useState(null)
  const [days, setDays] = useState('')
  const [renting, setRenting] = useState(false)

  const load = () => {
    setLoading(true)
    getEquipment().then(r => setEquipment(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const categories = ['All', ...new Set(equipment.map(e => e.category))]

  const filtered = equipment.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'All' || e.category === category
    return matchSearch && matchCat
  })

  const totalCost = selected && days ? (parseFloat(selected.daily_rate) * parseInt(days)).toFixed(2) : null

  const handleRent = async (e) => {
    e.preventDefault()
    if (!days || parseInt(days) < 1) return toast.error('Enter valid number of days')
    setRenting(true)
    try {
      await createRental({
        customer_id: user.customer_id,
        equipment_id: selected.equipment_id,
        rental_days: parseInt(days)
      })
      toast.success('Equipment rented successfully!')
      setSelected(null)
      setDays('')
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to rent')
    } finally { setRenting(false) }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Browse Equipment</h1>
          <p className={styles.sub}>Find and rent the equipment you need</p>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input className={styles.search} placeholder="Search equipment..." value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <div className={styles.categories}>
          {categories.map(cat => (
            <button
              key={cat}
              className={[styles.catBtn, category === cat ? styles.catActive : ''].join(' ')}
              onClick={() => setCategory(cat)}
            >{cat}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className={styles.skeleton} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>No equipment found</div>
      ) : (
        <div className={styles.grid}>
          {filtered.map(item => (
            <EquipmentCard key={item.equipment_id} item={item} onRent={setSelected} />
          ))}
        </div>
      )}

      <Modal open={!!selected} onClose={() => { setSelected(null); setDays('') }} title="Rent Equipment">
        {selected && (
          <form onSubmit={handleRent} className={styles.rentForm}>
            <div className={styles.equipInfo}>
              <div className={styles.equipInfoIcon}><Layers size={20} /></div>
              <div>
                <div className={styles.equipInfoName}>{selected.name}</div>
                <div className={styles.equipInfoRate}>₹{selected.daily_rate} per day</div>
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Number of Days</label>
              <input
                className={styles.input}
                type="number"
                min="1"
                max="365"
                placeholder="e.g. 7"
                value={days}
                onChange={e => setDays(e.target.value)}
                required
                autoFocus
              />
            </div>
            {totalCost && (
              <div className={styles.calcBox}>
                <span>{days} days × ₹{selected.daily_rate}</span>
                <span className={styles.calcTotal}>= ₹{totalCost}</span>
              </div>
            )}
            <div className={styles.formActions}>
              <button type="button" className={styles.cancelBtn} onClick={() => { setSelected(null); setDays('') }}>
                Cancel
              </button>
              <button type="submit" className={styles.submitBtn} disabled={renting}>
                {renting ? <span className={styles.spinner} /> : <><ShoppingCart size={16} /> Confirm Rental</>}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
