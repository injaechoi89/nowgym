import { useEffect, useState } from 'react'
import { IDENTITIES, setPin } from '../auth.js'
import { getHolBonusSettings, setHolBonusSettings, subscribeHolBonusSettings } from '../holSettings.js'
import { getPtHoursSettings, setPtHoursSettings, subscribePtHoursSettings } from '../ptHoursSettings.js'

export default function Settings({ role }) {
  const [inputs, setInputs] = useState(Object.fromEntries(IDENTITIES.map(id => [id, ''])))
  const [savedMsg, setSavedMsg] = useState('')
  const [holSettings, setHolSettingsState] = useState(getHolBonusSettings())
  const [holSavedMsg, setHolSavedMsg] = useState('')
  const [ptHours, setPtHoursState] = useState(getPtHoursSettings())
  const [ptHoursSavedMsg, setPtHoursSavedMsg] = useState('')

  useEffect(() => subscribeHolBonusSettings(setHolSettingsState), [])
  useEffect(() => subscribePtHoursSettings(setPtHoursState), [])

  if (role !== '원장님') {
    return (
      <div className="card" style={{textAlign:'center',padding:'3rem 1rem',color:'var(--text3)'}}>
        🔒 설정은 원장님만 볼 수 있어요.
      </div>
    )
  }

  const save = async (id) => {
    const val = (inputs[id]||'').trim()
    if (!/^\d{4}$/.test(val)) { alert('PIN은 숫자 4자리로 입력해주세요'); return }
    await setPin(id, val)
    setInputs(f => ({...f, [id]:''}))
    setSavedMsg(`${id} PIN이 변경되었습니다.`)
    setTimeout(()=>setSavedMsg(''), 2500)
  }

  const saveHolSettings = () => {
    setHolBonusSettings(holSettings)
    setHolSavedMsg('추가금 설정이 저장되었습니다.')
    setTimeout(()=>setHolSavedMsg(''), 2500)
  }

  const savePtHours = () => {
    if (ptHours.start >= ptHours.end) { alert('시작 시간이 끝 시간보다 빨라야 해요.'); return }
    setPtHoursSettings(ptHours)
    setPtHoursSavedMsg('PT 운영시간이 저장되었습니다. 페이지를 새로고침하면 적용돼요.')
    setTimeout(()=>setPtHoursSavedMsg(''), 3500)
  }

  return (
    <div>
      <div className="card" style={{marginBottom:14}}>
        <div className="card-title">PT 시간표 운영시간</div>
        <p style={{fontSize:13,color:'var(--text3)',marginBottom:14}}>
          PT 시간표에 표시되는 하루 시작/끝 시간입니다. 30분 단위로 칸이 생성됩니다.
        </p>
        {ptHoursSavedMsg && <div style={{fontSize:13,color:'var(--green)',marginBottom:10}}>{ptHoursSavedMsg}</div>}
        <div className="rrow" style={{gap:10}}>
          <span className="rl" style={{minWidth:80}}>시작 시간</span>
          <input type="time" value={ptHours.start} onChange={e=>setPtHoursState(s=>({...s, start: e.target.value}))} style={{flex:1}} />
        </div>
        <div className="rrow" style={{gap:10}}>
          <span className="rl" style={{minWidth:80}}>끝 시간</span>
          <input type="time" value={ptHours.end} onChange={e=>setPtHoursState(s=>({...s, end: e.target.value}))} style={{flex:1}} />
        </div>
        <button className="btn btn-g" style={{marginTop:10}} onClick={savePtHours}>운영시간 저장</button>
      </div>
      <div className="card" style={{marginBottom:14}}>
        <div className="card-title">근무 추가금 설정</div>
        <p style={{fontSize:13,color:'var(--text3)',marginBottom:14}}>
          스케줄 &gt; 휴일근무에서 등록하는 근무 유형별 추가금입니다. 정상근무는 항상 추가금이 없습니다.
        </p>
        {holSavedMsg && <div style={{fontSize:13,color:'var(--green)',marginBottom:10}}>{holSavedMsg}</div>}
        <div className="rrow" style={{gap:10}}>
          <span className="rl" style={{minWidth:80}}>정상근무</span>
          <input type="text" value="0 (고정)" disabled style={{flex:1,textAlign:'right',color:'var(--text3)'}} />
          <span style={{fontSize:13,color:'var(--text3)'}}>원</span>
        </div>
        <div className="rrow" style={{gap:10}}>
          <span className="rl" style={{minWidth:80}}>추가근무</span>
          <input type="number" value={holSettings.extra} onChange={e=>setHolSettingsState(s=>({...s, extra: Number(e.target.value)||0}))} style={{flex:1,textAlign:'right'}} />
          <span style={{fontSize:13,color:'var(--text3)'}}>원</span>
        </div>
        <button className="btn btn-g" style={{marginTop:10}} onClick={saveHolSettings}>추가금 저장</button>
      </div>
      <div className="card">
        <div className="card-title">로그인 PIN 관리</div>
        <p style={{fontSize:13,color:'var(--text3)',marginBottom:14}}>
          각 트레이너/원장님 로그인용 PIN(4자리 숫자)을 바꿀 수 있습니다. 트레이너에게는 개별적으로 새 PIN을 안내해주세요.
        </p>
        {savedMsg && <div style={{fontSize:13,color:'var(--green)',marginBottom:10}}>{savedMsg}</div>}
        {IDENTITIES.map(id => (
          <div key={id} className="rrow" style={{gap:10}}>
            <span className="rl" style={{minWidth:80}}>{id==='원장님'?'👑 원장님':`${id} 선생님`}</span>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="새 PIN 4자리"
              value={inputs[id]}
              onChange={e=>setInputs(f=>({...f, [id]: e.target.value.replace(/\D/g,'')}))}
              style={{flex:1,textAlign:'center',letterSpacing:6}}
            />
            <button className="btn btn-g" style={{padding:'6px 14px',fontSize:12}} onClick={()=>save(id)}>변경</button>
          </div>
        ))}
      </div>
    </div>
  )
}
