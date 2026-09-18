import { useState } from 'react'
import { TODAY, ML, WD, TRAINERS } from './data.js'
import { useLocalStorage } from './useLocalStorage.js'
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

const MENU = [
  {id:'home', label:'홈', icon:'ti-home'},
  {id:'task', label:'과업 인증', icon:'ti-checklist'},
  {id:'pt', label:'PT 시간표', icon:'ti-barbell'},
  {id:'diary', label:'PT 운동 일지', icon:'ti-notebook'},
  {id:'contract', label:'PT회원 관리', icon:'ti-file-text'},
  {id:'schedule', label:'스케줄', icon:'ti-calendar'},
  {id:'salary', label:'급여 정산', icon:'ti-coin'},
  {id:'dashboard', label:'매출 대시보드', icon:'ti-chart-bar', ownerOnly:true},
  {id:'settings', label:'설정', icon:'ti-settings', ownerOnly:true},
]

const PAGES = {home:Home, task:Task, pt:PT, schedule:Schedule, salary:Salary, dashboard:Dashboard, diary:PTDiary, contract:PTContract, settings:Settings}
const PAGE_TITLES = {home:'홈', task:'과업 인증', pt:'PT 시간표', schedule:'스케줄', salary:'급여 정산', dashboard:'매출 대시보드', diary:'PT 운동 일지', contract:'PT회원 관리', settings:'설정'}

export default function App() {
  const [auth, setAuth] = useLocalStorage('nowgym-auth', null)
  const [page, setPage] = useLocalStorage('nowgym-page', 'home')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

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

  const logout = () => {
    if (window.confirm('로그아웃 하시겠어요?')) setAuth(null)
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
            <span className="role-badge">{isOwner?'원장님 👑':`${myTrainer} 선생님`}</span>
            <button className="btn btn-outline" style={{padding:'5px 12px',fontSize:12}} onClick={logout}>로그아웃</button>
          </div>
        </div>
        <div className="content">
          <Page role={role} myTrainer={myTrainer} />
        </div>
      </div>
    </div>
  )
}
