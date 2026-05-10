export const MESSAGES = Object.freeze({
  ko: {
    common: {
      loadingTitle: '화면 준비',
      loadingDescription: '요청한 화면을 불러오고 있습니다.',
      loadingLabel: '화면을 불러오는 중입니다.',
      languageSelect: '언어 선택'
    },
    header: {
      brandLabel: 'Bridgework 홈페이지로 이동',
      searchLabel: '접근성 지도 출발지 검색',
      searchInputLabel: '접근성 지도 출발지 입력',
      searchButtonLabel: '출발지 검색',
      userMenuLabel: '사용자 메뉴',
      login: '회원가입/로그인',
      logout: '로그아웃',
      loggingOut: '로그아웃 중'
    },
    nav: {
      mainMenu: '주요 메뉴',
      home: '홈',
      map: '접근성 지도',
      jobs: '퀵 맞춤 일자리 추천',
      business: '내 정보',
      profile: '사용자 메뉴',
      settings: '설정',
      loginRequired: '로그인 필요'
    },
    footer: {
      backToTop: '화면 맨 위로 이동',
      description: '노동을 잇는 다리, 브릿지워크',
      socials: 'Bridgework 소셜 채널',
      policies: 'Bridgework 정책',
      terms: '서비스 이용약관',
      privacy: '개인정보 처리방침',
      privacyConsent: '개인정보 수집·이용 동의',
      marketingConsent: '마케팅 정보 수신 동의',
      thirdParty: '제3자 제공 동의',
      outsourcing: '개인정보 처리위탁 안내'
    }
  },
  zh: {
    common: {
      loadingTitle: '页面准备中',
      loadingDescription: '正在加载请求的页面。',
      loadingLabel: '正在加载页面。',
      languageSelect: '选择语言'
    },
    header: {
      brandLabel: '前往 Bridgework 首页',
      searchLabel: '无障碍地图出发地搜索',
      searchInputLabel: '输入无障碍地图出发地',
      searchButtonLabel: '搜索出发地',
      userMenuLabel: '用户菜单',
      login: '注册/登录',
      logout: '退出登录',
      loggingOut: '正在退出'
    },
    nav: {
      mainMenu: '主菜单',
      home: '首页',
      map: '无障碍地图',
      jobs: '快速匹配职位推荐',
      business: '我的信息',
      profile: '用户菜单',
      settings: '设置',
      loginRequired: '需要登录'
    },
    footer: {
      backToTop: '返回页面顶部',
      description: '连接劳动的桥梁，Bridgework',
      socials: 'Bridgework 社交频道',
      policies: 'Bridgework 政策',
      terms: '服务使用条款',
      privacy: '隐私政策',
      privacyConsent: '个人信息收集和使用同意',
      marketingConsent: '营销信息接收同意',
      thirdParty: '第三方提供同意',
      outsourcing: '个人信息委托处理说明'
    }
  },
  en: {
    common: {
      loadingTitle: 'Preparing Screen',
      loadingDescription: 'Loading the requested screen.',
      loadingLabel: 'Loading screen.',
      languageSelect: 'Select language'
    },
    header: {
      brandLabel: 'Go to the Bridgework homepage',
      searchLabel: 'Accessibility map origin search',
      searchInputLabel: 'Enter an accessibility map origin',
      searchButtonLabel: 'Search origin',
      userMenuLabel: 'User menu',
      login: 'Sign up / Log in',
      logout: 'Log out',
      loggingOut: 'Logging out'
    },
    nav: {
      mainMenu: 'Main menu',
      home: 'Home',
      map: 'Accessibility Map',
      jobs: 'Quick Job Matches',
      business: 'My Info',
      profile: 'User menu',
      settings: 'Settings',
      loginRequired: 'Login required'
    },
    footer: {
      backToTop: 'Back to top',
      description: 'Bridgework, connecting people to work',
      socials: 'Bridgework social channels',
      policies: 'Bridgework policies',
      terms: 'Terms of Service',
      privacy: 'Privacy Policy',
      privacyConsent: 'Personal Information Collection and Use Consent',
      marketingConsent: 'Marketing Communications Consent',
      thirdParty: 'Third-party Provision Consent',
      outsourcing: 'Personal Information Processing Outsourcing Notice'
    }
  },
  ja: {
    common: {
      loadingTitle: '画面準備',
      loadingDescription: 'リクエストされた画面を読み込んでいます。',
      loadingLabel: '画面を読み込んでいます。',
      languageSelect: '言語を選択'
    },
    header: {
      brandLabel: 'Bridgework ホームページへ移動',
      searchLabel: 'アクセシビリティ地図の出発地検索',
      searchInputLabel: 'アクセシビリティ地図の出発地を入力',
      searchButtonLabel: '出発地を検索',
      userMenuLabel: 'ユーザーメニュー',
      login: '登録/ログイン',
      logout: 'ログアウト',
      loggingOut: 'ログアウト中'
    },
    nav: {
      mainMenu: 'メインメニュー',
      home: 'ホーム',
      map: 'アクセシビリティ地図',
      jobs: 'クイック求人推薦',
      business: 'マイ情報',
      profile: 'ユーザーメニュー',
      settings: '設定',
      loginRequired: 'ログインが必要'
    },
    footer: {
      backToTop: 'ページ上部へ移動',
      description: '仕事をつなぐ橋、Bridgework',
      socials: 'Bridgework ソーシャルチャンネル',
      policies: 'Bridgework ポリシー',
      terms: '利用規約',
      privacy: 'プライバシーポリシー',
      privacyConsent: '個人情報の収集・利用同意',
      marketingConsent: 'マーケティング情報受信同意',
      thirdParty: '第三者提供同意',
      outsourcing: '個人情報処理委託案内'
    }
  }
});

export function getMessage(messages, key) {
  return key.split('.').reduce((value, segment) => value?.[segment], messages) || key;
}
