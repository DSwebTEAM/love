import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { layout } from '../lib/heart'

const N = 24 // multiple of 4 so a dot lands on both the top cleft and the bottom tip
const STAGGER = 85
const rand = (a, b) => a + Math.random() * (b - a)

export default function Heart({ word, name, run }) {
  const root = useRef(null)
  const pts = useMemo(() => layout(N), [])
  const [formed, setFormed] = useState(false)

  // Layout effect so a replay never paints a frame of the finished heart first.
  // Only transform, opacity and a short blur are animated; the final state is the plain inline style.
  useLayoutEffect(() => {
    setFormed(false)
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const anims = []
    if (!reduce) {
      root.current.querySelectorAll('.w').forEach((el, k) => {
        const th = rand(0, Math.PI * 2)
        const r = rand(60, 110)
        const from = `translate(-50%,-50%) translate(${Math.cos(th) * r}vmin,${Math.sin(th) * r}vmin) rotate(${rand(-360, 360)}deg) scale(.2)`
        const to = `translate(-50%,-50%) rotate(${pts[k].ang}deg)`
        anims.push(el.animate(
          [{ transform: from, opacity: 0, filter: 'blur(10px)' }, { transform: to, opacity: 1, filter: 'blur(0px)' }],
          { duration: rand(1900, 2600), delay: 300 + k * STAGGER, easing: 'cubic-bezier(.16,.84,.3,1)', fill: 'backwards' },
        ))
      })
    }
    const t = setTimeout(() => setFormed(true), reduce ? 100 : 300 + N * STAGGER + 2300)
    return () => { clearTimeout(t); anims.forEach(a => a.cancel()) }
  }, [run, word, pts])

  const fs = 3.2 * Math.min(1, 4.5 / Math.max(word.length, 1))
  const nameSize = Math.max(6, 12 - Math.max(0, name.length - 6) * 0.5)

  return (
    <div ref={root} className={'heart' + (formed ? ' beat' : '')} style={{ '--fs': `${fs}vmin` }}>
      {pts.map((p, i) => (
        <span
          key={i}
          className={'w' + (p.dot ? ' dot' : '')}
          style={{ left: `${p.x}%`, top: `${p.y}%`, transform: `translate(-50%,-50%) rotate(${p.ang}deg)` }}
          aria-hidden="true"
        >
          {p.dot ? '•' : word}
        </span>
      ))}
      <div className={'halo' + (formed ? ' on' : '')} />
      <h1 className={'name' + (formed ? ' on' : '')} style={{ fontSize: `${nameSize}vmin` }}>{name}</h1>
    </div>
  )
}
