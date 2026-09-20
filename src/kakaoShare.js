// 카카오톡 공유하기(Kakao Share JS SDK) 연동.
// 이 키는 원래 클라이언트에 노출되는 용도의 공개 키이고, 카카오 개발자 콘솔의
// "플랫폼 키"에 등록된 도메인에서만 동작하도록 카카오 쪽에서 막아줍니다.
const KAKAO_JS_KEY = 'efa7bc6611c6707d9686af7e0724c4ff'

function getKakao() {
  const Kakao = window.Kakao
  if (!Kakao) throw new Error('카카오 SDK를 아직 불러오지 못했어요. 잠시 후 다시 시도해주세요.')
  if (!Kakao.isInitialized()) Kakao.init(KAKAO_JS_KEY)
  return Kakao
}

// 카카오톡 공유 창을 띄웁니다. text는 카카오 기본 텍스트 템플릿 제한(200자)이 있어서
// 짧은 알림 문구만 넣고, 자세한 내용은 link로 연결되는 페이지(회원 운동일지 등)에서 보게 합니다.
export function shareKakaoText({ text, linkUrl, buttonTitle = '자세히 보기' }) {
  const Kakao = getKakao()
  Kakao.Share.sendDefault({
    objectType: 'text',
    text,
    link: { webUrl: linkUrl, mobileWebUrl: linkUrl },
    buttonTitle,
  })
}
