import { getSyncedValue, setSyncedValue, subscribeSynced } from './docStore.js'

export const PT_HOURS_STORE_KEY = 'nowgym-pt-hours-settings'
const DEFAULT_HOURS = { start: '09:00', end: '19:00' }
const TRAINER_NAMES = ['정우', '준혁', '건호', '인재']
const DEFAULT = Object.fromEntries(TRAINER_NAMES.map(name => [name, DEFAULT_HOURS]))

// 트레이너마다 PT 시간표 운영시간이 다를 수 있어서 트레이너별로 저장합니다.
// 예전에는 전체가 공유하는 {start,end} 하나였는데, 그 형태로 저장된 값이 남아있으면
// 모든 트레이너의 기존 값으로 그대로 옮겨줍니다.
function normalize(raw) {
  if (!raw) return DEFAULT
  if (raw.start && raw.end) {
    const base = { start: raw.start, end: raw.end }
    return Object.fromEntries(TRAINER_NAMES.map(name => [name, base]))
  }
  return Object.fromEntries(TRAINER_NAMES.map(name => [name, { ...DEFAULT_HOURS, ...(raw[name] || {}) }]))
}

export function getPtHoursSettings() {
  return normalize(getSyncedValue(PT_HOURS_STORE_KEY, DEFAULT))
}

export function setPtHoursSettingsFor(trainerName, hours) {
  const current = getPtHoursSettings()
  setSyncedValue(PT_HOURS_STORE_KEY, DEFAULT, { ...current, [trainerName]: hours })
}

export function subscribePtHoursSettings(fn) {
  return subscribeSynced(PT_HOURS_STORE_KEY, DEFAULT, v => fn(normalize(v)))
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
