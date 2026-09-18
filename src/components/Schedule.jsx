import {useState} from 'react'
import {useSyncedState} from '../useSyncedState.js'
import {TODAY,ML,WD,TRAINERS,VAC_DATA,HOL_RECORDS_INIT,fmt,fmtDate,isPast} from '../data.js'
import {HOL_TYPES,HOL_TYPE_COLOR,holidayBonusAmount,holidayLabel} from '../holSettings.js'
const holAmt = holidayBonusAmount
const holLbl = holidayLabel
function holColor(t){return HOL_TYPE_COLOR[t]||'#8b8fa3';}
const TRAINER_DOT_COLOR = {정우:'#6B5CE7', 준혁:'#1D9E75', 건호:'#D4537E', 인재:'#378ADD'}
export default function Schedule({role, myTrainer}) {
  const isOwner = role==='원장님'
  const [tab, setTab] = useState('vac')
  const [trainer, setTrainer] = useState(isOwner ? '정우' : myTrainer)
  const effectiveTrainer = trainer
  const canEditVac = isOwner || effectiveTrainer===myTrainer
  const [year, setYear] = useState(TODAY.getFullYear())
  const [month, setMonth] = useState(TODAY.getMonth())
  const [vacData, setVacData] = useSyncedState('nowgym-vacations', VAC_DATA)
  const [holRecs, setHolRecs] = useSyncedState('nowgym-holiday-work', HOL_RECORDS_INIT)
  const [holModal, setHolModal] = useState(null)
  const [holSelTrainer, setHolSelTrainer] = useState('정우')
  const [holSelType, setHolSelType] = useState('normal')
  const changeMonth = d=>{let m=month+d,y=year;if(m>11){m=0;y++}if(m<0){m=11;y--}setMonth(m);setYear(y)}
  const vacs = vacData[effectiveTrainer]||[]
  const used = vacs.filter(k=>{const p=k.split('-');return isPast(new Date(+p[0],+p[1]-1,+p[2]))}).length
  const upcoming = vacs.filter(k=>{const p=k.split('-');return !isPast(new Date(+p[0],+p[1]-1,+p[2]))}).length
  const remain = 12-used-upcoming
  const monthRecs = holRecs.filter(r=>{const p=r.date.split('-');return +p[0]===year&&+p[1]===month+1})
  const holTotal = monthRecs.reduce((a,r)=>a+holAmt(r.type),0)
  const fd = new Date(year,month,1).getDay()
  const dim = new Date(year,month+1,0).getDate()
  return (
    <div>
      <div style={{display:'flex',gap:4,background:'var(--surface1)',borderRadius:'var(--radius)',padding:4,marginBottom:16,width:'fit-content'}}>
        <button className={`btn${tab==='vac'?' btn-g':''}`} onClick={()=>setTab('vac')}>🌴 휴가</button>
        <button className={`btn${tab==='hol'?' btn-g':''}`} onClick={()=>setTab('hol')}>🌞 휴일근무</button>
      </div>
      {tab==='vac'&&(
        <div className="grid-2">
          <div>
            {isOwner ? (
              <div style={{display:'flex',gap:8,marginBottom:8,flexWrap:'wrap'}}>
                {TRAINERS.map(t=><button key={t.name} className={`btn ${effectiveTrainer===t.name?'btn-g':'btn-outline'}`} onClick={()=>setTrainer(t.name)}>{t.name}</button>)}
              </div>
            ) : (
              <div style={{fontSize:13,fontWeight:500,marginBottom:8}}>내 휴가: {myTrainer}</div>
            )}
            <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:10}}>
              {TRAINERS.map(t=><div key={t.name} style={{display:'flex',alignItems:'center',gap:4,fontSize:11,color:'var(--text3)'}}><div style={{width:8,height:8,borderRadius:'50%',background:TRAINER_DOT_COLOR[t.name]}}></div>{t.name}</div>)}
            </div>
            <div className="card" style={{marginBottom:12}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:8}}>
                <div style={{display:'flex',alignItems:'baseline',gap:4}}><span style={{fontSize:32,fontWeight:500}}>{used}</span><span style={{fontSize:13,color:'var(--text3)'}}>/ 12일 사용</span></div>
                <span className="badge badge-g">{remain}일 남음</span>
              </div>
              <div className="bar-bg"><div className="bar-fill" style={{width:Math.round((used+upcoming)/12*100)+'%',background:'var(--green)'}}></div></div>
              <div style={{display:'flex',gap:4,flexWrap:'wrap',marginTop:8}}>
                {Array(12).fill(0).map((_,i)=><div key={i} style={{width:22,height:22,borderRadius:'50%',border:'1.5px solid var(--border)',background:i<used?'var(--green)':i<used+upcoming?'var(--amber-light)':'var(--surface1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,color:i<used?'#fff':i<used+upcoming?'var(--amber)':'var(--text3)'}}>{i+1}</div>)}
              </div>
            </div>
            <div className="card">
              <div className="cal-nav">
                <button className="cal-nav-btn" onClick={()=>changeMonth(-1)}>◀</button>
                <span className="cal-nav-label">{year}년 {ML[month]}</span>
                <button className="cal-nav-btn" onClick={()=>changeMonth(1)}>▶</button>
              </div>
              <div className="cal-weekdays">{['일','월','화','수','목','금','토'].map((d,i)=><div key={i} className={`cal-wd${i===0?' s':i===6?' sa':''}`}>{d}</div>)}</div>
              <div className="cal-grid">
                {Array(fd).fill(0).map((_,i)=><div key={i} className="cc emp"></div>)}
                {Array(dim).fill(0).map((_,i)=>{
                  const d=i+1,k=year+'-'+(month+1)+'-'+d
                  const isVac=vacs.includes(k)
                  const onVacAll=TRAINERS.filter(t=>(vacData[t.name]||[]).includes(k))
                  const past=isPast(new Date(year,month,d))
                  const isToday=d===TODAY.getDate()&&month===TODAY.getMonth()&&year===TODAY.getFullYear()
                  const dw=new Date(year,month,d).getDay()
                  const atLimit = used+upcoming>=12
                  return (
                    <div key={i} className={`cc${isVac&&past?' vac-used':isVac?' vac-up':''}${isToday?' today':''}`}
                      style={{opacity:(past&&onVacAll.length===0)||(atLimit&&!isVac&&!past)?0.4:1,cursor:canEditVac&&!(atLimit&&!isVac&&!past)?'pointer':'default'}}
                      onClick={()=>{
                        if(!canEditVac)return
                        if(!past&&!isVac){
                          if(used+upcoming>=12){alert('휴가는 연간 12일까지만 사용할 수 있어요.');return}
                          setVacData(v=>({...v,[effectiveTrainer]:[...v[effectiveTrainer],k]}))
                        }
                        else if(isVac&&!past){setVacData(v=>({...v,[effectiveTrainer]:v[effectiveTrainer].filter(x=>x!==k)}))}
                      }}>
                      <div className={`cdn${dw===0?' s':dw===6?' sa':''}`}>{d}</div>
                      {onVacAll.length>0&&(
                        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:1}}>
                          {onVacAll.map(t=>(
                            <div key={t.name} style={{display:'flex',alignItems:'center',gap:2,fontSize:8,lineHeight:1,color:TRAINER_DOT_COLOR[t.name],fontWeight:600}}>
                              <div style={{width:5,height:5,borderRadius:'50%',background:TRAINER_DOT_COLOR[t.name],flexShrink:0}}></div>
                              {t.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-title">{effectiveTrainer} 휴가 내역</div>
            {[...vacs].sort().map((k,idx)=>{
              const p=k.split('-');const past=isPast(new Date(+p[0],+p[1]-1,+p[2]));const dw=new Date(+p[0],+p[1]-1,+p[2]).getDay()
              return <div key={k} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 0',borderBottom:'0.5px solid var(--border)',fontSize:13}}>
                <span style={{fontSize:11,color:'var(--text3)',minWidth:32}}>{idx+1}번째</span>
                <span style={{flex:1,fontWeight:500}}>{p[0]}년 {p[1]}월 {p[2]}일 ({WD[dw]})</span>
                <span className={`badge ${past?'badge-g':'badge-b'}`}>{past?'사용완료':'예정'}</span>
              </div>
            })}
          </div>
        </div>
      )}
      {tab==='hol'&&(
        <div>
            <div className="card" style={{marginBottom:12,background:'#E05A2B'}}>
              <div style={{color:'#fff',fontSize:13,opacity:.85,marginBottom:4}}>{ML[month]} 휴일 근무 추가금 합계</div>
              <div style={{color:'#fff',fontSize:28,fontWeight:600}}>{fmt(holTotal)}</div>
              <div style={{display:'flex',gap:8,marginTop:8,flexWrap:'wrap'}}>
                {TRAINERS.map(tr=>{const cnt=monthRecs.filter(r=>r.trainerName===tr.name).length;const amt=monthRecs.filter(r=>r.trainerName===tr.name).reduce((a,r)=>a+holAmt(r.type),0);return cnt>0?<span key={tr.name} style={{fontSize:11,background:'rgba(255,255,255,.2)',color:'#fff',borderRadius:20,padding:'2px 10px'}}>{tr.short} {cnt}일 +{fmt(amt)}</span>:null})}
              </div>
            </div>
            <div className="card">
              <div className="cal-nav">
                <button className="cal-nav-btn" onClick={()=>changeMonth(-1)}>◀</button>
                <span className="cal-nav-label">{year}년 {ML[month]}</span>
                <button className="cal-nav-btn" onClick={()=>changeMonth(1)}>▶</button>
              </div>
              <div style={{display:'flex',gap:10,marginBottom:10}}>
                {HOL_TYPES.map(t=><div key={t} style={{display:'flex',alignItems:'center',gap:4,fontSize:12,color:'var(--text3)'}}><div style={{width:9,height:9,borderRadius:'50%',background:HOL_TYPE_COLOR[t]}}></div>{holLbl(t)}</div>)}
                <div style={{fontSize:11,color:'var(--text3)',marginLeft:'auto'}}>날짜 클릭 → 등록</div>
              </div>
              <div className="cal-weekdays">{['일','월','화','수','목','금','토'].map((d,i)=><div key={i} className={`cal-wd${i===0?' s':i===6?' sa':''}`}>{d}</div>)}</div>
              <div className="cal-grid">
                {Array(fd).fill(0).map((_,i)=><div key={i} className="cc emp"></div>)}
                {Array(dim).fill(0).map((_,i)=>{
                  const d=i+1,k=year+'-'+(month+1)+'-'+d
                  const rec=holRecs.find(r=>r.date===k)
                  const isToday=d===TODAY.getDate()&&month===TODAY.getMonth()&&year===TODAY.getFullYear()
                  const dw=new Date(year,month,d).getDay()
                  const lockedOut = !isOwner && rec && rec.trainerName!==myTrainer
                  return (
                    <div key={i} className={`cc hday${rec?' worked':''}${isToday?' today':''}`}
                      style={{cursor:lockedOut?'default':'pointer'}}
                      onClick={()=>{if(lockedOut)return;setHolSelTrainer(rec?rec.trainerName:(isOwner?'정우':myTrainer));setHolSelType(rec?rec.type:'normal');setHolModal({k,d,rec})}}>
                      <div className={`cdn${dw===0?' s':dw===6?' sa':''}`}>{d}</div>
                      {rec&&<div style={{fontSize:9,fontWeight:600,borderRadius:3,padding:'1px 3px',background:'#E1F5EE',color:'#085041'}}>{rec.trainerName.slice(0,2)}</div>}
                      {rec&&<div style={{width:6,height:6,borderRadius:'50%',background:holColor(rec.type)}}></div>}
                    </div>
                  )
                })}
              </div>
            </div>
        </div>
      )}
      {holModal&&(
        <div className="modal-backdrop" onClick={e=>e.target===e.currentTarget&&setHolModal(null)}>
          <div className="modal" style={{width:380}}>
            <div className="modal-title">근무 등록</div>
            <div style={{fontSize:18,fontWeight:600,color:'#E05A2B',marginBottom:12}}>{year}년 {month+1}월 {holModal.d}일</div>
            <div style={{fontSize:12,color:'var(--text3)',marginBottom:6}}>근무 선생님</div>
            <div style={{display:'flex',gap:8,marginBottom:12}}>
              {(isOwner?TRAINERS:TRAINERS.filter(t=>t.name===myTrainer)).map(t=><button key={t.name} style={{flex:1,padding:'8px 4px',border:'1.5px solid '+(holSelTrainer===t.name?'var(--green)':'var(--border)'),borderRadius:'var(--radius)',background:holSelTrainer===t.name?'var(--green-light)':'transparent',color:holSelTrainer===t.name?'var(--green-dark)':'var(--text2)',cursor:isOwner?'pointer':'default',fontSize:12,fontWeight:500}} onClick={()=>isOwner&&setHolSelTrainer(t.name)}>{t.name}</button>)}
            </div>
            <div style={{fontSize:12,color:'var(--text3)',marginBottom:6}}>휴일 유형</div>
            <div style={{display:'flex',gap:8,marginBottom:12}}>
              {HOL_TYPES.map(t=><button key={t} style={{flex:1,padding:'8px 4px',border:'1.5px solid '+(holSelType===t?'#E05A2B':'var(--border)'),borderRadius:'var(--radius)',background:holSelType===t?'var(--orange-light)':'transparent',cursor:'pointer',fontSize:12,fontWeight:500,color:holSelType===t?'#E05A2B':'var(--text2)'}} onClick={()=>setHolSelType(t)}>{holLbl(t)}<br/><span style={{fontSize:10,opacity:.7}}>{holAmt(t)>0?'+'+fmt(holAmt(t)):'추가금 없음'}</span></button>)}
            </div>
            <div style={{background:'var(--surface1)',borderRadius:'var(--radius)',padding:'10px 14px',display:'flex',justifyContent:'space-between',marginBottom:12}}>
              <span style={{fontSize:13,color:'var(--text3)'}}>추가금</span>
              <span style={{fontWeight:600,color:'#E05A2B'}}>{holAmt(holSelType)>0?'+'+fmt(holAmt(holSelType)):'없음'}</span>
            </div>
            <div className="modal-btns">
              <button className="btn btn-outline" onClick={()=>setHolModal(null)}>취소</button>
              {holModal.rec&&<button className="btn btn-danger" onClick={()=>{setHolRecs(r=>r.filter(x=>x.date!==holModal.k));setHolModal(null)}}>삭제</button>}
              <button className="btn btn-g" onClick={()=>{setHolRecs(r=>[...r.filter(x=>x.date!==holModal.k),{date:holModal.k,trainerName:holSelTrainer,type:holSelType}]);setHolModal(null)}}>등록 완료</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
