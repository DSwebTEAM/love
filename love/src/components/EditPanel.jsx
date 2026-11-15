import { X, Music, Upload } from 'lucide-react'

const SWATCHES = ['#ff2e63', '#ff7a59', '#ffc857', '#5ce1e6', '#b388ff']
const KEYS = [['R / Space', 'Replay'], ['E', 'Edit'], ['F', 'Full screen'], ['M', 'Mute'], ['Esc', 'Close']]

export default function EditPanel({ open, cfg, patch, track, onFile, onAmbient, onClose }) {
  const commitWord = e => {
    const v = e.target.value.trim().toUpperCase()
    if (v) patch({ word: v })
    else e.target.value = cfg.word
  }
  return (
    <aside className={'panel' + (open ? ' open' : '')} role="dialog" aria-label="Edit" aria-hidden={!open}>
      <header>
        <h2>Edit</h2>
        <button type="button" className="ib" aria-label="Close" onClick={onClose}><X size={20} /></button>
      </header>

      <label>Name
        <input value={cfg.name} maxLength={16} onChange={e => patch({ name: e.target.value })} />
      </label>

      <label>Word
        <input
          key={cfg.word}
          defaultValue={cfg.word}
          maxLength={6}
          onBlur={commitWord}
          onKeyDown={e => e.key === 'Enter' && e.target.blur()}
        />
      </label>

      <div className="field">
        <span>Colour</span>
        <div className="swatches">
          {SWATCHES.map(c => (
            <button
              key={c}
              type="button"
              className="sw"
              style={{ background: c }}
              aria-label={`Colour ${c}`}
              aria-pressed={cfg.accent === c}
              onClick={() => patch({ accent: c })}
            />
          ))}
        </div>
      </div>

      <div className="field">
        <span>Music</span>
        <div className="row">
          <button type="button" className="txt" onClick={onAmbient} aria-pressed={!track}><Music size={16} /> Ambient</button>
          <label className="txt"><Upload size={16} /> Your file
            <input type="file" accept="audio/*" hidden onChange={e => e.target.files[0] && onFile(e.target.files[0])} />
          </label>
        </div>
        {track && <small>Playing: {track}</small>}
      </div>

      <dl className="keys">
        {KEYS.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}
        <div><dt>Swipe up</dt><dd>Edit</dd></div>
        <div><dt>Double-tap</dt><dd>Replay</dd></div>
      </dl>
    </aside>
  )
}
