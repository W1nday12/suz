export function tapHaptic(): void {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(8)
    }
  } catch {
    // iOS Safari does not expose vibration; visual feedback is enough.
  }
}

export function successHaptic(): void {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([12, 40, 18])
    }
  } catch {
    // no-op
  }
}

export function errorHaptic(): void {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([30, 40, 30])
    }
  } catch {
    // no-op
  }
}
