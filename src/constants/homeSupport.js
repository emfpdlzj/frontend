import comwelLogo from '../assets/home-support/comwel-logo.png';
import hrdkLogo from '../assets/home-support/hrdk-logo.svg';
import jobworldLogo from '../assets/home-support/jobworld-logo.png';
import keadLogo from '../assets/home-support/kead-logo.svg';
import keisLogo from '../assets/home-support/keis-logo.png';
import koshaLogo from '../assets/home-support/kosha-logo.png';
import moelLogo from '../assets/home-support/moel-logo.png';
import socialenterpriseLogo from '../assets/home-support/socialenterprise-logo.png';

export const HOME_SUPPORT_SECTION_COPY = Object.freeze({
  ko: {
    eyebrow: '관련 공공기관',
    title: '취업에 도움되는 공공기관',
    description: '기관 로고를 누르면 새 탭에서 공식 사이트로 이동합니다.',
    ariaLabel: '장애인 취업 관련 정부기관 및 공공기관 링크 목록',
    newTabLabel: '새 탭 열기',
    cta: '기관 바로가기'
  },
  en: {
    eyebrow: 'Public Support',
    title: 'Employment and Labor Support Organizations',
    description: 'Click to open each organization website in a new tab.',
    ariaLabel: 'Government and public employment support organization links',
    newTabLabel: 'Open in new tab',
    cta: 'Visit organization'
  },
  ja: {
    eyebrow: '関連公共機関',
    title: '障害者就職・労働支援機関',
    description: 'クリックすると各機関のサイトを新しいタブで開きます。',
    ariaLabel: '障害者就職関連の政府・公共機関リンク一覧',
    newTabLabel: '新しいタブで開く',
    cta: '機関サイトへ'
  },
  'zh-CN': {
    eyebrow: '相关公共机构',
    title: '残障人士就业与劳动支持机构',
    description: '点击后将在新标签页打开对应机构网站。',
    ariaLabel: '残障人士就业相关政府及公共机构链接列表',
    newTabLabel: '新标签页打开',
    cta: '前往机构网站'
  }
});

export const HOME_SUPPORT_ORGANIZATIONS = Object.freeze([
  {
    id: 'moel',
    url: 'https://www.moel.go.kr/',
    logo: moelLogo,
    accent: '#0b5fd3',
    name: {
      ko: '고용노동부',
      en: 'Ministry of Employment and Labor',
      ja: '雇用労働部',
      'zh-CN': '雇佣劳动部'
    },
    category: {
      ko: '정책·고용서비스',
      en: 'Policy · Employment Services',
      ja: '政策・雇用サービス',
      'zh-CN': '政策·就业服务'
    },
    description: {
      ko: '고용정책과 노동권 보호, 일자리 제도를 총괄하는 중앙행정기관입니다.',
      en: 'The central government agency overseeing employment policy, labor rights, and job systems.',
      ja: '雇用政策、労働権保護、雇用制度を総括する中央行政機関です。',
      'zh-CN': '统筹就业政策、劳动权益保护和就业制度的中央行政机关。'
    }
  },
  {
    id: 'kead',
    url: 'https://www.kead.or.kr/',
    logo: keadLogo,
    accent: '#00a0b6',
    name: {
      ko: '한국장애인고용공단',
      en: 'Korea Employment Agency for Persons with Disabilities',
      ja: '韓国障害者雇用公団',
      'zh-CN': '韩国残障人雇佣公团'
    },
    category: {
      ko: '장애인 고용지원',
      en: 'Disability Employment Support',
      ja: '障害者雇用支援',
      'zh-CN': '残障人就业支持'
    },
    description: {
      ko: '장애인 채용 연계, 직무개발, 보조공학과 근로지원인 사업을 지원합니다.',
      en: 'Supports disability hiring, job design, assistive technology, and workplace support services.',
      ja: '障害者採用連携、職務開発、補助工学、就労支援員事業を支援します。',
      'zh-CN': '支持残障人招聘对接、岗位开发、辅助工学和职场支持服务。'
    }
  },
  {
    id: 'keis',
    url: 'https://keis.or.kr/keis/ko/index.do',
    logo: keisLogo,
    logoClassName: 'is-keis',
    accent: '#4c67cf',
    name: {
      ko: '한국고용정보원',
      en: 'Korea Employment Information Service',
      ja: '韓国雇用情報院',
      'zh-CN': '韩国雇佣信息院'
    },
    category: {
      ko: '고용정보·진로데이터',
      en: 'Employment Data · Career Info',
      ja: '雇用情報・進路データ',
      'zh-CN': '就业信息·职业数据'
    },
    description: {
      ko: '고용정보와 직업·진로 데이터를 제공해 취업 준비와 탐색을 돕습니다.',
      en: 'Provides employment, job, and career data to support job search and planning.',
      ja: '雇用情報と職業・進路データを提供し、就職準備と探索を支援します。',
      'zh-CN': '提供就业、职业与生涯数据，帮助求职准备与职业探索。'
    }
  },
  {
    id: 'comwel',
    url: 'https://www.comwel.or.kr/',
    logo: comwelLogo,
    logoClassName: 'is-comwel',
    accent: '#ff8c42',
    name: {
      ko: '근로복지공단',
      en: 'Korea Workers’ Compensation & Welfare Service',
      ja: '勤労福祉公団',
      'zh-CN': '勤劳福利公团'
    },
    category: {
      ko: '근로복지·재활지원',
      en: 'Worker Welfare · Rehabilitation',
      ja: '勤労福祉・リハビリ支援',
      'zh-CN': '劳动福利·康复支持'
    },
    description: {
      ko: '산재보상, 재활, 근로자 복지와 일상 복귀 지원 정보를 제공합니다.',
      en: 'Provides information on compensation, rehabilitation, worker welfare, and return-to-work support.',
      ja: '労災補償、リハビリ、勤労者福祉、職場復帰支援情報を提供します。',
      'zh-CN': '提供工伤补偿、康复、劳动福利与返岗支持信息。'
    }
  },
  {
    id: 'hrdk',
    url: 'https://www.hrdkorea.or.kr/',
    logo: hrdkLogo,
    accent: '#0c8f63',
    name: {
      ko: '한국산업인력공단',
      en: 'HRD Korea',
      ja: '韓国産業人力公団',
      'zh-CN': '韩国产业人力公团'
    },
    category: {
      ko: '직업훈련·자격',
      en: 'Training · Certification',
      ja: '職業訓練・資格',
      'zh-CN': '职业培训·资格认证'
    },
    description: {
      ko: '직업훈련, 국가자격, 능력개발 정보를 통해 취업 역량 강화를 돕습니다.',
      en: 'Supports employability with vocational training, certifications, and skills development.',
      ja: '職業訓練、国家資格、能力開発情報で就業力強化を支援します。',
      'zh-CN': '通过职业培训、国家资格和能力开发信息帮助提升就业能力。'
    }
  },
  {
    id: 'kosha',
    url: 'https://www.kosha.or.kr/',
    logo: koshaLogo,
    logoClassName: 'is-kosha',
    accent: '#1d56bc',
    name: {
      ko: '안전보건공단',
      en: 'KOSHA',
      ja: '安全保健公団',
      'zh-CN': '安全保健公团'
    },
    category: {
      ko: '산업안전·보건',
      en: 'Workplace Safety · Health',
      ja: '産業安全・保健',
      'zh-CN': '产业安全·保健'
    },
    description: {
      ko: '안전한 근무환경 조성을 위한 산업안전·보건 정보와 지원사업을 제공합니다.',
      en: 'Provides workplace safety, occupational health information, and prevention support programs.',
      ja: '安全な勤務環境づくりのための産業安全・保健情報と支援事業を提供します。',
      'zh-CN': '提供构建安全工作环境所需的产业安全、职业健康信息与支持项目。'
    }
  },
  {
    id: 'socialenterprise',
    url: 'https://www.socialenterprise.or.kr/',
    logo: socialenterpriseLogo,
    logoClassName: 'is-socialenterprise',
    accent: '#14a05b',
    name: {
      ko: '한국사회적기업진흥원',
      en: 'Korea Social Enterprise Promotion Agency',
      ja: '韓国社会的企業振興院',
      'zh-CN': '韩国社会企业振兴院'
    },
    category: {
      ko: '사회적경제·판로지원',
      en: 'Social Economy · Market Support',
      ja: '社会的経済・販路支援',
      'zh-CN': '社会经济·市场支持'
    },
    description: {
      ko: '사회적기업과 협동조합의 성장, 판로, 공공서비스 연계를 지원합니다.',
      en: 'Supports growth, market access, and public-service connections for social enterprises.',
      ja: '社会的企業と協同組合の成長、販路、公共サービス連携を支援します。',
      'zh-CN': '支持社会企业与合作社的成长、销售渠道和公共服务衔接。'
    }
  },
  {
    id: 'jobworld',
    url: 'https://www.koreajobworld.or.kr/',
    logo: jobworldLogo,
    logoClassName: 'is-jobworld',
    accent: '#0177c0',
    name: {
      ko: '한국잡월드',
      en: 'Korea Job World',
      ja: '韓国ジョブワールド',
      'zh-CN': '韩国Job World'
    },
    category: {
      ko: '진로체험·직업탐색',
      en: 'Career Experience · Exploration',
      ja: '進路体験・職業探索',
      'zh-CN': '职业体验·职业探索'
    },
    description: {
      ko: '직업체험과 진로설계 콘텐츠를 통해 다양한 일 경험과 진로 탐색을 돕습니다.',
      en: 'Offers career experiences and planning content to explore different jobs and futures.',
      ja: '職業体験と進路設計コンテンツを通じて多様な仕事体験と進路探索を支援します。',
      'zh-CN': '通过职业体验与生涯设计内容帮助探索不同工作与职业方向。'
    }
  }
]);
