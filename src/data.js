import { holidayBonusAmount } from './holSettings.js'

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
export const STAFF_BASE = {정우:1500000, 준혁:1200000, 건호:1400000, 인재:1300000};
export const TASK_INSEN = 400000;
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
export const PRODUCTS = [
  {id:'h10',type:'half',name:'하프PT 10회',count:10,weeks:5,price:450000},
  {id:'h20',type:'half',name:'하프PT 20회',count:20,weeks:10,price:850000},
  {id:'h30',type:'half',name:'하프PT 30회',count:30,weeks:15,price:1200000},
  {id:'f10',type:'full',name:'일반PT 10회',count:10,weeks:5,price:600000},
  {id:'f20',type:'full',name:'일반PT 20회',count:20,weeks:10,price:1100000},
  {id:'f30',type:'full',name:'일반PT 30회',count:30,weeks:15,price:1500000},
];
export const PT_MEMBERS_INIT=[
  {id:1,name:'홍길동',phone:'010-1234-5678',birth:'930315',gender:'남',trainer:'인재',product:PRODUCTS[3],regType:'재등록',payMethod:'카드',start:new Date(2026,8,1),actual:600000,staff:'인재'},
  {id:2,name:'김민지',phone:'010-2345-6789',birth:'980520',gender:'여',trainer:'인재',product:PRODUCTS[0],regType:'신규',payMethod:'카드',start:new Date(2026,7,11),actual:450000,staff:'인재'},
  {id:3,name:'오소연',phone:'010-5678-9012',birth:'951130',gender:'여',trainer:'정우',product:PRODUCTS[4],regType:'신규',payMethod:'카드',start:new Date(2026,6,7),actual:1100000,staff:'정우'},
]
export function getTier(tiers,val){let r=tiers[0];for(let t of tiers){if(val>=t[0])r=t;else break;}return r;}
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
    .reduce((sum, r) => sum + holidayBonusAmount(r.type), 0)
}
