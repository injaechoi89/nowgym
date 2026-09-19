import { useEffect, useState } from 'react'
import { MONTH_SALES, SALES_MONTH_KEYS } from './salesData.js'
import { fetchMonthSalesFromSheet, mergeMonthSales } from './salesSync.js'

// 구글 스프레드시트에서 최신 매출을 가져와 MONTH_SALES 스냅샷 위에 덮어써서 반환합니다.
// 화면이 열릴 때마다(마운트 시) 한 번 조회하며, 조회 전에는 기존 스냅샷을 그대로 보여줍니다.
// keys를 지정하면 그 달들만 조회합니다(예: 홈 화면은 최근 2개월만 필요) — 기본값은 전체 기간.
export function useLiveSales(keys = SALES_MONTH_KEYS) {
  const [live, setLive] = useState({})
  const keysSig = keys.join(',')

  useEffect(() => {
    let cancelled = false
    Promise.all(keys.map(async key => {
      const data = await fetchMonthSalesFromSheet(key).catch(() => null)
      return [key, data]
    })).then(results => {
      if (cancelled) return
      setLive(prev => {
        const next = { ...prev }
        results.forEach(([key, data]) => { if (data) next[key] = data })
        return next
      })
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keysSig])

  const monthSales = {}
  SALES_MONTH_KEYS.forEach(key => { monthSales[key] = mergeMonthSales(MONTH_SALES[key], live[key]) })
  return { monthSales, monthKeys: SALES_MONTH_KEYS }
}
