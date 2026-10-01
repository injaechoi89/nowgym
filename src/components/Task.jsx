import {useState, useRef, useEffect} from 'react'
import {TODAY, ML, TRAINERS} from '../data.js'
import {readFileAsDataUrl, processImage, getCertPhotos, saveCertPhoto, deleteCertPhoto, subscribeCertPhotos} from '../photoUtils.js'

export const DOT_COLOR = {clean:'#1D9E75',insta:'#D4537E',blog:'#378ADD',review:'#BA7517'}
export const TYPE_LABEL = {clean:'청소',insta:'인스타',blog:'블로그',review:'리뷰'}
const TYPE_UNIT = {clean:'일',insta:'회',blog:'회',review:'개'}
export const TYPES = ['clean','insta','blog','review']
// 청소 월 20회, 인스타/블로그 주 1회(≈월 4회), 리뷰 월 2회 목표
export const MONTHLY_TARGET = {clean:20,insta:4,blog:4,review:2}

export function toKey(y,m,d){return `${y}-${m+1}-${d}`}

// 청소는 사진을 최대 2장(배열)까지 저장하고, 나머지 항목은 사진 1장(문자열)만 저장합니다.
export const CLEAN_MAX = 2
export function hasPhoto(day, t) {
  return t==='clean' ? Array.isArray(day[t]) && day[t].some(Boolean) : !!day[t]
}

function IconInsta({size=26}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <defs>
        <linearGradient id="igGrad" x1="0" y1="24" x2="24" y2="0">
          <stop offset="0%" stopColor="#FFDD55"/>
          <stop offset="30%" stopColor="#FF543E"/>
          <stop offset="60%" stopColor="#C837AB"/>
          <stop offset="100%" stopColor="#3051F3"/>
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="22" height="22" rx="6" fill="url(#igGrad)"/>
      <rect x="6.5" y="6.5" width="11" height="11" rx="3.5" stroke="#fff" strokeWidth="1.6" fill="none"/>
      <circle cx="12" cy="12" r="3.3" stroke="#fff" strokeWidth="1.6" fill="none"/>
      <circle cx="17.2" cy="6.8" r="1.1" fill="#fff"/>
    </svg>
  )
}

function IconNaver({size=26}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <rect width="24" height="24" rx="5" fill="#03C75A"/>
      <path d="M14.7 13.4L9.4 6H6v12h3.3v-7.4L14.6 18H18V6h-3.3z" fill="#fff"/>
    </svg>
  )
}

function IconNaverBlog({size=26}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <rect width="24" height="24" rx="5" fill="#03C75A"/>
      <text x="12" y="15.5" textAnchor="middle" fontSize="8.5" fontWeight="700" fontFamily="Arial, sans-serif" fill="#fff">blog</text>
    </svg>
  )
}

const TYPE_ICON = {insta:IconInsta, blog:IconNaverBlog, review:IconNaver}

function MonthRing({pct}) {
  const r = 13, circ = 2 * Math.PI * r
  const dash = (pct/100*circ).toFixed(1)
  return (
    <svg width={30} height={30} viewBox="0 0 30 30">
      <circle cx={15} cy={15} r={r} fill="none" stroke="var(--border-strong)" strokeWidth={3}></circle>
      <circle cx={15} cy={15} r={r} fill="none" stroke="var(--green)" strokeWidth={3} strokeLinecap="round"
        strokeDasharray={`${dash} ${circ.toFixed(1)}`} transform="rotate(-90 15 15)"></circle>
      <text x={15} y={18} textAnchor="middle" fontSize={8} fontWeight={700} fill="var(--text)">{pct}%</text>
    </svg>
  )
}

export default function Task({role, myTrainer, taskJump, onTaskJumpHandled}) {
  const isOwner = role==='원장님'
  const [trainer, setTrainer] = useState('정우')
  const effectiveTrainer = isOwner ? trainer : myTrainer
  const [photos, setPhotos] = useState(getCertPhotos())
  useEffect(() => subscribeCertPhotos(setPhotos), [])
  const [year, setYear] = useState(TODAY.getFullYear())
  const [month, setMonth] = useState(TODAY.getMonth())
  const [tab, setTab] = useState('month')
  const [modal, setModal] = useState(null)
  const [busyType, setBusyType] = useState(null)
  const [preview, setPreview] = useState(null)
  const fileInputs = useRef({})

  const data = photos[effectiveTrainer]||{}
  const fd = new Date(year,month,1).getDay()
  const dim = new Date(year,month+1,0).getDate()
  const allKeys = Object.keys(data).filter(k=>{const p=k.split('-');return +p[1]===month+1&&+p[0]===year})
  const countOf = t => allKeys.filter(k=>hasPhoto(data[k]||{},t)).length
  const cleanDone = countOf('clean'), instaDone = countOf('insta'), blogDone = countOf('blog'), reviewDone = countOf('review')

  const changeMonth = d => {
    let m=month+d, y=year
    if(m>11){m=0;y++} if(m<0){m=11;y--}
    setMonth(m); setYear(y)
  }

  const changeYear = d => setYear(y=>y+d)

  const goToMonth = m => { setMonth(m); setTab('month') }

  const yearMonths = Array.from({length:12}, (_,m) => {
    const isFuture = year>TODAY.getFullYear() || (year===TODAY.getFullYear() && m>TODAY.getMonth())
    const isCurrent = year===TODAY.getFullYear() && m===TODAY.getMonth()
    const keys = Object.keys(data).filter(k=>{const p=k.split('-');return +p[1]===m+1 && +p[0]===year})
    const counts = Object.fromEntries(TYPES.map(t=>[t, keys.filter(k=>hasPhoto(data[k]||{},t)).length]))
    const totalTarget = TYPES.reduce((s,t)=>s+MONTHLY_TARGET[t],0)
    const totalDone = TYPES.reduce((s,t)=>s+counts[t],0)
    return {m, isFuture, isCurrent, counts, pct: Math.min(100, Math.round(totalDone/totalTarget*100))}
  })

  const includedMonths = year<TODAY.getFullYear() ? 12 : year===TODAY.getFullYear() ? TODAY.getMonth()+1 : 0
  const yearSummary = TYPES.map(t => {
    const done = yearMonths.slice(0, includedMonths).reduce((s,mm)=>s+mm.counts[t],0)
    const target = MONTHLY_TARGET[t]*includedMonths
    return {t, done, target, pct: target ? Math.round(done/target*100) : 0}
  })

  const isFutureDate = (y,m,d) => new Date(y,m,d) > new Date(TODAY.getFullYear(),TODAY.getMonth(),TODAY.getDate())

  const openDay = (y,m,d) => {
    if (isFutureDate(y,m,d)) return
    setModal({k: toKey(y,m,d), y, m, d})
  }

  useEffect(() => {
    if (!taskJump) return
    setYear(TODAY.getFullYear()); setMonth(TODAY.getMonth()); setTab('month')
    openDay(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate())
    onTaskJumpHandled && onTaskJumpHandled()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskJump])

  const pickFile = (key) => {
    const input = fileInputs.current[key]
    if (input) input.click()
  }

  const onFileChosen = async (type, e, slot=0) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !modal) return
    const busyKey = type==='clean' ? `clean_${slot}` : type
    setBusyType(busyKey)
    try {
      const raw = await readFileAsDataUrl(file)
      const processed = await processImage(raw, { timestamp: type==='clean' })
      const ok = saveCertPhoto(effectiveTrainer, modal.k, type, processed, slot)
      if (!ok) {
        alert('저장 공간이 부족해서 사진을 저장하지 못했어요. 오래된 인증 사진을 지우고 다시 시도해주세요.')
      }
    } catch {
      alert('사진을 처리하는 중 문제가 생겼어요. 다시 시도해주세요.')
    } finally {
      setBusyType(null)
    }
  }

  const removePhoto = (type, slot=0) => {
    if (!window.confirm(`${TYPE_LABEL[type]} 인증 사진을 삭제할까요?`)) return
    deleteCertPhoto(effectiveTrainer, modal.k, type, slot)
  }

  const todayKey = toKey(TODAY.getFullYear(),TODAY.getMonth(),TODAY.getDate())
  const todayPhotos = data[todayKey]||{}

  return (
    <div>
      <div style={{display:'flex',gap:8,marginBottom:16,alignItems:'center',flexWrap:'wrap'}}>
        {(isOwner?TRAINERS:TRAINERS.filter(t=>t.name===myTrainer)).map(t=>(
          <button key={t.name} className={`btn ${effectiveTrainer===t.name?'btn-g':'btn-outline'}`} onClick={()=>isOwner&&setTrainer(t.name)}>{t.name}</button>
        ))}
        <button className="btn btn-g" style={{marginLeft:'auto'}} onClick={()=>openDay(TODAY.getFullYear(),TODAY.getMonth(),TODAY.getDate())}>📷 오늘 인증하기</button>
      </div>

      <div className="card" style={{marginBottom:16}}>
        <div className="card-title">오늘 인증 현황 · {ML[TODAY.getMonth()]} {TODAY.getDate()}일</div>
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          {TYPES.map(t=>(
            <div key={t} style={{textAlign:'center'}}>
              {t==='clean' ? (
                <div style={{display:'flex',gap:4}}>
                  {Array.from({length:CLEAN_MAX}).map((_,i)=>{
                    const photo = todayPhotos.clean?.[i]
                    return photo ? (
                      <img key={i} src={photo} alt={`${TYPE_LABEL.clean} ${i+1}`} style={{width:56,height:56,objectFit:'cover',borderRadius:8,border:'2px solid '+DOT_COLOR.clean,cursor:'pointer'}} onClick={()=>setPreview(photo)}/>
                    ) : (
                      <div key={i} style={{width:56,height:56,borderRadius:8,border:'1.5px dashed var(--border-strong)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text3)',fontSize:10}}>미인증</div>
                    )
                  })}
                </div>
              ) : todayPhotos[t] ? (
                <img src={todayPhotos[t]} alt={TYPE_LABEL[t]} style={{width:56,height:56,objectFit:'cover',borderRadius:8,border:'2px solid '+DOT_COLOR[t],cursor:'pointer'}} onClick={()=>setPreview(todayPhotos[t])}/>
              ) : (
                <div style={{width:56,height:56,borderRadius:8,border:'1.5px dashed var(--border-strong)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text3)',fontSize:10}}>미인증</div>
              )}
              <div style={{fontSize:11,color:'var(--text3)',marginTop:4}}>{TYPE_LABEL[t]}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="metric-grid" style={{gridTemplateColumns:'repeat(4,1fr)',marginBottom:16}}>
        {TYPES.map(t=>{
          const done = {clean:cleanDone,insta:instaDone,blog:blogDone,review:reviewDone}[t]
          const target = MONTHLY_TARGET[t]
          const pct = Math.min(100, Math.round(done/target*100))
          return (
            <div key={t} className="metric">
              <div className="metric-label" style={{display:'flex',alignItems:'center',gap:5}}><span style={{width:9,height:9,borderRadius:'50%',background:DOT_COLOR[t],display:'inline-block'}}></span>{TYPE_LABEL[t]}</div>
              <div className="metric-val">{done}{TYPE_UNIT[t]} <span style={{fontSize:13,fontWeight:400,color:'var(--text3)'}}>/ {target}{TYPE_UNIT[t]}</span></div>
              <div className="bar-bg" style={{marginTop:6}}><div className="bar-fill" style={{width:pct+'%',background:DOT_COLOR[t]}}></div></div>
              <div className="metric-sub">{pct}% 달성</div>
            </div>
          )
        })}
      </div>

      <div style={{display:'flex',gap:6,marginBottom:10}}>
        <button className={`btn ${tab==='month'?'btn-g':'btn-outline'}`} style={{padding:'6px 14px',fontSize:12}} onClick={()=>setTab('month')}>월별 보기</button>
        <button className={`btn ${tab==='year'?'btn-g':'btn-outline'}`} style={{padding:'6px 14px',fontSize:12}} onClick={()=>setTab('year')}>연간 보기</button>
      </div>

      {tab==='month' ? (
      <div className="card">
        <div className="cal-nav">
          <button className="cal-nav-btn" onClick={()=>changeMonth(-1)}>◀</button>
          <span className="cal-nav-label">{year}년 {ML[month]}</span>
          <button className="cal-nav-btn" onClick={()=>changeMonth(1)}>▶</button>
        </div>
        <div style={{display:'flex',gap:10,marginBottom:10,flexWrap:'wrap'}}>
          {TYPES.map(t=>(
            <div key={t} style={{display:'flex',alignItems:'center',gap:4,fontSize:12,color:'var(--text3)'}}>
              <div style={{width:9,height:9,borderRadius:'50%',background:DOT_COLOR[t]}}></div>
              {TYPE_LABEL[t]}
            </div>
          ))}
          <div style={{fontSize:11,color:'var(--text3)',marginLeft:'auto'}}>오늘/지난 날짜 클릭 → 사진 인증</div>
        </div>
        <div className="cal-weekdays">{['일','월','화','수','목','금','토'].map((d,i)=><div key={i} className={`cal-wd${i===0?' s':i===6?' sa':''}`}>{d}</div>)}</div>
        <div className="cal-grid">
          {Array(fd).fill(0).map((_,i)=><div key={i} className="cc emp"></div>)}
          {Array(dim).fill(0).map((_,i)=>{
            const d=i+1, k=toKey(year,month,d)
            const day=data[k]||{}
            const types=TYPES.filter(t=>hasPhoto(day,t))
            const isToday=d===TODAY.getDate()&&month===TODAY.getMonth()&&year===TODAY.getFullYear()
            const isFuture=isFutureDate(year,month,d)
            const dw=new Date(year,month,d).getDay()
            return (
              <div key={i} className={`cc${isToday?' today':''}`}
                style={{opacity:isFuture?0.4:1,cursor:isFuture?'default':'pointer'}}
                onClick={()=>openDay(year,month,d)}>
                <div className={`cdn${dw===0?' s':dw===6?' sa':''}`}>{d}</div>
                {types.length>0&&<div className="dots-row">{types.map(t=><div key={t} className="cdot" style={{background:DOT_COLOR[t]}}></div>)}</div>}
              </div>
            )
          })}
        </div>
      </div>
      ) : (
      <div className="card">
        <div className="cal-nav">
          <button className="cal-nav-btn" onClick={()=>changeYear(-1)}>◀</button>
          <span className="cal-nav-label">{year}년</span>
          <button className="cal-nav-btn" onClick={()=>changeYear(1)}>▶</button>
        </div>
        <div className="metric-grid" style={{gridTemplateColumns:'repeat(4,1fr)',marginBottom:16}}>
          {yearSummary.map(({t,done,target,pct})=>(
            <div key={t} className="metric">
              <div className="metric-label" style={{display:'flex',alignItems:'center',gap:5}}><span style={{width:9,height:9,borderRadius:'50%',background:DOT_COLOR[t],display:'inline-block'}}></span>{TYPE_LABEL[t]}</div>
              <div className="metric-val">{done}{TYPE_UNIT[t]} <span style={{fontSize:13,fontWeight:400,color:'var(--text3)'}}>/ {target}{TYPE_UNIT[t]}</span></div>
              <div className="bar-bg" style={{marginTop:6}}><div className="bar-fill" style={{width:pct+'%',background:DOT_COLOR[t]}}></div></div>
              <div className="metric-sub">{pct}% 달성 (1~{includedMonths||1}월 누적)</div>
            </div>
          ))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
          {yearMonths.map(mm=>(
            <div key={mm.m}
              onClick={()=>!mm.isFuture && goToMonth(mm.m)}
              style={{background:mm.isFuture?'var(--surface1)':'var(--surface)',border:'0.5px solid '+(mm.isCurrent?'var(--green)':'var(--border)'),borderRadius:'var(--radius)',padding:'12px 13px',cursor:mm.isFuture?'default':'pointer'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:9}}>
                <span style={{fontSize:13,fontWeight:700,color:mm.isFuture?'var(--text3)':'var(--text)'}}>{ML[mm.m]}</span>
                {mm.isFuture ? <span style={{fontSize:9.5,color:'var(--text3)'}}>예정</span>
                 : mm.isCurrent ? <span style={{fontSize:9.5,fontWeight:600,color:'var(--green)',background:'var(--green-light)',padding:'2px 7px',borderRadius:999}}>진행중</span>
                 : <MonthRing pct={mm.pct} />}
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                {TYPES.map(t=>{
                  const done = mm.counts[t], target = MONTHLY_TARGET[t]
                  const pct = mm.isFuture ? 0 : Math.min(100, Math.round(done/target*100))
                  return (
                    <div key={t} style={{display:'flex',alignItems:'center',gap:7}}>
                      <span style={{width:6,height:6,borderRadius:'50%',background:mm.isFuture?'var(--border-strong)':DOT_COLOR[t],flexShrink:0}}></span>
                      <div className="bar-bg" style={{flex:1,height:5}}><div className="bar-fill" style={{width:pct+'%',background:mm.isFuture?'var(--border-strong)':DOT_COLOR[t]}}></div></div>
                      <span style={{fontSize:10,color:'var(--text2)',width:32,textAlign:'right',flexShrink:0}}>{mm.isFuture?'–':`${done}/${target}`}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      )}

      {modal&&(
        <div className="modal-backdrop" onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div className="modal" style={{width:380}}>
            <div className="modal-title">과업 인증 사진</div>
            <div style={{fontSize:13,color:'var(--text3)',marginBottom:14}}>{effectiveTrainer} · {modal.y}년 {modal.m+1}월 {modal.d}일</div>
            <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:16}}>
              {TYPES.map(t=>{
                if (t === 'clean') {
                  const cleanPhotos = (photos[effectiveTrainer]?.[modal.k]||{}).clean || []
                  return (
                    <div key={t} style={{display:'flex',flexDirection:'column',gap:8}}>
                      <div style={{fontSize:13,fontWeight:500}}>{TYPE_LABEL.clean} <span style={{fontSize:10,color:'var(--text3)',fontWeight:400}}>(최대 {CLEAN_MAX}장 · 촬영 시 시간이 자동으로 찍혀요)</span></div>
                      <div style={{display:'flex',gap:14}}>
                        {Array.from({length:CLEAN_MAX}).map((_,slot)=>{
                          const photo = cleanPhotos[slot]
                          const busyKey = `clean_${slot}`
                          return (
                            <div key={slot} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                              <input ref={el=>fileInputs.current[busyKey]=el} type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={e=>onFileChosen('clean',e,slot)} />
                              {photo ? (
                                <img src={photo} alt={`청소 ${slot+1}`} style={{width:48,height:48,objectFit:'cover',borderRadius:6,border:'1.5px solid '+DOT_COLOR.clean,cursor:'pointer'}} onClick={()=>setPreview(photo)}/>
                              ) : (
                                <div style={{width:48,height:48,borderRadius:6,border:'1.5px dashed var(--border-strong)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,color:'var(--text3)'}}>🧹</div>
                              )}
                              <div style={{display:'flex',gap:4}}>
                                <button className="btn btn-outline" style={{padding:'5px 8px',fontSize:11}} disabled={busyType===busyKey} onClick={()=>pickFile(busyKey)}>{busyType===busyKey?'처리중...':(photo?'변경':'촬영')}</button>
                                {photo&&<button className="btn btn-danger" style={{padding:'5px 8px',fontSize:11}} onClick={()=>removePhoto('clean',slot)}>삭제</button>}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                }
                const photo = (photos[effectiveTrainer]?.[modal.k]||{})[t]
                const Icon = TYPE_ICON[t]
                return (
                  <div key={t} style={{display:'flex',alignItems:'center',gap:10}}>
                    <input ref={el=>fileInputs.current[t]=el} type="file" accept="image/*" style={{display:'none'}} onChange={e=>onFileChosen(t,e)} />
                    {photo ? (
                      <img src={photo} alt={TYPE_LABEL[t]} style={{width:48,height:48,objectFit:'cover',borderRadius:6,border:'1.5px solid '+DOT_COLOR[t],cursor:'pointer'}} onClick={()=>setPreview(photo)}/>
                    ) : (
                      <div style={{width:48,height:48,borderRadius:6,border:'1.5px dashed var(--border-strong)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,color:'var(--text3)'}}><Icon/></div>
                    )}
                    <div style={{flex:1,fontSize:13,fontWeight:500}}>{TYPE_LABEL[t]}</div>
                    <button className="btn btn-outline" style={{padding:'6px 10px',fontSize:12}} disabled={busyType===t} onClick={()=>pickFile(t)}>{busyType===t?'처리중...':(photo?'다시 촬영/변경':'사진 선택')}</button>
                    {photo&&<button className="btn btn-danger" style={{padding:'6px 10px',fontSize:12}} onClick={()=>removePhoto(t)}>삭제</button>}
                  </div>
                )
              })}
            </div>
            <div className="modal-btns">
              <button className="btn btn-g" onClick={()=>setModal(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {preview&&(
        <div className="modal-backdrop" onClick={()=>setPreview(null)}>
          <img src={preview} alt="인증 사진 미리보기" style={{maxWidth:'90vw',maxHeight:'90vh',borderRadius:8}}/>
        </div>
      )}
    </div>
  )
}
