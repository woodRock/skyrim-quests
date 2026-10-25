import { useState, type FormEvent } from 'react'
import { backend } from '../lib/backend'
import { play } from '../lib/sfx'
import { useGame } from '../store'

const MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'That is not a valid courier address.',
  'auth/invalid-credential': 'That pass-phrase is not yours.',
  'auth/wrong-password': 'That pass-phrase is not yours.',
  'auth/user-not-found': 'No one answers to that address.',
  'auth/email-already-in-use': 'Someone already answers to that address. Try continuing instead.',
  'auth/weak-password': 'Your pass-phrase needs at least 8 characters.',
  'auth/network-request-failed': 'The courier could not reach the realm.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
}
const messageFor = (err: unknown) => MESSAGES[(err as { code?: string; message?: string })?.code ?? (err as Error)?.message ?? ''] ?? 'The gate did not open. Try again.'

export function Login() {
  const { go } = useGame()
  const [mode, setMode] = useState<'continue' | 'register'>('continue')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const local = backend.mode === 'local'

  const run = async (fn: () => Promise<void>) => {
    setBusy(true); setError('')
    try { await fn(); play('open'); go('menu') }
    catch (err) { play('close'); setError(messageFor(err)) }
    finally { setBusy(false) }
  }
  const submit = (e: FormEvent) => { e.preventDefault(); void run(() => (mode === 'register' ? backend.register(email, password) : backend.signIn(email, password))) }

  return (
    <div className="screen menu-bg">
      <h2 className="menu-title skyrim-font">{mode === 'register' ? 'NEW ADVENTURER' : 'RETURN TO SKYRIM'}</h2>
      <form className="panel form" onSubmit={submit}>
        <label className="skyrim-font field" htmlFor="email">EMAIL</label>
        <input id="email" className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        {!local && (
          <>
            <label className="skyrim-font field" htmlFor="pw">PASSWORD</label>
            <input id="pw" className="input" type="password" required minLength={8} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} />
          </>
        )}
        {error && <div className="error serif" role="alert">{error}</div>}
        <button className="btn gold wide skyrim-font" disabled={busy}>{busy ? '...' : mode === 'register' ? 'BEGIN' : 'CONTINUE'}</button>
        {backend.signInWithGoogle && <button type="button" className="btn wide skyrim-font" disabled={busy} onClick={() => void run(() => backend.signInWithGoogle!())}>CONTINUE WITH GOOGLE</button>}
      </form>
      <p className="note serif">
        {local ? 'Local mode: saves stay on this device. No password needed.' : (
          <>{mode === 'register' ? 'Already registered? ' : 'New to Skyrim? '}
            <button className="link" type="button" onClick={() => { play('click'); setMode(mode === 'register' ? 'continue' : 'register'); setError('') }}>{mode === 'register' ? 'Continue your saga' : 'Register'}</button></>
        )}
      </p>
      <button className="btn ghost skyrim-font" onClick={() => { play('close'); go('title') }}>BACK</button>
    </div>
  )
}
