// 구글 스프레드시트(월별 매출 시트)에서 실시간으로 매출 데이터를 가져옵니다.
// 시트가 "링크가 있으면 누구나 볼 수 있음"으로 공유되어 있어야 동작합니다.
const SHEET_ID = '1-1emio-hgAh8AAsdRxulhMK0uhmUySAj6tvROfGgEAE'

// 월별 탭의 gid. 시트에 새 달 탭이 추가되면 여기 한 줄만 추가해주면 됩니다.
// (없는 달은 탭 이름으로 자동 조회를 시도합니다.)
const TAB_GIDS = {
  '2025-01': '735104163', '2025-02': '1535994900', '2025-03': '2039440421', '2025-04': '438864827',
  '2025-05': '2102669744', '2025-06': '1670106777', '2025-07': '1402911412', '2025-08': '855582492',
  '2025-09': '1568459447', '2025-10': '1464730215', '2025-11': '777649421', '2025-12': '571873999',
  '2026-01': '1794661800', '2026-02': '973263170', '2026-03': '276482836', '2026-04': '1643203421',
  '2026-05': '122638833', '2026-06': '1101702712', '2026-07': '984324313', '2026-08': '1300086445',
  '2026-09': '110443872',
}

function tabNameFor(key) {
  const [y, m] = key.split('-')
  return `${y.slice(2)}년 ${Number(m)}월`
}

function parseCSV(text) {
  const rows = []
  let row = [], field = '', inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++ } else inQuotes = false }
      else field += c
    } else if (c === '"') inQuotes = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\r') { /* skip */ }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else field += c
  }
  if (field.length || row.length) { row.push(field); rows.push(row) }
  return rows
}

function num(s) {
  if (!s) return 0
  return parseInt(String(s).replace(/,/g, ''), 10) || 0
}

// 시트의 한 달 탭을 파싱해 매출 데이터를 반환합니다.
// 결제수단별 매출·신규/재등록 인원수는 모든 달에서 셀 위치가 확인되어 항상 채워지고,
// PT 합계·트레이너별 매출은 시트에 해당 표가 있는 달(대략 26년 1월~)에서만 채워집니다.
// 못 찾은 값은 undefined로 두어, 호출하는 쪽에서 기존 값을 그대로 쓰도록 합니다.
export async function fetchMonthSalesFromSheet(key) {
  const gid = TAB_GIDS[key]
  const url = gid
    ? `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${gid}`
    : `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabNameFor(key))}`

  const res = await fetch(url)
  if (!res.ok) return null
  const rows = parseCSV(await res.text())
  if (rows.length < 4) return null

  const row2 = rows[2] || []
  const cash = num(row2[14]), card = num(row2[15]), account = num(row2[16]), kiosk = num(row2[17]), total = num(row2[18])
  if (!total) return null

  let newMem = 0, reReg = 0
  for (let r = 3; r < rows.length; r++) {
    const row = rows[r]
    if (!row || !row[1]) continue
    const note = row[11] || ''
    if (note.includes('신규')) newMem++
    else if (note.includes('재등록')) reReg++
  }

  let ptTotal
  for (const row of rows) {
    if ((row[20] || '').trim() === 'PT 합계') { ptTotal = num(row[21]); break }
  }

  // 트레이너별 PT 매출은 항상 49~52행 O열(col14)에 정우·준혁·건호·인재 순서로 고정되어 있습니다.
  // 이름 라벨(N열/col13)은 달마다 비어있을 때가 있어서, 라벨 대신 이 고정 위치로 읽습니다.
  let trainer
  if (ptTotal !== undefined) {
    const order = ['정우', '준혁', '건호', '인재']
    const vals = [49, 50, 51, 52].map(r => num((rows[r] || [])[14]))
    if (vals.some(v => v > 0)) {
      trainer = {}
      order.forEach((name, i) => { trainer[name] = vals[i] })
    }
  }

  return { total, card, account, kiosk, cash, newMem, reReg, ptTotal, trainer }
}

// MONTH_SALES 스냅샷 위에 시트에서 가져온 값을 필드별로 덮어씌웁니다.
// (라이브 조회가 실패했거나 특정 필드를 못 찾은 경우 기존 값을 그대로 유지)
export function mergeMonthSales(base, live) {
  if (!live) return base
  return {
    ...base,
    total: live.total ?? base.total,
    card: live.card ?? base.card,
    account: live.account ?? base.account,
    kiosk: live.kiosk ?? base.kiosk,
    cash: live.cash ?? base.cash,
    newMem: live.newMem ?? base.newMem,
    reReg: live.reReg ?? base.reReg,
    ptTotal: live.ptTotal ?? base.ptTotal,
    trainer: live.trainer ?? base.trainer,
  }
}
