import { getSyncedValue, setSyncedValue, subscribeSynced } from './docStore.js'

export const PT_HOURS_STORE_KEY = 'nowgym-pt-hours-settings'
const DEFAULT = { start: '09:00', end: '19:00' }

export function getPtHoursSettings() {
  return { ...DEFAULT, ...(getSyncedValue(PT_HOURS_STORE_KEY, DEFAULT) || {}) }
}

export function setPtHoursSettings(next) {
  setSyncedValue(PT_HOURS_STORE_KEY, DEFAULT, next)
}

export function subscribePtHoursSettings(fn) {
  return subscribeSynced(PT_HOURS_STORE_KEY, DEFAULT, v => fn({ ...DEFAULT, ...v }))
}

// start~end 사이 30분 단위 시간 슬롯 목록을 만든다 (end는 그 시각까지 포함해서 시작 가능)
export function buildHourSlots(start, end) {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const slots = []
  let h = sh, m = sm
  let guard = 0
  while ((h < eh || (h === eh && m <= em)) && guard < 96) {
    slots.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
    m += 30
    if (m >= 60) { m -= 60; h += 1 }
    guard++
  }
  return slots
}
