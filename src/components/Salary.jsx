import {useState} from 'react'
import {useSyncedState} from '../useSyncedState.js'
import {TRAINERS,SALARY_POLICY_INIT,salaryPolicyFor,MT,ML,HOL_RECORDS_INIT,getTier,fmt,fmtM,sumHolidayBonus,PT_INSEN_TRAINERS,ptInsenGroupTotal,ptInsenFor,PT_INSEN_THRESHOLD,getQInsen} from '../data.js'
import {useLiveSales} from '../useLiveSales.js'

export default function Salary({role, myTrainer}) {
  const isOwner = role==='원장님'
  const visibleTrainers = isOwner ? TRAINERS : TRAINERS.filter(t=>t.name===myTrainer)
  const [holRecs] = useSyncedState('nowgym-holiday-work', HOL_RECORDS_INIT)
  const [salaryPolicies] = useSyncedState('nowgym-salary-policy', SALARY_POLICY_INIT)
  const {monthSales:MONTH_SALES, monthKeys:SALES_MONTH_KEYS} = useLiveSales()
  const [idx, setIdx] = useState(SALES_MONTH_KEYS.length-1)
  const key = SALES_MONTH_KEYS[idx]
  const [year,monthStr] = key.split('-'); const month = +monthStr
  const d = MONTH_SALES[key]
  const policy = salaryPolicyFor(key, salaryPolicies)
  const totalManwon = Math.round(d.total/10000)
  const mi = getTier(MT,totalManwon)[1]
  const qInfo = getQInsen(key,MONTH_SALES)
  const qEnds=[3,6,9,12]; const hasQ=qEnds.includes(month)&&qInfo.insen>0
  const ptGroupTotal = ptInsenGroupTotal(d.trainer)
  const ptGroupEligible = ptGroupTotal >= PT_INSEN_THRESHOLD
  const nextMonth = month<12?ML[month]:'익년 1월'
  const calcTrainer = tr => {
    const base=policy.base[tr.name]||1300000
    const taskInsen=policy.taskInsen[tr.name]??400000
    const fixed=base+taskInsen
    const ptAmt=d.trainer[tr.name]||0
    const ptEligible=PT_INSEN_TRAINERS.includes(tr.name)
    const ptInsen=ptInsenFor(tr.name,d.trainer)
    const hol=sumHolidayBonus(holRecs, tr.name, +year, month)
    const qI=qInfo.insen
    const total=fixed+mi+ptInsen+hol+qI
    return {tr, base, taskInsen, ptAmt, ptEligible, ptInsen, hol, qI, total}
  }
  const trainerCalcs = visibleTrainers.map(calcTrainer)
  const excInjaeTotal = trainerCalcs.filter(c=>c.tr.name!=='인재').reduce((a,c)=>a+c.total,0)
  const calcTotalForMonth = (name, mk) => {
    const md = MONTH_SALES[mk]
    const [my, mmStr] = mk.split('-'); const mm = +mmStr
    const pol = salaryPolicyFor(mk, salaryPolicies)
    const miM = getTier(MT, Math.round(md.total/10000))[1]
    const qIM = getQInsen(mk, MONTH_SALES).insen
    const base = pol.base[name] || 1300000
    const taskInsen = pol.taskInsen[name] ?? 400000
    const ptInsen = ptInsenFor(name, md.trainer)
    const hol = sumHolidayBonus(holRecs, name, +my, mm)
    return base + taskInsen + miM + ptInsen + hol + qIM
  }
  const calcExcInjaeTotalForMonth = mk => PT_INSEN_TRAINERS.reduce((sum, name) => sum + calcTotalForMonth(name, mk), 0)
  const monthlyExcInjaeTotals = SALES_MONTH_KEYS.map(mk => ({mk, total: calcExcInjaeTotalForMonth(mk)}))
  const maxMonthlyTotal = Math.max(...monthlyExcInjaeTotals.map(m=>m.total))
  const monthlyMyTotals = SALES_MONTH_KEYS.map(mk => ({mk, total: calcTotalForMonth(myTrainer, mk)}))
  const maxMyMonthlyTotal = Math.max(...monthlyMyTotals.map(m=>m.total))
  return (
    <div>
      <div className="cal-nav" style={{marginBottom:16}}>
        <button className="cal-nav-btn" disabled={idx<=0} onClick={()=>setIdx(i=>Math.max(0,i-1))}>◀</button>
        <span className="cal-nav-label">{year}년 {ML[month-1]} 정산</span>
        <button className="cal-nav-btn" disabled={idx>=SALES_MONTH_KEYS.length-1} onClick={()=>setIdx(i=>Math.min(SALES_MONTH_KEYS.length-1,i+1))}>▶</button>
      </div>
      {isOwner && (
        <div className="card" style={{padding:0,overflow:'hidden',marginBottom:16}}>
          <div style={{background:'var(--blue)',padding:'12px 16px'}}>
            <div style={{color:'rgba(255,255,255,.85)',fontSize:12,marginBottom:3}}>정우·준혁·건호 합산 월급 (인재 제외) · {ML[month-1]}</div>
            <div style={{color:'#fff',fontSize:24,fontWeight:600}}>{fmt(excInjaeTotal)}</div>
          </div>
        </div>
      )}
      <div className="grid-2">
        {trainerCalcs.map(({tr, base, taskInsen, ptAmt, ptEligible, ptInsen, hol, qI, total})=>{
          return (
            <div key={tr.name} className="card" style={{padding:0,overflow:'hidden'}}>
              <div style={{background:'var(--green)',padding:'12px 16px'}}>
                <div style={{color:'rgba(255,255,255,.85)',fontSize:12,marginBottom:3}}>{tr.name} · {ML[month-1]} → {nextMonth} 10일 지급</div>
                <div style={{color:'#fff',fontSize:24,fontWeight:600}}>{fmt(total)}</div>
              </div>
              <div style={{padding:'10px 16px'}}>
                <div style={{fontSize:11,fontWeight:500,color:'var(--text3)',padding:'6px 0 3px'}}>고정급 <span style={{fontWeight:400}}>({policy.effectiveFrom.slice(0,4)}년 {+policy.effectiveFrom.slice(5)}월~ 기준)</span></div>
                <div className="rrow"><span className="rl">기본급</span><span className="rv">{fmt(base)}</span></div>
                <div className="rrow"><span className="rl">과업 인센티브</span><span className="rv g">+{fmt(taskInsen)}</span></div>
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
      {isOwner && (
        <div className="card" style={{marginTop:16}}>
          <div className="card-title">월별 합산 월급 추이 <span style={{fontSize:11,color:'var(--text3)'}}>정우·준혁·건호, 인재 제외</span></div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {monthlyExcInjaeTotals.map(({mk},i)=>({mk,i})).reverse().map(({mk,i})=>{
              const total=monthlyExcInjaeTotals[i].total
              const pct=Math.round(total/maxMonthlyTotal*100)
              const [ky,km]=mk.split('-')
              return (
                <div key={mk} style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{fontSize:11,color:'var(--text3)',width:52,textAlign:'right',flexShrink:0}}>{ky.slice(2)}.{km}월</div>
                  <div style={{flex:1,height:22,background:'var(--surface1)',borderRadius:4,overflow:'hidden'}}>
                    <div style={{height:'100%',width:pct+'%',background:i===idx?'var(--green)':'var(--blue)',borderRadius:4,display:'flex',alignItems:'center',paddingLeft:8,fontSize:10,color:'#fff',fontWeight:500}}>{pct>25?fmtM(total):''}</div>
                  </div>
                  <div style={{fontSize:11,color:'var(--text3)',width:48,textAlign:'right',flexShrink:0}}>{fmtM(total)}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
      {!isOwner && (
        <div className="card" style={{marginTop:16}}>
          <div className="card-title">월별 급여 지급액 <span style={{fontSize:11,color:'var(--text3)'}}>{myTrainer}</span></div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {monthlyMyTotals.map(({mk},i)=>({mk,i})).reverse().map(({mk,i})=>{
              const total=monthlyMyTotals[i].total
              const pct=Math.round(total/maxMyMonthlyTotal*100)
              const [ky,km]=mk.split('-')
              return (
                <div key={mk} style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{fontSize:11,color:'var(--text3)',width:52,textAlign:'right',flexShrink:0}}>{ky.slice(2)}.{km}월</div>
                  <div style={{flex:1,height:22,background:'var(--surface1)',borderRadius:4,overflow:'hidden'}}>
                    <div style={{height:'100%',width:pct+'%',background:i===idx?'var(--green)':'var(--blue)',borderRadius:4,display:'flex',alignItems:'center',paddingLeft:8,fontSize:10,color:'#fff',fontWeight:500}}>{pct>25?fmtM(total):''}</div>
                  </div>
                  <div style={{fontSize:11,color:'var(--text3)',width:48,textAlign:'right',flexShrink:0}}>{fmtM(total)}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
