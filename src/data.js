import { recordBonusAmount } from './holSettings.js'

export const TODAY = new Date();
export const ML = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
export const WD = ['일','월','화','수','목','금','토'];
export const DAYS = ['월','화','수','목','금','토','일'];
export const TRAINERS = [
  {name:'정우', short:'정우', av:'av0'},
  {name:'준혁', short:'준혁', av:'av1'},
  {name:'건호', short:'건호', av:'av2'},
  {name:'인재', short:'인재', av:'av3'},
];
// 회원이 로그인 없이 본인 운동일지를 볼 수 있는 링크에 쓰는, 추측하기 어려운 토큰을 만듭니다.
export function genToken(){
  return crypto.randomUUID ? crypto.randomUUID().replace(/-/g,'') : Math.random().toString(36).slice(2)+Date.now().toString(36)
}
export const WORKOUT_LOGS_STORE_KEY = 'nowgym-workout-logs'
export const WORKOUT_LOGS_INIT = {
  정우:[
    {id:'a',memberId:1,memberName:'홍길동',date:new Date(2026,8,3),int:'💀 최고',parts:['하체','코어'],exs:[{name:'스쿼트',sets:[{w:100,r:5,u:''},{w:100,r:5,u:''},{w:90,r:8,u:''}]},{name:'레그프레스',sets:[{w:160,r:10,u:''},{w:140,r:12,u:''}]},{name:'플랭크',sets:[{w:0,r:60,u:'초'},{w:0,r:60,u:'초'}]}],memo:'스쿼트 100kg 3세트 완주! 다음엔 105kg 도전.',media:['📸'],cnt:2},
    {id:'b',memberId:1,memberName:'홍길동',date:new Date(2026,8,1),int:'💪 보통',parts:['가슴','어깨'],exs:[{name:'벤치프레스',sets:[{w:80,r:5,u:''},{w:75,r:8,u:''}]},{name:'숄더프레스',sets:[{w:50,r:10,u:''},{w:45,r:12,u:''}]}],memo:'벤치 80kg 5회 성공!',media:[],cnt:1},
  ],
  준혁:[{id:'c',memberId:5,memberName:'오소연',date:new Date(2026,8,2),int:'💪 보통',parts:['하체'],exs:[{name:'스쿼트',sets:[{w:60,r:10,u:''},{w:60,r:10,u:''}]}],memo:'레그프레스 60kg 달성!',media:[],cnt:1}],
  건호:[],인재:[],
}
// 트레이너 기본급/과업 인센티브는 적용 시작월(effectiveFrom, 'YYYY-MM')을 가진 이력으로 관리합니다.
// 새 변경을 추가하면 그 달부터 적용되고, 그 이전 달의 급여 정산은 그 시점에 유효했던 값을 그대로 씁니다.
export const SALARY_POLICY_INIT = [
  {id:'sp1', effectiveFrom:'2025-01', base:{정우:1100000,준혁:1200000,건호:900000,인재:1300000}, taskInsen:{정우:400000,준혁:400000,건호:300000,인재:400000}},
]
// monthKey('YYYY-MM') 시점에 유효했던 급여 정책을 찾습니다. (effectiveFrom이 monthKey 이하인 것 중 가장 최근 것)
export function salaryPolicyFor(monthKey, policies){
  const sorted = [...policies].sort((a,b)=>a.effectiveFrom.localeCompare(b.effectiveFrom))
  let picked = sorted[0]
  for(const p of sorted){ if(p.effectiveFrom<=monthKey) picked=p; else break }
  return picked
}
export const MT = [[0,0],[2750,100000],[3000,200000],[3300,300000],[3500,400000],[3700,500000],[4000,600000],[4200,800000]];
export const QT = [[0,0],[8000,500000],[8500,600000],[9000,700000],[9500,800000],[10000,900000],[10500,1000000],[11000,1200000],[11500,1400000]];
export const PH = new Set(['2026-1-1','2026-1-28','2026-1-29','2026-1-30','2026-3-1','2026-5-5','2026-5-25','2026-6-6','2026-8-15','2026-9-24','2026-9-25','2026-9-26','2026-10-3','2026-10-9','2026-12-25']);
export const EX_CATEGORIES = {
  '가슴':['벤치프레스','인클라인 벤치프레스','덤벨 플라이','푸시업','딥스'],
  '등':['데드리프트','풀업','랫풀다운','시티드 로우','바벨 로우'],
  '하체':['스쿼트','레그프레스','런지','레그 익스텐션','레그 컬','힙 스러스트'],
  '어깨':['숄더프레스','사이드 레터럴 레이즈','프론트 레이즈','업라이트 로우'],
  '팔':['바이셉 컬','해머 컬','트라이셉 푸시다운','스컬 크러셔'],
  '코어':['플랭크','크런치','레그레이즈','러시안 트위스트'],
  '유산소':['런닝머신','싸이클','로잉머신','줄넘기'],
};
export const EXERCISES_INIT = Object.entries(EX_CATEGORIES).flatMap(([cat,names])=>names.map((name,i)=>({id:`${cat}-${i}`,category:cat,name,desc:'',imageUrl:'',videoUrl:'',createdBy:'원장님'})))
export const PT_HOURS = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:30','19:00'];
export const PRODUCTS_INIT = [
  {id:'h10',type:'half',name:'하프PT 10회',count:10,weeks:5,price:450000},
  {id:'h20',type:'half',name:'하프PT 20회',count:20,weeks:10,price:850000},
  {id:'h30',type:'half',name:'하프PT 30회',count:30,weeks:15,price:1200000},
  {id:'f10',type:'full',name:'일반PT 10회',count:10,weeks:5,price:600000},
  {id:'f20',type:'full',name:'일반PT 20회',count:20,weeks:10,price:1100000},
  {id:'f30',type:'full',name:'일반PT 30회',count:30,weeks:15,price:1500000},
];
export const PT_MEMBERS_INIT=[
  {id:1,name:'홍길동',phone:'010-1234-5678',birth:'930315',gender:'남',trainer:'인재',goal:'체지방 감량',product:PRODUCTS_INIT[3],regType:'재등록',payMethod:'카드',start:new Date(2026,8,1),actual:600000,staff:'인재'},
  {id:2,name:'김민지',phone:'010-2345-6789',birth:'980520',gender:'여',trainer:'인재',goal:'체력 향상',product:PRODUCTS_INIT[0],regType:'신규',payMethod:'카드',start:new Date(2026,7,11),actual:450000,staff:'인재'},
  {id:3,name:'오소연',phone:'010-5678-9012',birth:'951130',gender:'여',trainer:'정우',goal:'다이어트',product:PRODUCTS_INIT[4],regType:'신규',payMethod:'카드',start:new Date(2026,6,7),actual:1100000,staff:'정우'},
].map(m=>({...m,contracts:[{id:'c'+m.id,product:m.product,regType:m.regType,payMethod:m.payMethod,start:m.start,actual:m.actual,staff:m.staff}]}))
export function getTier(tiers,val){let r=tiers[0];for(let t of tiers){if(val>=t[0])r=t;else break;}return r;}
// PT 인센티브: 정우·준혁·건호 세 명의 PT 매출 합산이 월 800만원 이상이면, 그 달은 세 명 각자 본인 PT 매출의 10%를 인센티브로 지급합니다. (인재는 대상 제외)
export const PT_INSEN_TRAINERS = ['정우','준혁','건호']
export const PT_INSEN_THRESHOLD = 8000000
export const PT_INSEN_RATE = 0.10
export function ptInsenGroupTotal(trainerSales){ return PT_INSEN_TRAINERS.reduce((a,n)=>a+(trainerSales[n]||0),0) }
export function ptInsenFor(name,trainerSales){
  if(!PT_INSEN_TRAINERS.includes(name)) return 0
  if(ptInsenGroupTotal(trainerSales) < PT_INSEN_THRESHOLD) return 0
  return Math.round((trainerSales[name]||0)*PT_INSEN_RATE)
}
export function fmt(n){return Math.round(n).toLocaleString('ko-KR')+'원';}
export function fmtM(n){return Math.round(n/10000).toLocaleString('ko-KR')+'만';}
function asDate(d){return d instanceof Date ? d : new Date(d);}
export function fmtDate(d){d=asDate(d);return d.getFullYear()+'년 '+(d.getMonth()+1)+'월 '+d.getDate()+'일';}
export function fmtDateShort(d){d=asDate(d);return (d.getMonth()+1)+'월 '+d.getDate()+'일';}
export function toDateInput(d){d=asDate(d);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
export function addWeeks(d,w){const r=asDate(d);const r2=new Date(r);r2.setDate(r2.getDate()+w*7);return r2;}
export function isPast(d){return d<new Date(TODAY.getFullYear(),TODAY.getMonth(),TODAY.getDate());}
export function isHoliday(y,m,d){const dw=new Date(y,m-1,d).getDay();const ph=PH.has(y+'-'+m+'-'+d);return{isSat:dw===6,isSun:dw===0,isPh:ph,isH:dw===0||dw===6||ph};}

export const VAC_DATA = {
  정우:['2026-3-14','2026-4-2','2026-5-20','2026-6-10','2026-7-3','2026-8-15','2026-9-15','2026-9-22'],
  준혁:['2026-1-20','2026-2-14','2026-4-5','2026-6-25','2026-8-8','2026-10-10'],
  건호:['2026-2-3','2026-3-22','2026-5-5','2026-7-18','2026-9-12'],
  인재:['2026-3-10','2026-4-20','2026-6-15','2026-8-1'],
};

export const HOL_RECORDS_INIT = [
  {date:'2026-9-5',trainerName:'정우',type:'normal'},
  {date:'2026-9-6',trainerName:'준혁',type:'extra'},
  {date:'2026-9-12',trainerName:'건호',type:'normal'},
  {date:'2026-9-13',trainerName:'정우',type:'extra'},
  {date:'2026-9-19',trainerName:'준혁',type:'normal'},
  {date:'2026-9-20',trainerName:'건호',type:'extra'},
  {date:'2026-9-26',trainerName:'인재',type:'extra'},
];

// PT 스케줄은 이제 요일 반복 템플릿이 아니라 실제 날짜별 등록 기록이라 시드 데이터 없이 빈 상태로 시작합니다.
export const PT_DATA = {};

// 매출 데이터는 실제 스프레드시트에서 동기화한 salesData.js의 MONTH_SALES를 사용합니다.
// 휴일/추가 근무 유형과 추가금은 holSettings.js에서 관리합니다.

export function sumHolidayBonus(holRecs, trainerName, year, month) {
  return holRecs
    .filter(r => r.trainerName===trainerName)
    .filter(r => {
      const p = r.date.split('-')
      return +p[0]===year && +p[1]===month
    })
    .reduce((sum, r) => sum + recordBonusAmount(r), 0)
}

// 분기(3,6,9,12월) 마지막 달에만 지급되는 분기 매출 인센티브. 그 분기 3개월 매출 합산(만원 단위)으로 구간을 찾습니다.
export function getQInsen(key,sales){
  const [yearStr,monthStr]=key.split('-'); const year=+yearStr; const m=+monthStr
  const qEnd=[3,6,9,12]; if(!qEnd.includes(m))return{insen:0,label:''};
  const q=Math.ceil(m/3)
  const qMonths=[q*3-2,q*3-1,q*3]
  const qKeys=qMonths.map(mm=>`${year}-${String(mm).padStart(2,'0')}`).filter(k=>sales[k])
  const qSum=qKeys.reduce((a,k)=>a+Math.round((sales[k]?.total||0)/10000),0)
  const insen=getTier(QT,qSum)[1]
  const firstM=+qKeys[0]?.split('-')[1]||qMonths[0]
  const lastM=+qKeys[qKeys.length-1]?.split('-')[1]||qMonths[qMonths.length-1]
  return{insen,label:`${q}분기 (${ML[firstM-1]}~${ML[lastM-1]}, 총 ${qSum.toLocaleString()}만원)`}
}

// 트레이너 한 명의 특정 달 최종 급여(기본급+과업인센+센터매출인센+PT인센+휴일근무+분기인센) 합계.
export function calcTrainerSalaryForMonth(name, key, {salaryPolicies, holRecs, monthSales}) {
  const d = monthSales[key]
  const [year, monthStr] = key.split('-'); const month = +monthStr
  const policy = salaryPolicyFor(key, salaryPolicies)
  const base = policy.base[name] || 1300000
  const taskInsen = policy.taskInsen[name] ?? 400000
  const mi = getTier(MT, Math.round(d.total/10000))[1]
  const ptInsen = ptInsenFor(name, d.trainer)
  const hol = sumHolidayBonus(holRecs, name, +year, month)
  const qI = getQInsen(key, monthSales).insen
  return base+taskInsen+mi+ptInsen+hol+qI
}
