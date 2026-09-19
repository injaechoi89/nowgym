import { useEffect, useState } from 'react'
import { IDENTITIES, setPin } from '../auth.js'
import { getHolBonusSettings, setHolBonusSettings, subscribeHolBonusSettings } from '../holSettings.js'
import { getPtHoursSettings, setPtHoursSettings, subscribePtHoursSettings } from '../ptHoursSettings.js'
import { useSyncedState } from '../useSyncedState.js'
import { EXERCISES_INIT, PRODUCTS_INIT } from '../data.js'
import { readFileAsDataUrl, processImage } from '../photoUtils.js'

const emptyExForm = () => ({id:null,category:'',name:'',desc:'',imageUrl:'',videoUrl:''})
const emptyProdForm = () => ({id:null,type:'full',name:'',count:'',weeks:'',price:''})

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
  const [products, setProducts] = useSyncedState('nowgym-pt-products', PRODUCTS_INIT)
  const [prodForm, setProdForm] = useState(null)

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

  const openNewProd = () => setProdForm(emptyProdForm())
  const openEditProd = (p) => setProdForm({...p})
  const saveProd = () => {
    const name = prodForm.name.trim()
    const count = parseInt(prodForm.count)
    const weeks = parseInt(prodForm.weeks)
    const price = parseInt(prodForm.price)
    if (!name || !count || !weeks || !price) { alert('상품명·횟수·기간·가격을 모두 입력해주세요'); return }
    const np = {id: prodForm.id || 'p'+Date.now(), type: prodForm.type, name, count, weeks, price}
    setProducts(list => prodForm.id ? list.map(x => x.id === prodForm.id ? np : x) : [...list, np])
    setProdForm(null)
  }
  const deleteProd = (id) => {
    if (products.length <= 1) { alert('최소 1개의 PT 상품은 남아있어야 해요.'); return }
    if (!window.confirm('이 PT 상품을 삭제할까요?')) return
    setProducts(list => list.filter(x => x.id !== id))
  }

  const [tab, setTab] = useState('exercises')

  return (
    <div>
      <div style={{display:'flex',gap:8,marginBottom:14}}>
        <button className={`btn ${tab==='exercises'?'btn-g':'btn-outline'}`} onClick={()=>setTab('exercises')}>운동 종목 관리</button>
        <button className={`btn ${tab==='general'?'btn-g':'btn-outline'}`} onClick={()=>setTab('general')}>일반 설정</button>
      </div>
      {tab==='exercises' && (
      <div className="card" style={{marginBottom:14}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:10}}>
          <div className="card-title" style={{marginBottom:0}}>운동 종목 관리</div>
          <button className="btn btn-g" style={{padding:'6px 14px',fontSize:12,flexShrink:0}} onClick={openNewEx}>+ 종목 추가</button>
        </div>
        <p style={{fontSize:13,color:'var(--text3)',margin:'6px 0 14px'}}>
          PT 운동일지에서 선택할 수 있는 운동 종목입니다. 운동명·설명·사진·영상 링크를 등록/수정할 수 있어요.
        </p>
        {Object.entries(exByCat).map(([cat, exs]) => (
          <div key={cat} style={{border:'0.5px solid var(--border)',borderRadius:'var(--radius)',marginBottom:10,overflow:'hidden'}}>
            <div style={{fontSize:12,fontWeight:600,color:'var(--green-dark)',background:'var(--green-light)',padding:'6px 12px'}}>{cat} <span style={{fontWeight:400,color:'var(--text3)'}}>· {exs.length}개</span></div>
            <div style={{padding:'0 12px'}}>
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
          </div>
        ))}
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
      )}
      {tab==='general' && (isOwner ? (
        <>
          <div className="card" style={{marginBottom:14}}>
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:10}}>
              <div className="card-title" style={{marginBottom:0}}>PT 상품 관리</div>
              <button className="btn btn-g" style={{padding:'6px 14px',fontSize:12,flexShrink:0}} onClick={openNewProd}>+ 상품 추가</button>
            </div>
            <p style={{fontSize:13,color:'var(--text3)',margin:'6px 0 14px'}}>
              PT 가입/재등록 시 선택할 수 있는 상품입니다. 종류·횟수·기간·가격을 등록/수정할 수 있어요.
            </p>
            {products.map(p => (
              <div key={p.id} className="rrow" style={{gap:8}}>
                <span style={{fontSize:10,padding:'2px 7px',borderRadius:8,background:p.type==='half'?'#FBEAF0':'#E6F1FB',color:p.type==='half'?'#712B13':'#042C53',flexShrink:0}}>{p.type==='half'?'하프 30분':'일반 50분'}</span>
                <span style={{flex:1,fontSize:13}}>{p.name}</span>
                <span style={{fontSize:12,color:'var(--text3)'}}>{p.count}회 · {p.weeks}주 · {p.price.toLocaleString()}원</span>
                <button className="btn btn-outline" style={{padding:'5px 10px',fontSize:12}} onClick={()=>openEditProd(p)}>수정</button>
                <button className="btn btn-danger" style={{padding:'5px 10px',fontSize:12}} onClick={()=>deleteProd(p.id)}>삭제</button>
              </div>
            ))}
            {prodForm && (
              <div className="modal-backdrop" onClick={e=>e.target===e.currentTarget&&setProdForm(null)}>
                <div className="modal">
                  <div className="modal-title">{prodForm.id ? 'PT 상품 수정' : 'PT 상품 추가'}</div>
                  <div style={{marginBottom:10}}>
                    <label style={{fontSize:12,color:'var(--text3)',display:'block',marginBottom:4}}>PT 종류</label>
                    <div style={{display:'flex',gap:8}}>
                      <button style={{flex:1,padding:'8px 4px',border:'1.5px solid '+(prodForm.type==='half'?'#D4537E':'var(--border)'),borderRadius:'var(--radius)',background:prodForm.type==='half'?'#FBEAF0':'transparent',color:prodForm.type==='half'?'#712B13':'var(--text2)',fontSize:12,fontWeight:500,cursor:'pointer'}} onClick={()=>setProdForm(f=>({...f,type:'half'}))}>하프PT (30분)</button>
                      <button style={{flex:1,padding:'8px 4px',border:'1.5px solid '+(prodForm.type==='full'?'#378ADD':'var(--border)'),borderRadius:'var(--radius)',background:prodForm.type==='full'?'#E6F1FB':'transparent',color:prodForm.type==='full'?'#042C53':'var(--text2)',fontSize:12,fontWeight:500,cursor:'pointer'}} onClick={()=>setProdForm(f=>({...f,type:'full'}))}>일반PT (50분)</button>
                    </div>
                  </div>
                  <div style={{marginBottom:10}}>
                    <label style={{fontSize:12,color:'var(--text3)',display:'block',marginBottom:4}}>상품명</label>
                    <input type="text" value={prodForm.name} onChange={e=>setProdForm(f=>({...f,name:e.target.value}))} placeholder="예: 일반PT 10회" style={{width:'100%'}}/>
                  </div>
                  <div style={{marginBottom:10}}>
                    <label style={{fontSize:12,color:'var(--text3)',display:'block',marginBottom:4}}>횟수</label>
                    <input type="number" value={prodForm.count} onChange={e=>setProdForm(f=>({...f,count:e.target.value}))} placeholder="예: 10" style={{width:'100%'}}/>
                  </div>
                  <div style={{marginBottom:10}}>
                    <label style={{fontSize:12,color:'var(--text3)',display:'block',marginBottom:4}}>과정 기간(주)</label>
                    <input type="number" value={prodForm.weeks} onChange={e=>setProdForm(f=>({...f,weeks:e.target.value}))} placeholder="예: 5" style={{width:'100%'}}/>
                  </div>
                  <div style={{marginBottom:14}}>
                    <label style={{fontSize:12,color:'var(--text3)',display:'block',marginBottom:4}}>가격(원)</label>
                    <input type="number" value={prodForm.price} onChange={e=>setProdForm(f=>({...f,price:e.target.value}))} placeholder="예: 600000" style={{width:'100%'}}/>
                  </div>
                  <div className="modal-btns">
                    <button className="btn btn-outline" onClick={()=>setProdForm(null)}>취소</button>
                    <button className="btn btn-g" onClick={saveProd}>저장</button>
                  </div>
                </div>
              </div>
            )}
          </div>
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
      ))}
    </div>
  )
}
