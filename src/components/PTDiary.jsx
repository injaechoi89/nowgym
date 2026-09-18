import {useState} from 'react'
import {useSyncedState} from '../useSyncedState.js'
import {TODAY,TRAINERS,EX_CATEGORIES,ML,WD,fmt,fmtDate,fmtDateShort,toDateInput} from '../data.js'
const INIT_LOGS = {
  정우:[
    {id:'a',memberId:1,memberName:'홍길동',date:new Date(2026,8,3),int:'💀 최고',parts:['하체','코어'],exs:[{name:'스쿼트',sets:[{w:100,r:5,u:''},{w:100,r:5,u:''},{w:90,r:8,u:''}]},{name:'레그프레스',sets:[{w:160,r:10,u:''},{w:140,r:12,u:''}]},{name:'플랭크',sets:[{w:0,r:60,u:'초'},{w:0,r:60,u:'초'}]}],memo:'스쿼트 100kg 3세트 완주! 다음엔 105kg 도전.',media:['📸'],cnt:14},
    {id:'b',memberId:1,memberName:'홍길동',date:new Date(2026,8,1),int:'💪 보통',parts:['가슴','어깨'],exs:[{name:'벤치프레스',sets:[{w:80,r:5,u:''},{w:75,r:8,u:''}]},{name:'숄더프레스',sets:[{w:50,r:10,u:''},{w:45,r:12,u:''}]}],memo:'벤치 80kg 5회 성공!',media:[],cnt:13},
  ],
  준혁:[{id:'c',memberId:5,memberName:'오소연',date:new Date(2026,8,2),int:'💪 보통',parts:['하체'],exs:[{name:'스쿼트',sets:[{w:60,r:10,u:''},{w:60,r:10,u:''}]}],memo:'레그프레스 60kg 달성!',media:[],cnt:11}],
  건호:[],인재:[],
}
export default function PTDiary({role, myTrainer}) {
  const isOwner = role==='원장님'
  const [trainer, setTrainer] = useState('정우')
  const effectiveTrainer = isOwner ? trainer : myTrainer
  const [logs, setLogs] = useSyncedState('nowgym-workout-logs', INIT_LOGS)
  const [view, setView] = useState('list')
  const [selLog, setSelLog] = useState(null)
  const [year, setYear] = useState(TODAY.getFullYear())
  const [month, setMonth] = useState(TODAY.getMonth())
  const [wExs, setWExs] = useState([])
  const [wDate, setWDate] = useState(toDateInput(TODAY))
  const [wInt, setWInt] = useState('💪 보통')
  const [wParts, setWParts] = useState([])
  const [wMemo, setWMemo] = useState('')
  const [wMedia, setWMedia] = useState([])
  const [wMember, setWMember] = useState('홍길동')
  const [exModal, setExModal] = useState(false)
  const [kkModal, setKkModal] = useState(null)
  const trLogs = (logs[effectiveTrainer]||[]).map(l=>l.date instanceof Date?l:{...l,date:new Date(l.date)})
  const fd=new Date(year,month,1).getDay(); const dim=new Date(year,month+1,0).getDate()
  const logMap={}; trLogs.forEach(l=>{const k=l.date.getFullYear()+'-'+(l.date.getMonth()+1)+'-'+l.date.getDate();logMap[k]=true})
  const changeMonth=d=>{let m=month+d,y=year;if(m>11){m=0;y++}if(m<0){m=11;y--}setMonth(m);setYear(y)}
  const togglePart=p=>setWParts(ps=>ps.includes(p)?ps.filter(x=>x!==p):[...ps,p])
  const addEx=name=>{setWExs(es=>[...es,{name,sets:[{w:'',r:'',u:''}]}]);setExModal(false)}
  const addSet=i=>setWExs(es=>es.map((e,ei)=>ei===i?{...e,sets:[...e.sets,{w:'',r:'',u:''}]}:e))
  const rmEx=i=>setWExs(es=>es.filter((_,ei)=>ei!==i))
  const rmSet=(ei,si)=>setWExs(es=>es.map((e,i)=>i===ei?{...e,sets:e.sets.filter((_,j)=>j!==si)}:e))
  const updSet=(ei,si,field,val)=>setWExs(es=>es.map((e,i)=>i===ei?{...e,sets:e.sets.map((s,j)=>j===si?{...s,[field]:val}:s)}:e))
  const saveLog=()=>{
    if(!wExs.length)return alert('종목을 추가해주세요')
    const p=wDate.split('-'); const ld=new Date(+p[0],+p[1]-1,+p[2])
    const nl={id:'l'+Date.now(),memberName:wMember,date:ld,int:wInt,parts:[...wParts],exs:wExs.map(e=>({name:e.name,sets:e.sets.map(s=>({...s}))})),memo:wMemo,media:[...wMedia],cnt:trLogs.length+1}
    setLogs(l=>({...l,[effectiveTrainer]:[nl,...(l[effectiveTrainer]||[])]}))
    setView('list'); setWExs([]); setWParts([]); setWMemo(''); setWMedia([])
  }
  const openKk=l=>{
    const msg=`[🏋️ 나우짐 PT 일지]\n\n안녕하세요 ${l.memberName}님!\n${effectiveTrainer} 트레이너입니다 😊\n\n📅 ${fmtDate(l.date)} · ${l.cnt}번째 수업\n💪 부위: ${l.parts.join(', ')||'—'} · ${l.int}\n\n🏋️ 오늘 운동\n${l.exs.map(e=>`  • ${e.name}: ${e.sets.length}세트 (${e.sets.map((s,i)=>`${i+1}세트 ${s.w>0?s.w+'kg ':''}${s.r}${s.u||'회'}`).join(', ')})`).join('\n')}\n\n📝 메모\n${l.memo||'없음'}\n\n나우짐 📞 053-000-0000`
    setKkModal({msg,name:l.memberName})
  }
  return (
    <div>
      <div style={{display:'flex',gap:8,marginBottom:16,alignItems:'center'}}>
        {(isOwner?TRAINERS:TRAINERS.filter(t=>t.name===myTrainer)).map(t=><button key={t.name} className={`btn ${effectiveTrainer===t.name?'btn-g':'btn-outline'}`} onClick={()=>{if(isOwner){setTrainer(t.name);setView('list')}}}>{t.name}</button>)}
        <button className="btn btn-g" style={{marginLeft:'auto'}} onClick={()=>{setView('write');setWExs([]);setWParts([]);setWMemo('');setWMedia([]);setWDate(toDateInput(TODAY))}}>+ 일지 작성</button>
      </div>
      {view==='list'&&(
        <div className="grid-2">
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
                const isT=d===TODAY.getDate()&&month===TODAY.getMonth()&&year===TODAY.getFullYear()
                const dw=new Date(year,month,d).getDay()
                return <div key={i} className={`cc${logMap[k]?' has-log':''}${isT?' today':''}`}>
                  <div className={`cdn${dw===0?' s':dw===6?' sa':''}`}>{d}</div>
                  {logMap[k]&&<div style={{width:6,height:6,borderRadius:'50%',background:'var(--green)'}}></div>}
                </div>
              })}
            </div>
          </div>
          <div>
            {trLogs.length===0&&<div style={{textAlign:'center',padding:'2rem',color:'var(--text3)',fontSize:13}}>일지가 없어요</div>}
            {trLogs.map(l=>(
              <div key={l.id} className="card" style={{marginBottom:10,cursor:'pointer'}} onClick={()=>{setSelLog(l);setView('detail')}}>
                <div style={{background:'var(--surface1)',margin:'-16px -20px 10px',padding:'10px 16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:13,fontWeight:500}}>{fmtDate(l.date)} ({WD[l.date.getDay()]})</span>
                  <span className="badge badge-g">{l.cnt}번째</span>
                </div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:8}}>
                  {l.parts.map(p=><span key={p} style={{fontSize:11,padding:'2px 8px',borderRadius:10,background:'var(--surface1)',color:'var(--text3)'}}>{p}</span>)}
                  <span style={{fontSize:11,color:'var(--text3)',marginLeft:'auto'}}>{l.int}</span>
                </div>
                {l.exs.map((e,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:13,padding:'3px 0'}}><span style={{fontWeight:500}}>{e.name}</span><span style={{color:'var(--text3)',fontSize:12}}>{e.sets.length}세트{e.sets[0].w>0?' · 최대 '+e.sets[0].w+'kg':''}</span></div>)}
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:10,paddingTop:8,borderTop:'0.5px solid var(--border)'}}>
                  <span style={{fontSize:12,color:'var(--text3)'}}>{l.memberName} · {l.exs.length}종목</span>
                  <button className="btn btn-kk" style={{fontSize:12,padding:'5px 12px'}} onClick={e=>{e.stopPropagation();openKk(l)}}>💬 카카오톡</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {view==='detail'&&selLog&&(
        <div>
          <button className="btn btn-outline" style={{marginBottom:14}} onClick={()=>setView('list')}>← 목록</button>
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
              {selLog.memo&&<div className="card" style={{fontSize:13,color:'var(--text2)',lineHeight:1.7}}>📝 {selLog.memo}</div>}
            </div>
            <div>
              {selLog.exs.map((e,i)=>(
                <div key={i} className="card" style={{marginBottom:10}}>
                  <div style={{fontSize:14,fontWeight:500,marginBottom:8}}>🏋️ {e.name}</div>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                    <thead><tr>{['세트','무게','횟수','볼륨'].map(h=><th key={h} style={{padding:'4px 8px',textAlign:'center',color:'var(--text3)',fontWeight:500,borderBottom:'0.5px solid var(--border)'}}>{h}</th>)}</tr></thead>
                    <tbody>{e.sets.map((s,si)=><tr key={si}>{[si+1,s.w>0?s.w+'kg':'—',s.r+(s.u||'회'),s.w>0?Math.round(s.w*s.r).toLocaleString()+'kg':'—'].map((v,vi)=><td key={vi} style={{padding:'5px 8px',textAlign:'center',borderBottom:'0.5px solid var(--border)',fontWeight:vi===0?400:500,color:vi===0?'var(--text3)':'var(--text)'}}>{v}</td>)}</tr>)}</tbody>
                  </table>
                </div>
              ))}
              <button className="btn btn-kk" style={{width:'100%',padding:12,fontSize:14}} onClick={()=>openKk(selLog)}>💬 카카오톡으로 일지 발송</button>
            </div>
          </div>
        </div>
      )}
      {view==='write'&&(
        <div className="grid-2">
          <div>
            <div className="card" style={{marginBottom:12}}>
              <div style={{marginBottom:10}}>
                <label style={{fontSize:12,color:'var(--text3)',display:'block',marginBottom:4}}>회원 이름</label>
                <input type="text" value={wMember} onChange={e=>setWMember(e.target.value)} style={{width:'100%'}} placeholder="홍길동"/>
              </div>
              <div style={{marginBottom:10}}>
                <label style={{fontSize:12,color:'var(--text3)',display:'block',marginBottom:4}}>날짜</label>
                <input type="date" value={wDate} onChange={e=>setWDate(e.target.value)} style={{width:'100%'}}/>
              </div>
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
                    <span style={{fontSize:14,fontWeight:500}}>🏋️ {ex.name}</span>
                    <button style={{background:'transparent',border:'none',color:'var(--text3)',cursor:'pointer',fontSize:16}} onClick={()=>rmEx(bi)}>✕</button>
                  </div>
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
                  <button style={{width:'100%',padding:'5px',border:'0.5px dashed var(--border)',background:'transparent',borderRadius:'var(--radius)',fontSize:12,color:'var(--text3)',cursor:'pointer'}} onClick={()=>addSet(bi)}>+ 세트 추가</button>
                </div>
              ))}
              <button className="btn btn-outline" style={{width:'100%',marginBottom:10}} onClick={()=>setExModal(true)}>+ 종목 추가</button>
              <button className="btn btn-g" style={{width:'100%',padding:12,fontSize:14}} onClick={saveLog}>일지 저장</button>
            </div>
          </div>
        </div>
      )}
      {exModal&&(
        <div className="modal-backdrop" onClick={e=>e.target===e.currentTarget&&setExModal(false)}>
          <div className="modal">
            <div className="modal-title">운동 종목 선택</div>
            {Object.entries(EX_CATEGORIES).map(([cat,exs])=>(
              <div key={cat} style={{marginBottom:12}}>
                <div style={{fontSize:12,fontWeight:500,color:'var(--text3)',marginBottom:6}}>{cat}</div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                  {exs.map(e=><button key={e} style={{padding:'6px 14px',border:'0.5px solid var(--border)',borderRadius:20,fontSize:13,background:'var(--surface1)',cursor:'pointer'}} onClick={()=>addEx(e)}>{e}</button>)}
                </div>
              </div>
            ))}
            <button className="btn btn-outline" style={{width:'100%',marginTop:8}} onClick={()=>setExModal(false)}>닫기</button>
          </div>
        </div>
      )}
      {kkModal&&(
        <div className="modal-backdrop" onClick={e=>e.target===e.currentTarget&&setKkModal(null)}>
          <div className="modal">
            <div className="modal-title">💬 카카오톡 발송</div>
            <div style={{fontSize:13,color:'var(--text3)',marginBottom:10}}>{kkModal.name}님에게 발송</div>
            <div style={{background:'#FEE500',borderRadius:12,padding:14,fontSize:13,color:'#3C1E1E',lineHeight:1.8,whiteSpace:'pre-wrap',marginBottom:12}}>{kkModal.msg}</div>
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
