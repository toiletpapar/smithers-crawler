// Rounds a number to the closest precision. Useful for floats.
const precisionRound = (x: number, precision: number): number => {
  return Math.round(x * Math.pow(10, precision)) / Math.pow(10, precision)
}

// Compares to floats to the nearest precision
const precisionEquals = (x: number, y: number, precision: number): boolean => {
  return precisionRound(x, precision) === precisionRound(y, precision)
}

export {
  precisionEquals,
  precisionRound
}