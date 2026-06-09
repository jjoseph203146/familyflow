import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { TopBar } from '@/components/layout/AppLayout'

export function JoinFamily() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { refreshProfile } = useAuth()
  const [suffix, setSuffix] = useState(() => {
    const raw = searchParams.get('code') ?? ''
    return raw.startsWith('FAM-') ? raw.slice(4) : raw
  })
  const [role, setRole] = useState<'parent' | 'child'>('child')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    const normalized = suffix.trim().toUpperCase()
    if (!normalized) { setError('Please enter the last 4 characters of your invite code.'); return }

    setLoading(true)
    setError('')

    const { error: rpcError } = await supabase.rpc('join_family', {
      p_invite_code: 'FAM-' + normalized,
      p_role: role,
    })

    if (rpcError) {
      setError(rpcError.message.includes('Invalid invite code')
        ? "That code doesn't match any family. Double-check it and try again."
        : rpcError.message)
      setLoading(false)
      return
    }

    await refreshProfile()
    navigate(role === 'parent' ? '/parent' : '/child')
  }

  function handleSuffixChange(val: string) {
    setSuffix(val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))
    setError('')
  }

  return (
    <div className="app-shell">
      <TopBar onBack={() => navigate('/onboarding')} />
      <div className="screen screen-padded">
        <div style={{ padding: '8px 0 24px' }}>
          <h1>Join a family</h1>
          <p className="text-muted" style={{ marginTop: 6 }}>Enter the invite code from your family manager.</p>
        </div>

        <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="input-group">
            <label className="input-label">Invite code</label>
            <div style={{
              display: 'flex', alignItems: 'center',
              border: `2px solid ${error ? '#EF4444' : '#E5E7EB'}`,
              borderRadius: 12, overflow: 'hidden', background: '#fff',
            }}>
              <span style={{
                padding: '0 4px 0 16px',
                fontSize: 22, fontWeight: 800,
                color: '#5C5CE0', letterSpacing: '0.1em',
                userSelect: 'none', whiteSpace: 'nowrap',
              }}>
                FAM-
              </span>
              <input
                className="input-field"
                placeholder="XXXX"
                value={suffix}
                onChange={e => handleSuffixChange(e.target.value)}
                style={{
                  fontSize: 22, fontWeight: 800, letterSpacing: '0.1em',
                  border: 'none', borderRadius: 0, padding: '14px 16px 14px 0',
                  flex: 1, outline: 'none', boxShadow: 'none',
                }}
                maxLength={4}
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
          </div>

          <div>
            <div className="input-label" style={{ marginBottom: 10 }}>Your role</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {(['parent', 'child'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  style={{
                    flex: 1, padding: '14px 16px',
                    borderRadius: 12, border: `2px solid ${role === r ? '#5C5CE0' : '#E5E7EB'}`,
                    background: role === r ? '#EEF0FD' : '#fff',
                    color: role === r ? '#5C5CE0' : '#6B7280',
                    fontWeight: 600, fontSize: 15, cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {r === 'parent' ? '👩 Parent' : '🧒 Child'}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="notif-banner warning">
              <span>⚠️</span> {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? 'Joining…' : 'Join family'}
          </button>
        </form>
      </div>
    </div>
  )
}
