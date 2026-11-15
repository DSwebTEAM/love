import { useCallback, useEffect, useRef, useState } from 'react'
import { Pencil, RotateCcw, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react'
import Heart from './components/Heart'
import EditPanel from './components/EditPanel'
import { createSound } from './lib/sound'

const KEY = 'love-heart:v1'
const DEFAULTS = { name: 'You', word: 'LOVE', accent: '#ff2e63' }
const canFull = !!document.documentElement.requestFullscreen // iPhone Safari has no Fullscreen API

function load() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY)) } } catch { return DEFAULTS }
}

const Btn = ({ label, hint, onClick, children }) => (
  <button type="button" className="ib" aria-label={label} title={`${label} (${hint})`} onClick={onClick}>{children}</button>
)

export default function App() {
  const [cfg, setCfg] = useState(load)
  const [started, setStarted] = useState(false)
  const [run, setRun] = useState(0)
  const [editing, setEditing] = useState(false)
  const [muted, setMuted] = useState(false)
  const [track, setTrack] = useState('')
  const [awake, setAwake] = useState(true)
  const [full, setFull] = useState(false)
  const sound = useRef(null)
  if (!sound.current) sound.current = createSound()
  const tap = useRef({})

  const patch = p => setCfg(c => ({ ...c, ...p }))
  const replay = useCallback(() => setRun(n => n + 1), [])
  const toggleMute = useCallback(() => setMuted(m => !m), [])
  const toggleEdit = useCallback(() => setEditing(v => !v), [])
  const toggleFull = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen()
    else document.documentElement.requestFullscreen?.().catch(() => {})
  }, [])

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(cfg)) } catch { /* private mode: skip persistence */ }
  }, [cfg])
  useEffect(() => { sound.current.setMuted(muted) }, [muted])

  // Controls fade out after a few idle seconds so the piece is clean full screen.
  useEffect(() => {
    if (!started) return
    let t
    const wake = () => { setAwake(true); clearTimeout(t); t = setTimeout(() => setAwake(false), 3500) }
    const evs = ['pointermove', 'pointerdown', 'keydown']
    wake()
    evs.forEach(e => addEventListener(e, wake))
    return () => { clearTimeout(t); evs.forEach(e => removeEventListener(e, wake)) }
  }, [started])

  useEffect(() => {
    const onFs = () => setFull(!!document.fullscreenElement)
    const onVis = () => (document.hidden ? sound.current.pause() : sound.current.resume())
    document.addEventListener('fullscreenchange', onFs)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      document.removeEventListener('fullscreenchange', onFs)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  // One listener; handlers come through a ref so they are never stale.
  const keys = useRef({})
  keys.current = { started, r: replay, ' ': replay, e: toggleEdit, f: toggleFull, m: toggleMute }
  useEffect(() => {
    const onKey = ev => {
      if (ev.metaKey || ev.ctrlKey || ev.altKey || !keys.current.started) return
      if (ev.key === 'Escape') return setEditing(false)
      if (ev.target.matches?.('input, textarea')) return
      const k = ev.key.toLowerCase()
      if (k === ' ' && ev.target.matches?.('button')) return
      const fn = ['r', ' ', 'e', 'f', 'm'].includes(k) && keys.current[k]
      if (fn) { ev.preventDefault(); fn() }
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [])

  const onTouchStart = e => { const t = e.touches[0]; tap.current.s = { x: t.clientX, y: t.clientY } }
  const onTouchEnd = e => {
    const s = tap.current.s
    if (!s) return
    const t = e.changedTouches[0]
    const dx = t.clientX - s.x
    const dy = t.clientY - s.y
    if (dy < -70 && Math.abs(dx) < 60) return setEditing(true)
    if (Math.abs(dx) < 12 && Math.abs(dy) < 12) {
      const now = Date.now()
      if (now - (tap.current.last || 0) < 320) { replay(); tap.current.last = 0 } else tap.current.last = now
    }
  }

  const begin = e => {
    e.preventDefault() // the submit tap is the user gesture browsers require before audio can start
    sound.current.start()
    setStarted(true)
  }

  const idle = started && !awake && !editing
  return (
    <div className={'app' + (idle ? ' idle' : '')} style={{ '--accent': cfg.accent }}>
      <div className="stage" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {started && <Heart word={cfg.word} name={cfg.name} run={run} />}
      </div>

      {!started && (
        <form className="intro" onSubmit={begin}>
          <h1>What’s the name?</h1>
          <input value={cfg.name === 'You' ? '' : cfg.name} onChange={e => patch({ name: e.target.value || 'You' })}
            maxLength={16} placeholder="Type a name" aria-label="Name" autoComplete="off" autoFocus />
          <button type="submit" className="go">Begin</button>
        </form>
      )}

      {started && (
        <>
          <nav className={'dock' + (idle ? ' hide' : '')} aria-label="Controls">
            <Btn label="Edit" hint="E" onClick={toggleEdit}><Pencil size={20} /></Btn>
            <Btn label="Replay" hint="R" onClick={replay}><RotateCcw size={20} /></Btn>
            <Btn label={muted ? 'Unmute' : 'Mute'} hint="M" onClick={toggleMute}>
              {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </Btn>
            {canFull && (
              <Btn label={full ? 'Exit full screen' : 'Full screen'} hint="F" onClick={toggleFull}>
                {full ? <Minimize size={20} /> : <Maximize size={20} />}
              </Btn>
            )}
          </nav>
          {editing && <div className="scrim" onClick={() => setEditing(false)} />}
          <EditPanel
            open={editing}
            cfg={cfg}
            patch={patch}
            track={track}
            onClose={() => setEditing(false)}
            onFile={f => { sound.current.playFile(f); setTrack(f.name) }}
            onAmbient={() => { sound.current.playAmbient(); setTrack('') }}
          />
        </>
      )}
    </div>
  )
}
