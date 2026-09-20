import { useSyncedState } from '../useSyncedState.js'
import { EXERCISES_INIT } from '../data.js'

// 카카오톡 등으로 공유된 운동 종목 링크로 들어왔을 때, 로그인 없이 그 운동의
// 설명·사진·영상을 볼 수 있는 공개 화면입니다. 운동 정보는 민감한 데이터가
// 아니라 회원 화면과 달리 별도 토큰 없이 종목 id로 바로 찾습니다.
export default function ExerciseInfoView({ id }) {
  const [exercises] = useSyncedState('nowgym-exercises', EXERCISES_INIT)
  const ex = exercises.find(e => e.id === id)

  if (!ex) {
    return (
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:20,textAlign:'center',background:'var(--bg)'}}>
        <div>
          <div style={{fontSize:40,marginBottom:10}}>🏋️</div>
          <div style={{fontSize:15,color:'var(--text3)',lineHeight:1.6}}>운동 종목 정보를 찾을 수 없어요.</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)'}}>
      <div style={{maxWidth:480,margin:'0 auto',padding:'24px 16px 60px'}}>
        <div style={{fontSize:11,color:'var(--text3)',textAlign:'center',marginBottom:16}}>🏋️ 나우짐 · {ex.category}</div>
        <div className="card">
          <div className="card-title">{ex.name}</div>
          {ex.imageUrl && <img src={ex.imageUrl} alt={ex.name} style={{width:'100%',borderRadius:'var(--radius)',marginBottom:10,display:'block'}}/>}
          {ex.desc
            ? <p style={{fontSize:13,color:'var(--text2)',lineHeight:1.7,marginBottom:14,whiteSpace:'pre-wrap'}}>{ex.desc}</p>
            : <p style={{fontSize:13,color:'var(--text3)',marginBottom:14}}>등록된 설명이 없어요.</p>}
          {ex.videoUrl && <a href={ex.videoUrl} target="_blank" rel="noreferrer" className="btn btn-g" style={{width:'100%',display:'block',textAlign:'center',textDecoration:'none',boxSizing:'border-box'}}>▶ 운동 영상 보기</a>}
        </div>
      </div>
    </div>
  )
}
