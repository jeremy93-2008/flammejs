import { clearTimeout } from 'node:timers'

let timeoutId: NodeJS.Timeout | null = null

export function debounce(fn: () => void | Promise<void>, delay: number = 100) {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(fn, delay)
}
