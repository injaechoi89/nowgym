import { useState } from 'react'
import { useSyncedState } from '../useSyncedState.js'
import { PT_MEMBERS_INIT, EXERCISES_INIT, WORKOUT_LOGS_STORE_KEY, WORKOUT_LOGS_INIT, WD, fmtDate } from '../data.js'

const exVolume = ex => ex.sets.reduce((a,s)=>a+(parseFloat(s.w)||0)*(parseFloat(s.r)||0),0)

// 회원이 로그인 없이, 본인 전용 링크(토큰)로 자기 PT 운동일지 전체를 볼 수 있는 공개 화면입니다.
export default function MemberDiaryView({ token }) {
  const [members] = useSyncedState('nowgym-pt-members', PT_MEMBERS_INIT)
  const [exercises] = useSyncedState('nowgym-exercises', EXERCISES_INIT)
  const [logs] = useSyncedState(WORKOUT_LOGS_STORE_KEY, WORKOUT_LOGS_INIT)
  const [exInfo, setExInfo] = useState(null)
  const member = members.find(m => m.token === token)

  if (!member) {
    return (
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:20,textAlign:'center',background:'var(--bg)'}}>
        <div>
          <div style={{fontSize:40,marginBottom:10}}>🔒</div>
          <div style={{fontSize:15,color:'var(--text3)',lineHeight:1.6}}>링크가 올바르지 않거나 만료되었어요.<br/>담당 트레이너에게 문의해주세요.</div>
        </div>
      </div>
    )
  }

  const myLogs = (logs[member.trainer]||[])
    .map(l => l.date instanceof Date ? l : {...l, date:new Date(l.date)})
    .filter(l => l.memberName===member.name)
    .sort((a,b) => b.date-a.date)

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)'}}>
      <div style={{maxWidth:640,margin:'0 auto',padding:'24px 16px 60px'}}>
        <div style={{textAlign:'center',marginBottom:20}}>
          <div style={{fontSize:20,fontWeight:600}}>🏋️ {member.name}님의 운동일지</div>
          <div style={{fontSize:13,color:'var(--text3)',marginTop:4}}>{member.trainer} 트레이너 · {member.product.name}</div>
        </div>
        {myLogs.length===0 && <div style={{textAlign:'center',padding:'3rem 1rem',color:'var(--text3)'}}>아직 기록된 운동일지가 없어요.</div>}
        {myLogs.map(l => (
          <div key={l.id} className="card" style={{marginBottom:12}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8,flexWrap:'wrap',gap:6}}>
              <span style={{fontSize:14,fontWeight:600}}>{fmtDate(l.date)} ({WD[l.date.getDay()]})</span>
              <span className="badge badge-g">{l.cnt}번째 · {l.int}</span>
            </div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:10}}>
              {l.parts.map(p => <span key={p} style={{fontSize:11,padding:'2px 8px',borderRadius:10,background:'var(--surface1)',color:'var(--text3)'}}>{p}</span>)}
            </div>
            {l.exs.map((e,i) => {
              const info = exercises.find(ex => ex.name===e.name)
              const hasInfo = info && (info.desc||info.videoUrl||info.imageUrl)
              return (
                <div key={i} style={{marginBottom:8,paddingBottom:8,borderBottom:i<l.exs.length-1?'0.5px solid var(--border)':'none'}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:13,fontWeight:500}}>
                    <span>{e.name}{hasInfo&&<button style={{background:'transparent',border:'none',color:'var(--text3)',cursor:'pointer',fontSize:13,padding:'0 0 0 4px'}} onClick={()=>setExInfo(info)}>ⓘ</button>}</span>
                    <span style={{color:'var(--text3)',fontSize:11}}>VOL {Math.round(exVolume(e)).toLocaleString()}kg</span>
                  </div>
                  <div style={{fontSize:12,color:'var(--text2)',marginTop:2}}>
                    {e.sets.map((s,si) => `${si+1}세트 ${s.w>0?s.w+'kg ':''}${s.r}${s.u||'회'}`).join(', ')}
                  </div>
                </div>
              )
            })}
            {l.memo && <div style={{fontSize:12,color:'var(--text2)',marginTop:6}}>📝 {l.memo}</div>}
          </div>
        ))}
      </div>
      {exInfo && (
        <div className="modal-backdrop" onClick={e=>e.target===e.currentTarget&&setExInfo(null)}>
          <div className="modal">
            <div className="modal-title">{exInfo.name}</div>
            {exInfo.imageUrl && <img src={exInfo.imageUrl} alt={exInfo.name} style={{width:'100%',borderRadius:'var(--radius)',marginBottom:10,display:'block'}}/>}
            {exInfo.desc && <p style={{fontSize:13,color:'var(--text2)',lineHeight:1.6,marginBottom:10,whiteSpace:'pre-wrap'}}>{exInfo.desc}</p>}
            {exInfo.videoUrl && <a href={exInfo.videoUrl} target="_blank" rel="noreferrer" className="btn btn-outline" style={{width:'100%',display:'block',textAlign:'center',marginBottom:10,textDecoration:'none',boxSizing:'border-box'}}>▶ 운동 영상 보기</a>}
            <button className="btn btn-g" style={{width:'100%'}} onClick={()=>setExInfo(null)}>닫기</button>
          </div>
        </div>
      )}
    </div>
  )
}
