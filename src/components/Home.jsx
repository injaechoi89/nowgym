import { TRAINERS, fmt, fmtM, ML, ptInsenFor } from '../data.js'
import { SALES_MONTH_KEYS } from '../salesData.js'
import { useLiveSales } from '../useLiveSales.js'
export default function Home({role, myTrainer}) {
  const isOwner = role==='원장님'
  const curKey = SALES_MONTH_KEYS[SALES_MONTH_KEYS.length-1]
  const prevKey = SALES_MONTH_KEYS[SALES_MONTH_KEYS.length-2]
  const { monthSales: MONTH_SALES } = useLiveSales([prevKey, curKey].filter(Boolean))
  const d = MONTH_SALES[curKey]
  const prev = prevKey ? MONTH_SALES[prevKey] : null
  const curMonth = +curKey.split('-')[1]
  const diff = prev ? Math.round((d.total-prev.total)/prev.total*100) : 0
  const myAmt = d.trainer[myTrainer]||0
  const myPtInsen = ptInsenFor(myTrainer, d.trainer)

  const allAlerts = [
    {color:'#E05A2B', text:'건호 — 오늘 청소 미인증', trainer:'건호'},
    {color:'#E24B4A', text:'준혁 — 이번달 리뷰 1개 남음', trainer:'준혁'},
    {color:'#378ADD', text:'건호 — 블로그 이번주 미완료', trainer:'건호'},
    {color:'#1D9E75', text:'10월 10일 급여 지급 예정 (D-5)', trainer:null},
  ]
  const alerts = isOwner ? allAlerts : allAlerts.filter(a => !a.trainer || a.trainer===myTrainer)

  return (
    <div>
      <div style={{fontSize:20,fontWeight:600,marginBottom:4}}>안녕하세요{isOwner?'':`, ${myTrainer} 선생님`} 👋</div>
      <div style={{fontSize:13,color:'var(--text3)',marginBottom:20}}>오늘의 나우짐 현황입니다</div>
      {isOwner ? (
        <div className="metric-grid" style={{gridTemplateColumns:'repeat(4,minmax(0,1fr))'}}>
          <div className="metric"><div className="metric-label">{ML[curMonth-1]} 총 매출</div><div className="metric-val g">{fmtM(d.total)}</div><div className="metric-sub">{prev?(diff>=0?'▲':'▼')+' 전월 '+Math.abs(diff)+'%':'—'}</div></div>
          <div className="metric"><div className="metric-label">이번달 회원</div><div className="metric-val">{d.newMem+d.reReg}명</div><div className="metric-sub">신규 {d.newMem} · 재등록 {d.reReg}</div></div>
          <div className="metric"><div className="metric-label">PT 매출</div><div className="metric-val b">{fmtM(d.ptTotal)}</div><div className="metric-sub">전체의 {Math.round(d.ptTotal/d.total*100)}%</div></div>
          <div className="metric"><div className="metric-label">10월 10일 지급</div><div className="metric-val o">D-5</div><div className="metric-sub">급여 지급일</div></div>
        </div>
      ) : (
        <div className="metric-grid" style={{gridTemplateColumns:'repeat(3,minmax(0,1fr))'}}>
          <div className="metric"><div className="metric-label">{ML[curMonth-1]} 내 PT 매출</div><div className="metric-val g">{fmtM(myAmt)}</div><div className="metric-sub">{myPtInsen>0?'인센 +'+fmt(myPtInsen):'인센 해당없음'}</div></div>
          <div className="metric"><div className="metric-label">이번달 신규 회원</div><div className="metric-val">{d.newMem}명</div><div className="metric-sub">센터 전체</div></div>
          <div className="metric"><div className="metric-label">10월 10일 지급</div><div className="metric-val o">D-5</div><div className="metric-sub">급여 지급일</div></div>
        </div>
      )}
      <div className="grid-2">
        <div className="card">
          <div className="card-title">⚠️ 확인 필요</div>
          {alerts.length===0 && <div className="empty-state">확인할 항목이 없어요.</div>}
          {alerts.map((a,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:i<alerts.length-1?'0.5px solid var(--border)':'none'}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:a.color,flexShrink:0}}></div>
              <span style={{fontSize:13,color:'var(--text)',flex:1}}>{a.text}</span>
            </div>
          ))}
        </div>
        {isOwner && (
          <div className="card">
            <div className="card-title">트레이너별 PT 매출 ({ML[curMonth-1]})</div>
            {TRAINERS.map((tr,i)=>{
              const amt = d.trainer[tr.name]||0
              const max = Math.max(...Object.values(d.trainer))
              return (
                <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 0',borderBottom:i<TRAINERS.length-1?'0.5px solid var(--border)':'none'}}>
                  <div className={`av ${tr.av}`} style={{width:30,height:30,fontSize:11}}>{tr.short}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:500,marginBottom:4}}>{tr.name}</div>
                    <div className="bar-bg"><div className="bar-fill" style={{width:(max?Math.round(amt/max*100):0)+'%',background:'var(--green)'}}></div></div>
                  </div>
                  <div style={{fontSize:13,fontWeight:500,color:'var(--green)',whiteSpace:'nowrap'}}>{fmtM(amt)}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
