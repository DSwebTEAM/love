const CHORDS = [
  [220, 261.63, 329.63, 440],
  [174.61, 261.63, 349.23, 440],
  [196, 261.63, 329.63, 392],
  [196, 246.94, 293.66, 392],
]
const LEVEL = 0.22

// Ambient pad synthesised with Web Audio (no files, no licensing), or the user's own track.
export function createSound() {
  let ctx, master, timer, el, mode = 'pad', muted = false

  const apply = () => {
    if (master) master.gain.setTargetAtTime(mode === 'pad' && !muted ? LEVEL : 0, ctx.currentTime, 0.4)
    if (el) el.muted = muted
  }

  function buildPad() {
    ctx = new (window.AudioContext || window.webkitAudioContext)()
    master = ctx.createGain()
    master.gain.value = 0
    master.connect(ctx.destination)
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 1100
    lp.connect(master)
    const lfo = ctx.createOscillator()
    const depth = ctx.createGain()
    lfo.frequency.value = 0.12
    depth.gain.value = 400
    lfo.connect(depth)
    depth.connect(lp.frequency)
    lfo.start()
    const voices = []
    for (let v = 0; v < 4; v++) {
      for (const detune of [-4, 4]) {
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.detune.value = detune
        g.gain.value = 0.12
        o.connect(g)
        g.connect(lp)
        o.start()
        voices.push(o)
      }
    }
    let i = 0
    const next = () => {
      const c = CHORDS[i++ % CHORDS.length]
      voices.forEach((o, n) => o.frequency.setTargetAtTime(c[n >> 1], ctx.currentTime, 1.2))
    }
    next()
    timer = setInterval(next, 6500)
    master.gain.linearRampToValueAtTime(muted ? 0 : LEVEL, ctx.currentTime + 5)
  }

  return {
    start() {
      if (ctx) return
      try { buildPad() } catch { /* audio unavailable or blocked: stay silent */ }
    },
    playFile(file) {
      if (el) { el.pause(); URL.revokeObjectURL(el.src) }
      el = new Audio(URL.createObjectURL(file))
      el.loop = true
      mode = 'file'
      apply()
      el.play().catch(() => {})
    },
    playAmbient() {
      if (el) { el.pause(); el = null }
      mode = 'pad'
      apply()
    },
    setMuted(m) { muted = m; apply() },
    pause() { ctx?.suspend(); el?.pause() },
    resume() { ctx?.resume(); if (mode === 'file') el?.play().catch(() => {}) },
    stop() { clearInterval(timer); ctx?.close() },
  }
}
