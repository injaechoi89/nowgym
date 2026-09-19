import {useState} from 'react'
import {useSyncedState} from '../useSyncedState.js'
import {TRAINERS,STAFF_BASE,TASK_INSEN,MT,QT,ML,HOL_RECORDS_INIT,getTier,fmt,fmtM,sumHolidayBonus,PT_INSEN_TRAINERS,ptInsenGroupTotal,ptInsenFor,PT_INSEN_THRESHOLD} from '../data.js'
import {useLiveSales} from '../useLiveSales.js'

function getQInsen(key,sales){
  const [yearStr,monthStr]=key.split('-'); const year=+yearStr; const m=+monthStr
  const qEnd=[3,6,9,12]; if(!qEnd.includes(m))return{insen:0,label:''};
  const q=Math.ceil(m/3)
  const qMonths=[q*3-2,q*3-1,q*3]
  const qKeys=qMonths.map(mm=>`${year}-${String(mm).padStart(2,'0')}`).filter(k=>sales[k])
  const qSum=qKeys.reduce((a,k)=>a+Math.round((sales[k]?.total||0)/10000),0)
  const insen=getTier(QT,qSum)[1]
  const firstM=+qKeys[0]?.split('-')[1]||qMonths[0]
  const lastM=+qKeys[qKeys.length-1]?.split('-')[1]||qMonths[qMonths.length-1]
  return{insen,label:`${q}분기 (${ML[firstM-1]}~${ML[lastM-1]}, 총 ${qSum.toLocaleString()}만원)`}
}

export default function Salary({role, myTrainer}) {
  const isOwner = role==='원장님'
  const visibleTrainers = isOwner ? TRAINERS : TRAINERS.filter(t=>t.name===myTrainer)
  const [holRecs] = useSyncedState('nowgym-holiday-work', HOL_RECORDS_INIT)
  const {monthSales:MONTH_SALES, monthKeys:SALES_MONTH_KEYS} = useLiveSales()
  const [idx, setIdx] = useState(SALES_MONTH_KEYS.length-1)
  const key = SALES_MONTH_KEYS[idx]
  const [year,monthStr] = key.split('-'); const month = +monthStr
  const d = MONTH_SALES[key]
  const totalManwon = Math.round(d.total/10000)
  const mi = getTier(MT,totalManwon)[1]
  const qInfo = getQInsen(key,MONTH_SALES)
  const qEnds=[3,6,9,12]; const hasQ=qEnds.includes(month)&&qInfo.insen>0
  const ptGroupTotal = ptInsenGroupTotal(d.trainer)
  const ptGroupEligible = ptGroupTotal >= PT_INSEN_THRESHOLD
  const nextMonth = month<12?ML[month]:'익년 1월'
  return (
    <div>
      <div className="cal-nav" style={{marginBottom:16}}>
        <button className="cal-nav-btn" disabled={idx<=0} onClick={()=>setIdx(i=>Math.max(0,i-1))}>◀</button>
        <span className="cal-nav-label">{year}년 {ML[month-1]} 정산</span>
        <button className="cal-nav-btn" disabled={idx>=SALES_MONTH_KEYS.length-1} onClick={()=>setIdx(i=>Math.min(SALES_MONTH_KEYS.length-1,i+1))}>▶</button>
      </div>
      <div className="grid-2">
        {visibleTrainers.map(tr=>{
          const base=STAFF_BASE[tr.name]||1300000
          const fixed=base+TASK_INSEN
          const ptAmt=d.trainer[tr.name]||0
          const ptEligible=PT_INSEN_TRAINERS.includes(tr.name)
          const ptInsen=ptInsenFor(tr.name,d.trainer)
          const hol=sumHolidayBonus(holRecs, tr.name, +year, month)
          const qI=qInfo.insen
          const total=fixed+mi+ptInsen+hol+qI
          return (
            <div key={tr.name} className="card" style={{padding:0,overflow:'hidden'}}>
              <div style={{background:'var(--green)',padding:'12px 16px'}}>
                <div style={{color:'rgba(255,255,255,.85)',fontSize:12,marginBottom:3}}>{tr.name} · {ML[month-1]} → {nextMonth} 10일 지급</div>
                <div style={{color:'#fff',fontSize:24,fontWeight:600}}>{fmt(total)}</div>
              </div>
              <div style={{padding:'10px 16px'}}>
                <div style={{fontSize:11,fontWeight:500,color:'var(--text3)',padding:'6px 0 3px'}}>고정급</div>
                <div className="rrow"><span className="rl">기본급</span><span className="rv">{fmt(base)}</span></div>
                <div className="rrow"><span className="rl">과업 인센티브</span><span className="rv g">+{fmt(TASK_INSEN)}</span></div>
                <div style={{fontSize:11,fontWeight:500,color:'var(--text3)',padding:'6px 0 3px'}}>센터 매출 연동</div>
                <div className="rrow">
                  <span className="rl">센터 매출 인센 <span style={{fontSize:10,color:'var(--text3)'}}>{totalManwon.toLocaleString()}만원 구간</span></span>
                  <span className="rv g">{mi>0?'+'+fmt(mi):'0원'}</span>
                </div>
                <div style={{fontSize:11,fontWeight:500,color:'var(--text3)',padding:'6px 0 3px'}}>PT 인센</div>
                <div className="rrow">
                  <span className="rl">
                    {ptEligible ? `PT 인센 (${fmtM(ptAmt)} × 10%)` : 'PT 인센 (대상 제외)'}
                    {ptEligible && <span style={{fontSize:10,color:'var(--text3)',display:'block',marginTop:2}}>정우·준혁·건호 합산 {fmtM(ptGroupTotal)} {ptGroupEligible?'≥':'<'} 800만 {ptGroupEligible?'(지급 대상)':'(미달)'}</span>}
                  </span>
                  <span className="rv g">{ptEligible?(ptInsen>0?'+'+fmt(ptInsen):'0원'):'해당없음'}</span>
                </div>
                <div style={{fontSize:11,fontWeight:500,color:'var(--text3)',padding:'6px 0 3px'}}>추가 항목</div>
                <div className="rrow">
                  <span className="rl">휴일 근무 <span style={{fontSize:10,background:'var(--amber-light)',color:'var(--amber)',padding:'1px 6px',borderRadius:8,marginLeft:4}}>휴일</span></span>
                  <span className="rv" style={{color:'#E05A2B'}}>{hol>0?'+'+fmt(hol):'0원'}</span>
                </div>
                <div className="rrow">
                  <span className="rl">분기 인센 <span style={{fontSize:10,background:'var(--blue-light)',color:'var(--blue-dark)',padding:'1px 6px',borderRadius:8,marginLeft:4}}>분기</span>{hasQ&&<span style={{fontSize:10,color:'var(--text3)',display:'block',marginTop:2}}>{qInfo.label}</span>}</span>
                  <span className="rv" style={{color:hasQ?'var(--blue)':'var(--text3)'}}>{hasQ?'+'+fmt(qI):'해당없음'}</span>
                </div>
                <div className="rrow" style={{marginTop:6,paddingTop:8,borderTop:'0.5px solid var(--border-strong)'}}>
                  <span style={{fontWeight:500,color:'var(--text)'}}>최종 합계</span>
                  <span style={{fontSize:16,fontWeight:600,color:'var(--green)'}}>{fmt(total)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
