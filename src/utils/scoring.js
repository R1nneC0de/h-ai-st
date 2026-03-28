const LASER_PENALTIES = { 1: 20, 2: 35, 3: 50 }

export function laserHitPenalty(section) {
  return LASER_PENALTIES[section] ?? 20
}

export function slotsBonus(symbols) {
  if (symbols[0] === 'Seven' && symbols[1] === 'Seven' && symbols[2] === 'Seven') {
    return 300
  }
  return 0
}

export function rouletteBonus(betNumber, betColor, resultNumber, resultColor) {
  const numMatch = betNumber === resultNumber
  const colorMatch = betColor === resultColor
  if (numMatch && colorMatch) return 400
  if (numMatch) return 200
  if (colorMatch) return 100
  return 0
}

export function blackjackBonus(handTotal) {
  if (handTotal === 21) return 500
  if (handTotal > 21) return -150
  return 0
}
