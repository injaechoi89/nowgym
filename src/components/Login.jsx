import { useState } from 'react'
import { IDENTITIES, verifyPin } from '../auth.js'

export default function Login({ onLogin }) {
  const [selected, setSelected] = useState(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  const submit = async () => {
    if (!pin.trim()) return
    setChecking(true)
    const ok = await verifyPin(selected, pin.trim())
    setChecking(false)
    if (ok) {
      onLogin(selected)
    } else {
      setError('PIN이 일치하지 않습니다.')
      setPin('')
    }
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)'}}>
      <div className="card" style={{width:340}}>
        <div style={{textAlign:'center',marginBottom:20}}>
          <div style={{fontSize:22,fontWeight:700,color:'var(--green)',marginBottom:4}}>🏋️ 나우짐</div>
          <div style={{fontSize:12,color:'var(--text3)'}}>관리 시스템에 로그인하세요</div>
        </div>
        {!selected ? (
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {IDENTITIES.map(id => (
              <button key={id} className="btn btn-outline" style={{padding:'12px',fontSize:14}} onClick={()=>{setSelected(id);setError('');setPin('')}}>
                {id==='원장님' ? '👑 원장님' : `${id} 선생님`}
              </button>
            ))}
          </div>
        ) : (
          <div>
            <div style={{fontSize:14,fontWeight:500,textAlign:'center',marginBottom:12}}>{selected==='원장님'?'👑 원장님':`${selected} 선생님`}</div>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              autoFocus
              value={pin}
              onChange={e=>setPin(e.target.value.replace(/\D/g,''))}
              onKeyDown={e=>{if(e.key==='Enter') submit()}}
              placeholder="PIN 4자리"
              style={{width:'100%',textAlign:'center',fontSize:20,letterSpacing:8,padding:'10px',marginBottom:10}}
            />
            {error && <div style={{color:'var(--red)',fontSize:12,textAlign:'center',marginBottom:10}}>{error}</div>}
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-outline" style={{flex:1}} onClick={()=>{setSelected(null);setError('');setPin('')}}>뒤로</button>
              <button className="btn btn-g" style={{flex:2}} disabled={checking||pin.length<4} onClick={submit}>{checking?'확인 중...':'로그인'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
