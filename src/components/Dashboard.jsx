import {useState} from 'react'
import {TRAINERS,ML,fmt,fmtM,ptInsenFor} from '../data.js'
import {useLiveSales} from '../useLiveSales.js'
export default function Dashboard({role}) {
  const {monthSales:MONTH_SALES, monthKeys:SALES_MONTH_KEYS} = useLiveSales()
  const [idx, setIdx] = useState(SALES_MONTH_KEYS.length-1)
  if (role!=='원장님') {
    return (
      <div className="card" style={{textAlign:'center',padding:'3rem 1rem',color:'var(--text3)'}}>
        🔒 매출 대시보드는 원장님만 볼 수 있어요.
      </div>
    )
  }
  const key = SALES_MONTH_KEYS[idx]
  const [year,monthStr] = key.split('-'); const month = +monthStr
  const d = MONTH_SALES[key]
  const prevKey = SALES_MONTH_KEYS[idx-1]
  const prev = prevKey ? MONTH_SALES[prevKey] : null
  const diff = prev?Math.round((d.total-prev.total)/prev.total*100):0
  const methods=[{label:'카드',val:d.card,c:'#378ADD'},{label:'계좌이체',val:d.account,c:'#1D9E75'},{label:'키오스크',val:d.kiosk,c:'#6B5CE7'},{label:'현금',val:d.cash,c:'#BA7517'}]
  const maxT = Math.max(...SALES_MONTH_KEYS.map(k=>MONTH_SALES[k].total))
  return (
    <div>
      <div className="cal-nav" style={{marginBottom:16}}>
        <button className="cal-nav-btn" disabled={idx<=0} onClick={()=>setIdx(i=>Math.max(0,i-1))}>◀</button>
        <span className="cal-nav-label">{year}년 {ML[month-1]}</span>
        <button className="cal-nav-btn" disabled={idx>=SALES_MONTH_KEYS.length-1} onClick={()=>setIdx(i=>Math.min(SALES_MONTH_KEYS.length-1,i+1))}>▶</button>
      </div>
      <div className="metric-grid" style={{marginBottom:14}}>
        <div className="metric"><div className="metric-label">총 매출</div><div className="metric-val g">{fmtM(d.total)}</div><div className="metric-sub">{prev?(diff>=0?'▲':'▼')+' 전월 '+Math.abs(diff)+'%':'—'}</div></div>
        <div className="metric"><div className="metric-label">총 회원</div><div className="metric-val">{d.newMem+d.reReg}명</div><div className="metric-sub">신규 {d.newMem} · 재등록 {d.reReg}</div></div>
        <div className="metric"><div className="metric-label">PT 매출</div><div className="metric-val b">{fmtM(d.ptTotal)}</div><div className="metric-sub">전체의 {Math.round(d.ptTotal/d.total*100)}%</div></div>
        <div className="metric"><div className="metric-label">1인 평균</div><div className="metric-val">{fmtM(Math.round(d.total/(d.newMem+d.reReg)))}</div><div className="metric-sub">만원 / 회원</div></div>
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-title">결제 수단별 매출</div>
          {methods.map(m=>{const pct=Math.round(m.val/d.total*100);return(
            <div key={m.label} style={{marginBottom:10}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4}}>
                <span style={{color:'var(--text3)'}}>{m.label}</span>
                <span style={{fontWeight:500}}>{fmt(m.val)} <span style={{color:'var(--text3)',fontWeight:400}}>({pct}%)</span></span>
              </div>
              <div className="bar-bg"><div className="bar-fill" style={{width:pct+'%',background:m.c}}></div></div>
            </div>
          )})}
        </div>
        <div className="card">
          <div className="card-title">트레이너별 PT 매출</div>
          {TRAINERS.map((tr,i)=>{const amt=d.trainer[tr.name]||0;const max=Math.max(...Object.values(d.trainer));return(
            <div key={tr.name} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 0',borderBottom:i<TRAINERS.length-1?'0.5px solid var(--border)':'none'}}>
              <div className={`av ${tr.av}`} style={{width:32,height:32,fontSize:11}}>{tr.short}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:500,marginBottom:4}}>{tr.name}</div>
                <div className="bar-bg"><div className="bar-fill" style={{width:(max?Math.round(amt/max*100):0)+'%',background:'var(--green)'}}></div></div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:13,fontWeight:500,color:'var(--green)'}}>{fmtM(amt)}</div>
                <div style={{fontSize:11,color:'var(--text3)'}}>{(()=>{const pi=ptInsenFor(tr.name,d.trainer);return pi>0?'인센 +'+fmt(pi):'인센 해당없음'})()}</div>
              </div>
            </div>
          )})}
        </div>
      </div>
      <div className="card">
        <div className="card-title">월별 매출 추이 <span style={{fontSize:11,color:'var(--text3)'}}>최근 {SALES_MONTH_KEYS.length}개월</span></div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {SALES_MONTH_KEYS.map((k,i)=>({k,i})).reverse().map(({k,i})=>{const md=MONTH_SALES[k];const pct=Math.round(md.total/maxT*100);const [ky,km]=k.split('-');return(
            <div key={k} style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{fontSize:11,color:'var(--text3)',width:52,textAlign:'right',flexShrink:0}}>{ky.slice(2)}.{km}월</div>
              <div style={{flex:1,height:22,background:'var(--surface1)',borderRadius:4,overflow:'hidden'}}>
                <div style={{height:'100%',width:pct+'%',background:i===idx?'var(--green)':'var(--blue)',borderRadius:4,display:'flex',alignItems:'center',paddingLeft:8,fontSize:10,color:'#fff',fontWeight:500}}>{pct>25?fmtM(md.total):''}</div>
              </div>
              <div style={{fontSize:11,color:'var(--text3)',width:48,textAlign:'right',flexShrink:0}}>{fmtM(md.total)}</div>
            </div>
          )})}
        </div>
      </div>
    </div>
  )
}
