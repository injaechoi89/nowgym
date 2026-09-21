// Vercel 서버는 UTC로 도는데, 앱의 날짜 키('YYYY-M-D')는 한국 시간(KST) 기준이라
// 서버 타임존에 상관없이 항상 KST 달력 날짜를 계산하는 헬퍼입니다.
export const TRAINER_NAMES = ['정우', '준혁', '건호', '인재']
export const IDENTITIES = ['원장님', ...TRAINER_NAMES]

export function kstDate(offsetDays = 0) {
  const nowKst = new Date(Date.now() + 9 * 3600 * 1000)
  nowKst.setUTCDate(nowKst.getUTCDate() + offsetDays)
  return { y: nowKst.getUTCFullYear(), m: nowKst.getUTCMonth() + 1, d: nowKst.getUTCDate(), dow: nowKst.getUTCDay() }
}

export function kstDateKey(offsetDays = 0) {
  const { y, m, d } = kstDate(offsetDays)
  return `${y}-${m}-${d}`
}
