import {useState, useEffect} from 'react'
import {useSyncedState} from '../useSyncedState.js'
import {TODAY,TRAINERS,PRODUCTS_INIT,PT_MEMBERS_INIT,WD,fmt,fmtDate,toDateInput,addWeeks,genToken} from '../data.js'
export default function PTContract({role, myTrainer}) {
  const isOwner = role==='원장님'
  const [members,setMembers]=useSyncedState('nowgym-pt-members', PT_MEMBERS_INIT)
  useEffect(()=>{
    if(members.some(m=>!m.token)) setMembers(list=>list.map(m=>m.token?m:{...m,token:genToken()}))
  }, [members])
  const [products]=useSyncedState('nowgym-pt-products', PRODUCTS_INIT)
  const [view,setView]=useState('list')
  const [cur,setCur]=useState(null)
  const [renewMode,setRenewMode]=useState(false)
  const [editContractId,setEditContractId]=useState(null)
  const [form,setForm]=useState({name:'',phone:'',birth:'',gender:'남',trainer:'인재',goal:'',regType:'신규',payMethod:'카드',start:toDateInput(TODAY),actual:'',staff:'인재',productId:'f10'})
  const [kkModal,setKkModal]=useState(null)
  const selProd=products.find(p=>p.id===form.productId)||products[3]||products[0]
  const startDate=form.start?new Date(form.start):TODAY
  const expireDate=addWeeks(startDate,selProd.weeks)
  const actual=parseInt(form.actual)||selProd.price
  const discount=selProd.price-actual
  const visibleMembers = isOwner ? members : members.filter(m=>m.trainer===myTrainer)
  const contractsOf = m => (m.contracts && m.contracts.length) ? m.contracts : [{id:'legacy-'+m.id,product:m.product,regType:m.regType,payMethod:m.payMethod,start:m.start,actual:m.actual,staff:m.staff}]
  const openNew=()=>{setForm({name:'',phone:'',birth:'',gender:'남',trainer:isOwner?'인재':myTrainer,goal:'',regType:'신규',payMethod:'카드',start:toDateInput(TODAY),actual:'',staff:isOwner?'인재':myTrainer,productId:'f10'});setCur(null);setRenewMode(false);setEditContractId(null);setView('form')}
  const openRenew=m=>{setForm({name:m.name,phone:m.phone,birth:m.birth,gender:m.gender,trainer:m.trainer,goal:m.goal||'',regType:'재등록',payMethod:m.payMethod,start:toDateInput(TODAY),actual:'',staff:m.staff,productId:m.product.id});setCur(m);setRenewMode(true);setEditContractId(null);setView('form')}
  const openEditContract=(m,c)=>{setForm({name:m.name,phone:m.phone,birth:m.birth,gender:m.gender,trainer:m.trainer,goal:m.goal||'',regType:c.regType,payMethod:c.payMethod,start:toDateInput(c.start),actual:c.actual,staff:c.staff,productId:c.product.id});setCur(m);setRenewMode(false);setEditContractId(c.id);setView('form')}
  const notifyNewMember=(name,trainer,regType)=>{
    fetch('/api/notify-new-member',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,trainer,regType})}).catch(()=>{})
  }
  const saveForm=()=>{
    const p=form.start.split('-'); const sd=new Date(+p[0],+p[1]-1,+p[2])
    if(cur&&renewMode){
      const newContract={id:'c'+Date.now(),product:selProd,regType:form.regType,payMethod:form.payMethod,start:sd,actual,staff:form.staff}
      const nm={...cur,name:form.name||cur.name,phone:form.phone||cur.phone,birth:form.birth,gender:form.gender,trainer:form.trainer,goal:form.goal,product:selProd,regType:form.regType,payMethod:form.payMethod,start:sd,actual,staff:form.staff,contracts:[...(cur.contracts||[]),newContract]}
      setMembers(ms=>ms.map(m=>m.id===cur.id?nm:m))
      notifyNewMember(nm.name,nm.trainer,form.regType)
      setRenewMode(false); setView('preview'); setCur(nm)
      return
    }
    if(cur&&editContractId){
      const curContracts=contractsOf(cur)
      const isLatest=curContracts[curContracts.length-1].id===editContractId
      const contracts=curContracts.map(c=>c.id===editContractId?{...c,product:selProd,regType:form.regType,payMethod:form.payMethod,start:sd,actual,staff:form.staff}:c)
      const nm={...cur,name:form.name||cur.name,phone:form.phone||cur.phone,birth:form.birth,gender:form.gender,trainer:form.trainer,goal:form.goal,contracts,...(isLatest?{product:selProd,regType:form.regType,payMethod:form.payMethod,start:sd,actual,staff:form.staff}:{})}
      setMembers(ms=>ms.map(m=>m.id===cur.id?nm:m))
      setEditContractId(null); setView('preview'); setCur(nm)
      return
    }
    const newContract={id:'c'+Date.now(),product:selProd,regType:form.regType,payMethod:form.payMethod,start:sd,actual,staff:form.staff}
    const nm={id:Date.now(),name:form.name||'홍길동',phone:form.phone||'010-0000-0000',birth:form.birth,gender:form.gender,trainer:form.trainer,goal:form.goal,product:selProd,regType:form.regType,payMethod:form.payMethod,start:sd,actual,staff:form.staff,contracts:[newContract],token:genToken()}
    setMembers(ms=>[...ms,nm])
    notifyNewMember(nm.name,nm.trainer,form.regType)
    setView('preview'); setCur(nm)
  }
  const openKk=(type)=>{
    if(!cur)return
    const expire=addWeeks(cur.start,cur.product.weeks)
    let msg=''
    if(type==='contract'||type==='both'){
      msg+=`[🏋️ 나우짐 PT 이용 계약서]\n\n안녕하세요 ${cur.name}님!\n나우짐에 등록해 주셔서 감사합니다 😊\n\n──────────────────\n🏋️ 담당: ${cur.trainer} 트레이너\n📋 ${cur.product.name} (${cur.product.weeks}주 과정)\n📅 ${fmtDate(cur.start)} ~ ${fmtDate(expire)}\n💳 ${cur.payMethod} · ${cur.regType}\n💰 결제: ${fmt(cur.actual)}${cur.actual<cur.product.price?' ('+fmt(cur.product.price-cur.actual)+' 할인)':''}\n──────────────────\n\n회원님의 건강한 라이프 스타일을 응원할게요!💪🏻\n나우짐 📞 053-965-0513`
    }
    if(type==='receipt'||type==='both'){
      msg+=`\n\n──────────────────\n[💳 결제 내역서]\n  상품: ${cur.product.name}\n  결제일: ${fmtDate(cur.start)}\n  결제: ${cur.payMethod}\n  금액: ${fmt(cur.actual)}\n──────────────────`
    }
    setKkModal({msg,name:cur.name})
  }
  const deleteMember=m=>{
    if(!window.confirm(`${m.name}님을 삭제할까요? 계약서를 포함한 모든 정보가 삭제되며 되돌릴 수 없어요.`))return
    setMembers(ms=>ms.filter(x=>x.id!==m.id))
    if(cur&&cur.id===m.id){setCur(null);setView('list')}
  }
  const deleteContract=(m,contractId)=>{
    const curContracts=contractsOf(m)
    if(curContracts.length<=1){alert('마지막 남은 계약서는 삭제할 수 없어요. 회원을 통째로 삭제하려면 회원 삭제를 이용해주세요.');return}
    if(!window.confirm('이 계약서를 삭제할까요? 되돌릴 수 없어요.'))return
    const remaining=curContracts.filter(c=>c.id!==contractId)
    const latest=remaining[remaining.length-1]
    const nm={...m,contracts:remaining,product:latest.product,regType:latest.regType,payMethod:latest.payMethod,start:latest.start,actual:latest.actual,staff:latest.staff}
    setMembers(ms=>ms.map(x=>x.id===m.id?nm:x))
    setCur(nm)
  }
  const copyDiaryLink=m=>{
    if(!m.token){alert('링크를 준비 중이에요. 잠시 후 다시 시도해주세요.');return}
    const url=`${window.location.origin}${window.location.pathname}?member=${m.token}`
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(url).then(
        ()=>alert('운동일지 링크가 복사되었어요. 회원님께 전달해주세요.'),
        ()=>window.prompt('아래 링크를 복사해주세요', url)
      )
    } else {
      window.prompt('아래 링크를 복사해주세요', url)
    }
  }
  const trI=['정우','준혁','건호','인재']
  return (
    <div>
      {view==='list'&&(
        <div>
          <div style={{display:'flex',justifyContent:'flex-end',marginBottom:14}}>
            <button className="btn btn-g" onClick={openNew}>+ 신규 등록</button>
          </div>
          {visibleMembers.length===0&&<div className="empty-state">등록된 회원이 없어요.</div>}
          <div className="grid-2">
            {visibleMembers.map(m=>{
              const expire=addWeeks(m.start,m.product.weeks)
              const avC=['av0','av1','av2','av3'][trI.indexOf(m.trainer)]||'av3'
              return (
                <div key={m.id} className="card" style={{cursor:'pointer'}} onClick={()=>{setCur(m);setView('preview')}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                    <div className={`av ${avC}`} style={{width:40,height:40,fontSize:13}}>{m.name.slice(0,2)}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:15,fontWeight:500}}>{m.name}</div>
                      <div style={{fontSize:12,color:'var(--text3)'}}>{m.trainer} · {m.product.name}</div>
                    </div>
                    <span className={`badge ${m.regType==='신규'?'badge-g':'badge-b'}`}>{m.regType}</span>
                    <button className="btn btn-danger" style={{padding:'5px 10px',fontSize:12}} onClick={e=>{e.stopPropagation();deleteMember(m)}}>삭제</button>
                  </div>
                  <div className="rrow"><span className="rl">시작일</span><span className="rv">{fmtDate(m.start)}</span></div>
                  <div className="rrow"><span className="rl">만료일</span><span className="rv">{fmtDate(expire)}</span></div>
                  <div className="rrow"><span className="rl">결제금액</span><span className="rv g">{fmt(m.actual)}</span></div>
                </div>
              )
            })}
          </div>
        </div>
      )}
      {view==='form'&&(
        <div className="grid-2">
          <div>
            {renewMode&&<div className="card" style={{marginBottom:12,background:'var(--green-light)',color:'var(--green-dark)',fontSize:13,fontWeight:500}}>🔄 {cur.name}님 재등록 · 새 계약 추가</div>}
            {editContractId&&<div className="card" style={{marginBottom:12,background:'var(--surface1)',color:'var(--text2)',fontSize:13,fontWeight:500}}>✏️ {cur.name}님 계약 정보 수정</div>}
            <div className="card" style={{marginBottom:12}}>
              <div style={{fontWeight:500,marginBottom:12}}>회원 정보</div>
              {[['이름','name','text','홍길동'],['연락처','phone','text','010-0000-0000'],['생년월일','birth','text','990101']].map(([l,k,t,ph])=>(
                <div className="rrow" key={k}><span className="rl">{l}</span><input type={t} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} placeholder={ph} style={{border:'none',background:'transparent',textAlign:'right',color:'var(--text)',fontSize:13,outline:'none'}}/></div>
              ))}
              <div className="rrow"><span className="rl">성별</span><select value={form.gender} onChange={e=>setForm(f=>({...f,gender:e.target.value}))} style={{border:'none',background:'transparent',textAlign:'right',fontSize:13}}><option value="남">남</option><option value="여">여</option></select></div>
              <div className="rrow"><span className="rl">담당 트레이너</span><select value={form.trainer} disabled={!isOwner} onChange={e=>setForm(f=>({...f,trainer:e.target.value}))} style={{border:'none',background:'transparent',textAlign:'right',fontSize:13}}>{(isOwner?TRAINERS:TRAINERS.filter(t=>t.name===myTrainer)).map(t=><option key={t.name} value={t.name}>{t.name}</option>)}</select></div>
              <div className="rrow"><span className="rl">운동목적</span><input type="text" value={form.goal} onChange={e=>setForm(f=>({...f,goal:e.target.value}))} placeholder="예: 체지방 감량, 근력 강화" style={{border:'none',background:'transparent',textAlign:'right',color:'var(--text)',fontSize:13,outline:'none'}}/></div>
            </div>
            <div className="card" style={{marginBottom:12}}>
              <div style={{fontWeight:500,marginBottom:12}}>결제 정보</div>
              <div className="rrow"><span className="rl">등록 구분</span><select value={form.regType} onChange={e=>setForm(f=>({...f,regType:e.target.value}))} style={{border:'none',background:'transparent',fontSize:13}}><option value="신규">신규</option><option value="재등록">재등록</option></select></div>
              <div className="rrow"><span className="rl">결제 방법</span><select value={form.payMethod} onChange={e=>setForm(f=>({...f,payMethod:e.target.value}))} style={{border:'none',background:'transparent',fontSize:13}}><option>카드</option><option>계좌이체</option><option>현금</option><option>키오스크</option></select></div>
              <div className="rrow"><span className="rl">시작일</span><input type="date" value={form.start} onChange={e=>setForm(f=>({...f,start:e.target.value}))} style={{border:'none',background:'transparent',fontSize:13}}/></div>
              <div className="rrow"><span className="rl">실결제액</span><input type="number" value={form.actual} onChange={e=>setForm(f=>({...f,actual:e.target.value}))} placeholder={selProd.price} style={{border:'none',background:'transparent',textAlign:'right',fontSize:13,outline:'none'}}/></div>
            </div>
          </div>
          <div>
            <div className="card" style={{marginBottom:12}}>
              <div style={{fontWeight:500,marginBottom:12}}>PT 상품 선택</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8}}>
                {products.map(p=>(
                  <button key={p.id} style={{border:'1.5px solid '+(form.productId===p.id?'var(--green)':'var(--border)'),borderRadius:10,padding:'10px 8px',background:form.productId===p.id?'var(--green-light)':'transparent',cursor:'pointer',textAlign:'left'}} onClick={()=>{setForm(f=>({...f,productId:p.id,actual:''}))}}>
                    <span style={{fontSize:10,padding:'2px 7px',borderRadius:8,background:p.type==='half'?'#FBEAF0':'#E6F1FB',color:p.type==='half'?'#712B13':'#042C53',display:'inline-block',marginBottom:4}}>{p.type==='half'?'하프 30분':'일반 50분'}</span>
                    <div style={{fontSize:13,fontWeight:500,marginBottom:2}}>{p.name}</div>
                    <div style={{fontSize:11,color:'var(--text3)',marginBottom:4}}>{p.weeks}주 과정</div>
                    <div style={{fontSize:14,fontWeight:500,color:'var(--green)'}}>{fmt(p.price)}</div>
                  </button>
                ))}
              </div>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-outline" style={{flex:1}} onClick={()=>{setRenewMode(false);setEditContractId(null);setView(cur?'preview':'list')}}>취소</button>
              <button className="btn btn-g" style={{flex:2,padding:12,fontSize:14}} onClick={saveForm}>확인</button>
            </div>
          </div>
        </div>
      )}
      {view==='preview'&&cur&&(
        <div>
          <button onClick={()=>setView('list')} style={{background:'transparent',border:'none',color:'var(--text2)',fontSize:13,cursor:'pointer',padding:0,marginBottom:14,display:'flex',alignItems:'center',gap:4}}>← 회원목록</button>
          <div className="grid-2">
            <div>
              <div className="card" style={{marginBottom:12}}>
                <div style={{fontSize:11,fontWeight:500,color:'var(--text3)',marginBottom:8}}>회원 정보</div>
                <div className="rrow"><span className="rl">성명</span><span className="rv">{cur.name}</span></div>
                <div className="rrow"><span className="rl">연락처</span><span className="rv">{cur.phone}</span></div>
                {cur.goal&&<div className="rrow"><span className="rl">운동목적</span><span className="rv">{cur.goal}</span></div>}
                <div className="rrow"><span className="rl">담당 트레이너</span><span className="rv">{cur.trainer}</span></div>
              </div>
              {(()=>{const curContracts=contractsOf(cur);const latestId=curContracts[curContracts.length-1].id;return curContracts.slice().reverse().map(c=>{
                const expire=addWeeks(c.start,c.product.weeks)
                const isLatest=c.id===latestId
                return (
                  <div key={c.id} className="card" style={{padding:0,overflow:'hidden',marginBottom:12}}>
                    <div style={{background:'var(--green)',padding:'16px',position:'relative'}}>
                      <div style={{position:'absolute',top:12,right:12,display:'flex',gap:6}}>
                        <button onClick={()=>openEditContract(cur,c)} style={{background:'rgba(255,255,255,.22)',border:'none',borderRadius:8,color:'#fff',fontSize:12,padding:'5px 10px',cursor:'pointer'}}>수정</button>
                        <button onClick={()=>deleteContract(cur,c.id)} style={{background:'rgba(0,0,0,.2)',border:'none',borderRadius:8,color:'#fff',fontSize:12,padding:'5px 10px',cursor:'pointer'}}>삭제</button>
                      </div>
                      <div style={{color:'rgba(255,255,255,.8)',fontSize:12,marginBottom:4,paddingRight:95}}>🏋️ 나우짐 · 대구 혁신도시{isLatest?' · 현재 계약':''}</div>
                      <div style={{color:'#fff',fontSize:18,fontWeight:500,marginBottom:3}}>PT 이용 계약서</div>
                      <div style={{color:'rgba(255,255,255,.8)',fontSize:12}}>{fmtDate(c.start)} 등록</div>
                    </div>
                    <div style={{padding:'14px 16px'}}>
                      <div className="rrow"><span className="rl">PT 종류</span><span className="rv">{c.product.type==='half'?'하프PT (30분)':'일반PT (50분)'}</span></div>
                      <div className="rrow"><span className="rl">총 횟수</span><span className="rv">{c.product.count}회 ({c.product.weeks}주)</span></div>
                      <div className="rrow"><span className="rl">시작일</span><span className="rv">{fmtDate(c.start)}</span></div>
                      <div className="rrow"><span className="rl">만료일</span><span className="rv">{fmtDate(expire)}</span></div>
                      <div className="rrow"><span className="rl">등록 구분</span><span className="rv">{c.regType}</span></div>
                      <div className="rrow"><span className="rl">결제 방법</span><span className="rv">{c.payMethod}</span></div>
                      <div className="rrow"><span className="rl">정가</span><span className="rv">{fmt(c.product.price)}</span></div>
                      {c.product.price-c.actual>0&&<div className="rrow"><span className="rl">할인</span><span className="rv">-{fmt(c.product.price-c.actual)}</span></div>}
                      <div style={{background:'var(--green-light)',borderRadius:'var(--radius)',padding:'10px 14px',display:'flex',justifyContent:'space-between',marginTop:10}}>
                        <span style={{fontSize:14,color:'var(--green-dark)'}}>실결제액</span>
                        <span style={{fontSize:20,fontWeight:500,color:'var(--green)'}}>{fmt(c.actual)}</span>
                      </div>
                    </div>
                  </div>
                )
              })})()}
            </div>
            <div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                <button className="btn btn-g" style={{padding:13,fontSize:14,fontWeight:700,borderRadius:'var(--radius)',marginBottom:8}} onClick={()=>openRenew(cur)}>🔄 재등록 (새 계약 추가)</button>
                <button className="btn btn-outline" style={{padding:13,fontSize:14,fontWeight:700,borderRadius:'var(--radius)',marginBottom:8}} onClick={()=>copyDiaryLink(cur)}>🔗 회원 운동일지 링크 복사</button>
                <button className="btn btn-kk" style={{padding:13,fontSize:14,fontWeight:700,borderRadius:'var(--radius)',marginBottom:8}} onClick={()=>openKk('contract')}>💬 가입서 카카오 발송</button>
                <button className="btn btn-kk" style={{padding:13,fontSize:14,fontWeight:700,borderRadius:'var(--radius)',marginBottom:8}} onClick={()=>openKk('receipt')}>💬 결제내역 카카오 발송</button>
                <button style={{padding:13,fontSize:14,fontWeight:700,borderRadius:'var(--radius)',background:'#f0b800',border:'none',cursor:'pointer'}} onClick={()=>openKk('both')}>💬 가입서 + 결제내역 동시 발송</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {kkModal&&(
        <div className="modal-backdrop" onClick={e=>e.target===e.currentTarget&&setKkModal(null)}>
          <div className="modal">
            <div className="modal-title">카카오톡 발송 미리보기</div>
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
