import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { login as apiLogin, register as apiRegister } from '../api'
import toast from 'react-hot-toast'
import { Wrench, User, Lock, Mail, Eye, EyeOff } from 'lucide-react'
import styles from './Login.module.css'

export default function Login() {
  const [tab, setTab] = useState('login')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [regForm, setRegForm] = useState({ username: '', email: '', password: '' })

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!loginForm.username || !loginForm.password) return toast.error('Fill in all fields')
    setLoading(true)
    try {
      const { data } = await apiLogin(loginForm)
      login(data.user)
      toast.success('Welcome back!')
      navigate(data.user.role === 'admin' ? '/admin' : '/customer')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (regForm.password.length < 6) return toast.error('Password must be at least 6 characters')
    setLoading(true)
    try {
      await apiRegister(regForm)
      toast.success('Account created! Please login.')
      setTab('login')
      setRegForm({ username: '', email: '', password: '' })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.bg}>
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        <div className={styles.orb3} />
      </div>

      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logoWrap}>
            <div className={styles.logoIcon}><Wrench size={28} /></div>
          </div>
          <h1 className={styles.title}>RentEase</h1>
          <p className={styles.subtitle}>Equipment Rental Management</p>
        </div>

        <div className={styles.tabs}>
          <button
            className={[styles.tab, tab === 'login' ? styles.activeTab : ''].join(' ')}
            onClick={() => setTab('login')}
          >Login</button>
          <button
            className={[styles.tab, tab === 'register' ? styles.activeTab : ''].join(' ')}
            onClick={() => setTab('register')}
          >Register</button>
        </div>

        <div className={styles.body}>
          {tab === 'login' ? (
            <form onSubmit={handleLogin} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Username</label>
                <div className={styles.inputWrap}>
                  <User size={16} className={styles.inputIcon} />
                  <input
                    className={styles.input}
                    placeholder="Enter your username"
                    value={loginForm.username}
                    onChange={e => setLoginForm(p => ({ ...p, username: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Password</label>
                <div className={styles.inputWrap}>
                  <Lock size={16} className={styles.inputIcon} />
                  <input
                    className={styles.input}
                    type={showPass ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={loginForm.password}
                    onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
                    required
                  />
                  <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(p => !p)}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? <span className={styles.spinner} /> : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Username</label>
                <div className={styles.inputWrap}>
                  <User size={16} className={styles.inputIcon} />
                  <input
                    className={styles.input}
                    placeholder="Choose a username"
                    value={regForm.username}
                    onChange={e => setRegForm(p => ({ ...p, username: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Email</label>
                <div className={styles.inputWrap}>
                  <Mail size={16} className={styles.inputIcon} />
                  <input
                    className={styles.input}
                    type="email"
                    placeholder="your@email.com"
                    value={regForm.email}
                    onChange={e => setRegForm(p => ({ ...p, email: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Password</label>
                <div className={styles.inputWrap}>
                  <Lock size={16} className={styles.inputIcon} />
                  <input
                    className={styles.input}
                    type={showPass ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    value={regForm.password}
                    onChange={e => setRegForm(p => ({ ...p, password: e.target.value }))}
                    required
                  />
                  <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(p => !p)}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? <span className={styles.spinner} /> : 'Create Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
