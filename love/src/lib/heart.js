const pt = t => [
  16 * Math.sin(t) ** 3,
  -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)),
]

// Evenly spaced points along the heart outline by arc length, with the tangent angle for each.
// Output is in % of a square box, so the layout never needs recomputing on resize.
export function layout(n, steps = 1200) {
  const pts = Array.from({ length: steps + 1 }, (_, i) => pt((i / steps) * 2 * Math.PI))
  const cum = [0]
  for (let i = 1; i <= steps; i++) {
    cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))
  }
  const total = cum[steps]
  return Array.from({ length: n }, (_, k) => {
    const s = ((k + 1) / n) * total // phase puts a dot, not a word, on the top cleft
    let j = 0
    while (j < steps && cum[j] < s) j++
    const a = pts[Math.max(j - 1, 0)]
    const b = pts[Math.min(j + 1, steps)]
    let ang = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI
    if (ang > 90 || ang < -90) ang += 180 // keep text readable on the left and bottom
    return { x: 50 + pts[j][0] * 2.7, y: 50 + (pts[j][1] - 2.5) * 2.7, ang, dot: k % 2 === 1 }
  })
}
