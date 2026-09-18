// 휴일/추가 근무 유형과 추가금 설정.
// '정상근무'는 항상 추가금이 없고, '추가근무'는 원장님이 설정 페이지에서 금액을 바꿀 수 있습니다.
export const HOL_TYPES = ['normal', 'extra']

export const HOL_TYPE_LABEL = {
  normal: '정상근무',
  extra: '추가근무',
}

export const HOL_TYPE_COLOR = {
  normal: '#378ADD',
  extra: '#E05A2B',
}

import { getSyncedValue, setSyncedValue, subscribeSynced } from './docStore.js'

const DEFAULT_BONUS = { extra: 30000 }
export const HOL_BONUS_STORE_KEY = 'nowgym-hol-bonus-settings'

export function getHolBonusSettings() {
  return { ...DEFAULT_BONUS, ...(getSyncedValue(HOL_BONUS_STORE_KEY, DEFAULT_BONUS) || {}) }
}

export function setHolBonusSettings(next) {
  setSyncedValue(HOL_BONUS_STORE_KEY, DEFAULT_BONUS, next)
}

export function subscribeHolBonusSettings(fn) {
  return subscribeSynced(HOL_BONUS_STORE_KEY, DEFAULT_BONUS, v => fn({ ...DEFAULT_BONUS, ...v }))
}

export function holidayBonusAmount(type) {
  if (type === 'normal') return 0
  const settings = getHolBonusSettings()
  return settings[type] || 0
}

export function holidayLabel(type) {
  return HOL_TYPE_LABEL[type] || type
}
