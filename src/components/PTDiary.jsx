import {useState, useEffect} from 'react'
import {useSyncedState} from '../useSyncedState.js'
import {TODAY,TRAINERS,EXERCISES_INIT,PT_MEMBERS_INIT,PT_DATA,ML,WD,fmtDate,fmtDateShort} from '../data.js'
const exVolume = ex => ex.sets.reduce((a,s)=>a+(parseFloat(s.w)||0)*(parseFloat(s.r)||0),0)
const dateKeyOf = (y,m0,d) => `${y}-${m0+1}-${d}`
const dateKeyOfDate = d => dateKeyOf(d.getFullYear(),d.getMonth(),d.getDate())
const INIT_LOGS = {
  정우:[
    {id:'a',memberId:1,memberName:'홍길동',date:new Date(2026,8,3),int:'💀 최고',parts:['하체','코어'],exs:[{name:'스쿼트',sets:[{w:100,r:5,u:''},{w:100,r:5,u:''},{w:90,r:8,u:''}]},{name:'레그프레스',sets:[{w:160,r:10,u:''},{w:140,r:12,u:''}]},{name:'플랭크',sets:[{w:0,r:60,u:'초'},{w:0,r:60,u:'초'}]}],memo:'스쿼트 100kg 3세트 완주! 다음엔 105kg 도전.',media:['📸'],cnt:2},
    {id:'b',memberId:1,memberName:'홍길동',date:new Date(2026,8,1),int:'💪 보통',parts:['가슴','어깨'],exs:[{name:'벤치프레스',sets:[{w:80,r:5,u:''},{w:75,r:8,u:''}]},{name:'숄더프레스',sets:[{w:50,r:10,u:''},{w:45,r:12,u:''}]}],memo:'벤치 80kg 5회 성공!',media:[],cnt:1},
  ],
  준혁:[{id:'c',memberId:5,memberName:'오소연',date:new Date(2026,8,2),int:'💪 보통',parts:['하체'],exs:[{name:'스쿼트',sets:[{w:60,r:10,u:''},{w:60,r:10,u:''}]}],memo:'레그프레스 60kg 달성!',media:[],cnt:1}],
  건호:[],인재:[],
}
export default function PTDiary({role, myTrainer, diaryJump, onDiaryJumpHandled}) {
  const isOwner = role==='원장님'
  const [trainer, setTrainer] = useState('정우')
  const effectiveTrainer = isOwner ? trainer : myTrainer
  const [logs, setLogs] = useSyncedState('nowgym-workout-logs', INIT_LOGS)
  const [members] = useSyncedState('nowgym-pt-members', PT_MEMBERS_INIT)
  const [exercises] = useSyncedState('nowgym-exercises', EXERCISES_INIT)
  const [ptData] = useSyncedState('nowgym-pt-schedule', PT_DATA)
  const [view, setView] = useState('members') // members | calendar | write | detail
  const [selMemberName, setSelMemberName] = useState('')
  const [selDateKey, setSelDateKey] = useState('')
  const [selLog, setSelLog] = useState(null)
  const [year, setYear] = useState(TODAY.getFullYear())
  const [month, setMonth] = useState(TODAY.getMonth())
  const [wExs, setWExs] = useState([])
  const [wInt, setWInt] = useState('💪 보통')
  const [wParts, setWParts] = useState([])
  const [wMemo, setWMemo] = useState('')
  const [wMedia, setWMedia] = useState([])
  const [exModal, setExModal] = useState(false)
  const [exInfo, setExInfo] = useState(null)
  const [kkModal, setKkModal] = useState(null)
  const myMembers = members.filter(m=>m.trainer===effectiveTrainer)
  const selMember = myMembers.find(m=>m.name===selMemberName)
  const exByCat = {}; exercises.forEach(e=>{(exByCat[e.category]=exByCat[e.category]||[]).push(e)})
  const trLogs = (logs[effectiveTrainer]||[]).map(l=>l.date instanceof Date?l:{...l,date:new Date(l.date)})
  const memberLogs = trLogs.filter(l=>l.memberName===selMemberName)
  const memberLogByDate = {}; memberLogs.forEach(l=>{memberLogByDate[dateKeyOfDate(l.date)]=l})
  const memberBookedSet = new Set((ptData[effectiveTrainer]||[]).filter(p=>p.m===selMemberName).map(p=>p.dateKey))
  const fd=new Date(year,month,1).getDay(); const dim=new Date(year,month+1,0).getDate()
  const changeMonth=d=>{let m=month+d,y=year;if(m>11){m=0;y++}if(m<0){m=11;y--}setMonth(m);setYear(y)}
  const togglePart=p=>setWParts(ps=>ps.includes(p)?ps.filter(x=>x!==p):[...ps,p])
  const addEx=ex=>{
    setWExs(es=>[...es,{name:ex.name,memo:'',sets:[{w:'',r:'',u:''}]}])
    if(ex.category)setWParts(ps=>ps.includes(ex.category)?ps:[...ps,ex.category])
    setExModal(false)
  }
  const prevRecordFor=exName=>{
    const sorted=memberLogs.filter(l=>!(selLog&&l.id===selLog.id)).slice().sort((a,b)=>b.date-a.date)
    for(const l of sorted){
      const found=l.exs.find(e=>e.name===exName)
      if(found)return {date:l.date,sets:found.sets}
    }
    return null
  }
  const loadPrev=(bi,sets)=>setWExs(es=>es.map((e,i)=>i===bi?{...e,sets:sets.map(s=>({...s}))}:e))
  const addSet=i=>setWExs(es=>es.map((e,ei)=>{
    if(ei!==i)return e
    const last=e.sets[e.sets.length-1]
    return {...e,sets:[...e.sets,last?{w:last.w,r:last.r,u:last.u}:{w:'',r:'',u:''}]}
  }))
  const rmEx=i=>setWExs(es=>es.filter((_,ei)=>ei!==i))
  const rmSet=(ei,si)=>setWExs(es=>es.map((e,i)=>i===ei?{...e,sets:e.sets.filter((_,j)=>j!==si)}:e))
  const updSet=(ei,si,field,val)=>setWExs(es=>es.map((e,i)=>i===ei?{...e,sets:e.sets.map((s,j)=>j===si?{...s,[field]:val}:s)}:e))
  const updExMemo=(ei,val)=>setWExs(es=>es.map((e,i)=>i===ei?{...e,memo:val}:e))
  const moveEx=(ei,dir)=>setWExs(es=>{
    const ni=ei+dir
    if(ni<0||ni>=es.length)return es
    const arr=[...es]; [arr[ei],arr[ni]]=[arr[ni],arr[ei]]; return arr
  })

  const openMemberList = () => { setView('members'); setSelMemberName('') }
  const openMember = (name) => { setSelMemberName(name); setYear(TODAY.getFullYear()); setMonth(TODAY.getMonth()); setView('calendar') }
  const resetForm = () => { setWExs([]); setWParts([]); setWMemo(''); setWMedia([]); setWInt('💪 보통') }
  const startNewRoutine = (dateKey) => { setSelDateKey(dateKey); setSelLog(null); resetForm(); setView('write') }
  const startEditRoutine = (log) => {
    setSelDateKey(dateKeyOfDate(log.date)); setSelLog(log)
    setWExs(log.exs.map(e=>({name:e.name,memo:e.memo||'',sets:e.sets.map(s=>({...s}))})))
    setWParts([...log.parts]); setWMemo(log.memo); setWMedia([...log.media]); setWInt(log.int)
    setView('write')
  }
  const openDay = (dateKey) => {
    const existing = memberLogByDate[dateKey]
    if (existing) { setSelLog(existing); setSelDateKey(dateKey); setView('detail') }
    else startNewRoutine(dateKey)
  }
  const goBack = () => {
    if (view==='calendar') openMemberList()
    else setView('calendar')
  }
  const saveLog = () => {
    if (!wExs.length) return alert('종목을 추가해주세요')
    const [py,pm,pd] = selDateKey.split('-').map(Number)
    const ld = new Date(py,pm-1,pd)
    const id = selLog ? selLog.id : 'l'+Date.now()
    const nl = {id, memberName:selMemberName, date:ld, int:wInt, parts:[...wParts], exs:wExs.map(e=>({name:e.name,memo:e.memo||'',sets:e.sets.map(s=>({...s}))})), memo:wMemo, media:[...wMedia]}
    setLogs(l=>{
      const rest=(l[effectiveTrainer]||[]).filter(x=>x.id!==id)
      const merged=[...rest,nl]
      const forMember=merged.filter(x=>x.memberName===selMemberName).sort((a,b)=>new Date(a.date)-new Date(b.date))
      const cntMap={}; forMember.forEach((x,i)=>{cntMap[x.id]=i+1})
      return {...l,[effectiveTrainer]:merged.map(x=>x.memberName===selMemberName?{...x,cnt:cntMap[x.id]}:x)}
    })
    setView('calendar')
  }
  const deleteLog = (log) => {
    if (!window.confirm('이 운동 루틴을 삭제할까요?')) return
    setLogs(l=>{
      const rest=(l[effectiveTrainer]||[]).filter(x=>x.id!==log.id)
      const forMember=rest.filter(x=>x.memberName===selMemberName).sort((a,b)=>new Date(a.date)-new Date(b.date))
      const cntMap={}; forMember.forEach((x,i)=>{cntMap[x.id]=i+1})
      return {...l,[effectiveTrainer]:rest.map(x=>x.memberName===selMemberName?{...x,cnt:cntMap[x.id]}:x)}
    })
    setView('calendar')
  }
  const openKk=l=>{
    const msg=`[🏋️ 나우짐 PT 일지]\n\n📅 ${fmtDate(l.date)} · ${l.cnt}번째 수업\n💪 부위: ${l.parts.join(', ')||'—'} · 운동 강도: ${l.int}\n\n🏋️ 오늘 운동\n${l.exs.map(e=>`  • ${e.name}: ${e.sets.length}세트 (${e.sets.map((s,i)=>`${i+1}세트 ${s.w>0?s.w+'kg ':''}${s.r}${s.u||'회'}`).join(', ')})`).join('\n')}\n\n📝 메모\n${l.memo||'없음'}\n\n나우짐 📞 053-965-0513`
    setKkModal({msg,name:l.memberName})
  }

  useEffect(() => {
    if (!diaryJump) return
    const jTrainer = isOwner ? diaryJump.trainer : myTrainer
    if (isOwner) setTrainer(jTrainer)
    const [jy,jm] = diaryJump.dateKey.split('-').map(Number)
    setSelMemberName(diaryJump.member)
    setYear(jy); setMonth(jm-1)
    const logsForTrainer = (logs[jTrainer]||[]).map(l=>l.date instanceof Date?l:{...l,date:new Date(l.date)})
    const existing = logsForTrainer.find(l=>l.memberName===diaryJump.member && dateKeyOfDate(l.date)===diaryJump.dateKey)
    if (existing) { setSelLog(existing); setSelDateKey(diaryJump.dateKey); setView('detail') }
    else { setSelDateKey(diaryJump.dateKey); setSelLog(null); resetForm(); setView('write') }
    onDiaryJumpHandled && onDiaryJumpHandled()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diaryJump])

  return (
    <div>
      <div style={{display:'flex',gap:8,marginBottom:16,alignItems:'center'}}>
        {(isOwner?TRAINERS:TRAINERS.filter(t=>t.name===myTrainer)).map(t=><button key={t.name} className={`btn ${effectiveTrainer===t.name?'btn-g':'btn-outline'}`} onClick={()=>{if(isOwner){setTrainer(t.name);openMemberList()}}}>{t.name}</button>)}
        {view!=='members'&&<button className="btn btn-outline" style={{marginLeft:'auto'}} onClick={goBack}>← {view==='calendar'?'회원 목록':'달력으로'}</button>}
      </div>
      {view==='members'&&(
        <div className="grid-2">
          {myMembers.length===0&&<div style={{textAlign:'center',padding:'2rem',color:'var(--text3)',fontSize:13}}>{effectiveTrainer} 담당 PT 회원이 없어요. 먼저 PT회원 관리에서 등록해주세요.</div>}
          {myMembers.map(m=>{
            const cnt=trLogs.filter(l=>l.memberName===m.name).length
            return (
              <div key={m.id} className="card" style={{cursor:'pointer'}} onClick={()=>openMember(m.name)}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <div className="av av3" style={{width:40,height:40,fontSize:13}}>{m.name.slice(0,2)}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:15,fontWeight:500}}>{m.name}{m.goal&&<span style={{fontSize:11,fontWeight:400,color:'var(--green-dark)',background:'var(--green-light)',borderRadius:8,padding:'1px 7px',marginLeft:6}}>{m.goal}</span>}</div>
                    <div style={{fontSize:12,color:'var(--text3)'}}>{m.product.name}</div>
                  </div>
                  <span className="badge badge-g">일지 {cnt}개</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {view==='calendar'&&selMember&&(
        <div className="grid-2">
          <div>
            <div className="card" style={{marginBottom:12}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                <div className="av av3" style={{width:40,height:40,fontSize:13}}>{selMember.name.slice(0,2)}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:15,fontWeight:500}}>{selMember.name}{selMember.goal&&<span style={{fontSize:11,fontWeight:400,color:'var(--green-dark)',background:'var(--green-light)',borderRadius:8,padding:'1px 7px',marginLeft:6}}>{selMember.goal}</span>}</div>
                  <div style={{fontSize:12,color:'var(--text3)'}}>{selMember.product.name}</div>
                </div>
                <span className="badge badge-g">일지 {memberLogs.length}개</span>
              </div>
            </div>
            <div style={{display:'flex',gap:12,marginBottom:10,flexWrap:'wrap'}}>
              <div style={{display:'flex',alignItems:'center',gap:5,fontSize:12,color:'var(--text3)'}}><div style={{width:8,height:8,borderRadius:'50%',background:'#378ADD'}}></div>PT 수업일</div>
              <div style={{display:'flex',alignItems:'center',gap:5,fontSize:12,color:'var(--text3)'}}><div style={{width:8,height:8,borderRadius:'50%',background:'var(--green)'}}></div>운동일지 작성됨</div>
              <div style={{fontSize:11,color:'var(--text3)',marginLeft:'auto'}}>날짜 클릭 → 루틴 등록/확인</div>
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
                  const d=i+1,k=dateKeyOf(year,month,d)
                  const isT=d===TODAY.getDate()&&month===TODAY.getMonth()&&year===TODAY.getFullYear()
                  const dw=new Date(year,month,d).getDay()
                  const hasBooking=memberBookedSet.has(k)
                  const hasLog=!!memberLogByDate[k]
                  return <div key={i} className={`cc${isT?' today':''}`} style={{cursor:'pointer'}} onClick={()=>openDay(k)}>
                    <div className={`cdn${dw===0?' s':dw===6?' sa':''}`}>{d}</div>
                    {(hasBooking||hasLog)&&(
                      <div style={{display:'flex',gap:2}}>
                        {hasBooking&&<div style={{width:6,height:6,borderRadius:'50%',background:'#378ADD'}}></div>}
                        {hasLog&&<div style={{width:6,height:6,borderRadius:'50%',background:'var(--green)'}}></div>}
                      </div>
                    )}
                  </div>
                })}
              </div>
            </div>
          </div>
          <div>
            {memberLogs.length===0&&<div style={{textAlign:'center',padding:'2rem',color:'var(--text3)',fontSize:13}}>이 회원의 운동일지가 없어요</div>}
            {memberLogs.slice().sort((a,b)=>b.date-a.date).map(l=>(
              <div key={l.id} className="card" style={{marginBottom:10,cursor:'pointer'}} onClick={()=>{setSelLog(l);setSelDateKey(dateKeyOfDate(l.date));setView('detail')}}>
                <div style={{background:'var(--surface1)',margin:'-16px -20px 10px',padding:'10px 16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:13,fontWeight:500}}>{fmtDate(l.date)} ({WD[l.date.getDay()]})</span>
                  <span className="badge badge-g">{l.cnt}번째</span>
                </div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:8}}>
                  {l.parts.map(p=><span key={p} style={{fontSize:11,padding:'2px 8px',borderRadius:10,background:'var(--surface1)',color:'var(--text3)'}}>{p}</span>)}
                  <span style={{fontSize:11,color:'var(--text3)',marginLeft:'auto'}}>{l.int}</span>
                </div>
                {l.exs.map((e,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:13,padding:'3px 0'}}><span style={{fontWeight:500}}>{e.name}</span><span style={{color:'var(--text3)',fontSize:12}}>{e.sets.length}세트{e.sets[0].w>0?' · 최대 '+e.sets[0].w+'kg':''}</span></div>)}
              </div>
            ))}
          </div>
        </div>
      )}
      {view==='detail'&&selLog&&(
        <div className="grid-2">
          <div>
            <div className="card" style={{padding:0,overflow:'hidden',marginBottom:12}}>
              <div style={{background:'var(--green)',padding:'14px 16px'}}>
                <div style={{color:'rgba(255,255,255,.85)',fontSize:12,marginBottom:3}}>{selLog.cnt}번째 수업 · {selLog.int}</div>
                <div style={{color:'#fff',fontSize:18,fontWeight:500}}>{fmtDate(selLog.date)} ({WD[selLog.date.getDay()]})</div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:6}}>{selLog.parts.map(p=><span key={p} style={{fontSize:11,background:'rgba(255,255,255,.25)',color:'#fff',padding:'2px 8px',borderRadius:10}}>{p}</span>)}</div>
              </div>
              <div style={{padding:'12px 16px',fontSize:13,color:'var(--text2)'}}>회원: {selLog.memberName}</div>
            </div>
            {selLog.memo&&<div className="card" style={{fontSize:13,color:'var(--text2)',lineHeight:1.7,marginBottom:12}}>📝 {selLog.memo}</div>}
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-outline" style={{flex:1}} onClick={()=>startEditRoutine(selLog)}>✏️ 루틴 수정</button>
              <button className="btn btn-danger" style={{flex:1}} onClick={()=>deleteLog(selLog)}>삭제</button>
            </div>
          </div>
          <div>
            {selLog.exs.map((e,i)=>(
              <div key={i} className="card" style={{marginBottom:10}}>
                <div style={{display:'flex',alignItems:'baseline',gap:6,marginBottom:8}}>
                  <span style={{fontSize:14,fontWeight:500}}>🏋️ {e.name}</span>
                  {(()=>{const info=exercises.find(ex=>ex.name===e.name); return info&&(info.desc||info.videoUrl||info.imageUrl)&&<button style={{background:'transparent',border:'none',color:'var(--text3)',cursor:'pointer',fontSize:13,padding:0}} onClick={()=>setExInfo(info)}>ⓘ</button>})()}
                  <span style={{fontSize:11,color:'var(--text3)'}}>VOL {Math.round(exVolume(e)).toLocaleString()}kg</span>
                </div>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                  <thead><tr>{['세트','무게','횟수','볼륨'].map(h=><th key={h} style={{padding:'4px 8px',textAlign:'center',color:'var(--text3)',fontWeight:500,borderBottom:'0.5px solid var(--border)'}}>{h}</th>)}</tr></thead>
                  <tbody>{e.sets.map((s,si)=><tr key={si}>{[si+1,s.w>0?s.w+'kg':'—',s.r+(s.u||'회'),s.w>0?Math.round(s.w*s.r).toLocaleString()+'kg':'—'].map((v,vi)=><td key={vi} style={{padding:'5px 8px',textAlign:'center',borderBottom:'0.5px solid var(--border)',fontWeight:vi===0?400:500,color:vi===0?'var(--text3)':'var(--text)'}}>{v}</td>)}</tr>)}</tbody>
                </table>
                {e.memo&&<div style={{fontSize:12,color:'var(--text2)',marginTop:8,paddingTop:8,borderTop:'0.5px solid var(--border)'}}>📝 {e.memo}</div>}
              </div>
            ))}
            <button className="btn btn-kk" style={{width:'100%',padding:12,fontSize:14}} onClick={()=>openKk(selLog)}>💬 카카오톡으로 일지 발송</button>
          </div>
        </div>
      )}
      {view==='write'&&selMemberName&&(
        <div className="grid-2">
          <div>
            <div className="card" style={{marginBottom:12}}>
              <div style={{fontSize:15,fontWeight:500,marginBottom:2}}>{selMemberName}{selMember&&selMember.goal&&<span style={{fontSize:11,fontWeight:400,color:'var(--green-dark)',background:'var(--green-light)',borderRadius:8,padding:'1px 7px',marginLeft:6}}>{selMember.goal}</span>}님 운동 루틴 {selLog?'수정':'등록'}</div>
              {selDateKey&&(()=>{const [py,pm,pd]=selDateKey.split('-').map(Number);return <div style={{fontSize:13,color:'var(--text3)',marginBottom:10}}>{py}년 {pm}월 {pd}일 ({WD[new Date(py,pm-1,pd).getDay()]})</div>})()}
              <div>
                <label style={{fontSize:12,color:'var(--text3)',display:'block',marginBottom:6}}>운동 강도</label>
                <div style={{display:'flex',gap:6}}>
                  {['😊 쉬움','💪 보통','🔥 힘듦','💀 최고'].map(v=><button key={v} style={{flex:1,padding:'6px 2px',border:'0.5px solid '+(wInt===v?'var(--green)':'var(--border)'),borderRadius:'var(--radius)',background:wInt===v?'var(--green-light)':'transparent',fontSize:11,cursor:'pointer',color:wInt===v?'var(--green-dark)':'var(--text2)',fontWeight:wInt===v?500:400}} onClick={()=>setWInt(v)}>{v}</button>)}
                </div>
              </div>
            </div>
            <div className="card" style={{marginBottom:12}}>
              <label style={{fontSize:12,color:'var(--text3)',display:'block',marginBottom:8}}>운동 부위</label>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {['가슴','등','하체','어깨','팔','코어','유산소','전신'].map(p=><button key={p} style={{padding:'5px 12px',border:'0.5px solid '+(wParts.includes(p)?'var(--green)':'var(--border)'),borderRadius:20,fontSize:12,background:wParts.includes(p)?'var(--green-light)':'transparent',color:wParts.includes(p)?'var(--green-dark)':'var(--text2)',cursor:'pointer'}} onClick={()=>togglePart(p)}>{p}</button>)}
              </div>
            </div>
            <div className="card" style={{marginBottom:12}}>
              <label style={{fontSize:12,color:'var(--text3)',display:'block',marginBottom:8}}>트레이너 메모</label>
              <textarea value={wMemo} onChange={e=>setWMemo(e.target.value)} rows={3} placeholder="오늘 수업 포인트, 다음 계획 등" style={{width:'100%'}}/>
            </div>
          </div>
          <div>
            <div style={{marginBottom:10}}>
              {wExs.map((ex,bi)=>(
                <div key={bi} className="card" style={{marginBottom:8}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                    <div style={{display:'flex',alignItems:'baseline',gap:6}}>
                      <span style={{fontSize:14,fontWeight:500}}>🏋️ {ex.name}</span>
                      <span style={{fontSize:11,color:'var(--text3)'}}>VOL {Math.round(exVolume(ex)).toLocaleString()}kg</span>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:2}}>
                      <button disabled={bi===0} style={{background:'transparent',border:'none',color:bi===0?'var(--border)':'var(--text3)',cursor:bi===0?'default':'pointer',fontSize:14,padding:'0 4px'}} onClick={()=>moveEx(bi,-1)}>▲</button>
                      <button disabled={bi===wExs.length-1} style={{background:'transparent',border:'none',color:bi===wExs.length-1?'var(--border)':'var(--text3)',cursor:bi===wExs.length-1?'default':'pointer',fontSize:14,padding:'0 4px'}} onClick={()=>moveEx(bi,1)}>▼</button>
                      <button style={{background:'transparent',border:'none',color:'var(--text3)',cursor:'pointer',fontSize:16,padding:'0 4px'}} onClick={()=>rmEx(bi)}>✕</button>
                    </div>
                  </div>
                  {(()=>{const prev=prevRecordFor(ex.name); return prev&&(
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,fontSize:11,color:'var(--text3)',background:'var(--surface1)',borderRadius:8,padding:'5px 8px',marginBottom:6}}>
                      <span>지난 기록({fmtDateShort(prev.date)}): {prev.sets.map(s=>`${s.w>0?s.w+'kg ':''}${s.r}${s.u||'회'}`).join(', ')}</span>
                      <button style={{background:'transparent',border:'none',color:'var(--blue)',cursor:'pointer',fontSize:11,fontWeight:600,whiteSpace:'nowrap'}} onClick={()=>loadPrev(bi,prev.sets)}>불러오기</button>
                    </div>
                  )})()}
                  <div style={{display:'grid',gridTemplateColumns:'24px 1fr 1fr 1fr 20px',gap:4,marginBottom:4}}>
                    {['세트','무게(kg)','횟수','단위',''].map((h,i)=><div key={i} style={{fontSize:10,color:'var(--text3)',textAlign:'center'}}>{h}</div>)}
                  </div>
                  {ex.sets.map((s,si)=>(
                    <div key={si} style={{display:'grid',gridTemplateColumns:'24px 1fr 1fr 1fr 20px',gap:4,marginBottom:4,alignItems:'center'}}>
                      <div style={{fontSize:11,color:'var(--text3)',textAlign:'center'}}>{si+1}</div>
                      <input type="number" value={s.w} onChange={e=>updSet(bi,si,'w',e.target.value)} placeholder="0" style={{textAlign:'center',fontSize:12,padding:'4px 2px'}}/>
                      <input type="number" value={s.r} onChange={e=>updSet(bi,si,'r',e.target.value)} placeholder="0" style={{textAlign:'center',fontSize:12,padding:'4px 2px'}}/>
                      <select value={s.u} onChange={e=>updSet(bi,si,'u',e.target.value)} style={{fontSize:11,padding:'4px 2px'}}>
                        <option value="">회</option><option value="초">초</option><option value="분">분</option>
                      </select>
                      <button style={{background:'transparent',border:'none',color:'var(--text3)',cursor:'pointer',fontSize:12}} onClick={()=>rmSet(bi,si)}>✕</button>
                    </div>
                  ))}
                  <button style={{width:'100%',padding:'5px',border:'0.5px dashed var(--border)',background:'transparent',borderRadius:'var(--radius)',fontSize:12,color:'var(--text3)',cursor:'pointer',marginBottom:6}} onClick={()=>addSet(bi)}>+ 세트 추가</button>
                  <input type="text" value={ex.memo} onChange={e=>updExMemo(bi,e.target.value)} placeholder="이 종목 메모 (자세, 특이사항 등)" style={{width:'100%',fontSize:12,padding:'6px 8px'}}/>
                </div>
              ))}
              <button className="btn btn-outline" style={{width:'100%',marginBottom:10}} onClick={()=>setExModal(true)}>+ 종목 추가</button>
              <div style={{display:'flex',gap:8}}>
                <button className="btn btn-outline" style={{flex:1,padding:12,fontSize:14}} onClick={()=>selLog?setView('detail'):setView('calendar')}>취소</button>
                <button className="btn btn-g" style={{flex:2,padding:12,fontSize:14}} onClick={saveLog}>루틴 저장</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {exModal&&(
        <div className="modal-backdrop" onClick={e=>e.target===e.currentTarget&&setExModal(false)}>
          <div className="modal">
            <div className="modal-title">운동 종목 선택</div>
            {Object.entries(exByCat).map(([cat,exs])=>(
              <div key={cat} style={{marginBottom:12}}>
                <div style={{fontSize:12,fontWeight:500,color:'var(--text3)',marginBottom:6}}>{cat}</div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                  {exs.map(ex=>(
                    <div key={ex.id} style={{display:'flex',alignItems:'center',border:'0.5px solid var(--border)',borderRadius:20,background:'var(--surface1)'}}>
                      <button style={{display:'flex',alignItems:'center',gap:6,padding:'6px 8px 6px 14px',border:'none',background:'transparent',borderRadius:20,fontSize:13,cursor:'pointer'}} onClick={()=>addEx(ex)}>
                        {ex.imageUrl&&<img src={ex.imageUrl} alt="" style={{width:20,height:20,borderRadius:4,objectFit:'cover'}}/>}
                        {ex.name}
                      </button>
                      {(ex.desc||ex.videoUrl||ex.imageUrl)&&<button style={{background:'transparent',border:'none',color:'var(--text3)',cursor:'pointer',fontSize:13,padding:'4px 10px 4px 0'}} onClick={()=>setExInfo(ex)}>ⓘ</button>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button className="btn btn-outline" style={{width:'100%',marginTop:8}} onClick={()=>setExModal(false)}>닫기</button>
          </div>
        </div>
      )}
      {exInfo&&(
        <div className="modal-backdrop" onClick={e=>e.target===e.currentTarget&&setExInfo(null)}>
          <div className="modal">
            <div className="modal-title">{exInfo.name}</div>
            {exInfo.imageUrl&&<img src={exInfo.imageUrl} alt={exInfo.name} style={{width:'100%',borderRadius:'var(--radius)',marginBottom:10,display:'block'}}/>}
            {exInfo.desc&&<p style={{fontSize:13,color:'var(--text2)',lineHeight:1.6,marginBottom:10,whiteSpace:'pre-wrap'}}>{exInfo.desc}</p>}
            {exInfo.videoUrl&&<a href={exInfo.videoUrl} target="_blank" rel="noreferrer" className="btn btn-outline" style={{width:'100%',display:'block',textAlign:'center',marginBottom:10,textDecoration:'none',boxSizing:'border-box'}}>▶ 운동 영상 보기</a>}
            <button className="btn btn-g" style={{width:'100%'}} onClick={()=>setExInfo(null)}>닫기</button>
          </div>
        </div>
      )}
      {kkModal&&(
        <div className="modal-backdrop" onClick={e=>e.target===e.currentTarget&&setKkModal(null)}>
          <div className="modal">
            <div className="modal-title">💬 카카오톡 발송</div>
            <div style={{fontSize:13,color:'var(--text3)',marginBottom:10}}>{kkModal.name}님에게 발송 · 보내기 전에 아래 내용을 직접 수정할 수 있어요</div>
            <textarea
              value={kkModal.msg}
              onChange={e=>setKkModal(m=>({...m,msg:e.target.value}))}
              rows={14}
              style={{width:'100%',boxSizing:'border-box',background:'#FEE500',borderRadius:12,padding:14,fontSize:13,color:'#3C1E1E',lineHeight:1.8,whiteSpace:'pre-wrap',marginBottom:12,border:'none',resize:'vertical',fontFamily:'inherit'}}
            />
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-outline" style={{flex:1}} onClick={()=>setKkModal(null)}>닫기</button>
              <button className="btn btn-kk" style={{flex:2,padding:11,fontSize:14,fontWeight:700}} onClick={()=>{setKkModal(null);alert(kkModal.name+'님께 카카오톡 발송 완료!')}}>💬 카카오톡으로 보내기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
