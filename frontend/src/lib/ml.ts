export type Point = { x: number; y: number; label?: number }
export type Pt = { id: number; x: number; y: number; label: 0 | 1 }

export function knn(points: Pt[], x: number, y: number, k: number): 0 | 1 {
  const near = points
    .map((p) => ({ p, d: (p.x - x) ** 2 + (p.y - y) ** 2 }))
    .sort((a, b) => a.d - b.d)
    .slice(0, k)
  if (!near.length) return 0
  const c0 = near.filter((n) => n.p.label === 0).length
  const c1 = near.filter((n) => n.p.label === 1).length
  if (c0 === c1) return near[0].p.label
  return c0 > c1 ? 0 : 1
}

export function leaveOneOutAccuracy(points: Pt[], k: number): number {
  if (!points.length) return 0
  const correct = points.filter(
    (p) =>
      knn(
        points.filter((o) => o.id !== p.id),
        p.x,
        p.y,
        k,
      ) === p.label,
  ).length
  return Math.round((correct / points.length) * 100)
}

export function trainPerceptron(
  points: Point[],
  lr = 0.6,
  epochs = 30,
  start: { weights: [number, number]; bias: number } = { weights: [0, 0], bias: 0 },
): { weights: [number, number]; bias: number } {
  let [w1, w2] = start.weights
  let b = start.bias
  for (let e = 0; e < epochs; e++) {
    for (const p of points) {
      const guess = perceptronClassify(w1, w2, b, p.x, p.y)
      const err = (p.label || 0) - guess
      w1 += lr * err * p.x
      w2 += lr * err * p.y
      b += lr * err
    }
  }
  return { weights: [w1, w2], bias: b }
}

export function perceptronClassify(w1: number, w2: number, b: number, x: number, y: number): 0 | 1 {
  return w1 * x + w2 * y + b >= 0 ? 1 : 0
}

export function trainLinearRegression(
  points: Point[],
  steps = 500,
  lr = 0.03,
): { slope: number; intercept: number } {
  let slope = 0
  let intercept = 0
  for (let e = 0; e < steps; e++) {
    let dm = 0
    let db = 0
    for (const p of points) {
      const error = slope * p.x + intercept - p.y
      dm += error * p.x
      db += error
    }
    slope -= (lr * dm) / points.length
    intercept -= (lr * db) / points.length
  }
  return { slope, intercept }
}
