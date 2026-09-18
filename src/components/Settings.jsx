import { useEffect, useState } from 'react'
import { IDENTITIES, setPin } from '../auth.js'
import { getHolBonusSettings, setHolBonusSettings, subscribeHolBonusSettings } from '../holSettings.js'
import { getPtHoursSettings, setPtHoursSettings, subscribePtHoursSettings } from '../ptHoursSettings.js'
import { useSyncedState } from '../useSyncedState.js'
import { EXERCISES_INIT } from '../data.js'
import { readFileAsDataUrl, processImage } from '../photoUtils.js'

const emptyExForm = () => ({id:null,category:'',name:'',desc:'',imageUrl:'',videoUrl:''})

export default function Settings({ role, myTrainer }) {
  const isOwner = role === '원장님'
  const creatorId = isOwner ? '원장님' : myTrainer
  const [inputs, setInputs] = useState(Object.fromEntries(IDENTITIES.map(id => [id, ''])))
  const [savedMsg, setSavedMsg] = useState('')
  const [holSettings, setHolSettingsState] = useState(getHolBonusSettings())
  const [holSavedMsg, setHolSavedMsg] = useState('')
  const [ptHours, setPtHoursState] = useState(getPtHoursSettings())
  const [ptHoursSavedMsg, setPtHoursSavedMsg] = useState('')
  const [exercises, setExercises] = useSyncedState('nowgym-exercises', EXERCISES_INIT)
  const [exForm, setExForm] = useState(null)
  const [exUploading, setExUploading] = useState(false)

  useEffect(() => subscribeHolBonusSettings(setHolSettingsState), [])
  useEffect(() => subscribePtHoursSettings(setPtHoursState), [])

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

  const exByCat = {}
  exercises.forEach(e => { (exByCat[e.category] = exByCat[e.category] || []).push(e) })

  const openNewEx = () => setExForm(emptyExForm())
  const openEditEx = (ex) => setExForm({...ex})
  const onExImageChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setExUploading(true)
    try {
      const raw = await readFileAsDataUrl(file)
      const compressed = await processImage(raw, { maxWidth: 700, quality: 0.6 })
      setExForm(f => ({...f, imageUrl: compressed}))
    } finally {
      setExUploading(false)
    }
  }
  const canEditEx = ex => isOwner || ex.createdBy === creatorId
  const saveEx = () => {
    if (!exForm.category.trim() || !exForm.name.trim()) { alert('운동 부위와 운동명을 입력해주세요'); return }
    const nex = {...exForm, category: exForm.category.trim(), name: exForm.name.trim(), id: exForm.id || 'ex'+Date.now(), createdBy: exForm.id ? exForm.createdBy : creatorId}
    setExercises(list => exForm.id ? list.map(x => x.id === exForm.id ? nex : x) : [...list, nex])
    setExForm(null)
  }
  const deleteEx = (id) => {
    if (!window.confirm('이 운동 종목을 삭제할까요?')) return
    setExercises(list => list.filter(x => x.id !== id))
  }

  return (
    <div>
      <div className="card" style={{marginBottom:14}}>
        <div className="card-title">운동 종목 관리</div>
        <p style={{fontSize:13,color:'var(--text3)',marginBottom:14}}>
          PT 운동일지에서 선택할 수 있는 운동 종목입니다. 운동명·설명·사진·영상 링크를 등록/수정할 수 있어요.
        </p>
        {Object.entries(exByCat).map(([cat, exs]) => (
          <div key={cat} style={{marginBottom:10}}>
            <div style={{fontSize:12,fontWeight:500,color:'var(--text3)',marginBottom:6}}>{cat}</div>
            {exs.map(ex => (
              <div key={ex.id} className="rrow" style={{gap:8}}>
                {ex.imageUrl && <img src={ex.imageUrl} alt="" style={{width:28,height:28,borderRadius:6,objectFit:'cover'}}/>}
                <span style={{flex:1,fontSize:13}}>{ex.name}</span>
                {ex.createdBy && <span style={{fontSize:11,color:'var(--text3)'}}>{ex.createdBy==='원장님'?'원장님':`${ex.createdBy} 선생님`} 등록</span>}
                {canEditEx(ex) ? (
                  <>
                    <button className="btn btn-outline" style={{padding:'5px 10px',fontSize:12}} onClick={()=>openEditEx(ex)}>수정</button>
                    <button className="btn btn-danger" style={{padding:'5px 10px',fontSize:12}} onClick={()=>deleteEx(ex.id)}>삭제</button>
                  </>
                ) : null}
              </div>
            ))}
          </div>
        ))}
        <button className="btn btn-g" style={{marginTop:6}} onClick={openNewEx}>+ 종목 추가</button>
        {exForm && (
          <div className="modal-backdrop" onClick={e=>e.target===e.currentTarget&&setExForm(null)}>
            <div className="modal">
              <div className="modal-title">{exForm.id ? '운동 종목 수정' : '운동 종목 추가'}</div>
              <div style={{marginBottom:10}}>
                <label style={{fontSize:12,color:'var(--text3)',display:'block',marginBottom:4}}>운동 부위</label>
                <input type="text" list="ex-cat-list" value={exForm.category} onChange={e=>setExForm(f=>({...f,category:e.target.value}))} placeholder="예: 가슴, 하체, 코어" style={{width:'100%'}}/>
                <datalist id="ex-cat-list">{Object.keys(exByCat).map(c=><option key={c} value={c}/>)}</datalist>
              </div>
              <div style={{marginBottom:10}}>
                <label style={{fontSize:12,color:'var(--text3)',display:'block',marginBottom:4}}>운동명</label>
                <input type="text" value={exForm.name} onChange={e=>setExForm(f=>({...f,name:e.target.value}))} placeholder="예: 벤치프레스" style={{width:'100%'}}/>
              </div>
              <div style={{marginBottom:10}}>
                <label style={{fontSize:12,color:'var(--text3)',display:'block',marginBottom:4}}>운동 설명</label>
                <textarea value={exForm.desc} onChange={e=>setExForm(f=>({...f,desc:e.target.value}))} rows={3} placeholder="자세, 주의사항 등" style={{width:'100%'}}/>
              </div>
              <div style={{marginBottom:10}}>
                <label style={{fontSize:12,color:'var(--text3)',display:'block',marginBottom:4}}>운동 이미지</label>
                {exForm.imageUrl && <img src={exForm.imageUrl} alt="" style={{width:'100%',maxHeight:160,objectFit:'cover',borderRadius:'var(--radius)',marginBottom:6}}/>}
                <input type="file" accept="image/*" onChange={onExImageChange}/>
                {exUploading && <span style={{fontSize:12,color:'var(--text3)'}}> 업로드 중…</span>}
              </div>
              <div style={{marginBottom:14}}>
                <label style={{fontSize:12,color:'var(--text3)',display:'block',marginBottom:4}}>운동 영상 링크</label>
                <input type="text" value={exForm.videoUrl} onChange={e=>setExForm(f=>({...f,videoUrl:e.target.value}))} placeholder="유튜브 등 영상 URL" style={{width:'100%'}}/>
              </div>
              <div className="modal-btns">
                <button className="btn btn-outline" onClick={()=>setExForm(null)}>취소</button>
                <button className="btn btn-g" onClick={saveEx}>저장</button>
              </div>
            </div>
          </div>
        )}
      </div>
      {isOwner ? (
        <>
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
        </>
      ) : (
        <div className="card" style={{textAlign:'center',padding:'2rem 1rem',color:'var(--text3)'}}>
          🔒 나머지 설정은 원장님만 볼 수 있어요.
        </div>
      )}
    </div>
  )
}
