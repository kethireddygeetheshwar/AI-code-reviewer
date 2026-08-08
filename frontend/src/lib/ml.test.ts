import { describe, expect, it } from 'vitest'
import {
  knn,
  leaveOneOutAccuracy,
  perceptronClassify,
  trainLinearRegression,
  trainPerceptron,
} from './ml'
import type { Pt } from './ml'

const clusters: Pt[] = [
  { id: 1, x: 20, y: 20, label: 0 },
  { id: 2, x: 26, y: 28, label: 0 },
  { id: 3, x: 80, y: 80, label: 1 },
  { id: 4, x: 74, y: 72, label: 1 },
]

describe('knn', () => {
  it('classifies a point near cluster A as class 0', () => {
    expect(knn(clusters, 22, 24, 3)).toBe(0)
  })

  it('classifies a point near cluster B as class 1', () => {
    expect(knn(clusters, 78, 76, 3)).toBe(1)
  })

  it('breaks ties toward the nearest neighbour', () => {
    const pts: Pt[] = [
      { id: 1, x: 0, y: 0, label: 0 },
      { id: 2, x: 1, y: 0, label: 0 },
      { id: 3, x: 0, y: 1, label: 1 },
      { id: 4, x: 100, y: 100, label: 1 },
    ]
    expect(knn(pts, 0, 0, 4)).toBe(0)
  })

  it('returns 0 when the dataset is empty', () => {
    expect(knn([], 50, 50, 3)).toBe(0)
  })
})

describe('leaveOneOutAccuracy', () => {
  it('reaches 100% for perfectly separated clusters with k=1', () => {
    expect(leaveOneOutAccuracy(clusters, 1)).toBe(100)
  })

  it('returns 0 for an empty dataset', () => {
    expect(leaveOneOutAccuracy([], 3)).toBe(0)
  })
})

describe('trainPerceptron', () => {
  const andGate = [
    { x: 0, y: 0, label: 0 },
    { x: 0, y: 1, label: 0 },
    { x: 1, y: 0, label: 0 },
    { x: 1, y: 1, label: 1 },
  ]

  it('learns the AND gate to 100% accuracy', () => {
    const { weights, bias } = trainPerceptron(andGate, 0.6, 30)
    const correct = andGate.filter(
      (p) => perceptronClassify(weights[0], weights[1], bias, p.x, p.y) === p.label,
    )
    expect(correct).toHaveLength(4)
  })

  it('starts from supplied weights and continues training', () => {
    const first = trainPerceptron(andGate, 0.6, 1)
    const second = trainPerceptron(andGate, 0.6, 1, first)
    expect(second.weights[0]).toBeGreaterThan(first.weights[0])
  })
})

describe('trainLinearRegression', () => {
  it('fits a line close to y ≈ 2x', () => {
    const data = [
      { x: 1, y: 2.1 },
      { x: 2, y: 4.0 },
      { x: 3, y: 5.9 },
      { x: 4, y: 8.1 },
      { x: 5, y: 10.0 },
    ]
    const { slope, intercept } = trainLinearRegression(data, 2000, 0.01)
    expect(slope).toBeCloseTo(2, 0.4)
    expect(intercept).toBeCloseTo(0, 0.4)
  })
})
