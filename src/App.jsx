import { useState, useEffect } from 'react'
import { TODAY, ML, WD, TRAINERS } from './data.js'
import { useLocalStorage } from './useLocalStorage.js'
import { subscribeNotifications, markRead, markAllRead } from './notifications.js'
import Home from './components/Home.jsx'
import Task from './components/Task.jsx'
import PT from './components/PT.jsx'
import Schedule from './components/Schedule.jsx'
import Salary from './components/Salary.jsx'
import Dashboard from './components/Dashboard.jsx'
import PTDiary from './components/PTDiary.jsx'
import PTContract from './components/PTContract.jsx'
import Settings from './components/Settings.jsx'
import Login from './components/Login.jsx'
import MemberDiaryView from './components/MemberDiaryView.jsx'
import ExerciseInfoView from './components/ExerciseInfoView.jsx'

const MENU = [
  {id:'home', label:'홈', icon:'ti-home'},
  {id:'task', label:'과업 인증', icon:'ti-checklist'},
  {id:'pt', label:'PT 시간표', icon:'ti-barbell'},
  {id:'diary', label:'PT 운동 일지', icon:'ti-notebook'},
  {id:'contract', label:'PT회원 관리', icon:'ti-file-text'},
  {id:'schedule', label:'스케줄', icon:'ti-calendar'},
  {id:'salary', label:'급여 정산', icon:'ti-coin'},
  {id:'dashboard', label:'매출 대시보드', icon:'ti-chart-bar', ownerOnly:true},
  {id:'settings', label:'설정', icon:'ti-settings'},
]

const PAGES = {home:Home, task:Task, pt:PT, schedule:Schedule, salary:Salary, dashboard:Dashboard, diary:PTDiary, contract:PTContract, settings:Settings}
const PAGE_TITLES = {home:'홈', task:'과업 인증', pt:'PT 시간표', schedule:'스케줄', salary:'급여 정산', dashboard:'매출 대시보드', diary:'PT 운동 일지', contract:'PT회원 관리', settings:'설정'}

export default function App() {
  const [auth, setAuth] = useLocalStorage('nowgym-auth', null)
  const [page, setPage] = useLocalStorage('nowgym-page', 'home')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [diaryJump, setDiaryJump] = useState(null)
  const [taskJump, setTaskJump] = useState(null)
  const [notifs, setNotifs] = useState([])
  const [notifOpen, setNotifOpen] = useState(false)

  useEffect(() => {
    if (!auth) return
    return subscribeNotifications(auth.identity, setNotifs)
  }, [auth?.identity])

  const urlParams = new URLSearchParams(window.location.search)
  const memberToken = urlParams.get('member')
  if (memberToken) {
    return <MemberDiaryView token={memberToken} />
  }
  const exerciseId = urlParams.get('ex')
  if (exerciseId) {
    return <ExerciseInfoView id={exerciseId} />
  }

  if (!auth) {
    return <Login onLogin={(identity) => setAuth({identity})} />
  }

  const isOwner = auth.identity==='원장님'
  const role = isOwner ? '원장님' : '선생님'
  const myTrainer = isOwner ? TRAINERS[0].name : auth.identity
  const Page = PAGES[page] || Home
  const visibleMenu = MENU.filter(m => isOwner || !m.ownerOnly)
  const currentPage = visibleMenu.some(m=>m.id===page) ? page : 'home'

  const goPage = (id) => {
    const item = MENU.find(m => m.id===id)
    if (item?.ownerOnly && !isOwner) return
    setPage(id)
    setMobileNavOpen(false)
  }

  const goToDiary = (jump) => {
    setDiaryJump(jump)
    setPage('diary')
  }

  const goToTodayTask = () => {
    setTaskJump(Date.now())
    setPage('task')
  }

  const logout = () => {
    if (window.confirm('로그아웃 하시겠어요?')) setAuth(null)
  }

  const unreadCount = notifs.filter(n => !n.read).length
  const onClickNotif = (n) => {
    if (!n.read) markRead(n.id)
    setNotifOpen(false)
    if (n.page) goPage(n.page)
  }
  const onMarkAllRead = () => markAllRead(notifs.filter(n => !n.read).map(n => n.id))
  const timeAgo = (ts) => {
    const diffMin = Math.round((Date.now() - ts) / 60000)
    if (diffMin < 1) return '방금'
    if (diffMin < 60) return `${diffMin}분 전`
    const diffH = Math.round(diffMin / 60)
    if (diffH < 24) return `${diffH}시간 전`
    return `${Math.round(diffH / 24)}일 전`
  }

  return (
    <div className="layout">
      <div className={`sidebar-backdrop${mobileNavOpen?' open':''}`} onClick={()=>setMobileNavOpen(false)}></div>
      <aside className={`sidebar${mobileNavOpen?' open':''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-title">🏋️ 나우짐</div>
          <div className="sidebar-logo-sub">관리 시스템</div>
        </div>
        <nav className="sidebar-nav">
          {visibleMenu.map(m => (
            <button key={m.id} className={`nav-item${currentPage===m.id?' active':''}`} onClick={()=>goPage(m.id)}>
              <i className={`ti ${m.icon}`} aria-hidden="true"></i>
              {m.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div style={{fontSize:11,color:'rgba(255,255,255,0.3)',marginBottom:6}}>나우짐 관리 시스템 v1.0</div>
        </div>
      </aside>
      <div className="main">
        <div className="topbar">
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <button className="mobile-menu-btn" aria-label="메뉴 열기" onClick={()=>setMobileNavOpen(o=>!o)}>
              <i className="ti ti-menu-2" aria-hidden="true"></i>
            </button>
            <div className="topbar-title">{PAGE_TITLES[currentPage]}</div>
          </div>
          <div className="topbar-right">
            <span className="topbar-date">{TODAY.getFullYear()}년 {TODAY.getMonth()+1}월 {TODAY.getDate()}일 ({WD[TODAY.getDay()]})</span>
            <div style={{position:'relative'}}>
              <button className="btn btn-outline" style={{padding:'5px 10px',fontSize:14,position:'relative'}} aria-label="알림" onClick={()=>setNotifOpen(o=>!o)}>
                🔔
                {unreadCount>0 && <span style={{position:'absolute',top:-4,right:-4,background:'var(--red)',color:'#fff',fontSize:10,fontWeight:700,minWidth:16,height:16,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',padding:'0 3px'}}>{unreadCount>9?'9+':unreadCount}</span>}
              </button>
              {notifOpen && (
                <>
                  <div style={{position:'fixed',inset:0,zIndex:40}} onClick={()=>setNotifOpen(false)}></div>
                  <div className="card" style={{position:'fixed',top:64,left:12,right:12,maxWidth:360,marginLeft:'auto',maxHeight:'70vh',overflowY:'auto',padding:0,zIndex:41,boxShadow:'0 8px 24px rgba(0,0,0,0.15)'}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 14px',borderBottom:'0.5px solid var(--border)'}}>
                      <span style={{fontSize:13,fontWeight:600}}>알림</span>
                      {unreadCount>0 && <button className="btn btn-outline" style={{padding:'3px 8px',fontSize:11}} onClick={onMarkAllRead}>모두 읽음</button>}
                    </div>
                    {notifs.length===0 ? (
                      <div style={{padding:20,textAlign:'center',fontSize:12,color:'var(--text3)'}}>알림이 없어요.</div>
                    ) : notifs.slice(0,50).map(n => (
                      <div key={n.id} onClick={()=>onClickNotif(n)}
                        style={{padding:'10px 14px',borderBottom:'0.5px solid var(--border)',cursor:'pointer',background:n.read?'transparent':'var(--green-light)'}}>
                        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                          {!n.read && <span style={{width:6,height:6,borderRadius:'50%',background:'var(--green)',flexShrink:0}}></span>}
                          <span style={{fontSize:12,fontWeight:600,flex:1}}>{n.title}</span>
                          <span style={{fontSize:10,color:'var(--text3)',flexShrink:0}}>{timeAgo(n.createdAt)}</span>
                        </div>
                        <div style={{fontSize:12,color:'var(--text2)'}}>{n.body}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <span className="role-badge">{isOwner?'원장님 👑':`${myTrainer} 선생님`}</span>
            <button className="btn btn-outline" style={{padding:'5px 12px',fontSize:12}} onClick={logout}>로그아웃</button>
          </div>
        </div>
        <div className="content">
          <Page role={role} myTrainer={myTrainer} onOpenDiary={goToDiary} diaryJump={diaryJump} onDiaryJumpHandled={()=>setDiaryJump(null)} onNavigate={goPage} onOpenTodayTask={goToTodayTask} taskJump={taskJump} onTaskJumpHandled={()=>setTaskJump(null)} />
        </div>
      </div>
    </div>
  )
}
