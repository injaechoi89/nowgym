import {useState, useEffect, Fragment} from 'react'
import {useSyncedState} from '../useSyncedState.js'
import {TODAY, TRAINERS, PT_DATA, PT_MEMBERS_INIT, DAYS} from '../data.js'
import {getPtHoursSettings, subscribePtHoursSettings, buildHourSlots} from '../ptHoursSettings.js'

function emptyForm() {
  return {m:'', type:'full'}
}

function toKey(d){return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`}
function dateKeyToDate(k){const p=k.split('-');return new Date(+p[0],+p[1]-1,+p[2])}
function mondayOf(d){
  const dow=d.getDay(); const diff=dow===0?-6:1-dow
  const r=new Date(d.getFullYear(),d.getMonth(),d.getDate()); r.setDate(r.getDate()+diff); return r
}

export default function PT({role, myTrainer, onOpenDiary}) {
  const isOwner = role==='원장님'
  const [trainer, setTrainer] = useState('정우')
  const effectiveTrainer = isOwner ? trainer : myTrainer
  const [offset, setOffset] = useState(0)
  const [ptData, setPtData] = useSyncedState('nowgym-pt-schedule', PT_DATA)
  const [members] = useSyncedState('nowgym-pt-members', PT_MEMBERS_INIT)
  const [hoursSettings, setHoursSettings] = useState(getPtHoursSettings())
  useEffect(() => subscribePtHoursSettings(setHoursSettings), [])
  const PT_HOURS = buildHourSlots(hoursSettings.start, hoursSettings.end)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyForm())
  const [memberPickerOpen, setMemberPickerOpen] = useState(false)
  const pts = (ptData[effectiveTrainer]||[]).filter(p=>typeof p.dateKey==='string')
  const myMembers = members.filter(m=>m.trainer===effectiveTrainer)
  const selectedMember = myMembers.find(m=>m.name===form.m)
  const allowedType = selectedMember ? selectedMember.product.type : null
  const lookup = {}
  pts.forEach(p=>{if(!lookup[p.dateKey])lookup[p.dateKey]={};lookup[p.dateKey][p.hour]=p})
  const getMonday = (off) => {
    const d=mondayOf(TODAY); d.setDate(d.getDate()+off*7); return d
  }
  const mon = getMonday(offset)
  const sun = new Date(mon); sun.setDate(sun.getDate()+6)
  const todayDow = (()=>{const d=TODAY.getDay();return d===0?6:d-1})()

  const thisWeekMon = mondayOf(TODAY)
  const weekDateKeys = new Set(Array.from({length:7},(_,i)=>{const d=new Date(thisWeekMon); d.setDate(d.getDate()+i); return toKey(d)}))
  const half = pts.filter(p=>p.type==='half' && weekDateKeys.has(p.dateKey)).length
  const full = pts.filter(p=>p.type==='full' && weekDateKeys.has(p.dateKey)).length

  const monthStats = (() => {
    const inMonth = p => { const dt=dateKeyToDate(p.dateKey); return dt.getFullYear()===TODAY.getFullYear() && dt.getMonth()===TODAY.getMonth() }
    const mHalf = pts.filter(p=>p.type==='half' && inMonth(p)).length
    const mFull = pts.filter(p=>p.type==='full' && inMonth(p)).length
    return {mHalf, mFull}
  })()

  // 이 회원의 전체 예약을 날짜·시간 순으로 정렬했을 때 몇 번째 회차인지 계산 (아직 등록되지 않은 슬롯도 가정해서 계산 가능)
  const computeSessionNumber = (memberName, dateKey, hour) => {
    const mem = members.find(x=>x.name===memberName && x.trainer===effectiveTrainer)
    if (!mem) return null
    const existingSlots = pts.filter(p=>p.m===memberName)
    const already = existingSlots.some(s=>s.dateKey===dateKey && s.hour===hour)
    const slots = (already ? existingSlots : existingSlots.concat([{dateKey,hour}])).slice().sort((a,b)=>{
      const da=dateKeyToDate(a.dateKey), db=dateKeyToDate(b.dateKey)
      return da-db || a.hour.localeCompare(b.hour)
    })
    const pos = slots.findIndex(s=>s.dateKey===dateKey && s.hour===hour) + 1
    return {n: pos, total: mem.product.count}
  }

  const sessionCount = (booking) => {
    const sc = computeSessionNumber(booking.m, booking.dateKey, booking.hour)
    if (!sc) return null
    return {n: Math.min(sc.n, sc.total), total: sc.total}
  }

  const nextSlotOf = (hour) => {
    const idx = PT_HOURS.indexOf(hour)
    return idx>=0 ? PT_HOURS[idx+1] : undefined
  }

  // 이 슬롯을 덮고 있는 예약을 찾는다 (본인 시작 슬롯이거나, 직전 슬롯에서 시작한 일반PT의 두번째 칸)
  const coveringOf = (dateKey, hour) => {
    const direct = lookup[dateKey] && lookup[dateKey][hour]
    if (direct) return {booking: direct, isStart: true}
    const idx = PT_HOURS.indexOf(hour)
    const prevHour = idx>0 ? PT_HOURS[idx-1] : undefined
    const prevBooking = prevHour && lookup[dateKey] && lookup[dateKey][prevHour]
    if (prevBooking && prevBooking.type==='full') return {booking: prevBooking, isStart: false}
    return null
  }

  const openCell = (dateKey, hour, dt) => {
    const covering = coveringOf(dateKey, hour)
    if (covering && !covering.isStart) return // 이어지는 칸은 시작 칸에서만 수정
    const existing = covering?.booking
    setForm(existing ? {m:existing.m, type:existing.type} : emptyForm())
    setMemberPickerOpen(false)
    setModal({dateKey, hour, y:dt.getFullYear(), m:dt.getMonth(), d:dt.getDate(), dow:(dt.getDay()===0?6:dt.getDay()-1), existing: !!existing})
  }

  const saveBooking = () => {
    if (!form.m.trim()) { alert('회원을 선택해주세요'); return }
    if (form.type==='full') {
      const next = nextSlotOf(modal.hour)
      if (!next) { alert('마지막 시간대에는 일반PT(50분)를 등록할 수 없어요.'); return }
      const nextBooking = lookup[modal.dateKey] && lookup[modal.dateKey][next]
      if (nextBooking) { alert(`${next}에 이미 다른 예약이 있어서 일반PT를 등록할 수 없어요.`); return }
    }
    const memberName = form.m.trim()
    const existing = lookup[modal.dateKey] && lookup[modal.dateKey][modal.hour]
    const isNewAllocation = !(existing && existing.m===memberName)
    if (isNewAllocation) {
      const sc = computeSessionNumber(memberName, modal.dateKey, modal.hour)
      if (sc && sc.n > sc.total) {
        alert(`${memberName}님은 등록한 PT ${sc.total}회를 이미 모두 사용해서 더 등록할 수 없어요.`)
        return
      }
    }
    setPtData(pd => {
      const list = (pd[effectiveTrainer]||[]).filter(p => !(p.dateKey===modal.dateKey && p.hour===modal.hour))
      list.push({dateKey: modal.dateKey, hour: modal.hour, type: form.type, m: memberName})
      return {...pd, [effectiveTrainer]: list}
    })
    setModal(null)
  }

  const removeBooking = () => {
    setPtData(pd => ({...pd, [effectiveTrainer]: (pd[effectiveTrainer]||[]).filter(p => !(p.dateKey===modal.dateKey && p.hour===modal.hour))}))
    setModal(null)
  }

  const resetAllSchedules = () => {
    if (!window.confirm('모든 트레이너의 PT 시간표 예약을 전부 삭제할까요? 되돌릴 수 없어요.')) return
    setPtData({})
  }

  const hourRows = PT_HOURS.filter(h=>h.endsWith(':00'))
  const dayColWidthPct = (100 - 6) / 7 / 2 // 라벨 6% 남기고 7일 x 2칸 균등 분할

  const cellStyle = (covering, dayIndex) => {
    if (!covering) return {border:'0.5px solid var(--border)',background:dayIndex%2===0?'var(--surface)':'var(--surface1)',cursor:'pointer',height:32,width:dayColWidthPct+'%'}
    const isHalf = covering.booking.type==='half'
    return {border:'0.5px solid '+(isHalf?'#D4537E':'#378ADD'),background:isHalf?'#FBEAF0':'#E6F1FB',color:isHalf?'#712B13':'#042C53',textAlign:'center',fontWeight:500,fontSize:10,cursor:covering.isStart?'pointer':'default',height:32,width:dayColWidthPct+'%'}
  }

  return (
    <div>
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        {(isOwner?TRAINERS:TRAINERS.filter(t=>t.name===myTrainer)).map(t=>(
          <button key={t.name} className={`btn ${effectiveTrainer===t.name?'btn-g':'btn-outline'}`} onClick={()=>isOwner&&setTrainer(t.name)}>{t.name}</button>
        ))}
        {isOwner&&<button className="btn btn-danger" style={{marginLeft:'auto'}} onClick={resetAllSchedules}>전체 일정 삭제</button>}
      </div>
      <div className="metric-grid" style={{gridTemplateColumns:'repeat(4,1fr)',marginBottom:16}}>
        <div className="metric"><div className="metric-label" style={{display:'flex',alignItems:'center',gap:5}}><span style={{width:9,height:9,borderRadius:'50%',background:'#D4537E',display:'inline-block'}}></span>하프PT</div><div className="metric-val">{half}회 <span style={{fontSize:13,fontWeight:400,color:'var(--text3)'}}>/ {monthStats.mHalf}회</span></div><div className="metric-sub">이번주 / 이번달</div></div>
        <div className="metric"><div className="metric-label" style={{display:'flex',alignItems:'center',gap:5}}><span style={{width:9,height:9,borderRadius:'50%',background:'#378ADD',display:'inline-block'}}></span>일반PT</div><div className="metric-val">{full}회 <span style={{fontSize:13,fontWeight:400,color:'var(--text3)'}}>/ {monthStats.mFull}회</span></div><div className="metric-sub">이번주 / 이번달</div></div>
        <div className="metric"><div className="metric-label">총 횟수</div><div className="metric-val">{half+full}회 <span style={{fontSize:13,fontWeight:400,color:'var(--text3)'}}>/ {monthStats.mHalf+monthStats.mFull}회</span></div><div className="metric-sub">이번주 / 이번달</div></div>
        <div className="metric"><div className="metric-label">총 시간</div><div className="metric-val">{Math.round((half*30+full*60)/60*10)/10}h <span style={{fontSize:13,fontWeight:400,color:'var(--text3)'}}>/ {Math.round((monthStats.mHalf*30+monthStats.mFull*60)/60*10)/10}h</span></div><div className="metric-sub">이번주 / 이번달</div></div>
      </div>
      <div className="card">
        <div className="cal-nav">
          <button className="cal-nav-btn" onClick={()=>setOffset(o=>o-1)}>◀</button>
          <span className="cal-nav-label">{mon.getMonth()+1}월 {mon.getDate()}일 – {sun.getMonth()+1}월 {sun.getDate()}일{offset===0?' (이번주)':''}</span>
          <button className="cal-nav-btn" onClick={()=>setOffset(o=>o+1)}>▶</button>
        </div>
        <div style={{display:'flex',gap:12,marginBottom:10,flexWrap:'wrap'}}>
          <div style={{display:'flex',alignItems:'center',gap:5,fontSize:12,color:'var(--text3)'}}><div style={{width:12,height:12,borderRadius:3,background:'#FBEAF0',border:'1.5px solid #D4537E'}}></div>하프PT 30분 (1칸)</div>
          <div style={{display:'flex',alignItems:'center',gap:5,fontSize:12,color:'var(--text3)'}}><div style={{width:12,height:12,borderRadius:3,background:'#E6F1FB',border:'1.5px solid #378ADD'}}></div>일반PT 50분 (2칸)</div>
          <div style={{fontSize:11,color:'var(--text3)',marginLeft:'auto'}}>빈 칸 클릭 → 등록 · 예약 클릭 → 수정/삭제 (해당 날짜에만 등록돼요)</div>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{borderCollapse:'collapse',tableLayout:'fixed',width:'100%',minWidth:760,fontSize:11}}>
            <colgroup>
              <col style={{width:'6%'}}/>
              {DAYS.map((_,i)=>(<Fragment key={i}><col style={{width:dayColWidthPct+'%'}}/><col style={{width:dayColWidthPct+'%'}}/></Fragment>))}
            </colgroup>
            <thead>
              <tr>
                <th style={{padding:'4px 6px',color:'var(--text3)',fontWeight:500}}></th>
                {DAYS.map((d,i)=>{
                  const dt=new Date(mon); dt.setDate(dt.getDate()+i)
                  const isTd=offset===0&&i===todayDow
                  return <th key={i} colSpan={2} style={{padding:'4px 4px',textAlign:'center',color:isTd?'var(--blue)':'var(--text3)',fontWeight:500,borderLeft:'2px solid var(--border-strong)',background:i%2===0?'var(--surface)':'var(--surface1)'}}>{d}<br/><span style={{fontWeight:400,color:'var(--text3)'}}>{dt.getDate()}</span></th>
                })}
              </tr>
              <tr>
                <th></th>
                {DAYS.map((_,i)=>(
                  <Fragment key={i}>
                    <th style={{fontWeight:400,color:'var(--text3)',fontSize:9,padding:'0 0 3px',borderLeft:'2px solid var(--border-strong)',background:i%2===0?'var(--surface)':'var(--surface1)'}}>:00</th>
                    <th style={{fontWeight:400,color:'var(--text3)',fontSize:9,padding:'0 0 3px',background:i%2===0?'var(--surface)':'var(--surface1)'}}>:30</th>
                  </Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {hourRows.map(h=>{
                const half30 = nextSlotOf(h)
                return (
                  <tr key={h}>
                    <td style={{border:'0.5px solid var(--border)',padding:'0 6px',background:'var(--surface1)',color:'var(--text3)',whiteSpace:'nowrap',height:32}}>{h}</td>
                    {DAYS.map((_,i)=>{
                      const dt = new Date(mon); dt.setDate(dt.getDate()+i)
                      const dKey = toKey(dt)
                      const cov0 = coveringOf(dKey,h)
                      const cov1 = half30 && half30.endsWith(':30') ? coveringOf(dKey,half30) : null
                      return (
                        <Fragment key={i}>
                          <td onClick={()=>openCell(dKey,h,dt)} style={{...cellStyle(cov0,i), borderLeft:'2px solid var(--border-strong)'}}>
                            {cov0&&cov0.isStart?(()=>{const sc=sessionCount(cov0.booking);return <>{cov0.booking.type==='half'?'하프':'PT'}<br/>{cov0.booking.m.slice(0,3)}{sc?` ${sc.n}/${sc.total}`:''}</>})():null}
                          </td>
                          {half30&&half30.endsWith(':30') ? (
                            <td onClick={()=>openCell(dKey,half30,dt)} style={cellStyle(cov1,i)}>
                              {cov1&&cov1.isStart?(()=>{const sc=sessionCount(cov1.booking);return <>{cov1.booking.type==='half'?'하프':'PT'}<br/>{cov1.booking.m.slice(0,3)}{sc?` ${sc.n}/${sc.total}`:''}</>})():null}
                            </td>
                          ) : <td style={{border:'0.5px solid var(--border)',background:i%2===0?'var(--surface)':'var(--surface1)',width:dayColWidthPct+'%'}}></td>}
                        </Fragment>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      {modal&&(
        <div className="modal-backdrop" onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div className="modal" style={{width:360}}>
            <div className="modal-title">PT 예약 {modal.existing?'수정':'등록'}</div>
            <div style={{fontSize:13,color:'var(--text3)',marginBottom:12}}>{effectiveTrainer} · {modal.y}년 {modal.m+1}월 {modal.d}일 ({DAYS[modal.dow]}) {modal.hour}</div>
            <div style={{marginBottom:10,position:'relative'}}>
              <label style={{fontSize:12,color:'var(--text3)',display:'block',marginBottom:4}}>회원 선택</label>
              <button
                type="button"
                onClick={()=>setMemberPickerOpen(o=>!o)}
                style={{width:'100%',textAlign:'left',padding:'8px 10px',border:'0.5px solid var(--border)',borderRadius:'var(--radius)',background:'var(--surface1)',color:form.m?'var(--text)':'var(--text3)',fontSize:13,cursor:'pointer'}}>
                {form.m||'회원을 선택하세요'} ▾
              </button>
              {memberPickerOpen&&(
                <div style={{position:'absolute',top:'100%',left:0,right:0,zIndex:10,background:'var(--surface)',border:'0.5px solid var(--border-strong)',borderRadius:'var(--radius)',marginTop:4,maxHeight:220,overflowY:'auto',boxShadow:'0 4px 12px rgba(0,0,0,0.12)'}}>
                  {myMembers.length===0&&<div style={{padding:10,fontSize:12,color:'var(--text3)'}}>{effectiveTrainer} 담당 PT 회원이 없어요. 먼저 PT회원 관리에서 등록해주세요.</div>}
                  {myMembers.map(m=>(
                    <div key={m.id}
                      onClick={()=>{setForm(f=>({...f,m:m.name,type:m.product.type}));setMemberPickerOpen(false)}}
                      style={{padding:'9px 12px',fontSize:13,cursor:'pointer',borderBottom:'0.5px solid var(--border)'}}
                      onMouseEnter={e=>e.currentTarget.style.background='var(--surface1)'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      {m.name} <span style={{color:'var(--text3)',fontSize:11}}>· {m.product.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{marginBottom:4}}>
              <label style={{fontSize:12,color:'var(--text3)',display:'block',marginBottom:6}}>PT 종류{allowedType&&<span style={{color:'var(--text3)',fontWeight:400}}> · {selectedMember.name}님 가입 종목만 선택 가능</span>}</label>
              <div style={{display:'flex',gap:8}}>
                {(()=>{const halfDisabled=allowedType&&allowedType!=='half';return <button disabled={halfDisabled} style={{flex:1,padding:'8px 4px',border:'1.5px solid '+(form.type==='half'?'#D4537E':'var(--border)'),borderRadius:'var(--radius)',background:form.type==='half'?'#FBEAF0':'transparent',color:halfDisabled?'var(--text3)':form.type==='half'?'#712B13':'var(--text2)',opacity:halfDisabled?0.4:1,cursor:halfDisabled?'not-allowed':'pointer',fontSize:12,fontWeight:500}} onClick={()=>!halfDisabled&&setForm(f=>({...f,type:'half'}))}>하프PT (30분)</button>})()}
                {(()=>{const fullDisabled=allowedType&&allowedType!=='full';return <button disabled={fullDisabled} style={{flex:1,padding:'8px 4px',border:'1.5px solid '+(form.type==='full'?'#378ADD':'var(--border)'),borderRadius:'var(--radius)',background:form.type==='full'?'#E6F1FB':'transparent',color:fullDisabled?'var(--text3)':form.type==='full'?'#042C53':'var(--text2)',opacity:fullDisabled?0.4:1,cursor:fullDisabled?'not-allowed':'pointer',fontSize:12,fontWeight:500}} onClick={()=>!fullDisabled&&setForm(f=>({...f,type:'full'}))}>일반PT (50분, 2칸)</button>})()}
              </div>
            </div>
            {modal.existing&&onOpenDiary&&(
              <button className="btn btn-outline" style={{width:'100%',marginBottom:8}} onClick={()=>{onOpenDiary({trainer:effectiveTrainer,member:form.m,dateKey:modal.dateKey});setModal(null)}}>📝 {form.m}님 운동일지 작성/보기</button>
            )}
            <div className="modal-btns">
              <button className="btn btn-outline" onClick={()=>setModal(null)}>취소</button>
              {modal.existing&&<button className="btn btn-danger" onClick={removeBooking}>삭제</button>}
              <button className="btn btn-g" onClick={saveBooking}>저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
