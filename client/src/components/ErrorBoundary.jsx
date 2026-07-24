import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: '#0f0f1a', color: '#f1f5f9',
          fontFamily: 'Inter, sans-serif', flexDirection: 'column', gap: 16, padding: 32
        }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Something went wrong</h2>
          <pre style={{
            background: '#1a1a2e', padding: 16, borderRadius: 10,
            fontSize: 12, color: '#ef4444', maxWidth: 600, overflow: 'auto',
            border: '1px solid rgba(239,68,68,0.3)'
          }}>
            {this.state.error.message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 24px', background: '#6366f1', color: 'white',
              border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600
            }}
          >Reload</button>
        </div>
      )
    }
    return this.props.children
  }
}
