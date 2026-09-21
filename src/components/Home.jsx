import { useEffect, useState } from 'react'
import { TRAINERS, TODAY, PT_MEMBERS_INIT, PT_DATA, HOL_RECORDS_INIT, SALARY_POLICY_INIT, fmt, fmtM, ML, ptInsenFor, calcTrainerSalaryForMonth, addWeeks } from '../data.js'
import { SALES_MONTH_KEYS } from '../salesData.js'
import { useLiveSales } from '../useLiveSales.js'
import { useSyncedState } from '../useSyncedState.js'
import { getCertPhotos, subscribeCertPhotos } from '../photoUtils.js'
import { TYPES, TYPE_LABEL, DOT_COLOR, MONTHLY_TARGET } from './Task.jsx'

export default function Home({role, myTrainer, onNavigate, onOpenTodayTask}) {
  const isOwner = role==='원장님'
  const curKey = SALES_MONTH_KEYS[SALES_MONTH_KEYS.length-1]
  const prevKey = SALES_MONTH_KEYS[SALES_MONTH_KEYS.length-2]
  const curMonthNum = +curKey.split('-')[1]
  const q = Math.ceil(curMonthNum/3)
  const qKeys = [q*3-2,q*3-1,q*3].map(mm=>`${curKey.split('-')[0]}-${String(mm).padStart(2,'0')}`)
  const { monthSales: MONTH_SALES } = useLiveSales([...new Set([prevKey, curKey, ...qKeys].filter(Boolean))])
  const d = MONTH_SALES[curKey]
  const prev = prevKey ? MONTH_SALES[prevKey] : null
  const curMonth = curMonthNum
  const diff = prev ? Math.round((d.total-prev.total)/prev.total*100) : 0
  const myAmt = d.trainer[myTrainer]||0
  const myPtInsen = ptInsenFor(myTrainer, d.trainer)

  const [salaryPolicies] = useSyncedState('nowgym-salary-policy', SALARY_POLICY_INIT)
  const [holRecs] = useSyncedState('nowgym-holiday-work', HOL_RECORDS_INIT)
  const mySalary = calcTrainerSalaryForMonth(myTrainer, curKey, {salaryPolicies, holRecs, monthSales: MONTH_SALES})

  const [members] = useSyncedState('nowgym-pt-members', PT_MEMBERS_INIT)
  const myActiveMembers = members.filter(m => m.trainer===myTrainer && TODAY <= addWeeks(m.start, m.product.weeks)).length

  const [ptData] = useSyncedState('nowgym-pt-schedule', PT_DATA)
  const todayKey = `${TODAY.getFullYear()}-${TODAY.getMonth()+1}-${TODAY.getDate()}`
  const todayMemberCount = new Set((ptData[myTrainer]||[]).filter(p=>p.dateKey===todayKey).map(p=>p.m)).size

  const [photos, setPhotos] = useState(getCertPhotos())
  useEffect(() => subscribeCertPhotos(setPhotos), [])
  const taskData = photos[myTrainer]||{}
  const taskKeysThisMonth = Object.keys(taskData).filter(k=>{const p=k.split('-');return +p[1]===TODAY.getMonth()+1 && +p[0]===TODAY.getFullYear()})
  const taskProgress = TYPES.map(t=>{
    const done = taskKeysThisMonth.filter(k=>taskData[k]?.[t]).length
    const target = MONTHLY_TARGET[t]
    return {t, done, target, pct: Math.min(100, Math.round(done/target*100))}
  })

  const payDay = new Date(TODAY.getFullYear(), TODAY.getMonth() + (TODAY.getDate()>10?1:0), 10)
  const dDay = Math.round((payDay - new Date(TODAY.getFullYear(),TODAY.getMonth(),TODAY.getDate())) / 86400000)

  return (
    <div>
      <div style={{fontSize:20,fontWeight:600,marginBottom:4}}>안녕하세요{isOwner?'':`, ${myTrainer} 선생님`} 👋</div>
      <div style={{fontSize:13,color:'var(--text3)',marginBottom:20}}>오늘의 나우짐 현황입니다</div>
      {isOwner ? (
        <div className="metric-grid" style={{gridTemplateColumns:'repeat(4,minmax(0,1fr))'}}>
          <div className="metric"><div className="metric-label">{ML[curMonth-1]} 총 매출</div><div className="metric-val g">{fmtM(d.total)}</div><div className="metric-sub">{prev?(diff>=0?'▲':'▼')+' 전월 '+Math.abs(diff)+'%':'—'}</div></div>
          <div className="metric"><div className="metric-label">이번달 회원</div><div className="metric-val">{d.newMem+d.reReg}명</div><div className="metric-sub">신규 {d.newMem} · 재등록 {d.reReg}</div></div>
          <div className="metric"><div className="metric-label">PT 매출</div><div className="metric-val b">{fmtM(d.ptTotal)}</div><div className="metric-sub">전체의 {Math.round(d.ptTotal/d.total*100)}%</div></div>
          <div className="metric"><div className="metric-label">{payDay.getMonth()+1}월 {payDay.getDate()}일 지급</div><div className="metric-val o">{dDay===0?'D-DAY':'D-'+dDay}</div><div className="metric-sub">급여 지급일</div></div>
        </div>
      ) : (
        <>
          <div className="metric-grid" style={{gridTemplateColumns:'repeat(2,minmax(0,1fr))'}}>
            <div className="metric" style={{cursor:'pointer'}} onClick={()=>onNavigate&&onNavigate('salary')}>
              <div className="metric-label">{ML[curMonth-1]} 내 예상 월급</div>
              <div className="metric-val g">{fmt(mySalary)}</div>
              <div className="metric-sub">급여 정산 바로가기 →</div>
            </div>
            <div className="metric" style={{cursor:'pointer'}} onClick={()=>onNavigate&&onNavigate('salary')}>
              <div className="metric-label">{ML[curMonth-1]} 내 PT 매출</div>
              <div className="metric-val b">{fmtM(myAmt)}</div>
              <div className="metric-sub">{myPtInsen>0?'인센 +'+fmt(myPtInsen):'인센 해당없음'}</div>
            </div>
          </div>
          <div className="metric-grid" style={{gridTemplateColumns:'repeat(2,minmax(0,1fr))'}}>
            <div className="metric" style={{cursor:'pointer'}} onClick={()=>onNavigate&&onNavigate('contract')}>
              <div className="metric-label">내 PT 유효 회원 수</div>
              <div className="metric-val">{myActiveMembers}명</div>
              <div className="metric-sub">PT회원 관리 바로가기 →</div>
            </div>
            <div className="metric" style={{cursor:'pointer'}} onClick={()=>onNavigate&&onNavigate('pt')}>
              <div className="metric-label">오늘 진행할 PT 회원수</div>
              <div className="metric-val o">{todayMemberCount}명</div>
              <div className="metric-sub">PT 시간표 바로가기 →</div>
            </div>
          </div>
          <div className="card" style={{cursor:'pointer',marginBottom:16}} onClick={()=>onNavigate&&onNavigate('task')}>
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:10,marginBottom:14}}>
              <div className="card-title" style={{marginBottom:0}}>과업 인증 · {ML[TODAY.getMonth()]} 진행률</div>
              <button className="btn btn-g" style={{padding:'6px 14px',fontSize:12,flexShrink:0}} onClick={e=>{e.stopPropagation();onOpenTodayTask&&onOpenTodayTask()}}>오늘 과업 인증</button>
            </div>
            <div style={{display:'flex',gap:14,flexWrap:'wrap'}}>
              {taskProgress.map(({t,done,target,pct})=>(
                <div key={t} style={{flex:'1 1 100px',minWidth:100}}>
                  <div style={{display:'flex',alignItems:'center',gap:5,fontSize:12,color:'var(--text3)',marginBottom:4}}>
                    <span style={{width:8,height:8,borderRadius:'50%',background:DOT_COLOR[t],display:'inline-block'}}></span>
                    {TYPE_LABEL[t]}
                  </div>
                  <div className="bar-bg"><div className="bar-fill" style={{width:pct+'%',background:DOT_COLOR[t]}}></div></div>
                  <div style={{fontSize:11,color:'var(--text3)',marginTop:3}}>{done}/{target} · {pct}%</div>
                </div>
              ))}
            </div>
            <div style={{fontSize:11,color:'var(--text3)',marginTop:10}}>과업 인증 바로가기 →</div>
          </div>
        </>
      )}
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
  )
}
