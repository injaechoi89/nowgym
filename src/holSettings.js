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

// 근무 기록 한 건의 추가금. 등록 당시 직접 입력한 금액(amount)이 있으면 그 값을 쓰고,
// 없으면(예전 기록) 그 유형의 기본 설정값을 그대로 씁니다.
export function recordBonusAmount(rec) {
  if (rec.type === 'normal') return 0
  return rec.amount != null ? rec.amount : holidayBonusAmount(rec.type)
}

export function holidayLabel(type) {
  return HOL_TYPE_LABEL[type] || type
}
