const SYMBOL_MAP = {
  Cherry: '1',
  Bell: '2',
  Bar: '3',
  Diamond: '4',
  Seven: '7',
}

export function slotsToDigits(symbols) {
  return symbols.map((s) => SYMBOL_MAP[s] ?? '0')
}

export function rouletteToDigits(number) {
  const padded = String(number).padStart(2, '0')
  return [padded[0], padded[1]]
}

export function blackjackToDigits(total) {
  const padded = String(total).padStart(2, '0')
  return [padded[0], padded[1]]
}

export function validateVaultCode(entered, stored) {
  if (entered.length !== stored.length) return false
  return entered.every((d, i) => d === stored[i])
}
