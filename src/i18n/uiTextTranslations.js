const UI_TEXT_TRANSLATIONS = {
  '닫기': { zh: '关闭', en: 'Close', ja: '閉じる' },
  '다시 시도': { zh: '重试', en: 'Retry', ja: '再試行' },
  '취소': { zh: '取消', en: 'Cancel', ja: 'キャンセル' },
  '삭제': { zh: '删除', en: 'Delete', ja: '削除' },
  '저장 중...': { zh: '保存中...', en: 'Saving...', ja: '保存中...' },
  '계산 중': { zh: '计算中', en: 'Calculating', ja: '計算中' },
  '로딩 중': { zh: '加载中', en: 'Loading', ja: '読み込み中' },
  '확인 필요': { zh: '需要确认', en: 'Needs confirmation', ja: '確認が必要' },
  '데이터 미확인': { zh: '数据未确认', en: 'Data not confirmed', ja: 'データ未確認' },
  '접근 양호': { zh: '通行良好', en: 'Accessible', ja: 'アクセス良好' },
  '주의 필요': { zh: '需要注意', en: 'Caution needed', ja: '注意が必要' },
  '접근 어려움': { zh: '通行困难', en: 'Access difficult', ja: 'アクセス困難' },
  '문제 없음': { zh: '无问题', en: 'No issue', ja: '問題なし' },
  '주의': { zh: '注意', en: 'Caution', ja: '注意' },
  '불편/위험': { zh: '不便/风险', en: 'Difficult/Risky', ja: '不便/危険' },
  '필수': { zh: '必填', en: 'Required', ja: '必須' },
  '선택 입력': { zh: '选填', en: 'Optional', ja: '任意入力' },
  '선택하세요': { zh: '请选择', en: 'Select', ja: '選択してください' },
  '선택해주세요.': { zh: '请选择。', en: 'Please select.', ja: '選択してください。' },
  '전체': { zh: '全部', en: 'All', ja: 'すべて' },
  '예': { zh: '是', en: 'Yes', ja: 'はい' },
  '아니오': { zh: '否', en: 'No', ja: 'いいえ' },
  '기타': { zh: '其他', en: 'Other', ja: 'その他' },
  '무관': { zh: '不限', en: 'Any', ja: '不問' },
  '로그인 필요': { zh: '需要登录', en: 'Login required', ja: 'ログインが必要' },
  '로그인 후 확인': { zh: '登录后查看', en: 'Check after login', ja: 'ログイン後に確認' },
  '로그인하기': { zh: '登录', en: 'Log in', ja: 'ログイン' },
  '회원가입/로그인': { zh: '注册/登录', en: 'Sign up / Log in', ja: '登録/ログイン' },
  '로그아웃': { zh: '退出登录', en: 'Log out', ja: 'ログアウト' },
  '로그아웃 중': { zh: '正在退出', en: 'Logging out', ja: 'ログアウト中' },
  '카카오로 시작하기': { zh: '使用 Kakao 开始', en: 'Continue with Kakao', ja: 'Kakaoで始める' },
  '네이버로 시작하기': { zh: '使用 Naver 开始', en: 'Continue with Naver', ja: 'Naverで始める' },
  '노동을 잇는 다리, 브릿지워크': {
    zh: '连接劳动的桥梁，Bridgework',
    en: 'Bridgework, connecting people to work',
    ja: '仕事をつなぐ橋、Bridgework'
  },
  '법률 문서 번역 제한 안내': {
    zh: '法律文件翻译限制说明',
    en: 'Legal document translation notice',
    ja: '法的文書の翻訳制限に関する案内'
  },
  '약관 및 정책 문서는 권리·의무 해석과 규제 리스크를 줄이기 위해 한국어 원문을 기준으로 제공합니다. 의미가 달라질 수 있는 자동 번역은 제공하지 않으며, 필요한 경우 한국어 원문 또는 고객센터 안내를 확인해 주세요.': {
    zh: '条款和政策文件以韩文原文为准，以减少权利义务解释和合规风险。可能改变含义的自动翻译不予提供；如有需要，请查看韩文原文或联系客户支持。',
    en: 'Terms and policy documents are provided with the Korean original as the authoritative text to reduce interpretation and regulatory risk. Automated translation is not provided where meaning may change; please refer to the Korean original or contact support if needed.',
    ja: '規約およびポリシー文書は、権利・義務の解釈と規制上のリスクを抑えるため、韓国語原文を基準として提供しています。意味が変わる可能性のある自動翻訳は提供していません。必要に応じて韓国語原文またはカスタマーサポートの案内をご確認ください。'
  },
  '소셜 로그인 처리': { zh: '处理社交登录', en: 'Processing social login', ja: 'ソーシャルログイン処理' },
  '소셜 로그인 검증 중...': { zh: '正在验证社交登录...', en: 'Verifying social login...', ja: 'ソーシャルログインを確認中...' },
  '서버 로그인 처리 중...': { zh: '服务器正在处理登录...', en: 'Processing login on server...', ja: 'サーバーでログイン処理中...' },
  '소셜 로그인 처리에 실패했습니다.': { zh: '社交登录处理失败。', en: 'Social login failed.', ja: 'ソーシャルログイン処理に失敗しました。' },
  '소셜 로그인 state 검증에 실패했습니다. 다시 로그인해 주세요.': {
    zh: '社交登录 state 验证失败。请重新登录。',
    en: 'Social login state verification failed. Please log in again.',
    ja: 'ソーシャルログインの state 検証に失敗しました。もう一度ログインしてください。'
  },
  '지원하지 않는 소셜 로그인 경로입니다.': {
    zh: '不支持的社交登录路径。',
    en: 'This social login route is not supported.',
    ja: '対応していないソーシャルログイン経路です。'
  },
  '인가 코드가 누락되었습니다.': { zh: '缺少授权码。', en: 'Authorization code is missing.', ja: '認可コードがありません。' },
  '온보딩 저장': { zh: '保存入门信息', en: 'Save onboarding', ja: 'オンボーディングを保存' },
  '온보딩 저장에 실패했습니다.': { zh: '入门信息保存失败。', en: 'Failed to save onboarding.', ja: 'オンボーディングの保存に失敗しました。' },
  '가입 완료': { zh: '注册完成', en: 'Sign-up complete', ja: '登録完了' },
  '가입 처리 중...': { zh: '正在处理注册...', en: 'Completing sign-up...', ja: '登録処理中...' },
  '다음 단계': { zh: '下一步', en: 'Next step', ja: '次へ' },
  '이전 단계': { zh: '上一步', en: 'Previous step', ja: '前へ' },
  '완료': { zh: '完成', en: 'Done', ja: '完了' },
  '기본 정보': { zh: '基本信息', en: 'Basic Info', ja: '基本情報' },
  '개인 정보': { zh: '个人信息', en: 'Personal Info', ja: '個人情報' },
  '직무·경력': { zh: '职位与经历', en: 'Job and Career', ja: '職務・経歴' },
  '근무 조건': { zh: '工作条件', en: 'Work Conditions', ja: '勤務条件' },
  '장애 정보': { zh: '残障信息', en: 'Disability Info', ja: '障害情報' },
  '자기소개': { zh: '自我介绍', en: 'Introduction', ja: '自己紹介' },
  '학력·경력': { zh: '学历与经历', en: 'Education and Career', ja: '学歴・経歴' },
  '직무 역량': { zh: '职业能力', en: 'Job Skills', ja: '職務能力' },
  '장애·지원 정보': { zh: '残障与支持信息', en: 'Disability and Support Info', ja: '障害・支援情報' },
  'AI 추천 태그': { zh: 'AI 推荐标签', en: 'AI Recommendation Tags', ja: 'AI推薦タグ' },
  '희망 직무': { zh: '期望职位', en: 'Desired Job', ja: '希望職務' },
  '통근 범위': { zh: '通勤范围', en: 'Commute Range', ja: '通勤範囲' },
  '선호 업무환경': { zh: '偏好的工作环境', en: 'Preferred Work Environment', ja: '希望する職場環境' },
  '기피 업무환경': { zh: '希望避免的工作环境', en: 'Avoided Work Environment', ja: '避けたい職場環境' },
  '필요 지원사항': { zh: '所需支持事项', en: 'Required Support', ja: '必要な支援' },
  '이름': { zh: '姓名', en: 'Name', ja: '氏名' },
  '연락처': { zh: '联系方式', en: 'Contact', ja: '連絡先' },
  '이메일': { zh: '电子邮箱', en: 'Email', ja: 'メール' },
  '거주지': { zh: '居住地', en: 'Residence', ja: '居住地' },
  '생년월일': { zh: '出生日期', en: 'Date of Birth', ja: '生年月日' },
  '연령대': { zh: '年龄段', en: 'Age Range', ja: '年齢層' },
  '상세 주소': { zh: '详细地址', en: 'Detailed Address', ja: '詳細住所' },
  '비상연락처': { zh: '紧急联系人', en: 'Emergency Contact', ja: '緊急連絡先' },
  '최종 학력': { zh: '最高学历', en: 'Highest Education', ja: '最終学歴' },
  '졸업 상태': { zh: '毕业状态', en: 'Graduation Status', ja: '卒業状況' },
  '주요 경력': { zh: '主要经历', en: 'Main Experience', ja: '主な経歴' },
  '경력 요약': { zh: '经历摘要', en: 'Career Summary', ja: '経歴概要' },
  '학력 요약': { zh: '学历摘要', en: 'Education Summary', ja: '学歴概要' },
  '희망 고용형태': { zh: '期望雇用形式', en: 'Desired Employment Type', ja: '希望雇用形態' },
  '지원 직무': { zh: '目标职位', en: 'Target Job', ja: '応募職務' },
  '장애 유형': { zh: '残障类型', en: 'Disability Type', ja: '障害種別' },
  '보유 기술/역량': { zh: '技能/能力', en: 'Skills/Competencies', ja: '保有スキル・能力' },
  '자격증': { zh: '证书', en: 'Certificates', ja: '資格' },
  '근무 형태': { zh: '工作形式', en: 'Work Type', ja: '勤務形態' },
  '근무 가능 시점': { zh: '可开始工作时间', en: 'Available Start Date', ja: '勤務開始可能時期' },
  '장애 여부': { zh: '残障状态', en: 'Disability Status', ja: '障害の有無' },
  '장애 등록 여부': { zh: '残障登记状态', en: 'Disability Registration', ja: '障害者登録の有無' },
  '장애 정도': { zh: '残障程度', en: 'Disability Severity', ja: '障害程度' },
  '재택 가능 여부': { zh: '是否可远程工作', en: 'Remote Work Availability', ja: '在宅勤務可否' },
  '지원 요구사항': { zh: '支持需求', en: 'Support Requirements', ja: '支援要件' },
  '보조기기': { zh: '辅助设备', en: 'Assistive Device', ja: '補助機器' },
  '지원 동기': { zh: '申请动机', en: 'Motivation', ja: '志望動機' },
  '직무 적합성 설명': { zh: '职位适配说明', en: 'Job Fit Description', ja: '職務適性説明' },
  '중장기 커리어 목표': { zh: '中长期职业目标', en: 'Mid/Long-term Career Goal', ja: '中長期キャリア目標' },
  '즉시 가능': { zh: '可立即开始', en: 'Available Immediately', ja: '即時可能' },
  '1개월 이내': { zh: '1个月内', en: 'Within 1 Month', ja: '1か月以内' },
  '협의 가능': { zh: '可协商', en: 'Negotiable', ja: '相談可能' },
  '중증': { zh: '重度', en: 'Severe', ja: '重度' },
  '중등도': { zh: '中度', en: 'Moderate', ja: '中等度' },
  '경증': { zh: '轻度', en: 'Mild', ja: '軽度' },
  '해당 없음': { zh: '不适用', en: 'Not Applicable', ja: '該当なし' },
  '졸업': { zh: '已毕业', en: 'Graduated', ja: '卒業' },
  '졸업예정': { zh: '预计毕业', en: 'Expected Graduation', ja: '卒業予定' },
  '재학': { zh: '在读', en: 'Enrolled', ja: '在学' },
  '수료': { zh: '已结业', en: 'Completed', ja: '修了' },
  '중퇴': { zh: '中途退学', en: 'Dropped Out', ja: '中退' },
  '남성': { zh: '男性', en: 'Male', ja: '男性' },
  '여성': { zh: '女性', en: 'Female', ja: '女性' },
  '선택 안 함': { zh: '不选择', en: 'Prefer not to say', ja: '選択しない' },
  '고졸 이하': { zh: '高中及以下', en: 'High School or Below', ja: '高卒以下' },
  '고졸': { zh: '高中毕业', en: 'High School', ja: '高卒' },
  '전문대졸': { zh: '专科毕业', en: 'College', ja: '専門卒' },
  '대졸': { zh: '本科毕业', en: 'Bachelor', ja: '大卒' },
  '석사': { zh: '硕士', en: 'Master', ja: '修士' },
  '박사': { zh: '博士', en: 'Doctorate', ja: '博士' },
  '등록됨': { zh: '已登记', en: 'Registered', ja: '登録済み' },
  '등록 안 됨': { zh: '未登记', en: 'Not Registered', ja: '未登録' },
  '내 프로필': { zh: '我的资料', en: 'My Profiles', ja: 'マイプロフィール' },
  '프로필 추가': { zh: '添加资料', en: 'Add Profile', ja: 'プロフィール追加' },
  '프로필 삭제': { zh: '删除资料', en: 'Delete Profile', ja: 'プロフィール削除' },
  '프로필 추가 완료': { zh: '完成添加资料', en: 'Finish Adding Profile', ja: 'プロフィール追加完了' },
  '변경사항 저장': { zh: '保存更改', en: 'Save Changes', ja: '変更を保存' },
  '기본 프로필로 설정': { zh: '设为默认资料', en: 'Set as Default Profile', ja: '基本プロフィールに設定' },
  '기본': { zh: '默认', en: 'Default', ja: '基本' },
  '작성 중': { zh: '填写中', en: 'Drafting', ja: '作成中' },
  '임시저장 있음': { zh: '有草稿', en: 'Draft Available', ja: '一時保存あり' },
  '현재 작성중': { zh: '当前填写中', en: 'Currently Drafting', ja: '現在作成中' },
  '프로필 목록을 불러오는 중입니다.': { zh: '正在加载个人资料列表。', en: 'Loading profile list.', ja: 'プロフィール一覧を読み込んでいます。' },
  '프로필 상세 정보를 불러오는 중입니다.': { zh: '正在加载个人资料详情。', en: 'Loading profile details.', ja: 'プロフィール詳細を読み込んでいます。' },
  '등록된 프로필이 없습니다. 회원가입 완료 후 기본 프로필이 생성됩니다.': {
    zh: '没有已注册的个人资料。注册完成后会创建默认个人资料。',
    en: 'No profiles are registered. A default profile is created after sign-up is complete.',
    ja: '登録済みプロフィールがありません。登録完了後に基本プロフィールが作成されます。'
  },
  '프로필은 최대 3개까지 등록할 수 있습니다.': {
    zh: '最多可注册 3 个个人资料。',
    en: 'You can register up to 3 profiles.',
    ja: 'プロフィールは最大3件まで登録できます。'
  },
  '기본 프로필은 삭제할 수 없습니다.': {
    zh: '默认个人资料不能删除。',
    en: 'The default profile cannot be deleted.',
    ja: '基本プロフィールは削除できません。'
  },
  '공고 필터': { zh: '职位筛选', en: 'Job Filters', ja: '求人フィルター' },
  '공고 검색 및 필터': { zh: '职位搜索和筛选', en: 'Job Search and Filters', ja: '求人検索・フィルター' },
  '상세 필터': { zh: '高级筛选', en: 'Advanced Filters', ja: '詳細フィルター' },
  '상세 필터 열기': { zh: '打开高级筛选', en: 'Open Advanced Filters', ja: '詳細フィルターを開く' },
  '상세 필터 닫기': { zh: '关闭高级筛选', en: 'Close Advanced Filters', ja: '詳細フィルターを閉じる' },
  '검색어': { zh: '搜索词', en: 'Search Term', ja: '検索語' },
  '정렬 기준': { zh: '排序方式', en: 'Sort By', ja: '並び替え基準' },
  '최신순': { zh: '最新', en: 'Newest', ja: '新着順' },
  '직무 적합도 높은순': { zh: '岗位匹配度高', en: 'Highest Job Fit', ja: '職務適合度が高い順' },
  '마감임박순': { zh: '即将截止', en: 'Deadline Soon', ja: '締切間近順' },
  '임금 높은순': { zh: '薪资较高', en: 'Highest Pay', ja: '賃金が高い順' },
  '공고 목록': { zh: '职位列表', en: 'Job List', ja: '求人一覧' },
  '공고 상세 패널': { zh: '职位详情面板', en: 'Job Detail Panel', ja: '求人詳細パネル' },
  '공고 상세 탭': { zh: '职位详情标签', en: 'Job Detail Tabs', ja: '求人詳細タブ' },
  '공고정보': { zh: '职位信息', en: 'Job Info', ja: '求人情報' },
  '기업정보': { zh: '企业信息', en: 'Company Info', ja: '企業情報' },
  '기업 정보': { zh: '企业信息', en: 'Company Info', ja: '企業情報' },
  '지원하기': { zh: '申请', en: 'Apply', ja: '応募する' },
  '관심 공고로 저장': { zh: '保存职位', en: 'Save Job', ja: '気になる求人に保存' },
  '공고 공유': { zh: '分享职位', en: 'Share Job', ja: '求人を共有' },
  '지원 정보 확인 필요': { zh: '申请信息需确认', en: 'Support Info Needs Confirmation', ja: '応募情報の確認が必要' },
  '급여': { zh: '薪资', en: 'Pay', ja: '給与' },
  '지역': { zh: '地区', en: 'Region', ja: '地域' },
  '고용형태': { zh: '雇用形式', en: 'Employment Type', ja: '雇用形態' },
  '마감': { zh: '截止', en: 'Deadline', ja: '締切' },
  '경력 조건': { zh: '经验要求', en: 'Experience', ja: '経歴条件' },
  '요구학력': { zh: '学历要求', en: 'Education Requirement', ja: '必要学歴' },
  '요구자격': { zh: '资格要求', en: 'Required Qualifications', ja: '必要資格' },
  '교통 필터': { zh: '交通筛选', en: 'Transit Filters', ja: '交通フィルター' },
  'AI 스코어링': { zh: 'AI 评分', en: 'AI Scoring', ja: 'AIスコアリング' },
  '초기화': { zh: '重置', en: 'Reset', ja: 'リセット' },
  '조건 적용': { zh: '应用条件', en: 'Apply Conditions', ja: '条件を適用' },
  '필터 옵션을 불러오는 중입니다.': { zh: '正在加载筛选选项。', en: 'Loading filter options.', ja: 'フィルター項目を読み込んでいます。' },
  '필터 옵션을 불러오지 못했습니다.': { zh: '无法加载筛选选项。', en: 'Failed to load filter options.', ja: 'フィルター項目を読み込めませんでした。' },
  '조건 적용을 누르면 회사 공고가 지도와 목록에 표시됩니다.': {
    zh: '点击应用条件后，公司职位会显示在地图和列表中。',
    en: 'Apply conditions to show company jobs on the map and list.',
    ja: '条件を適用すると、企業求人が地図と一覧に表示されます。'
  },
  '현재 조건에 맞는 공고가 없습니다.': { zh: '没有符合当前条件的职位。', en: 'No jobs match the current conditions.', ja: '現在の条件に合う求人はありません。' },
  '필터 조건을 완화해보세요.': { zh: '请放宽筛选条件。', en: 'Try relaxing the filters.', ja: 'フィルター条件を緩めてください。' },
  '지역 접근성 지도 추천을 불러오는 중입니다.': {
    zh: '正在加载区域无障碍地图推荐。',
    en: 'Loading regional accessibility map recommendations.',
    ja: '地域アクセシビリティ地図推薦を読み込んでいます。'
  },
  '선택한 프로필 기준으로 접근성 점수를 다시 계산하고 있습니다.': {
    zh: '正在根据所选个人资料重新计算无障碍分数。',
    en: 'Recalculating accessibility scores for the selected profile.',
    ja: '選択したプロフィール基準でアクセシビリティスコアを再計算しています。'
  },
  '교통수단': { zh: '交通方式', en: 'Transit Mode', ja: '交通手段' },
  '통근시간': { zh: '通勤时间', en: 'Commute Time', ja: '通勤時間' },
  '환승 선호도': { zh: '换乘偏好', en: 'Transfer Preference', ja: '乗換の希望' },
  '1차': { zh: '一级', en: 'Level 1', ja: '1次' },
  '2차': { zh: '二级', en: 'Level 2', ja: '2次' },
  '3차': { zh: '三级', en: 'Level 3', ja: '3次' },
  '접근성 지도': { zh: '无障碍地图', en: 'Accessibility Map', ja: 'アクセシビリティ地図' },
  '접근성 점수': { zh: '无障碍评分', en: 'Accessibility Score', ja: 'アクセシビリティスコア' },
  '추천 설명': { zh: '推荐说明', en: 'Recommendation Explanation', ja: '推薦説明' },
  '추천 이유': { zh: '推荐理由', en: 'Recommendation Reason', ja: '推薦理由' },
  '주의점': { zh: '注意事项', en: 'Caution Point', ja: '注意点' },
  '체크리스트': { zh: '检查清单', en: 'Checklist', ja: 'チェックリスト' },
  '상세정보': { zh: '详细信息', en: 'Details', ja: '詳細情報' },
  '사업장 주소': { zh: '工作地点地址', en: 'Workplace Address', ja: '事業所住所' },
  '기업 형태': { zh: '企业类型', en: 'Company Type', ja: '企業形態' },
  '표준사업장': { zh: '标准工作场所', en: 'Standard Workplace', ja: '標準事業所' },
  '장애인 고용 현황': { zh: '残障人士雇用情况', en: 'Disability Employment Status', ja: '障害者雇用状況' },
  '모집 마감까지': { zh: '距截止', en: 'Until Deadline', ja: '募集締切まで' },
  '경로 안내': { zh: '路线指引', en: 'Route Guidance', ja: '経路案内' },
  '지도 확대': { zh: '放大地图', en: 'Zoom in map', ja: '地図を拡大' },
  '지도 축소': { zh: '缩小地图', en: 'Zoom out map', ja: '地図を縮小' },
  '네이버 지도를 불러오는 중입니다...': { zh: '正在加载 Naver 地图...', en: 'Loading Naver Map...', ja: 'Naver地図を読み込んでいます...' },
  '네이버 지도를 표시하지 못했습니다.': { zh: '无法显示 Naver 地图。', en: 'Could not display Naver Map.', ja: 'Naver地図を表示できませんでした。' },
  '지도 데이터를 불러오지 못했습니다. 다시 시도해주세요.': {
    zh: '无法加载地图数据。请重试。',
    en: 'Failed to load map data. Please retry.',
    ja: '地図データを読み込めませんでした。再試行してください。'
  },
  '홈': { zh: '首页', en: 'Home', ja: 'ホーム' },
  '빠른 이동': { zh: '快速入口', en: 'Quick Links', ja: 'クイック移動' },
  '접근성 요약': { zh: '无障碍摘要', en: 'Accessibility Summary', ja: 'アクセシビリティ概要' },
  '추천 공고 보기': { zh: '查看推荐职位', en: 'View Recommended Jobs', ja: '推薦求人を見る' },
  '지도에서 탐색': { zh: '在地图中查看', en: 'Explore on Map', ja: '地図で探す' },
  '지도에서 자세히 보기': { zh: '在地图中查看详情', en: 'View Details on Map', ja: '地図で詳しく見る' },
  '더보기': { zh: '查看更多', en: 'More', ja: 'もっと見る' },
  '추천 공고 더보기': { zh: '查看更多推荐职位', en: 'View More Recommended Jobs', ja: '推薦求人をもっと見る' },
  '내 프로필 기반 추천 공고': { zh: '基于我的资料推荐', en: 'Recommended Jobs Based on My Profile', ja: 'プロフィール基準の推薦求人' },
  '내 추천 현황 요약': { zh: '我的推荐摘要', en: 'My Recommendation Summary', ja: '推薦状況の概要' },
  '추천 → 비교 → 지원': { zh: '推荐 → 比较 → 申请', en: 'Recommend → Compare → Apply', ja: '推薦 → 比較 → 応募' },
  '접근성 참고': { zh: '无障碍参考', en: 'Accessibility Note', ja: 'アクセシビリティ参考' },
  '상세에서 확인': { zh: '在详情中确认', en: 'Check details', ja: '詳細で確認' },
  '로그인하면 프로필 기반 추천 공고를 확인할 수 있습니다.': {
    zh: '登录后可查看基于个人资料的推荐职位。',
    en: 'Log in to view profile-based job recommendations.',
    ja: 'ログインするとプロフィール基準の推薦求人を確認できます。'
  },
  '추천 공고를 불러오지 못했습니다.': { zh: '无法加载推荐职位。', en: 'Failed to load recommended jobs.', ja: '推薦求人を読み込めませんでした。' },
  '추천 정확도를 높이려면 프로필을 먼저 입력해주세요.': {
    zh: '请先填写个人资料以提高推荐准确度。',
    en: 'Fill in your profile first to improve recommendation accuracy.',
    ja: '推薦精度を高めるには、先にプロフィールを入力してください。'
  },
  '현재 조건에 맞는 추천 공고가 없습니다. 프로필 또는 조건을 조금 넓혀보세요.': {
    zh: '没有符合当前条件的推荐职位。请放宽个人资料或条件。',
    en: 'No recommended jobs match the current conditions. Try broadening your profile or filters.',
    ja: '現在の条件に合う推薦求人はありません。プロフィールまたは条件を少し広げてください。'
  },
  '페이지를 찾을 수 없습니다.': { zh: '找不到页面。', en: 'Page not found.', ja: 'ページが見つかりません。' },
  '문제가 생겼나요?': { zh: '遇到问题了吗？', en: 'Having trouble?', ja: '問題が発生しましたか？' },
  '문의 메일 :': { zh: '联系邮箱：', en: 'Contact email:', ja: '問い合わせメール:' },
  '카톡 상담채널': { zh: 'KakaoTalk 咨询频道', en: 'KakaoTalk Support Channel', ja: 'KakaoTalk相談チャンネル' },
  '설정': { zh: '设置', en: 'Settings', ja: '設定' },
  '계정': { zh: '账户', en: 'Account', ja: 'アカウント' },
  '접근성': { zh: '无障碍', en: 'Accessibility', ja: 'アクセシビリティ' },
  '알림': { zh: '通知', en: 'Notifications', ja: '通知' },
  '내 데이터': { zh: '我的数据', en: 'My Data', ja: 'マイデータ' },
  '고객센터': { zh: '帮助中心', en: 'Support Center', ja: 'サポートセンター' },
  '약관': { zh: '条款', en: 'Terms', ja: '規約' },
  '회원탈퇴': { zh: '注销账户', en: 'Account Withdrawal', ja: '退会' },
  '계정 요약': { zh: '账户摘要', en: 'Account Summary', ja: 'アカウント概要' },
  '계정 설정': { zh: '账户设置', en: 'Account Settings', ja: 'アカウント設定' },
  '내 접근성 환경': { zh: '我的无障碍设置', en: 'My Accessibility Settings', ja: 'アクセシビリティ環境' },
  '고대비 모드': { zh: '高对比度模式', en: 'High Contrast Mode', ja: '高コントラストモード' },
  '스크린리더 최적화': { zh: '屏幕阅读器优化', en: 'Screen Reader Optimization', ja: 'スクリーンリーダー最適化' },
  '애니메이션 줄이기': { zh: '减少动画', en: 'Reduce Animation', ja: 'アニメーションを減らす' },
  '글자 크기': { zh: '文字大小', en: 'Text Size', ja: '文字サイズ' },
  '보통': { zh: '标准', en: 'Normal', ja: '標準' },
  '크게': { zh: '大', en: 'Large', ja: '大きく' },
  '아주 크게': { zh: '特大', en: 'Extra Large', ja: 'さらに大きく' },
  '알림 설정': { zh: '通知设置', en: 'Notification Settings', ja: '通知設定' },
  '이메일 알림': { zh: '邮件通知', en: 'Email Notifications', ja: 'メール通知' },
  '문자 알림': { zh: '短信通知', en: 'SMS Notifications', ja: 'SMS通知' },
  '카카오 알림톡': { zh: 'Kakao 通知', en: 'Kakao Notifications', ja: 'Kakao通知' },
  '서비스 공지': { zh: '服务公告', en: 'Service Notices', ja: 'サービス通知' },
  '개인정보': { zh: '个人信息', en: 'Privacy', ja: '個人情報' },
  '개인정보 처리방침': { zh: '隐私政策', en: 'Privacy Policy', ja: 'プライバシーポリシー' },
  '서비스 이용약관': { zh: '服务使用条款', en: 'Terms of Service', ja: '利用規約' },
  '개인정보 수집·이용 동의': { zh: '个人信息收集和使用同意', en: 'Personal Information Collection and Use Consent', ja: '個人情報の収集・利用同意' },
  '마케팅 정보 수신 동의': { zh: '营销信息接收同意', en: 'Marketing Communications Consent', ja: 'マーケティング情報受信同意' },
  '제3자 제공 동의': { zh: '向第三方提供同意', en: 'Third-party Provision Consent', ja: '第三者提供同意' },
  '개인정보 처리위탁 안내': { zh: '个人信息处理委托说明', en: 'Personal Information Processing Outsourcing Notice', ja: '個人情報処理委託案内' },
  '약관 및 정책': { zh: '条款和政策', en: 'Terms and Policies', ja: '規約・ポリシー' },
  '전체 약관 및 정책 보기': { zh: '查看全部条款和政策', en: 'View all terms and policies', ja: 'すべての規約・ポリシーを見る' },
  '문의하기': { zh: '联系我们', en: 'Contact Us', ja: '問い合わせ' },
  'FAQ': { zh: 'FAQ', en: 'FAQ', ja: 'FAQ' },
  '오류 제보': { zh: '报告问题', en: 'Report an Issue', ja: '不具合報告' },
  '회원탈퇴 신청': { zh: '申请注销账户', en: 'Request Account Withdrawal', ja: '退会申請' },
  '탈퇴 전 확인할 내용': { zh: '注销前确认事项', en: 'Check Before Withdrawal', ja: '退会前の確認事項' },
  '탈퇴 후 개인정보 파기/보관 안내 자세히 보기': {
    zh: '查看注销后个人信息删除/保留说明',
    en: 'View details on personal data deletion/retention after withdrawal',
    ja: '退会後の個人情報破棄・保管案内を詳しく見る'
  },
  '회원탈퇴 확인': { zh: '确认注销账户', en: 'Confirm Account Withdrawal', ja: '退会確認' },
  '탈퇴 신청': { zh: '提交注销申请', en: 'Submit Withdrawal Request', ja: '退会を申請' },
  'Bridgework 정책 문서': { zh: 'Bridgework 政策文档', en: 'Bridgework Policy Document', ja: 'Bridgeworkポリシー文書' },
  '환경설정으로 돌아가기': { zh: '返回设置', en: 'Back to Settings', ja: '設定に戻る' },
  '마지막 수정일': { zh: '最后修改日期', en: 'Last Updated', ja: '最終更新日' },
  '적용 서비스': { zh: '适用服务', en: 'Applicable Service', ja: '対象サービス' },
  'Bridgework 웹 서비스': { zh: 'Bridgework 网页服务', en: 'Bridgework Web Service', ja: 'Bridgework Webサービス' },
  '문의 및 정정 요청': { zh: '咨询和更正请求', en: 'Inquiries and Correction Requests', ja: '問い合わせ・訂正依頼' },
  '계정 복구 안내 닫기': { zh: '关闭账户恢复提示', en: 'Close account recovery notice', ja: 'アカウント復旧案内を閉じる' },
  '회원탈퇴 신청 상태에서 다시 복귀되셨어요.': {
    zh: '您已从账户注销申请状态恢复。',
    en: 'Your account has been restored from a withdrawal request.',
    ja: '退会申請状態から復帰しました。'
  },
  '계정이 다시 활성화되어': { zh: '您的账户已重新启用', en: 'Your account has been reactivated', ja: 'アカウントが再有効化されました' },
  '기존처럼 서비스를 이용할 수 있습니다.': { zh: '您可以像以前一样使用服务。', en: 'You can use the service as before.', ja: 'これまで通りサービスを利用できます。' },
  '가능한 고용형태를 선택해 주세요.': { zh: '请选择可用的雇用形式。', en: 'Select available employment types.', ja: '可能な雇用形態を選択してください。' },
  '근무 형태 가능 범위를 1개 이상 선택해 주세요.': { zh: '请至少选择一种可行的工作形式。', en: 'Select at least one available work type.', ja: '勤務形態の可能範囲を1つ以上選択してください。' },
  '보유 기술/역량을 1개 이상 입력해 주세요.': { zh: '请至少输入一项技能/能力。', en: 'Enter at least one skill/competency.', ja: '保有スキル・能力を1つ以上入力してください。' },
  '생년월일 또는 연령대 중 하나를 입력해 주세요.': { zh: '请输入出生日期或年龄段之一。', en: 'Enter either date of birth or age range.', ja: '生年月日または年齢層のどちらかを入力してください。' },
  '이름, 성별, 연락처, 이메일, 생년월일, 거주지 상세 주소를 입력해 주세요.': {
    zh: '请输入姓名、性别、联系方式、电子邮箱、出生日期和详细居住地址。',
    en: 'Enter name, gender, contact, email, date of birth, and detailed residence address.',
    ja: '氏名、性別、連絡先、メール、生年月日、居住地の詳細住所を入力してください。'
  },
  '최종 학력, 졸업 상태, 주요 경력, 지원 직무를 입력해 주세요.': {
    zh: '请输入最高学历、毕业状态、主要经历和目标职位。',
    en: 'Enter highest education, graduation status, main experience, and target job.',
    ja: '最終学歴、卒業状況、主な経歴、応募職務を入力してください。'
  },
  '장애 유형, 장애 정도, 장애인 등록 여부를 모두 선택해 주세요.': {
    zh: '请选择残障类型、残障程度和残障登记状态。',
    en: 'Select disability type, severity, and registration status.',
    ja: '障害種別、障害程度、障害者登録の有無をすべて選択してください。'
  },
  '자기소개를 입력해 주세요.': { zh: '请输入自我介绍。', en: 'Enter an introduction.', ja: '自己紹介を入力してください。' },
  '장애 등록 여부를 선택해 주세요.': { zh: '请选择残障登记状态。', en: 'Select disability registration status.', ja: '障害者登録の有無を選択してください。' },
  '장애 여부와 등록 여부를 선택해 주세요.': { zh: '请选择残障状态和登记状态。', en: 'Select disability status and registration status.', ja: '障害の有無と登録有無を選択してください。' },
  '근무환경/지원사항 목록은 각각 1개 이상 필요합니다.': {
    zh: '工作环境和支持事项列表各至少需要 1 项。',
    en: 'Work environment and support lists each need at least one item.',
    ja: '職場環境と支援事項のリストはそれぞれ1件以上必要です。'
  },
  '보유 기술과 근무 형태는 각각 1개 이상 필요합니다.': {
    zh: '技能和工作形式各至少需要 1 项。',
    en: 'Skills and work types each need at least one item.',
    ja: '保有スキルと勤務形態はそれぞれ1件以上必要です。'
  },
  '기본 프로필': { zh: '默认资料', en: 'Default Profile', ja: '基本プロフィール' },
  '기본 프로필 없음': { zh: '无默认资料', en: 'No Default Profile', ja: '基本プロフィールなし' },
  '기본 프로필 불러오는 중': { zh: '正在加载默认资料', en: 'Loading default profile', ja: '基本プロフィールを読み込み中' },
  '기본 프로필 새로고침 중': { zh: '正在刷新默认资料', en: 'Refreshing default profile', ja: '基本プロフィールを更新中' },
  '기본 프로필 정보를 불러오지 못했습니다.': { zh: '无法加载默认个人资料信息。', en: 'Failed to load default profile information.', ja: '基本プロフィール情報を読み込めませんでした。' },
  '기본 프로필 확인 필요': { zh: '默认资料需确认', en: 'Default profile needs confirmation', ja: '基本プロフィールの確認が必要' },
  '기본 프로필 기준으로 공고를 정렬했습니다.': {
    zh: '已按默认个人资料排序职位。',
    en: 'Jobs are sorted based on your default profile.',
    ja: '基本プロフィール基準で求人を並べ替えました。'
  },
  '선택한 프로필을 삭제할까요? 삭제한 프로필은 되돌릴 수 없습니다.': {
    zh: '要删除所选个人资料吗？删除后无法恢复。',
    en: 'Delete the selected profile? Deleted profiles cannot be restored.',
    ja: '選択したプロフィールを削除しますか？削除したプロフィールは元に戻せません。'
  },
  '임시저장 공간을 사용할 수 없습니다. 브라우저 저장소 설정을 확인해 주세요.': {
    zh: '无法使用临时保存空间。请检查浏览器存储设置。',
    en: 'Draft storage is unavailable. Check your browser storage settings.',
    ja: '一時保存領域を使用できません。ブラウザの保存設定を確認してください。'
  },
  '작성 중인 내용이 임시저장되었습니다.': { zh: '已保存草稿。', en: 'Draft saved.', ja: '作成中の内容を一時保存しました。' },
  '최근 변경사항이 임시저장되었습니다.': { zh: '最近的更改已保存为草稿。', en: 'Recent changes were saved as a draft.', ja: '最近の変更を一時保存しました。' },
  '임시저장된 새 프로필을 불러왔습니다.': { zh: '已加载保存的新资料草稿。', en: 'Loaded the saved new profile draft.', ja: '一時保存された新規プロフィールを読み込みました。' },
  '민감 정보를 제외한 임시저장 내용을 불러왔습니다.': {
    zh: '已加载不含敏感信息的草稿。',
    en: 'Loaded the draft excluding sensitive information.',
    ja: '機微情報を除いた一時保存内容を読み込みました。'
  },
  '5분 이내 임시저장 내용 있음': { zh: '5 分钟内有草稿', en: 'Draft saved within 5 minutes', ja: '5分以内の一時保存あり' },
  '저장 전 임시 프로필': { zh: '保存前临时资料', en: 'Temporary profile before saving', ja: '保存前の一時プロフィール' },
  '최종 수정일 확인 필요': { zh: '最后修改日期需确认', en: 'Last update needs confirmation', ja: '最終更新日の確認が必要' },
  '새 프로필': { zh: '新资料', en: 'New Profile', ja: '新規プロフィール' },
  '기타 정보': { zh: '其他信息', en: 'Other Info', ja: 'その他情報' },
  '상세 장애·지원': { zh: '残障和支持详情', en: 'Detailed Disability/Support', ja: '詳細な障害・支援' },
  '자기소개 및 지원 동기': { zh: '自我介绍和申请动机', en: 'Introduction and Motivation', ja: '自己紹介・志望動機' },
  '통근·근무환경': { zh: '通勤和工作环境', en: 'Commute/Work Environment', ja: '通勤・職場環境' },
  '세부 경력': { zh: '详细经历', en: 'Detailed Experience', ja: '詳細経歴' },
  '자격·포트폴리오': { zh: '证书和作品集', en: 'Certificates/Portfolio', ja: '資格・ポートフォリオ' },
  '공고 목록을 불러오지 못했습니다.': { zh: '无法加载职位列表。', en: 'Failed to load job list.', ja: '求人一覧を読み込めませんでした。' },
  '표시할 공고가 없습니다.': { zh: '没有可显示的职位。', en: 'No jobs to display.', ja: '表示する求人がありません。' },
  '공고 평가 정보': { zh: '职位评估信息', en: 'Job Evaluation Info', ja: '求人評価情報' },
  '공고명 확인 필요': { zh: '职位名称需确认', en: 'Job title needs confirmation', ja: '求人名の確認が必要' },
  '고용형태 확인 필요': { zh: '雇用形式需确认', en: 'Employment type needs confirmation', ja: '雇用形態の確認が必要' },
  '급여 확인 필요': { zh: '薪资需确认', en: 'Pay needs confirmation', ja: '給与の確認が必要' },
  '근무지역 확인 필요': { zh: '工作地区需确认', en: 'Work region needs confirmation', ja: '勤務地域の確認が必要' },
  '근무지 확인 필요': { zh: '工作地点需确认', en: 'Work location needs confirmation', ja: '勤務地の確認が必要' },
  '이름 확인 필요': { zh: '姓名需确认', en: 'Name needs confirmation', ja: '氏名の確認が必要' },
  '이메일 확인 필요': { zh: '邮箱需确认', en: 'Email needs confirmation', ja: 'メールの確認が必要' },
  '연락처 확인 필요': { zh: '联系方式需确认', en: 'Contact needs confirmation', ja: '連絡先の確認が必要' },
  '급여 · 고용형태 · 요구경력 · 마감일': { zh: '薪资 · 雇用形式 · 经验要求 · 截止日', en: 'Pay · Employment Type · Experience · Deadline', ja: '給与・雇用形態・必要経歴・締切' },
  '보유 기술/역량과 공고 요구사항 비교': {
    zh: '比较技能/能力与职位要求',
    en: 'Compare skills/competencies with job requirements',
    ja: '保有スキル・能力と求人要件の比較'
  },
  '세부 추천 설명은 공고 정보와 프로필 정보를 함께 확인해주세요.': {
    zh: '请结合职位信息和个人资料查看详细推荐说明。',
    en: 'Review detailed recommendation explanations together with job and profile information.',
    ja: '詳細な推薦説明は、求人情報とプロフィール情報を合わせて確認してください。'
  },
  '추천 설명을 불러오지 못했습니다.': { zh: '无法加载推荐说明。', en: 'Failed to load recommendation explanation.', ja: '推薦説明を読み込めませんでした。' },
  '추천 설명을 확인했습니다.': { zh: '已确认推荐说明。', en: 'Recommendation explanation checked.', ja: '推薦説明を確認しました。' },
  '추천 점수는 참고용으로 보고 상세 조건을 함께 확인하세요.': {
    zh: '推荐评分仅供参考，请同时确认详细条件。',
    en: 'Use recommendation scores as reference and check detailed conditions together.',
    ja: '推薦スコアは参考として、詳細条件も合わせて確認してください。'
  },
  '로그인 후 프로필을 선택하면 맞춤 추천을 볼 수 있습니다.': {
    zh: '登录后选择个人资料即可查看个性化推荐。',
    en: 'Log in and select a profile to view personalized recommendations.',
    ja: 'ログイン後にプロフィールを選択すると、カスタム推薦を確認できます。'
  },
  '로그인 후 추천 공고를 확인할 수 있습니다.': {
    zh: '登录后可查看推荐职位。',
    en: 'Log in to view recommended jobs.',
    ja: 'ログイン後に推薦求人を確認できます。'
  },
  '로그인하면 내 조건에 맞는 공고를 바로 비교할 수 있습니다.': {
    zh: '登录后可立即比较符合条件的职位。',
    en: 'Log in to compare jobs that match your conditions.',
    ja: 'ログインすると条件に合う求人をすぐ比較できます。'
  },
  '로그인 전 추천 공고 안내': { zh: '登录前推荐职位提示', en: 'Recommended Jobs Before Login Notice', ja: 'ログイン前の推薦求人案内' },
  '마감일 비교': { zh: '截止日比较', en: 'Deadline Comparison', ja: '締切日の比較' },
  '접근성 지도 연계': { zh: '关联无障碍地图', en: 'Accessibility Map Link', ja: 'アクセシビリティ地図連携' },
  '추천 공고 미리보기': { zh: '推荐职位预览', en: 'Recommended Jobs Preview', ja: '推薦求人プレビュー' },
  '추천 기준 프로필': { zh: '推荐基准资料', en: 'Recommendation Profile', ja: '推薦基準プロフィール' },
  '추천 공고': { zh: '推荐职位', en: 'Recommended Jobs', ja: '推薦求人' },
  '최근 활동과 안내': { zh: '近期活动和通知', en: 'Recent Activity and Notices', ja: '最近の活動と案内' },
  '최근 확인한 추천 공고': { zh: '最近查看的推荐职位', en: 'Recently Viewed Recommended Jobs', ja: '最近確認した推薦求人' },
  '지도 범례': { zh: '地图图例', en: 'Map Legend', ja: '地図凡例' },
  '지원기관': { zh: '支持机构', en: 'Support Agency', ja: '支援機関' },
  '상세 정보 탭': { zh: '详情标签', en: 'Detail Tabs', ja: '詳細情報タブ' },
  '접근성 상태 아이콘': { zh: '无障碍状态图标', en: 'Accessibility status icon', ja: 'アクセシビリティ状態アイコン' },
  '데이터 출처 안내 아이콘': { zh: '数据来源提示图标', en: 'Data source info icon', ja: 'データ出典案内アイコン' },
  '이동 시간 아이콘': { zh: '移动时间图标', en: 'Travel time icon', ja: '移動時間アイコン' },
  '도보 이동 아이콘': { zh: '步行图标', en: 'Walking icon', ja: '徒歩移動アイコン' },
  '드래그 핸들 아이콘': { zh: '拖动手柄图标', en: 'Drag handle icon', ja: 'ドラッグハンドルアイコン' },
  '정렬 옵션 펼치기 아이콘': { zh: '展开排序选项图标', en: 'Open sort options icon', ja: '並び替えオプション展開アイコン' },
  '안내 아이콘': { zh: '提示图标', en: 'Info icon', ja: '案内アイコン' },
  '검색 아이콘': { zh: '搜索图标', en: 'Search icon', ja: '検索アイコン' },
  '수정 아이콘': { zh: '编辑图标', en: 'Edit icon', ja: '編集アイコン' },
  '추가 아이콘': { zh: '添加图标', en: 'Add icon', ja: '追加アイコン' },
  '더보기 아이콘': { zh: '更多图标', en: 'More icon', ja: 'もっと見るアイコン' },
  '접기 아이콘': { zh: '收起图标', en: 'Collapse icon', ja: '閉じるアイコン' },
  '펼치기 아이콘': { zh: '展开图标', en: 'Expand icon', ja: '開くアイコン' },
  '입력 완료 아이콘': { zh: '输入完成图标', en: 'Input complete icon', ja: '入力完了アイコン' },
  '카카오톡 아이콘': { zh: 'KakaoTalk 图标', en: 'KakaoTalk icon', ja: 'KakaoTalkアイコン' },
  '계정 보안, 서비스 공지, 인증 관련 알림입니다.': {
    zh: '账户安全、服务公告和认证相关通知。',
    en: 'Account security, service notices, and authentication notifications.',
    ja: 'アカウントセキュリティ、サービス通知、認証関連の通知です。'
  },
  '알림은 중요도와 사용 목적에 따라 나누어 관리합니다.': {
    zh: '通知会按重要程度和使用目的分类管理。',
    en: 'Notifications are managed by importance and purpose.',
    ja: '通知は重要度と利用目的に応じて管理します。'
  },
  '서비스 소식과 이벤트성 안내입니다. 언제든 철회할 수 있습니다.': {
    zh: '服务消息和活动类通知，可随时撤回同意。',
    en: 'Service news and event information. You can withdraw at any time.',
    ja: 'サービスニュースとイベント案内です。いつでも撤回できます。'
  },
  '동의 상태와 데이터 요청을 한곳에서 확인합니다.': {
    zh: '在一个位置查看同意状态和数据请求。',
    en: 'Check consent status and data requests in one place.',
    ja: '同意状況とデータリクエストを一か所で確認します。'
  },
  '개인정보 처리 요청 절차를 확인합니다.': {
    zh: '查看个人信息处理请求流程。',
    en: 'Check the personal information processing request process.',
    ja: '個人情報処理リクエスト手順を確認します。'
  },
  '내 계정 데이터를 파일로 요청할 수 있습니다.': {
    zh: '您可以申请以文件形式获取账户数据。',
    en: 'You can request your account data as a file.',
    ja: 'アカウントデータをファイルでリクエストできます。'
  },
  '자주 필요한 도움말과 제보 채널입니다.': {
    zh: '常用帮助和反馈渠道。',
    en: 'Frequently needed help and report channels.',
    ja: 'よく使うヘルプと報告チャンネルです。'
  },
  '자주 확인하는 정책을 먼저 보여주고 나머지는 접어서 제공합니다.': {
    zh: '常查看的政策会优先显示，其余内容折叠提供。',
    en: 'Frequently viewed policies are shown first and the rest are collapsed.',
    ja: 'よく確認するポリシーを先に表示し、残りは折りたたみで提供します。'
  },
  '계정 삭제는 복구와 보관 범위를 확인한 뒤 진행합니다.': {
    zh: '请先确认恢复和保留范围，再继续注销账户。',
    en: 'Delete your account after checking recovery and retention scope.',
    ja: 'アカウント削除は復旧と保管範囲を確認してから進めます。'
  },
  '선택 동의 항목': { zh: '可选同意项目', en: 'Optional Consent Items', ja: '任意同意項目' },
  '선택 미동의': { zh: '未同意可选项', en: 'Optional Not Consented', ja: '任意未同意' },
  '선택 수신': { zh: '可选接收', en: 'Optional Receiving', ja: '任意受信' },
  '동의 완료': { zh: '已同意', en: 'Consented', ja: '同意済み' },
  '마케팅 정보 수신': { zh: '接收营销信息', en: 'Marketing Communications', ja: 'マーケティング情報受信' },
  '민감정보 수집·이용 동의': { zh: '敏感信息收集和使用同意', en: 'Sensitive Information Collection and Use Consent', ja: '機微情報の収集・利用同意' },
  '열람/수정/삭제 요청': { zh: '查看/修改/删除请求', en: 'View/Edit/Delete Request', ja: '閲覧・修正・削除依頼' },
  '개인정보 다운로드 요청': { zh: '个人信息下载请求', en: 'Personal Data Download Request', ja: '個人情報ダウンロード依頼' },
  '법정 보관 정보': { zh: '依法保留的信息', en: 'Legally Retained Information', ja: '法定保管情報' },
  '분리 보관': { zh: '分开保管', en: 'Separate Retention', ja: '分離保管' },
  '삭제/비식별': { zh: '删除/去标识化', en: 'Delete/De-identify', ja: '削除・非識別化' },
  '복구 가능 여부': { zh: '是否可恢复', en: 'Recoverability', ja: '復旧可否' },
  '재가입 제한 여부': { zh: '是否限制重新注册', en: 'Rejoin Restrictions', ja: '再登録制限の有無' },
  '탈퇴 후 개인정보 파기/보관 안내': {
    zh: '注销后个人信息删除/保留说明',
    en: 'Personal Data Deletion/Retention After Withdrawal',
    ja: '退会後の個人情報破棄・保管案内'
  },
  '탈퇴 전 유의사항 안내': { zh: '注销前注意事项', en: 'Withdrawal Precautions Notice', ja: '退会前の注意事項案内' },
  '지원 전 확인': { zh: '申请前确认', en: 'Check Before Applying', ja: '応募前確認' },
  '지원 전 체크': { zh: '申请前检查', en: 'Pre-apply Check', ja: '応募前チェック' },
  '지원 전 기업 확인': { zh: '申请前向企业确认', en: 'Confirm with Company Before Applying', ja: '応募前に企業確認' },
  '신청 가능': { zh: '可申请', en: 'Request Available', ja: '申請可能' },
  '신청 중': { zh: '申请中', en: 'Requested', ja: '申請中' },
  '실패': { zh: '失败', en: 'Failed', ja: '失敗' },
  '진행 중': { zh: '进行中', en: 'In Progress', ja: '進行中' },
  '저장 완료': { zh: '已保存', en: 'Saved', ja: '保存完了' },
  '저장 실패': { zh: '保存失败', en: 'Save Failed', ja: '保存失敗' },
  '인증 안내 닫기': { zh: '关闭认证提示', en: 'Close authentication notice', ja: '認証案内を閉じる' },
  '서비스 소개': { zh: '服务介绍', en: 'About the Service', ja: 'サービス紹介' },
  'Bridgework 로고 아이콘': { zh: 'Bridgework 徽标图标', en: 'Bridgework logo icon', ja: 'Bridgeworkロゴアイコン' },
  '검색 결과 내 주소/회사/직무를 검색하세요.': {
    zh: '在搜索结果中查找地址、公司或岗位。',
    en: 'Search addresses, companies, or roles in the results.',
    ja: '検索結果内の住所・会社・職務を検索してください。'
  },
  '검색을 먼저 해주세요.': { zh: '请先搜索。', en: 'Search first.', ja: '先に検索してください。' },
  '처리 중입니다...': { zh: '正在处理...', en: 'Processing...', ja: '処理中です...' },
  '필수 텍스트 항목을 입력해 주세요.': {
    zh: '请输入必填文本项目。',
    en: 'Enter the required text fields.',
    ja: '必須テキスト項目を入力してください。'
  },
  '기본 희망 정보': { zh: '基本期望信息', en: 'Basic Preferences', ja: '基本希望情報' },
  '항목 추가 버튼 또는 Enter로 입력': {
    zh: '使用添加按钮或 Enter 输入',
    en: 'Use Add or Enter to add an item',
    ja: '追加ボタンまたはEnterで入力'
  },
  '또는 연령대 중 하나 필수': {
    zh: '或填写年龄段，二选一必填',
    en: 'Or age range; one is required',
    ja: 'または年齢層のいずれか必須'
  },
  '예: 조용한 사무실': { zh: '例：安静的办公室', en: 'Example: quiet office', ja: '例：静かなオフィス' },
  '예: 소음이 큰 환경': { zh: '例：噪音较大的环境', en: 'Example: noisy environment', ja: '例：騒音が大きい環境' },
  '예: 화면 낭독기': { zh: '例：屏幕阅读器', en: 'Example: screen reader', ja: '例：スクリーンリーダー' },
  '예: 20대 후반': { zh: '例：20 多岁后半', en: 'Example: late 20s', ja: '例：20代後半' },
  '예: OA, 고객응대': { zh: '例：办公软件、客户服务', en: 'Example: office tools, customer support', ja: '例：OA、顧客対応' },
  '예: 컴활 2급': { zh: '例：计算机应用能力 2 级', en: 'Example: computer skills certificate', ja: '例：PC資格2級' },
  '예: 정규직': { zh: '例：正式员工', en: 'Example: full-time', ja: '例：正社員' },
  '직무': { zh: '岗位', en: 'Job', ja: '職務' },
  '환경': { zh: '环境', en: 'Environment', ja: '環境' },
  '지원': { zh: '支持', en: 'Support', ja: '支援' },
  '아직 생성되지 않았습니다.': { zh: '尚未创建。', en: 'Not created yet.', ja: 'まだ作成されていません。' },
  '미선택': { zh: '未选择', en: 'Not selected', ja: '未選択' },
  '2주 이내': { zh: '2 周内', en: 'Within 2 weeks', ja: '2週間以内' },
  '30일 내 가능': { zh: '30 天内可用', en: 'Available within 30 days', ja: '30日以内に可能' },
  '개': { zh: '个', en: 'items', ja: '件' },
  '건': { zh: '件', en: 'items', ja: '件' },
  '검색': { zh: '搜索', en: 'Search', ja: '検索' },
  '검색 결과': { zh: '搜索结果', en: 'Search Results', ja: '検索結果' },
  '/ 전체': { zh: '/ 全部', en: '/ All', ja: '/ 全体' },
  '개 더 보기': { zh: '查看更多', en: 'Show more', ja: 'さらに表示' },
  '건 더 보기': { zh: '查看更多', en: 'Show more', ja: 'さらに表示' },
  '검색을 누르면 회사 공고가 지도와 목록에 표시됩니다.': {
    zh: '点击搜索后，企业职位会显示在地图和列表中。',
    en: 'Search to show company jobs on the map and list.',
    ja: '検索すると企業求人が地図と一覧に表示されます。'
  },
  '검색을 누르면 회사 공고와 접근성 정보를 지도에 표시합니다.': {
    zh: '点击搜索后，将在地图中显示企业职位和无障碍信息。',
    en: 'Search to show company jobs and accessibility information on the map.',
    ja: '検索すると企業求人とアクセシビリティ情報を地図に表示します。'
  },
  '검색어나 상세 필터를 줄이면 더 많은 공고를 확인할 수 있습니다.': {
    zh: '减少搜索词或高级筛选后，可查看更多职位。',
    en: 'Use fewer keywords or filters to see more jobs.',
    ja: '検索語や詳細フィルターを減らすと、より多くの求人を確認できます。'
  },
  '공고를 선택해주세요.': { zh: '请选择职位。', en: 'Select a job.', ja: '求人を選択してください。' },
  '공고 상세를 불러오는 중입니다.': { zh: '正在加载职位详情。', en: 'Loading job details.', ja: '求人詳細を読み込んでいます。' },
  '공고 상세를 불러오지 못했습니다.': { zh: '无法加载职位详情。', en: 'Failed to load job details.', ja: '求人詳細を読み込めませんでした。' },
  '공고 선택': { zh: '选择职位', en: 'Select job', ja: '求人を選択' },
  '공고 스크랩': { zh: '收藏职位', en: 'Save job', ja: '求人を保存' },
  '공유': { zh: '分享', en: 'Share', ja: '共有' },
  '공고 핵심 요약': { zh: '职位重点摘要', en: 'Job Highlights', ja: '求人の要点' },
  '공고 핵심 정보': { zh: '职位重点信息', en: 'Key Job Info', ja: '求人の重要情報' },
  '공고 정보': { zh: '职位信息', en: 'Job Information', ja: '求人情報' },
  '공고 조건은 계속 확인할 수 있습니다.': {
    zh: '仍可继续查看职位条件。',
    en: 'You can still review the job conditions.',
    ja: '求人条件は引き続き確認できます。'
  },
  '공고 조건과 선택한 프로필 기준으로 추천 이유를 생성하고 있습니다.': {
    zh: '正在根据职位条件和所选资料生成推荐理由。',
    en: 'Creating recommendation reasons from the job and selected profile.',
    ja: '求人条件と選択したプロフィールを基準に推薦理由を作成しています。'
  },
  '공고 정보와 프로필 조건을 함께 확인하는 중입니다.': {
    zh: '正在同时确认职位信息和个人资料条件。',
    en: 'Checking the job information and profile conditions together.',
    ja: '求人情報とプロフィール条件を合わせて確認しています。'
  },
  '공고 조건, 프로필 적합도, 확인 필요 항목을 정리하고 있습니다.': {
    zh: '正在整理职位条件、资料匹配度和需确认项目。',
    en: 'Summarizing job conditions, profile fit, and items to confirm.',
    ja: '求人条件、プロフィール適合度、確認が必要な項目を整理しています。'
  },
  '공고 제공 정보': { zh: '职位提供信息', en: 'Job-provided information', ja: '求人提供情報' },
  '기업명 확인 필요': { zh: '企业名称需确认', en: 'Company name needs confirmation', ja: '企業名の確認が必要' },
  '희망 직무 확인 필요': { zh: '期望岗位需确认', en: 'Desired job needs confirmation', ja: '希望職務の確認が必要' },
  '확인 전': { zh: '确认前', en: 'Before confirmation', ja: '確認前' },
  '확인됨': { zh: '已确认', en: 'Confirmed', ja: '確認済み' },
  '없음': { zh: '无', en: 'None', ja: 'なし' },
  '오늘 마감': { zh: '今天截止', en: 'Due today', ja: '本日締切' },
  '마감 공고': { zh: '已截止职位', en: 'Closed job', ja: '締切済み求人' },
  '진행중 공고': { zh: '进行中职位', en: 'Open job', ja: '募集中の求人' },
  '등록일 확인 필요': { zh: '登记日期需确认', en: 'Registration date needs confirmation', ja: '登録日の確認が必要' },
  '저장일 확인 필요': { zh: '保存日期需确认', en: 'Saved date needs confirmation', ja: '保存日の確認が必要' },
  '스크랩 완료': { zh: '已收藏', en: 'Saved', ja: '保存済み' },
  '스크랩 아님': { zh: '未收藏', en: 'Not saved', ja: '未保存' },
  '근무지 주소 확인 필요': { zh: '工作地点地址需确认', en: 'Workplace address needs confirmation', ja: '勤務地住所の確認が必要' },
  '프로필을 확인하려면 로그인이 필요합니다.': {
    zh: '需要登录才能查看个人资料。',
    en: 'Log in to view your profile.',
    ja: 'プロフィールを確認するにはログインが必要です。'
  },
  '프로필 목록을 불러오지 못했습니다.': { zh: '无法加载个人资料列表。', en: 'Failed to load profile list.', ja: 'プロフィール一覧を読み込めませんでした。' },
  '프로필 변경에 실패했습니다.': { zh: '个人资料更改失败。', en: 'Failed to update profile.', ja: 'プロフィールの変更に失敗しました。' },
  '기본 프로필을 변경했습니다.': { zh: '已更改默认资料。', en: 'Default profile updated.', ja: '基本プロフィールを変更しました。' },
  '프로필을 추가했습니다.': { zh: '已添加资料。', en: 'Profile added.', ja: 'プロフィールを追加しました。' },
  '프로필을 저장했습니다.': { zh: '已保存资料。', en: 'Profile saved.', ja: 'プロフィールを保存しました。' },
  '프로필을 삭제했습니다.': { zh: '已删除资料。', en: 'Profile deleted.', ja: 'プロフィールを削除しました。' },
  '회원가입 옵션을 불러오지 못했습니다.': { zh: '无法加载注册选项。', en: 'Failed to load sign-up options.', ja: '登録オプションを読み込めませんでした。' },
  '로그인 상태를 확인하고 있습니다.': { zh: '正在确认登录状态。', en: 'Checking sign-in status.', ja: 'ログイン状態を確認しています。' },
  '로그인 세션이 만료되었습니다. 다시 로그인해 주세요.': {
    zh: '登录会话已过期。请重新登录。',
    en: 'Your sign-in session expired. Please log in again.',
    ja: 'ログインセッションが期限切れです。もう一度ログインしてください。'
  },
  '로그인 응답에 액세스 토큰이 없습니다.': {
    zh: '登录响应中没有访问令牌。',
    en: 'The login response has no access token.',
    ja: 'ログイン応答にアクセストークンがありません。'
  },
  '로그인 화면으로 이동 중...': { zh: '正在前往登录页面...', en: 'Opening login...', ja: 'ログイン画面へ移動中...' },
  '로그인 후 스크랩 공고를 확인할 수 있습니다.': {
    zh: '登录后可查看收藏的职位。',
    en: 'Log in to view saved jobs.',
    ja: 'ログイン後に保存した求人を確認できます。'
  },
  '로그인 후 자신의 프로필을 선택해보세요.': {
    zh: '登录后请选择您的资料。',
    en: 'Log in and choose your profile.',
    ja: 'ログイン後に自分のプロフィールを選択してください。'
  },
  '로그아웃 확인': { zh: '确认退出登录', en: 'Confirm log out', ja: 'ログアウト確認' },
  '로그아웃 확인 창 닫기': { zh: '关闭退出登录确认窗口', en: 'Close log-out confirmation', ja: 'ログアウト確認画面を閉じる' },
  '로그인 창 닫기': { zh: '关闭登录窗口', en: 'Close login window', ja: 'ログイン画面を閉じる' },
  '개인 강점/약점': { zh: '个人优势/不足', en: 'Personal strengths/weaknesses', ja: '個人の強み・弱み' },
  '지원동기': { zh: '申请动机', en: 'Motivation', ja: '志望動機' },
  '직무 적합성': { zh: '岗位匹配度', en: 'Job fit', ja: '職務適性' },
  '커리어 목표': { zh: '职业目标', en: 'Career goal', ja: 'キャリア目標' },
  '상세 장애 설명': { zh: '残障情况详情', en: 'Disability details', ja: '障害の詳細説明' },
  '근무 시 필요한 지원 사항': { zh: '工作时需要的支持', en: 'Support needed at work', ja: '勤務時に必要な支援' },
  '필요 지원 항목': { zh: '所需支持项目', en: 'Needed support items', ja: '必要な支援項目' },
  '복수 입력 가능': { zh: '可输入多个', en: 'Multiple entries allowed', ja: '複数入力可' },
  '근무 형태 가능 범위': { zh: '可工作的形式范围', en: 'Available work types', ja: '可能な勤務形態の範囲' },
  '희망 연봉': { zh: '期望年薪', en: 'Desired annual salary', ja: '希望年収' },
  '근무 시간 선호': { zh: '工作时间偏好', en: 'Work time preference', ja: '勤務時間の希望' },
  '재택근무 가능 여부': { zh: '是否可在家办公', en: 'Remote work availability', ja: '在宅勤務可否' },
  '병역 여부': { zh: '兵役状态', en: 'Military service status', ja: '兵役の有無' },
  '국가유공자 여부': { zh: '国家有功人员状态', en: 'Veteran status', ja: '国家有功者の有無' },
  '입력 항목 아이콘': { zh: '输入项目图标', en: 'Input field icon', ja: '入力項目アイコン' },
  '확인': { zh: '确认', en: 'Confirm', ja: '確認' },
  '로그인이 필요합니다.': { zh: '需要登录。', en: 'Login is required.', ja: 'ログインが必要です。' },
  '세션 확인': { zh: '确认会话', en: 'Checking session', ja: 'セッション確認' },
  '세션 검증 중...': { zh: '正在验证会话...', en: 'Verifying session...', ja: 'セッションを確認中...' },
  '페이지가 유효하지 않습니다. 다시 로그인해 주세요.': {
    zh: '页面无效。请重新登录。',
    en: 'This page is not valid. Please log in again.',
    ja: 'ページが有効ではありません。もう一度ログインしてください。'
  },
  '접근 권한이 없습니다. 필요한 권한을 확인해 주세요.': {
    zh: '没有访问权限。请确认所需权限。',
    en: 'You do not have access. Check the required permission.',
    ja: 'アクセス権限がありません。必要な権限を確認してください。'
  },
  '요청한 정보를 찾을 수 없습니다.': {
    zh: '找不到请求的信息。',
    en: 'The requested information was not found.',
    ja: 'リクエストした情報が見つかりません。'
  },
  '요청 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.': {
    zh: '请求超时。请稍后重试。',
    en: 'The request timed out. Try again later.',
    ja: 'リクエストがタイムアウトしました。しばらくしてから再試行してください。'
  },
  '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.': {
    zh: '发生服务器错误。请稍后重试。',
    en: 'A server error occurred. Try again later.',
    ja: 'サーバーエラーが発生しました。しばらくしてから再試行してください。'
  },
  '네트워크 연결을 확인할 수 없습니다. 인터넷 연결 상태를 확인한 뒤 다시 시도해 주세요.': {
    zh: '无法确认网络连接。请检查互联网连接后重试。',
    en: 'Network connection could not be confirmed. Check your connection and try again.',
    ja: 'ネットワーク接続を確認できません。インターネット接続を確認してから再試行してください。'
  },
  '요청 시간이 초과되었습니다.': { zh: '请求超时。', en: 'The request timed out.', ja: 'リクエストがタイムアウトしました。' },
  '요청이 취소되었습니다.': { zh: '请求已取消。', en: 'The request was canceled.', ja: 'リクエストがキャンセルされました。' },
  '토큰 갱신 정보가 없습니다. 다시 로그인해 주세요.': {
    zh: '没有令牌刷新信息。请重新登录。',
    en: 'Token refresh information is missing. Please log in again.',
    ja: 'トークン更新情報がありません。もう一度ログインしてください。'
  },
  '이미 종료된 세션의 토큰 갱신 결과입니다.': {
    zh: '这是已结束会话的令牌刷新结果。',
    en: 'This token refresh result belongs to an ended session.',
    ja: 'すでに終了したセッションのトークン更新結果です。'
  },
  '탈퇴 신청 취소 토큰이 없습니다. 고객센터에 문의해 주세요.': {
    zh: '缺少取消注销申请的令牌。请联系帮助中心。',
    en: 'The withdrawal cancellation token is missing. Contact support.',
    ja: '退会申請取消トークンがありません。サポートへお問い合わせください。'
  },
  '추천 요청 ID가 필요합니다.': {
    zh: '需要推荐请求 ID。',
    en: 'A recommendation request ID is required.',
    ja: '推薦リクエストIDが必要です。'
  },
  '지역 접근성 지도': { zh: '区域无障碍地图', en: 'Regional Accessibility Map', ja: '地域アクセシビリティ地図' },
  '로딩중': { zh: '加载中', en: 'Loading', ja: '読み込み中' },
  '회사': { zh: '公司', en: 'Company', ja: '会社' },
  '위치': { zh: '位置', en: 'Location', ja: '位置' },
  '좌표': { zh: '坐标', en: 'Coordinates', ja: '座標' },
  '근무지': { zh: '工作地点', en: 'Workplace', ja: '勤務地' },
  '교통': { zh: '交通', en: 'Transit', ja: '交通' },
  '보행': { zh: '步行', en: 'Walking', ja: '歩行' },
  '편의시설': { zh: '便利设施', en: 'Facilities', ja: '便利施設' },
  '휠체어': { zh: '轮椅', en: 'Wheelchair', ja: '車いす' },
  '공공': { zh: '公共', en: 'Public', ja: '公共' },
  '공고': { zh: '职位', en: 'Job', ja: '求人' },
  '곳': { zh: '处', en: 'places', ja: 'か所' },
  '개 · 수행기관': { zh: '个 · 执行机构', en: 'items · agencies', ja: '件・実施機関' },
  '프로필 선택': { zh: '选择资料', en: 'Select profile', ja: 'プロフィール選択' },
  '프로필 목록': { zh: '资料列表', en: 'Profile list', ja: 'プロフィール一覧' },
  '프로필을 선택하세요': { zh: '请选择资料', en: 'Select a profile', ja: 'プロフィールを選択してください' },
  '프로필 아이콘': { zh: '资料图标', en: 'Profile icon', ja: 'プロフィールアイコン' },
  '프로필 목록 펼치기 아이콘': { zh: '展开资料列表图标', en: 'Open profile list icon', ja: 'プロフィール一覧を開くアイコン' },
  '프로필 관리': { zh: '资料管理', en: 'Profile Management', ja: 'プロフィール管理' },
  '프로필 관리 아이콘': { zh: '资料管理图标', en: 'Profile management icon', ja: 'プロフィール管理アイコン' },
  '현재 위치': { zh: '当前位置', en: 'Current location', ja: '現在地' },
  '현재 위치 사용 요청': { zh: '请求使用当前位置', en: 'Request current location', ja: '現在地の使用をリクエスト' },
  '현재 위치로 이동': { zh: '移动到当前位置', en: 'Go to current location', ja: '現在地へ移動' },
  '지도 조작': { zh: '地图操作', en: 'Map controls', ja: '地図操作' },
  '지도 확대 및 축소': { zh: '放大和缩小地图', en: 'Zoom map in and out', ja: '地図の拡大・縮小' },
  '근로지원기관 위치 마커 아이콘': { zh: '工作支持机构位置标记图标', en: 'Work support agency location marker icon', ja: '就労支援機関の位置マーカーアイコン' },
  '근로지원인 수행기관 보기': { zh: '查看工作支持人员执行机构', en: 'View work support agencies', ja: '就労支援員実施機関を見る' },
  '근로지원인 수행기관은 지도에 위치만 표시되며 점수에는 들어가지 않습니다.': {
    zh: '工作支持人员执行机构仅在地图显示位置，不计入评分。',
    en: 'Work support agencies are shown on the map only and are not included in the score.',
    ja: '就労支援員実施機関は地図上の位置のみ表示され、スコアには含まれません。'
  },
  '점수 확인 필요': { zh: '评分需确认', en: 'Score needs confirmation', ja: 'スコア確認が必要' },
  '접근성 점수 기준: A 80 이상, B 60~79, C 60 미만': {
    zh: '无障碍评分标准：A 80 以上，B 60~79，C 低于 60',
    en: 'Accessibility score: A 80+, B 60-79, C under 60',
    ja: 'アクセシビリティスコア基準：A 80以上、B 60~79、C 60未満'
  },
  '접근성 점수 산정 기준 안내': {
    zh: '无障碍评分标准说明',
    en: 'Accessibility score criteria',
    ja: 'アクセシビリティスコア算定基準の案内'
  },
  '접근성 점수는 공고 정보, 회사 정보, 근무지 주변 이동 정보를 함께 보고 계산합니다.': {
    zh: '无障碍评分会结合职位信息、公司信息和工作地点周边移动信息计算。',
    en: 'The accessibility score uses job, company, and nearby travel information together.',
    ja: 'アクセシビリティスコアは求人情報、会社情報、勤務地周辺の移動情報を合わせて算定します。'
  },
  '이 점수는 지원을 돕는 참고 정보입니다. 실제 출퇴근 경로와 사업장 환경은 지원 전 다시 확인해주세요.': {
    zh: '此评分仅用于辅助申请。实际通勤路线和工作场所环境请在申请前再次确认。',
    en: 'This score is a reference for applying. Confirm the actual commute route and workplace before applying.',
    ja: 'このスコアは応募を助ける参考情報です。実際の通勤経路と事業所環境は応募前に再確認してください。'
  },
  'AI 스코어링을 켜면 선택한 내 프로필에 맞춰 점수를 다시 계산합니다.': {
    zh: '开启 AI 评分后，会根据所选个人资料重新计算分数。',
    en: 'Turn on AI scoring to recalculate scores for your selected profile.',
    ja: 'AIスコアリングをオンにすると、選択したプロフィールに合わせてスコアを再計算します。'
  },
  'AI 스코어링을 끄면 저장된 공고 정보를 기준으로 보여주고, 화면에서 고른 필터만 적용합니다.': {
    zh: '关闭 AI 评分后，将按已保存的职位信息显示，并仅应用当前选择的筛选条件。',
    en: 'Turn off AI scoring to use saved job data and only the filters selected on screen.',
    ja: 'AIスコアリングをオフにすると、保存済み求人情報を基準に表示し、画面で選んだフィルターのみ適用します。'
  },
  '추천 요약 생성 중': { zh: '正在生成推荐摘要', en: 'Creating recommendation summary', ja: '推薦要約を作成中' },
  '환승 횟수 아이콘': { zh: '换乘次数图标', en: 'Transfer count icon', ja: '乗換回数アイコン' },
  'A등급': { zh: 'A 级', en: 'Grade A', ja: 'A等級' },
  'B등급': { zh: 'B 级', en: 'Grade B', ja: 'B等級' },
  'C등급': { zh: 'C 级', en: 'Grade C', ja: 'C等級' },
  '네이버 지도 Client ID가 없습니다. `.env.local`에 `REACT_APP_NAVER_MAP_CLIENT_ID`를 설정해주세요.': {
    zh: '缺少 Naver 地图 Client ID。请在 `.env.local` 中设置 `REACT_APP_NAVER_MAP_CLIENT_ID`。',
    en: 'Naver Map Client ID is missing. Set `REACT_APP_NAVER_MAP_CLIENT_ID` in `.env.local`.',
    ja: 'Naver地図のClient IDがありません。`.env.local`に`REACT_APP_NAVER_MAP_CLIENT_ID`を設定してください。'
  },
  'Bridgework 로고': { zh: 'Bridgework 徽标', en: 'Bridgework logo', ja: 'Bridgeworkロゴ' },
  '장애 유형과 접근성을 고려한 맞춤 일자리 추천 서비스': {
    zh: '结合残障类型和无障碍情况的个性化职位推荐服务',
    en: 'Personalized job recommendations based on disability type and accessibility',
    ja: '障害種別とアクセシビリティを考慮したカスタム求人推薦サービス'
  },
  '처음 이용해도 별도 가입 절차 없이': {
    zh: '首次使用也无需单独注册流程',
    en: 'Start without a separate sign-up flow',
    ja: '初めてでも別途登録手続きなしで'
  },
  '바로 시작할 수 있어요.': { zh: '即可开始。', en: 'you can get started right away.', ja: 'すぐに始められます。' },
  '회원가입을 진행하면': { zh: '继续注册即表示', en: 'By signing up, you agree to the', ja: '登録を進めると' },
  '이용약관': { zh: '使用条款', en: 'Terms of Service', ja: '利用規約' },
  '및': { zh: '和', en: 'and', ja: 'および' },
  '에 동의하게 됩니다.': { zh: '。', en: '.', ja: 'に同意したことになります。' },
  '정말 로그아웃하시겠습니까?': { zh: '确定要退出登录吗？', en: 'Do you want to log out?', ja: '本当にログアウトしますか？' },
  '14~120 숫자를 입력하세요.': { zh: '请输入 14 到 120 之间的数字。', en: 'Enter a number from 14 to 120.', ja: '14〜120の数字を入力してください。' },
  '나이는 숫자만 입력할 수 있습니다.': { zh: '年龄只能输入数字。', en: 'Age can only contain numbers.', ja: '年齢は数字のみ入力できます。' },
  '필수 항목을 정확히 입력해 주세요.': { zh: '请正确填写必填项目。', en: 'Enter all required fields correctly.', ja: '必須項目を正しく入力してください。' },
  '회원가입 완료에 실패했습니다.': { zh: '注册完成失败。', en: 'Failed to complete sign-up.', ja: '登録完了に失敗しました。' },
  '프로필 기준으로 필터 조건을 적용해 공고를 조회합니다.': {
    zh: '根据个人资料应用筛选条件并查询职位。',
    en: 'Apply filters from your profile to search jobs.',
    ja: 'プロフィール基準でフィルター条件を適用し、求人を検索します。'
  },
  'AI 스코어링 설정': { zh: 'AI 评分设置', en: 'AI scoring settings', ja: 'AIスコアリング設定' },
  '프로필 기반 종합 점수 계산': { zh: '计算基于资料的综合评分', en: 'Calculate profile-based overall score', ja: 'プロフィール基準の総合スコアを計算' },
  '프로필 기반 종합 점수 계산 해제': { zh: '关闭基于资料的综合评分', en: 'Turn off profile-based overall score', ja: 'プロフィール基準の総合スコア計算を解除' },
  '현재 결과: AI 스코어링': { zh: '当前结果：AI 评分', en: 'Current results: AI scoring', ja: '現在の結果：AIスコアリング' },
  '필터 펼치기': { zh: '展开筛选', en: 'Expand filters', ja: 'フィルターを開く' },
  '필터 접기': { zh: '收起筛选', en: 'Collapse filters', ja: 'フィルターを閉じる' },
  '필터 검색 실행': { zh: '运行筛选搜索', en: 'Run filter search', ja: 'フィルター検索を実行' },
  '정렬 방식': { zh: '排序方式', en: 'Sort order', ja: '並び替え方式' },
  '접근성 점수 높은순': { zh: '无障碍评分高', en: 'Highest accessibility score', ja: 'アクセシビリティスコアが高い順' },
  '희망 직무 1차, 2차, 3차 선택': {
    zh: '选择期望岗位的一级、二级、三级分类',
    en: 'Select first, second, and third job categories',
    ja: '希望職務の1次、2次、3次分類を選択'
  },
  '통근': { zh: '通勤', en: 'Commute', ja: '通勤' },
  '고용': { zh: '雇用', en: 'Employment', ja: '雇用' },
  '임금': { zh: '薪资', en: 'Pay', ja: '賃金' },
  '스크랩 불가': { zh: '无法收藏', en: 'Cannot save', ja: '保存不可' },
  '스크랩 취소 확인 열기': { zh: '打开取消收藏确认', en: 'Open unsave confirmation', ja: '保存解除確認を開く' },
  '데이터 출처': { zh: '数据来源', en: 'Data source', ja: 'データ出典' },
  '데이터 출처 ·': { zh: '数据来源 ·', en: 'Data source ·', ja: 'データ出典・' },
  '상세정보 요약': { zh: '详情摘要', en: 'Details summary', ja: '詳細情報の要約' },
  '추천 요약': { zh: '推荐摘要', en: 'Recommendation summary', ja: '推薦要約' },
  '추천 요약을 불러오지 못했습니다.': { zh: '无法加载推荐摘要。', en: 'Failed to load recommendation summary.', ja: '推薦要約を読み込めませんでした。' },
  '추천 요약을 불러오면 이곳에 표시됩니다.': {
    zh: '加载推荐摘要后会显示在这里。',
    en: 'The recommendation summary will appear here once loaded.',
    ja: '推薦要約を読み込むとここに表示されます。'
  },
  '접근성 점수 근거와 지원 전 확인할 내용을 정리하고 있습니다.': {
    zh: '正在整理无障碍评分依据和申请前需确认的内容。',
    en: 'Summarizing score evidence and items to confirm before applying.',
    ja: 'アクセシビリティスコアの根拠と応募前に確認する内容を整理しています。'
  },
  '이런 준비가 도움이 될 수 있어요': {
    zh: '这些准备可能会有帮助',
    en: 'These preparations may help',
    ja: 'このような準備が役立つことがあります'
  },
  '추천 프로그램': { zh: '推荐项目', en: 'Recommended program', ja: '推薦プログラム' },
  '초과': { zh: '超出', en: 'Exceeded', ja: '超過' },
  'useAuth는 AuthProvider 내부에서만 사용할 수 있습니다.': {
    zh: 'useAuth 只能在 AuthProvider 内部使用。',
    en: 'useAuth can only be used inside AuthProvider.',
    ja: 'useAuthはAuthProvider内部でのみ使用できます。'
  },
  '추가': { zh: '添加', en: 'Add', ja: '追加' },
  '접근 권한이 없습니다.': { zh: '没有访问权限。', en: 'You do not have access.', ja: 'アクセス権限がありません。' },
  '이 화면을 이용할 권한이 있는 계정으로 다시 로그인해 주세요.': {
    zh: '请使用有权访问此页面的账户重新登录。',
    en: 'Log in again with an account that can access this screen.',
    ja: 'この画面を利用できる権限のあるアカウントで再ログインしてください。'
  },
  '주소가 바뀌었거나 삭제된 페이지일 수 있습니다.': {
    zh: '地址可能已更改，或页面已删除。',
    en: 'The address may have changed or the page may have been removed.',
    ja: 'アドレスが変更されたか、削除されたページの可能性があります。'
  },
  '일시적인 오류가 발생했습니다.': { zh: '发生临时错误。', en: 'A temporary error occurred.', ja: '一時的なエラーが発生しました。' },
  '잠시 후 다시 시도해 주세요. 문제가 계속되면 고객센터로 문의해 주세요.': {
    zh: '请稍后重试。如问题持续，请联系帮助中心。',
    en: 'Try again later. If the problem continues, contact support.',
    ja: 'しばらくしてから再試行してください。問題が続く場合はサポートへお問い合わせください。'
  },
  '홈으로 이동': { zh: '前往首页', en: 'Go home', ja: 'ホームへ移動' },
  '문의 안내': { zh: '咨询说明', en: 'Contact help', ja: '問い合わせ案内' },
  '카톡 상담채널 새 창으로 열기': {
    zh: '在新窗口打开 KakaoTalk 咨询频道',
    en: 'Open KakaoTalk support channel in a new window',
    ja: 'KakaoTalk相談チャンネルを新しいウィンドウで開く'
  },
  '이전 화면으로 이동': { zh: '返回上一页', en: 'Go back', ja: '前の画面へ移動' },
  '생년월일 달력': { zh: '出生日期日历', en: 'Date of birth calendar', ja: '生年月日カレンダー' },
  '캘린더에서 생년월일 선택': { zh: '在日历中选择出生日期', en: 'Select date of birth in calendar', ja: 'カレンダーで生年月日を選択' },
  '연도 선택': { zh: '选择年份', en: 'Select year', ja: '年を選択' },
  '월 선택': { zh: '选择月份', en: 'Select month', ja: '月を選択' },
  '월 이동': { zh: '移动月份', en: 'Change month', ja: '月を移動' },
  '이전 월': { zh: '上个月', en: 'Previous month', ja: '前の月' },
  '다음 월': { zh: '下个月', en: 'Next month', ja: '次の月' },
  '오늘': { zh: '今天', en: 'Today', ja: '今日' },
  ', 오늘': { zh: '，今天', en: ', today', ja: '、今日' },
  '년': { zh: '年', en: 'year', ja: '年' },
  '월': { zh: '月', en: 'month', ja: '月' },
  '일': { zh: '日', en: 'day', ja: '日' },
  '수': { zh: '周三', en: 'Wed', ja: '水' },
  '목': { zh: '周四', en: 'Thu', ja: '木' },
  '금': { zh: '周五', en: 'Fri', ja: '金' },
  '토': { zh: '周六', en: 'Sat', ja: '土' },
  '이름 입력': { zh: '输入姓名', en: 'Enter name', ja: '氏名を入力' },
  '나이': { zh: '年龄', en: 'Age', ja: '年齢' },
  '성별': { zh: '性别', en: 'Gender', ja: '性別' },
  '거주 지역': { zh: '居住地区', en: 'Residence area', ja: '居住地域' },
  '전화번호': { zh: '电话号码', en: 'Phone number', ja: '電話番号' },
  '숫자와 + 만 허용됩니다.': { zh: '仅允许输入数字和 +。', en: 'Only numbers and + are allowed.', ja: '数字と+のみ使用できます。' },
  '예: 28': { zh: '例：28', en: 'Example: 28', ja: '例：28' },
  '예: 서울 강남구': { zh: '例：首尔江南区', en: 'Example: Gangnam-gu, Seoul', ja: '例：ソウル江南区' },
  '예: 010-1234-5678': { zh: '例：010-1234-5678', en: 'Example: 010-1234-5678', ja: '例：010-1234-5678' },
  '예: user@example.com': { zh: '例：user@example.com', en: 'Example: user@example.com', ja: '例：user@example.com' },
  '추천 설명을 생성하고 있습니다': {
    zh: '正在生成推荐说明',
    en: 'Creating recommendation explanation',
    ja: '推薦説明を作成しています'
  },
  '추천 설명 생성 진행 중': {
    zh: '推荐说明生成中',
    en: 'Recommendation explanation in progress',
    ja: '推薦説明を作成中'
  },
  '직무 적합도': { zh: '岗位匹配度', en: 'Job fit', ja: '職務適合度' },
  '화': { zh: '周二', en: 'Tue', ja: '火' },
  '선택된 공고 상세': { zh: '所选职位详情', en: 'Selected job details', ja: '選択した求人詳細' },
  '왼쪽 목록에서 공고를 선택하면 상세 정보를 확인할 수 있습니다.': {
    zh: '从左侧列表选择职位后，可查看详细信息。',
    en: 'Select a job from the left list to view details.',
    ja: '左の一覧から求人を選択すると詳細情報を確認できます。'
  },
  '왜 추천되었나요?': { zh: '为什么推荐？', en: 'Why recommended?', ja: 'なぜ推薦されましたか？' },
  '지원 전에 확인해보면 좋아요': { zh: '申请前建议确认', en: 'Good to check before applying', ja: '応募前に確認するとよい項目' },
  '참고해주세요': { zh: '请参考', en: 'Please note', ja: '参考にしてください' },
  '지원 체크리스트': { zh: '申请检查清单', en: 'Application checklist', ja: '応募チェックリスト' },
  '내 프로필 필수 정보 입력 완료 여부': {
    zh: '我的资料必填信息是否已完成',
    en: 'Required profile information completed',
    ja: 'プロフィール必須情報の入力完了有無'
  },
  '지원 직무 입력 여부': { zh: '是否已输入申请岗位', en: 'Target job entered', ja: '応募職務の入力有無' },
  '보유 기술/역량 입력 여부': { zh: '是否已输入技能/能力', en: 'Skills entered', ja: '保有スキル・能力の入力有無' },
  '경력/학력 정보 입력 여부': { zh: '是否已输入经历/学历信息', en: 'Experience/education entered', ja: '経歴・学歴情報の入力有無' },
  '필요 시 자기소개 작성 여부': { zh: '必要时是否已填写自我介绍', en: 'Introduction added if needed', ja: '必要時の自己紹介作成有無' },
  '공고 요구조건 확인 여부': { zh: '是否已确认职位要求', en: 'Job requirements checked', ja: '求人要件の確認有無' },
  '공고 특성': { zh: '职位特点', en: 'Job characteristics', ja: '求人の特徴' },
  '마감 임박': { zh: '即将截止', en: 'Closing soon', ja: '締切間近' },
  '장애인 우대': { zh: '残障人士优待', en: 'Disability preference', ja: '障害者優遇' },
  '저장': { zh: '保存', en: 'Save', ja: '保存' },
  '모집직종': { zh: '招聘岗位', en: 'Recruiting role', ja: '募集職種' },
  '입사유형': { zh: '入职类型', en: 'Entry type', ja: '入社区分' },
  '급여방식': { zh: '薪资方式', en: 'Pay type', ja: '給与方式' },
  '근무지역': { zh: '工作地区', en: 'Work region', ja: '勤務地域' },
  '요구경력': { zh: '经验要求', en: 'Required experience', ja: '必要経歴' },
  '요구전공': { zh: '专业要求', en: 'Required major', ja: '必要専攻' },
  '요구자격증': { zh: '证书要求', en: 'Required certificates', ja: '必要資格' },
  '등록일': { zh: '登记日期', en: 'Registration date', ja: '登録日' },
  '모집기간': { zh: '招聘期间', en: 'Recruitment period', ja: '募集期間' },
  '담당기관': { zh: '负责机构', en: 'Responsible agency', ja: '担当機関' },
  '사업장명': { zh: '工作单位名称', en: 'Workplace name', ja: '事業所名' },
  '표준사업장 여부': { zh: '是否为标准工作场所', en: 'Standard workplace status', ja: '標準事業所の有無' },
  '인증 상태': { zh: '认证状态', en: 'Certification status', ja: '認証状態' },
  'AI 추천 설명': { zh: 'AI 推荐说明', en: 'AI recommendation explanation', ja: 'AI推薦説明' },
  'AI 직무 적합도를 켜면 선택 프로필 기준으로 공고와의 일치도를 확인할 수 있습니다.': {
    zh: '开启 AI 岗位匹配度后，可按所选资料查看与职位的匹配情况。',
    en: 'Turn on AI job fit to compare the job with your selected profile.',
    ja: 'AI職務適合度をオンにすると、選択プロフィール基準で求人との一致度を確認できます。'
  },
  'AI 설명은 프로필 정보와 공고 정보를 바탕으로 계산한 참고용이며, 채용 여부를 보장하지 않습니다.': {
    zh: 'AI 说明基于个人资料和职位信息计算，仅供参考，不保证录用结果。',
    en: 'AI explanations are calculated from profile and job information for reference and do not guarantee hiring.',
    ja: 'AI説明はプロフィール情報と求人情報をもとに計算した参考情報であり、採用可否を保証するものではありません。'
  },
  '직무 적합도 상세': { zh: '岗位匹配度详情', en: 'Job fit details', ja: '職務適合度の詳細' },
  '총 직무 적합도 점수': { zh: '岗位匹配度总分', en: 'Total job fit score', ja: '総職務適合度スコア' },
  '정보 부족': { zh: '信息不足', en: 'Not enough information', ja: '情報不足' },
  '지원 판단 요약': { zh: '申请判断摘要', en: 'Application decision summary', ja: '応募判断の要約' },
  '지원 전 빠른 판단': { zh: '申请前快速判断', en: 'Quick check before applying', ja: '応募前の簡易判断' },
  '직무 적합도 점수가 확인되면 AI 추천 설명을 함께 표시합니다.': {
    zh: '确认岗位匹配度分数后，会同时显示 AI 推荐说明。',
    en: 'When the job fit score is available, the AI recommendation explanation will appear here.',
    ja: '職務適合度スコアが確認されると、AI推薦説明も表示します。'
  },
  '추천 설명 세부 항목이 없습니다. 공고 정보와 적합도 점수를 함께 확인해주세요.': {
    zh: '没有推荐说明的详细项目。请同时查看职位信息和匹配度分数。',
    en: 'No detailed recommendation items are available. Check the job information and fit score together.',
    ja: '推薦説明の詳細項目がありません。求人情報と適合度スコアを合わせて確認してください。'
  },
  '지원 직무와 공고 직무의 일치 여부': {
    zh: '申请岗位与招聘岗位是否一致',
    en: 'Whether target job matches job posting',
    ja: '応募職務と求人職務の一致有無'
  },
  '학력 조건 일치 여부': { zh: '学历条件是否一致', en: 'Education requirement match', ja: '学歴条件の一致有無' },
  '경력 조건 일치 여부': { zh: '经验条件是否一致', en: 'Experience requirement match', ja: '経歴条件の一致有無' },
  '긍정 요인': { zh: '积极因素', en: 'Positive factors', ja: '良い要素' },
  '주의 요인': { zh: '注意因素', en: 'Caution factors', ja: '注意要素' },
  '부족 정보': { zh: '缺少的信息', en: 'Missing information', ja: '不足情報' },
  '· 확인 필요': { zh: '· 需要确认', en: '· Needs confirmation', ja: '・確認が必要' },
  '기업 안정성/채용 친화도는 접근성 지도 화면의 종합 점수 대상이므로 여기서는 간단한 참고 정보로만 표시합니다.': {
    zh: '企业稳定性/招聘友好度属于无障碍地图综合评分范围，此处仅显示简要参考信息。',
    en: 'Company stability and hiring friendliness are part of the accessibility map score, so only brief reference information is shown here.',
    ja: '企業安定性・採用親和度はアクセシビリティ地図画面の総合スコア対象のため、ここでは簡単な参考情報のみ表示します。'
  },
  '직무 적합도는 프로필 정보와 공고 정보를 바탕으로 계산한 참고 지표입니다.': {
    zh: '岗位匹配度是基于个人资料和职位信息计算的参考指标。',
    en: 'Job fit is a reference score calculated from profile and job information.',
    ja: '職務適合度はプロフィール情報と求人情報をもとに計算した参考指標です。'
  },
  '기업의 실제 채용 판단과 다를 수 있습니다.': {
    zh: '可能与企业的实际招聘判断不同。',
    en: 'This may differ from the company’s actual hiring decision.',
    ja: '企業の実際の採用判断とは異なる場合があります。'
  },
  '정보가 부족한 항목은 확인 필요로 표시됩니다.': {
    zh: '信息不足的项目会显示为需要确认。',
    en: 'Items with insufficient information are marked as needs confirmation.',
    ja: '情報が不足している項目は確認が必要と表示されます。'
  },
  '신입': { zh: '应届/新人', en: 'Entry level', ja: '新卒・未経験' },
  '학력 조건': { zh: '学历条件', en: 'Education requirement', ja: '学歴条件' },
  '학력 무관': { zh: '学历不限', en: 'Any education', ja: '学歴不問' },
  '대졸 이상': { zh: '本科及以上', en: 'Bachelor or higher', ja: '大卒以上' },
  '마감 임박 여부': { zh: '是否即将截止', en: 'Closing soon status', ja: '締切間近の有無' },
  '마감 3일 이내': { zh: '3 天内截止', en: 'Due within 3 days', ja: '3日以内に締切' },
  '마감 7일 이내': { zh: '7 天内截止', en: 'Due within 7 days', ja: '7日以内に締切' },
  '장애인 우대 여부': { zh: '是否优待残障人士', en: 'Disability preference status', ja: '障害者優遇の有無' },
  '우대 공고': { zh: '优待职位', en: 'Preferred jobs', ja: '優遇求人' },
  '최신 공고를 빠르게 좁혀보고, 선택 공고는 오른쪽에서 자세히 확인합니다.': {
    zh: '快速筛选最新职位，并在右侧查看所选职位详情。',
    en: 'Narrow down recent jobs quickly and review the selected job on the right.',
    ja: '最新求人を素早く絞り込み、選択した求人は右側で詳しく確認します。'
  },
  '키워드 검색': { zh: '关键词搜索', en: 'Keyword search', ja: 'キーワード検索' },
  '직무명, 회사명, 지역 검색': { zh: '搜索岗位、公司或地区', en: 'Search role, company, or region', ja: '職務名、会社名、地域を検索' },
  '희망 근무지역': { zh: '期望工作地区', en: 'Desired work region', ja: '希望勤務地域' },
  '필터 초기화': { zh: '重置筛选', en: 'Reset filters', ja: 'フィルターをリセット' },
  'AI 적합도 꺼짐': { zh: 'AI 匹配度关闭', en: 'AI fit off', ja: 'AI適合度オフ' },
  '정보 부족 · 확인 필요': { zh: '信息不足 · 需要确认', en: 'Not enough information · Needs confirmation', ja: '情報不足・確認が必要' },
  '해당 공고 목록': { zh: '相关职位列表', en: 'Matching job list', ja: '該当求人一覧' },
  '해당 공고': { zh: '相关职位', en: 'Matching jobs', ja: '該当求人' },
  '선택한 프로필 기준 직무 적합도를 공고별로 함께 표시합니다.': {
    zh: '按所选资料显示每个职位的岗位匹配度。',
    en: 'Shows job fit for each posting based on the selected profile.',
    ja: '選択したプロフィール基準の職務適合度を求人ごとに表示します。'
  },
  '최신 공고를 먼저 표시합니다.': { zh: '优先显示最新职位。', en: 'Newest jobs are shown first.', ja: '最新求人を先に表示します。' },
  '직무 적합도를 다시 계산하고 있습니다.': { zh: '正在重新计算岗位匹配度。', en: 'Recalculating job fit.', ja: '職務適合度を再計算しています。' },
  '프로필 선택이 필요합니다.': { zh: '需要选择资料。', en: 'Profile selection is required.', ja: 'プロフィール選択が必要です。' },
  '조건에 맞는 공고가 없습니다.': { zh: '没有符合条件的职位。', en: 'No jobs match the conditions.', ja: '条件に合う求人はありません。' },
  '자기소개와 프로필 입력값을 반영해 새 추천 결과를 준비하고 있습니다.': {
    zh: '正在根据自我介绍和资料输入准备新的推荐结果。',
    en: 'Preparing new recommendations using your introduction and profile inputs.',
    ja: '自己紹介とプロフィール入力内容を反映して新しい推薦結果を準備しています。'
  },
  '로그인 후 프로필을 선택하면 맞춤 일자리 추천을 확인할 수 있습니다.': {
    zh: '登录后选择个人资料即可查看个性化职位推荐。',
    en: 'Log in and select a profile to view personalized job recommendations.',
    ja: 'ログイン後にプロフィールを選択すると、カスタム求人推薦を確認できます。'
  },
  '선택된 공고': { zh: '已选择职位', en: 'Selected job', ja: '選択中の求人' },
  '현재 선택됨': { zh: '当前已选择', en: 'Currently selected', ja: '現在選択中' },
  '최근 저장순': { zh: '最近保存优先', en: 'Recently saved first', ja: '最近保存順' },
  '마감 임박순': { zh: '即将截止优先', en: 'Closing soon first', ja: '締切間近順' },
  '스크랩 삭제 확인': { zh: '确认删除收藏', en: 'Confirm saved job deletion', ja: '保存求人の削除確認' },
  '정말 이 스크랩 공고를 삭제하시겠습니까?': { zh: '确定要删除此收藏职位吗？', en: 'Delete this saved job?', ja: 'この保存求人を削除しますか？' },
  '삭제 중...': { zh: '正在删除...', en: 'Deleting...', ja: '削除中...' },
  '개인 맞춤 공고 모아보기': { zh: '查看个性化职位合集', en: 'View personalized saved jobs', ja: '個人向け求人をまとめて見る' },
  '스크랩한 공고': { zh: '收藏的职位', en: 'Saved jobs', ja: '保存した求人' },
  '저장한 공고를 접근성 점수와 추천 이유 기준으로 다시 비교해보세요.': {
    zh: '按无障碍评分和推荐理由重新比较已保存的职位。',
    en: 'Compare saved jobs again by accessibility score and recommendation reasons.',
    ja: '保存した求人をアクセシビリティスコアと推薦理由で再比較してください。'
  },
  '스크랩 공고 요약': { zh: '收藏职位摘要', en: 'Saved jobs summary', ja: '保存求人の要約' },
  '진행중': { zh: '进行中', en: 'Open', ja: '進行中' },
  '정렬': { zh: '排序', en: 'Sort', ja: '並び替え' },
  '스크랩 공고 목록': { zh: '收藏职位列表', en: 'Saved job list', ja: '保存求人一覧' },
  '저장 날짜, 마감 여부, 접근성 요약을 한눈에 확인합니다.': {
    zh: '一眼查看保存日期、截止状态和无障碍摘要。',
    en: 'Review saved date, deadline status, and accessibility summary at a glance.',
    ja: '保存日、締切状況、アクセシビリティ要約を一目で確認します。'
  },
  '스크랩 공고': { zh: '收藏职位', en: 'Saved job', ja: '保存求人' },
  '네이버 지도 클라이언트 정보가 없습니다.': { zh: '缺少 Naver 地图客户端信息。', en: 'Naver Map client information is missing.', ja: 'Naver地図クライアント情報がありません。' },
  '네이버 지도를 불러오는 중입니다.': { zh: '正在加载 Naver 地图。', en: 'Loading Naver Map.', ja: 'Naver地図を読み込んでいます。' },
  '스크랩 공고 상세': { zh: '收藏职位详情', en: 'Saved job details', ja: '保存求人詳細' },
  '왼쪽 목록에서 저장한 공고를 선택하면 접근성 요약과 추천 이유를 볼 수 있습니다.': {
    zh: '从左侧列表选择已保存职位后，可查看无障碍摘要和推荐理由。',
    en: 'Select a saved job from the left list to view its accessibility summary and recommendation reasons.',
    ja: '左の一覧から保存した求人を選択すると、アクセシビリティ要約と推薦理由を確認できます。'
  },
  '스크랩 삭제': { zh: '删除收藏', en: 'Delete saved job', ja: '保存を削除' },
  '스크랩 및 상태': { zh: '收藏和状态', en: 'Saved status', ja: '保存と状態' },
  '연동된 접근성 요약 데이터가 없습니다.': { zh: '没有关联的无障碍摘要数据。', en: 'No linked accessibility summary data.', ja: '連携されたアクセシビリティ要約データがありません。' },
  '주소 매칭 정보': { zh: '地址匹配信息', en: 'Address match information', ja: '住所マッチング情報' },
  '지도 미리보기': { zh: '地图预览', en: 'Map preview', ja: '地図プレビュー' },
  '표시 정보는 공고 상세 API에서 제공한 값 기준입니다.': {
    zh: '显示信息基于职位详情 API 提供的值。',
    en: 'Displayed information is based on values from the job detail API.',
    ja: '表示情報は求人詳細APIから提供された値に基づきます。'
  },
  '지원 전 최신 채용 상태와 이동 경로를 다시 확인하세요.': {
    zh: '申请前请再次确认最新招聘状态和移动路线。',
    en: 'Before applying, confirm the latest hiring status and travel route.',
    ja: '応募前に最新の採用状況と移動経路を再確認してください。'
  },
  '스크랩 공고를 불러오는 중입니다.': { zh: '正在加载收藏职位。', en: 'Loading saved jobs.', ja: '保存求人を読み込んでいます。' },
  '아직 스크랩한 공고가 없습니다.': { zh: '还没有收藏的职位。', en: 'No saved jobs yet.', ja: '保存した求人はまだありません。' },
  '지체장애': { zh: '肢体残障', en: 'Physical disability', ja: '肢体障害' },
  '뇌병변장애': { zh: '脑病变残障', en: 'Brain lesion disability', ja: '脳病変障害' },
  '시각장애': { zh: '视力残障', en: 'Visual disability', ja: '視覚障害' },
  '청각장애': { zh: '听力残障', en: 'Hearing disability', ja: '聴覚障害' },
  '언어장애': { zh: '言语残障', en: 'Speech disability', ja: '言語障害' },
  '지적장애': { zh: '智力残障', en: 'Intellectual disability', ja: '知的障害' },
  '자폐성장애': { zh: '自闭谱系残障', en: 'Autism spectrum disability', ja: '自閉スペクトラム障害' },
  '정신장애': { zh: '精神障碍', en: 'Mental disability', ja: '精神障害' },
  '신장장애': { zh: '肾脏残障', en: 'Kidney disability', ja: '腎臓障害' },
  '심장장애': { zh: '心脏残障', en: 'Heart disability', ja: '心臓障害' },
  '호흡기장애': { zh: '呼吸系统残障', en: 'Respiratory disability', ja: '呼吸器障害' },
  '간장애': { zh: '肝脏残障', en: 'Liver disability', ja: '肝臓障害' },
  '안면장애': { zh: '面部残障', en: 'Facial disability', ja: '顔面障害' },
  '장루·요루장애': { zh: '肠造口/尿路造口残障', en: 'Ostomy/urostomy disability', ja: 'ぼうこう・直腸機能障害' },
  '뇌전증장애': { zh: '癫痫残障', en: 'Epilepsy disability', ja: 'てんかん障害' },
  '정규직': { zh: '正式员工', en: 'Full-time', ja: '正社員' },
  '상용직': { zh: '长期雇用', en: 'Regular employment', ja: '常用雇用' },
  '계약직': { zh: '合同工', en: 'Contract', ja: '契約社員' },
  '무기계약직': { zh: '无固定期限合同', en: 'Indefinite contract', ja: '無期契約社員' },
  '임시직': { zh: '临时雇用', en: 'Temporary employment', ja: '臨時雇用' },
  '시간제': { zh: '兼职/小时制', en: 'Part-time', ja: 'パートタイム' },
  '일용직': { zh: '日工', en: 'Day labor', ja: '日雇い' },
  '인턴': { zh: '实习', en: 'Intern', ja: 'インターン' },
  '파견/용역': { zh: '派遣/外包', en: 'Dispatch/contract work', ja: '派遣/請負' },
  '파견·용역': { zh: '派遣/外包', en: 'Dispatched/outsourced', ja: '派遣・請負' },
  '재택/원격': { zh: '居家/远程', en: 'Remote', ja: '在宅/リモート' },
  '재택·원격': { zh: '居家/远程', en: 'Remote', ja: '在宅・リモート' },
  '월급': { zh: '月薪', en: 'Monthly pay', ja: '月給' },
  '일급': { zh: '日薪', en: 'Daily pay', ja: '日給' },
  '건별/성과급': { zh: 'Per task/performance pay', en: 'Per task / performance pay', ja: '案件別/成果給' },
  '건별·성과급': { zh: 'Per task/performance pay', en: 'Per task / performance pay', ja: '案件別・成果給' },
  '회사 내규에 따름': { zh: 'By company policy', en: 'By company policy', ja: '会社規定による' },
  '면접 후 협의': { zh: 'Discuss after interview', en: 'Discuss after interview', ja: '面接後に相談' },
  '관리직(임원·부서장)': { zh: 'Management (executives/team heads)', en: 'Management (executives/team heads)', ja: '管理職（役員・部門長）' },
  '경영·행정·사무직': { zh: 'Business, administration, office', en: 'Business, administration, office', ja: '経営・行政・事務' },
  '금융·보험직': { zh: 'Finance and insurance', en: 'Finance and insurance', ja: '金融・保険' },
  '인문·사회과학 연구직': { zh: 'Humanities and social science research', en: 'Humanities and social science research', ja: '人文・社会科学研究' },
  '연구직 및 공학 기술직': { zh: 'Research and engineering technology', en: 'Research and engineering technology', ja: '研究職・工学技術職' },
  '교육·법률·사회복지·경찰·소방직 및 군인': { zh: 'Education, legal, welfare, police, fire, military', en: 'Education, legal, welfare, police, fire, military', ja: '教育・法律・福祉・警察・消防・軍人' },
  '보건·의료직': { zh: 'Health and medical', en: 'Health and medical', ja: '保健・医療' },
  '예술·디자인·방송·스포츠직': { zh: 'Art, design, media, sports', en: 'Art, design, media, sports', ja: '芸術・デザイン・放送・スポーツ' },
  '미용·여행·숙박·음식·경비·청소직': { zh: 'Beauty, travel, lodging, food, security, cleaning', en: 'Beauty, travel, lodging, food, security, cleaning', ja: '美容・旅行・宿泊・飲食・警備・清掃' },
  '영업·판매·운전·운송직': { zh: 'Sales, retail, driving, transport', en: 'Sales, retail, driving, transport', ja: '営業・販売・運転・運送' },
  '건설·채굴직': { zh: 'Construction and mining', en: 'Construction and mining', ja: '建設・採掘' },
  '설치·정비·생산직': { zh: 'Installation, maintenance, production', en: 'Installation, maintenance, production', ja: '設置・整備・生産' },
  '농림어업직': { zh: 'Agriculture, forestry, fishing', en: 'Agriculture, forestry, fishing', ja: '農林漁業' },
  '의회의원·고위공무원 및 기업 고위임원': { zh: 'Legislators, senior public officials, executives', en: 'Legislators, senior officials, executives', ja: '議員・高位公務員・企業役員' },
  '행정·경영·금융·보험 관리자': { zh: 'Administration, business, finance, insurance managers', en: 'Administration, business, finance, insurance managers', ja: '行政・経営・金融・保険管理者' },
  '전문서비스 관리자': { zh: 'Professional service managers', en: 'Professional service managers', ja: '専門サービス管理者' },
  '미용·여행·숙박·음식·경비·청소 관리자': { zh: 'Beauty, travel, lodging, food, security, cleaning managers', en: 'Beauty, travel, lodging, food, security, cleaning managers', ja: '美容・旅行・宿泊・飲食・警備・清掃管理者' },
  '의회 의원': { zh: 'Legislator', en: 'Legislator', ja: '議員' },
  '고위 공무원 및 정당·특수 단체 임원': { zh: 'Senior public official or party/organization executive', en: 'Senior official or party/organization executive', ja: '高位公務員・政党/団体役員' },
  '기업 대표 및 기업 고위 임원': { zh: 'Company representative or executive', en: 'Company representative or executive', ja: '企業代表・企業役員' },
  '주간': { zh: '白天', en: 'Daytime', ja: '日勤' },
  '오전': { zh: '上午', en: 'Morning', ja: '午前' },
  '오후': { zh: '下午', en: 'Afternoon', ja: '午後' },
  '야간': { zh: '夜间', en: 'Night', ja: '夜間' },
  '탄력근무': { zh: '弹性工作', en: 'Flexible hours', ja: 'フレックスタイム' },
  '군필': { zh: '已服兵役', en: 'Completed service', ja: '兵役済み' },
  '면제': { zh: '免除', en: 'Exempt', ja: '免除' },
  '복무 중': { zh: '服役中', en: 'In service', ja: '服務中' },
  '프로필 사진': { zh: '资料照片', en: 'Profile photo', ja: 'プロフィール写真' },
  '비상 연락처': { zh: '紧急联系方式', en: 'Emergency contact', ja: '緊急連絡先' },
  '학력': { zh: '学历', en: 'Education', ja: '学歴' },
  '졸업 여부': { zh: '毕业状态', en: 'Graduation status', ja: '卒業有無' },
  '없으면 신입': { zh: '没有则按新人', en: 'Entry level if none', ja: 'なければ未経験' },
  '프로젝트 경험': { zh: '项目经验', en: 'Project experience', ja: 'プロジェクト経験' },
  '공백 기간 사유': { zh: '空白期原因', en: 'Reason for career gap', ja: '空白期間の理由' },
  '지원 직무 목록을 불러오는 중입니다.': { zh: '正在加载可申请岗位列表。', en: 'Loading target job list.', ja: '応募職務一覧を読み込んでいます。' },
  '지원 직무 목록을 불러오지 못했습니다.': { zh: '无法加载可申请岗位列表。', en: 'Failed to load target job list.', ja: '応募職務一覧を読み込めませんでした。' },
  '선택 가능한 지원 직무 목록이 없습니다.': { zh: '没有可选择的申请岗位。', en: 'No target jobs are available.', ja: '選択できる応募職務がありません。' },
  '보유 기술 / 역량': { zh: '技能 / 能力', en: 'Skills / Competencies', ja: '保有スキル / 能力' },
  'Enter 또는 추가 버튼으로 항목을 추가합니다.': {
    zh: '按 Enter 或添加按钮添加项目。',
    en: 'Use Enter or the Add button to add an item.',
    ja: 'Enterまたは追加ボタンで項目を追加します。'
  },
  '예) 엑셀': { zh: '例）Excel', en: 'Example: Excel', ja: '例）Excel' },
  '예) 컴퓨터활용능력 2급': { zh: '例）计算机应用能力 2 级', en: 'Example: computer skills certificate', ja: '例）PC資格2級' },
  '포트폴리오 URL': { zh: '作品集 URL', en: 'Portfolio URL', ja: 'ポートフォリオURL' },
  '수상 이력': { zh: '获奖经历', en: 'Awards', ja: '受賞歴' },
  '교육 이수 내역': { zh: '培训完成记录', en: 'Training history', ja: '教育履修歴' },
  '선택 완료된 지원 직무 경로': { zh: '已选择的申请岗位路径', en: 'Selected target job path', ja: '選択済み応募職務パス' },
  '관심 있는 분야부터 실제 수행 업무까지 차례로 선택해 주세요.': {
    zh: '请从感兴趣的领域到实际工作内容依次选择。',
    en: 'Select from your field of interest through the actual work task.',
    ja: '関心分野から実際の業務まで順番に選択してください。'
  },
  '1차 선택': { zh: '选择一级', en: 'Select level 1', ja: '1次選択' },
  '분야 선택': { zh: '选择领域', en: 'Select field', ja: '分野を選択' },
  '2차 선택': { zh: '选择二级', en: 'Select level 2', ja: '2次選択' },
  '세부 직군 선택': { zh: '选择细分职群', en: 'Select job group', ja: '詳細職群を選択' },
  '3차 선택': { zh: '选择三级', en: 'Select level 3', ja: '3次選択' },
  '실제 수행 업무 선택': { zh: '选择实际工作内容', en: 'Select actual task', ja: '実際の業務を選択' },
  '최대': { zh: '最多', en: 'Up to', ja: '最大' },
  '개까지 선택할 수 있습니다.': { zh: '个可选。', en: 'items can be selected.', ja: '件まで選択できます。' },
  '예) 높이조절 책상': { zh: '例）可调高度桌', en: 'Example: height-adjustable desk', ja: '例）高さ調整デスク' },
  '예) 3200': { zh: '例）3200', en: 'Example: 3200', ja: '例）3200' },
  '만원': { zh: '万韩元', en: '10,000 KRW', ja: '万ウォン' },
  '예) 대중교통 50분 이내': { zh: '例）公共交通 50 分钟以内', en: 'Example: within 50 minutes by public transit', ja: '例）公共交通50分以内' },
  '자기소개 및 지원동기': { zh: '自我介绍和申请动机', en: 'Introduction and motivation', ja: '自己紹介・志望動機' },
  'SNS / 개인 웹사이트': { zh: '社交媒体 / 个人网站', en: 'SNS / Personal website', ja: 'SNS / 個人ウェブサイト' },
  '자': { zh: '字', en: 'chars', ja: '字' },
  '학력 / 경력': { zh: '学历 / 经历', en: 'Education / Career', ja: '学歴 / 経歴' },
  '장애': { zh: '残障', en: 'Disability', ja: '障害' },
  '작성 중인 프로필 정보가 있습니다. 저장하지 않고 나가시겠습니까?': {
    zh: '有正在编辑的资料信息。要不保存并离开吗？',
    en: 'You have unsaved profile information. Leave without saving?',
    ja: '作成中のプロフィール情報があります。保存せずに移動しますか？'
  },
  '프로필 수정': { zh: '编辑资料', en: 'Edit profile', ja: 'プロフィール編集' },
  '프로필 상세': { zh: '资料详情', en: 'Profile details', ja: 'プロフィール詳細' },
  '프로필 저장에 실패했습니다.': { zh: '资料保存失败。', en: 'Failed to save profile.', ja: 'プロフィール保存に失敗しました。' },
  '파일 업로드 입력을 초기화하지 못했습니다. 화면을 새로고침 후 다시 시도해 주세요.': {
    zh: '无法重置文件上传输入。请刷新页面后重试。',
    en: 'Could not reset the file upload field. Refresh the page and try again.',
    ja: 'ファイルアップロード入力を初期化できませんでした。画面を更新して再試行してください。'
  },
  '포트폴리오에서 프로필 정보를 추출하지 못했습니다.': {
    zh: '无法从作品集中提取资料信息。',
    en: 'Could not extract profile information from the portfolio.',
    ja: 'ポートフォリオからプロフィール情報を抽出できませんでした。'
  },
  'PDF 분석 결과를 반영했습니다. 저장 버튼을 누르면 서버에 반영됩니다.': {
    zh: '已应用 PDF 分析结果。点击保存后会同步到服务器。',
    en: 'PDF analysis results were applied. Press Save to send them to the server.',
    ja: 'PDF分析結果を反映しました。保存ボタンを押すとサーバーに反映されます。'
  },
  '포트폴리오 분석에 실패했습니다.': { zh: '作品集分析失败。', en: 'Portfolio analysis failed.', ja: 'ポートフォリオ分析に失敗しました。' },
  '수정하기': { zh: '编辑', en: 'Edit', ja: '修正する' },
  '프로필 이름': { zh: '资料名称', en: 'Profile name', ja: 'プロフィール名' },
  '예) 기본 생성 프로필, 나의 프로필': {
    zh: '例）默认生成资料、我的资料',
    en: 'Example: default profile, my profile',
    ja: '例）基本作成プロフィール、マイプロフィール'
  },
  '삭제되는 정보': { zh: '将删除的信息', en: 'Information to be deleted', ja: '削除される情報' },
  '계정 식별 정보, 프로필, 접근성 설정, 저장 공고, 추천 이력은 탈퇴 확정 후 삭제 또는 비식별 처리됩니다.': {
    zh: '账户识别信息、资料、无障碍设置、保存职位和推荐记录会在注销确认后删除或去标识化。',
    en: 'Account identifiers, profiles, accessibility settings, saved jobs, and recommendation history are deleted or de-identified after withdrawal is confirmed.',
    ja: 'アカウント識別情報、プロフィール、アクセシビリティ設定、保存求人、推薦履歴は退会確定後に削除または非識別化されます。'
  },
  '탈퇴 신청 후 30일 안에 다시 로그인하면 계정 복구와 탈퇴 신청 취소를 진행할 수 있습니다.': {
    zh: '注销申请后 30 天内重新登录，可恢复账户并取消注销申请。',
    en: 'If you log in again within 30 days after requesting withdrawal, you can restore the account and cancel the request.',
    ja: '退会申請後30日以内に再ログインすると、アカウント復旧と退会申請取消を進められます。'
  },
  '법령 준수, 분쟁 대응, 보안 목적의 인증 기록, 처리 로그, 문의 이력은 분리 보관될 수 있습니다.': {
    zh: '为遵守法律、处理纠纷和安全目的，认证记录、处理日志和咨询记录可能会分开保管。',
    en: 'Authentication records, processing logs, and support history may be stored separately for legal compliance, dispute handling, and security.',
    ja: '法令遵守、紛争対応、セキュリティ目的の認証記録、処理ログ、問い合わせ履歴は分離保管される場合があります。'
  },
  '회원탈퇴 확인 창 닫기': { zh: '关闭注销账户确认窗口', en: 'Close account withdrawal confirmation', ja: '退会確認画面を閉じる' },
  '탈퇴 전 유의사항': { zh: '注销前注意事项', en: 'Before withdrawal', ja: '退会前の注意事項' },
  '탈퇴 신청 중': { zh: '正在申请注销', en: 'Requesting withdrawal', ja: '退会申請中' },
  '자주 사용': { zh: '常用', en: 'Frequently used', ja: 'よく使う' },
  '정보': { zh: '信息', en: 'Information', ja: '情報' },
  '위험': { zh: '风险', en: 'Risk', ja: 'リスク' },
  '확인 가능': { zh: '可确认', en: 'Can be checked', ja: '確認可能' },
  '환경설정': { zh: '设置', en: 'Settings', ja: '環境設定' },
  '설정 카테고리': { zh: '设置类别', en: 'Settings categories', ja: '設定カテゴリ' },
  '소셜 로그인 계정': { zh: '社交登录账户', en: 'Social login account', ja: 'ソーシャルログインアカウント' },
  '점수 표시': { zh: '评分显示', en: 'Score display', ja: 'スコア表示' },
  '색상+문자': { zh: '颜色+文字', en: 'Color + text', ja: '色+文字' },
  '문자 중심': { zh: '文字为主', en: 'Text focused', ja: '文字中心' },
  '지도 색상 보조': { zh: '地图颜色辅助', en: 'Map color support', ja: '地図色補助' },
  '카톡상담채널': { zh: 'KakaoTalk 咨询频道', en: 'KakaoTalk support channel', ja: 'KakaoTalk相談チャンネル' },
  '문의 메일:': { zh: '联系邮箱：', en: 'Contact email:', ja: '問い合わせメール:' },
  '운영 시간: 평일 10:00-18:00': { zh: '服务时间：工作日 10:00-18:00', en: 'Hours: weekdays 10:00-18:00', ja: '運営時間：平日10:00-18:00' },
  '답변 예상 시간: 영업일 기준 1-2일': { zh: '预计回复：1-2 个工作日', en: 'Expected reply: 1-2 business days', ja: '回答目安：営業日基準1〜2日' },
  '경력': { zh: '经历', en: 'Experience', ja: '経歴' },
  '급여 방식': { zh: '薪资方式', en: 'Pay type', ja: '給与方式' },
  '공고 배지': { zh: '职位徽章', en: 'Job badge', ja: '求人バッジ' },
  '거주지 상세 주소': { zh: '居住详细地址', en: 'Detailed residence address', ja: '居住地の詳細住所' },
  '동·읍·면 단위까지 입력하면 통근 시간 계산이 정확해져요': {
    zh: '输入到街道/乡镇级别可提高通勤时间计算准确度。',
    en: 'Enter neighborhood-level details for a more accurate commute estimate.',
    ja: '町・村単位まで入力すると通勤時間計算がより正確になります。'
  },
  '내 포트폴리오 pdf 파일로 생성하기': { zh: '生成我的作品集 PDF', en: 'Create my portfolio PDF', ja: 'ポートフォリオPDFを作成' },
  'PDF 분석 중...': { zh: '正在分析 PDF...', en: 'Analyzing PDF...', ja: 'PDFを分析中...' },
  'PDF 분석 중입니다': { zh: '正在分析 PDF', en: 'Analyzing PDF', ja: 'PDFを分析しています' },
  '분석이 끝날 때까지 잠시만 기다려 주세요.': {
    zh: '请稍等，直到分析完成。',
    en: 'Please wait until the analysis is complete.',
    ja: '分析が完了するまで少しお待ちください。'
  },
  '업로드 가능: PDF, 최대': { zh: '可上传：PDF，最大', en: 'Upload: PDF, up to', ja: 'アップロード可能：PDF、最大' },
  '이미 입력된 값들도 새로 덮어쓰기 됩니다. 진행하시겠습니까?': {
    zh: '已输入的值也会被新内容覆盖。要继续吗？',
    en: 'Existing values will also be overwritten. Continue?',
    ja: '入力済みの値も新しい内容で上書きされます。続行しますか？'
  },
  '포트폴리오로 프로필 생성': { zh: '用作品集生成资料', en: 'Create profile from portfolio', ja: 'ポートフォリオからプロフィールを作成' },
  '임시저장됨': { zh: '已临时保存', en: 'Draft saved', ja: '一時保存済み' },
  '프로필 입력 섹션': { zh: '资料输入区', en: 'Profile input section', ja: 'プロフィール入力セクション' },
  '지체': { zh: '肢体', en: 'Physical', ja: '肢体' },
  '뇌병변': { zh: '脑病变', en: 'Brain lesion', ja: '脳病変' },
  '시각': { zh: '视力', en: 'Visual', ja: '視覚' },
  '청각': { zh: '听力', en: 'Hearing', ja: '聴覚' },
  '언어': { zh: '言语', en: 'Speech', ja: '言語' },
  '지적': { zh: '智力', en: 'Intellectual', ja: '知的' },
  '자폐성': { zh: '自闭谱系', en: 'Autism spectrum', ja: '自閉スペクトラム' },
  '정신': { zh: '精神', en: 'Mental', ja: '精神' },
  '신장': { zh: '肾脏', en: 'Kidney', ja: '腎臓' },
  '심장': { zh: '心脏', en: 'Heart', ja: '心臓' },
  '호흡기': { zh: '呼吸系统', en: 'Respiratory', ja: '呼吸器' },
  '간': { zh: '肝脏', en: 'Liver', ja: '肝臓' },
  '안면': { zh: '面部', en: 'Facial', ja: '顔面' },
  '장루·요루': { zh: '肠造口/尿路造口', en: 'Ostomy/urostomy', ja: 'ぼうこう・直腸機能' },
  '뇌전증': { zh: '癫痫', en: 'Epilepsy', ja: 'てんかん' },
  '등록': { zh: '已登记', en: 'Registered', ja: '登録' },
  '미등록': { zh: '未登记', en: 'Not registered', ja: '未登録' },
  '80 이상': { zh: '80 以上', en: '80 or higher', ja: '80以上' },
  '60 ~ 79': { zh: '60 ~ 79', en: '60 to 79', ja: '60 ~ 79' },
  '60 미만': { zh: '低于 60', en: 'Under 60', ja: '60未満' },
  '서울': { zh: '首尔', en: 'Seoul', ja: 'ソウル' },
  '서울특별시': { zh: '首尔特别市', en: 'Seoul', ja: 'ソウル特別市' },
  '부산': { zh: '釜山', en: 'Busan', ja: '釜山' },
  '부산광역시': { zh: '釜山广域市', en: 'Busan', ja: '釜山広域市' },
  '대구': { zh: '大邱', en: 'Daegu', ja: '大邱' },
  '대구광역시': { zh: '大邱广域市', en: 'Daegu', ja: '大邱広域市' },
  '인천': { zh: '仁川', en: 'Incheon', ja: '仁川' },
  '인천광역시': { zh: '仁川广域市', en: 'Incheon', ja: '仁川広域市' },
  '광주': { zh: '光州', en: 'Gwangju', ja: '光州' },
  '광주광역시': { zh: '光州广域市', en: 'Gwangju', ja: '光州広域市' },
  '대전': { zh: '大田', en: 'Daejeon', ja: '大田' },
  '대전광역시': { zh: '大田广域市', en: 'Daejeon', ja: '大田広域市' },
  '울산': { zh: '蔚山', en: 'Ulsan', ja: '蔚山' },
  '울산광역시': { zh: '蔚山广域市', en: 'Ulsan', ja: '蔚山広域市' },
  '세종': { zh: '世宗', en: 'Sejong', ja: '世宗' },
  '세종특별자치시': { zh: '世宗特别自治市', en: 'Sejong', ja: '世宗特別自治市' },
  '경기': { zh: '京畿', en: 'Gyeonggi', ja: '京畿' },
  '경기도': { zh: '京畿道', en: 'Gyeonggi-do', ja: '京畿道' },
  '강원': { zh: '江原', en: 'Gangwon', ja: '江原' },
  '강원도': { zh: '江原道', en: 'Gangwon-do', ja: '江原道' },
  '강원특별자치도': { zh: '江原特别自治道', en: 'Gangwon State', ja: '江原特別自治道' },
  '충북': { zh: '忠北', en: 'Chungbuk', ja: '忠北' },
  '충청북도': { zh: '忠清北道', en: 'Chungcheongbuk-do', ja: '忠清北道' },
  '충남': { zh: '忠南', en: 'Chungnam', ja: '忠南' },
  '충청남도': { zh: '忠清南道', en: 'Chungcheongnam-do', ja: '忠清南道' },
  '전북': { zh: '全北', en: 'Jeonbuk', ja: '全北' },
  '전라북도': { zh: '全罗北道', en: 'Jeollabuk-do', ja: '全羅北道' },
  '전북특별자치도': { zh: '全北特别自治道', en: 'Jeonbuk State', ja: '全北特別自治道' },
  '전남': { zh: '全南', en: 'Jeonnam', ja: '全南' },
  '전라남도': { zh: '全罗南道', en: 'Jeollanam-do', ja: '全羅南道' },
  '경북': { zh: '庆北', en: 'Gyeongbuk', ja: '慶北' },
  '경상북도': { zh: '庆尚北道', en: 'Gyeongsangbuk-do', ja: '慶尚北道' },
  '경남': { zh: '庆南', en: 'Gyeongnam', ja: '慶南' },
  '경상남도': { zh: '庆尚南道', en: 'Gyeongsangnam-do', ja: '慶尚南道' },
  '제주': { zh: '济州', en: 'Jeju', ja: '済州' },
  '제주특별자치도': { zh: '济州特别自治道', en: 'Jeju', ja: '済州特別自治道' },
  '프로필 상세 정보를 불러오지 못했습니다.': { zh: '无法加载个人资料详情。', en: 'Failed to load profile details.', ja: 'プロフィール詳細を読み込めませんでした。' },
  '도움말': { zh: '帮助', en: 'Help', ja: 'ヘルプ' },
  '재가입 제한 기간이나 동일 소셜 계정 재가입 조건은 확정 전까지 확인 필요 항목으로 안내합니다.': {
    zh: '重新注册限制期限或同一社交账户重新注册条件，在最终确定前会作为需要确认的项目提示。',
    en: 'Rejoin restriction periods or conditions for rejoining with the same social account are shown as items needing confirmation until finalized.',
    ja: '再登録制限期間や同一ソーシャルアカウントでの再登録条件は、確定前まで確認が必要な項目として案内します。'
  },
  '탈퇴 전에는 삭제되는 정보, 복구 가능 여부, 법정 보관 정보, 재가입 제한 여부를 반드시 확인해야 합니다. 확인 후 탈퇴 신청이 서버에 접수됩니다.': {
    zh: '注销前必须确认将删除的信息、是否可恢复、依法保留的信息和重新注册限制。确认后，注销申请会提交到服务器。',
    en: 'Before withdrawal, you must review deleted information, recovery availability, legally retained information, and rejoin restrictions. After confirmation, the withdrawal request is submitted to the server.',
    ja: '退会前に、削除される情報、復旧可否、法定保管情報、再登録制限の有無を必ず確認してください。確認後、退会申請がサーバーに受け付けられます。'
  },
  '탈퇴 시 삭제되는 정보, 30일 내 복구 가능 여부, 법정 보관 정보, 재가입 제한 확인 필요 항목을 모두 확인했습니다.': {
    zh: '我已确认注销时删除的信息、30 天内恢复可能性、依法保留的信息，以及重新注册限制中需要确认的项目。',
    en: 'I have reviewed information deleted on withdrawal, recovery within 30 days, legally retained information, and rejoin restriction items that need confirmation.',
    ja: '退会時に削除される情報、30日以内の復旧可否、法定保管情報、再登録制限の確認必要項目をすべて確認しました。'
  },
  '계정 생성과 서비스 제공에 필요한 동의입니다.': {
    zh: '这是创建账户和提供服务所需的同意。',
    en: 'Required consent for account creation and service use.',
    ja: 'アカウント作成とサービス提供に必要な同意です。'
  },
  '추천 품질 개선을 위해 사용되며 기본 공개되지 않습니다.': {
    zh: '用于改进推荐质量，默认不会公开。',
    en: 'Used to improve recommendation quality and not public by default.',
    ja: '推薦品質の改善に使用され、基本的には公開されません。'
  },
  '지원 또는 기업 공개 설정 시 제공 범위를 확인합니다.': {
    zh: '申请或设置向企业公开时，请确认提供范围。',
    en: 'Review the sharing scope when applying or making information visible to companies.',
    ja: '応募または企業公開設定時に提供範囲を確認します。'
  },
  '선택 동의이며 서비스 이용에 필수는 아닙니다.': {
    zh: '这是可选同意，不是使用服务的必需项。',
    en: 'This consent is optional and not required to use the service.',
    ja: '任意同意であり、サービス利用に必須ではありません。'
  },
  '탈퇴 유예 기간, 삭제 대상, 분리 보관 대상을 확인합니다.': {
    zh: '确认注销宽限期、删除对象和分开保管对象。',
    en: 'Review the withdrawal grace period, deletion scope, and separate retention scope.',
    ja: '退会猶予期間、削除対象、分離保管対象を確認します。'
  },
  '탈퇴 시 삭제되는 정보': { zh: '注销时删除的信息', en: 'Information deleted on withdrawal', ja: '退会時に削除される情報' },
  '탈퇴 확정 후 계정 식별 정보, 프로필, 접근성 설정, 저장 공고, 추천 이력은 삭제 또는 비식별 처리 대상입니다.': {
    zh: '注销确认后，账户识别信息、资料、无障碍设置、保存职位和推荐记录将成为删除或去标识化对象。',
    en: 'After withdrawal is confirmed, account identifiers, profiles, accessibility settings, saved jobs, and recommendation history are subject to deletion or de-identification.',
    ja: '退会確定後、アカウント識別情報、プロフィール、アクセシビリティ設定、保存求人、推薦履歴は削除または非識別化の対象です。'
  },
  '탈퇴 후 복구 가능 여부': { zh: '注销后是否可恢复', en: 'Recovery after withdrawal', ja: '退会後の復旧可否' },
  '회원탈퇴 신청은 로그인 후 진행할 수 있습니다.': { zh: '注销账户申请需登录后进行。', en: 'Log in to request account withdrawal.', ja: '退会申請はログイン後に進められます。' },
  '회원탈퇴 신청을 처리하는 중입니다.': { zh: '正在处理注销账户申请。', en: 'Processing account withdrawal request.', ja: '退会申請を処理しています。' },
  '회원탈퇴 신청이 접수되었습니다. 30일 내 다시 로그인하면 탈퇴 신청이 취소됩니다.': {
    zh: '注销账户申请已接收。30 天内重新登录将取消注销申请。',
    en: 'Your withdrawal request was received. Logging in again within 30 days cancels the request.',
    ja: '退会申請を受け付けました。30日以内に再ログインすると退会申請が取り消されます。'
  },
  '회원탈퇴 신청에 실패했습니다. 잠시 후 다시 시도해 주세요.': { zh: '注销账户申请失败。请稍后重试。', en: 'Failed to request withdrawal. Try again later.', ja: '退会申請に失敗しました。しばらくしてから再試行してください。' },
  '자주 쓰는 계정, 접근성, 알림 설정을 먼저 관리하고 개인정보와 고객센터 정보를 한곳에서 확인합니다.': {
    zh: '先管理常用的账户、无障碍和通知设置，并在一处查看个人信息和帮助中心信息。',
    en: 'Manage frequently used account, accessibility, and notification settings first, and review privacy and support information in one place.',
    ja: 'よく使うアカウント、アクセシビリティ、通知設定を先に管理し、個人情報とサポート情報を一か所で確認します。'
  },
  '계정 정보': { zh: '账户信息', en: 'Account information', ja: 'アカウント情報' },
  '로그인, 연락처, 기본 프로필로 이어지는 핵심 계정 정보입니다.': {
    zh: '这是连接登录、联系方式和默认资料的核心账户信息。',
    en: 'Core account information connected to login, contact, and default profile.',
    ja: 'ログイン、連絡先、基本プロフィールにつながる主要アカウント情報です。'
  },
  '등록된 기본 프로필이 없습니다. 내 정보에서 기본 프로필을 먼저 생성해 주세요.': {
    zh: '没有已登记的默认资料。请先在我的信息中创建默认资料。',
    en: 'No default profile is registered. Create one in My Info first.',
    ja: '登録済みの基本プロフィールがありません。マイ情報で先に基本プロフィールを作成してください。'
  },
  'Bridgework 추천과 지도 화면을 내가 읽고 판단하기 쉬운 방식으로 조정합니다.': {
    zh: '调整 Bridgework 推荐和地图画面，使其更容易阅读和判断。',
    en: 'Adjust Bridgework recommendations and maps so they are easier for you to read and judge.',
    ja: 'Bridgeworkの推薦と地図画面を、自分が読み取り判断しやすい方式に調整します。'
  },
  '텍스트와 카드 경계를 더 뚜렷하게 표시': { zh: '更清晰地显示文本和卡片边界', en: 'Make text and card boundaries clearer', ja: 'テキストとカード境界をより明確に表示' },
  '전환과 지도 움직임을 줄임': { zh: '减少切换和地图移动效果', en: 'Reduce transitions and map movement', ja: '切り替えと地図の動きを減らす' },
  '마커에 텍스트와 패턴을 함께 표시': { zh: '在标记上同时显示文字和图案', en: 'Show text and patterns on markers', ja: 'マーカーにテキストとパターンを一緒に表示' },
  '추천 이유와 지도 요약을 읽기 순서로 제공': { zh: '按阅读顺序提供推荐理由和地图摘要', en: 'Provide recommendation reasons and map summaries in reading order', ja: '推薦理由と地図要約を読み順で提供' },
  '내 데이터 관리': { zh: '管理我的数据', en: 'Manage my data', ja: 'マイデータ管理' },
  '계정, 추천, 프로필 문의 접수': { zh: '受理账户、推荐和资料咨询', en: 'Account, recommendation, and profile support', ja: 'アカウント、推薦、プロフィール問い合わせ受付' },
  '약관과 안내 항목에서 기본 정보를 확인합니다.': { zh: '在条款和说明项目中查看基本信息。', en: 'Review basic information in terms and notices.', ja: '規約と案内項目で基本情報を確認します。' },
  '접근성, 지도, 공공데이터 오류 제보': { zh: '反馈无障碍、地图和公共数据错误', en: 'Report accessibility, map, or public data issues', ja: 'アクセシビリティ、地図、公共データのエラー報告' },
  '탈퇴 시 삭제되는 정보 확인': { zh: '确认注销时删除的信息', en: 'Confirm information deleted on withdrawal', ja: '退会時に削除される情報を確認' },
  '30일 내 복구 가능 여부 확인': { zh: '确认 30 天内是否可恢复', en: 'Confirm recovery within 30 days', ja: '30日以内の復旧可否を確認' },
  '법정 보관 정보의 분리 보관 확인': { zh: '确认依法保留信息的分开保管', en: 'Confirm separate retention of legally retained information', ja: '法定保管情報の分離保管を確認' },
  '재가입 제한 여부는 확인 필요로 안내': { zh: '重新注册限制会提示为需要确认', en: 'Rejoin restrictions are shown as needing confirmation', ja: '再登録制限の有無は確認が必要として案内' },
  '접근성 판단에 필요한 데이터가 부족합니다. 지원 전 이동 경로와 사업장 환경을 확인해주세요.': {
    zh: '无障碍判断所需数据不足。申请前请确认移动路线和工作场所环境。',
    en: 'There is not enough data for accessibility judgment. Confirm the route and workplace before applying.',
    ja: 'アクセシビリティ判断に必要なデータが不足しています。応募前に移動経路と事業所環境を確認してください。'
  },
  '접근성 양호': { zh: '无障碍良好', en: 'Good accessibility', ja: 'アクセシビリティ良好' },
  '현재 데이터 기준 접근성 점수가 높은 편입니다. 실제 이동 경로는 지원 전 다시 확인해주세요.': {
    zh: '根据当前数据，无障碍评分较高。实际移动路线请在申请前再次确认。',
    en: 'The accessibility score is high based on current data. Recheck the actual route before applying.',
    ja: '現在のデータではアクセシビリティスコアは高めです。実際の移動経路は応募前に再確認してください。'
  },
  '일부 접근성 요소는 확인이 필요합니다. 출퇴근 경로와 사업장 편의시설을 함께 점검해주세요.': {
    zh: '部分无障碍要素需要确认。请同时检查通勤路线和工作场所便利设施。',
    en: 'Some accessibility items need confirmation. Check the commute route and workplace facilities together.',
    ja: '一部のアクセシビリティ要素は確認が必要です。通勤経路と事業所の設備を合わせて点検してください。'
  },
  '추가 확인 필요': { zh: '需要进一步确认', en: 'Needs more confirmation', ja: '追加確認が必要' },
  '접근성 점수가 낮거나 데이터가 부족합니다. 접근 불가로 단정하지 말고 세부 경로를 확인해주세요.': {
    zh: '无障碍评分较低或数据不足。请不要断定无法通行，请确认详细路线。',
    en: 'The accessibility score is low or data is limited. Do not assume access is impossible; check the detailed route.',
    ja: 'アクセシビリティスコアが低い、またはデータが不足しています。アクセス不可と断定せず、詳細経路を確認してください。'
  },
  '임금형태': { zh: '薪资形式', en: 'Pay type', ja: '賃金形態' },
  '지역 확인 필요': { zh: '地区需确认', en: 'Region needs confirmation', ja: '地域の確認が必要' },
  '데이터 출처 · BridgeWork Spring Backend 추천 지도 API': {
    zh: '数据来源 · BridgeWork Spring Backend 推荐地图 API',
    en: 'Data source · BridgeWork Spring Backend recommendation map API',
    ja: 'データ出典・BridgeWork Spring Backend推薦地図API'
  },
  '교통 접근 근거': { zh: '交通可达性依据', en: 'Transit access evidence', ja: '交通アクセス根拠' },
  '근무지 주변 대중교통 또는 교통약자 이동지원 데이터가': {
    zh: '工作地点周边公共交通或交通弱势群体移动支持数据',
    en: 'Public transit or mobility support data near the workplace',
    ja: '勤務地周辺の公共交通または移動支援データが'
  },
  '주변 대중교통/이동지원 데이터는 추가 확인이 필요합니다.': {
    zh: '周边公共交通/移动支持数据需要进一步确认。',
    en: 'Nearby public transit/mobility support data needs further confirmation.',
    ja: '周辺の公共交通・移動支援データは追加確認が必要です。'
  },
  '보행 안전 근거': { zh: '步行安全依据', en: 'Walking safety evidence', ja: '歩行安全根拠' },
  '횡단보도, 신호등, 보행 네트워크 데이터가': {
    zh: '人行横道、信号灯和步行网络数据',
    en: 'Crosswalk, signal, and walking network data',
    ja: '横断歩道、信号、歩行ネットワークデータが'
  },
  '보행 경로 안전 데이터는 추가 확인이 필요합니다.': {
    zh: '步行路线安全数据需要进一步确认。',
    en: 'Walking route safety data needs further confirmation.',
    ja: '歩行経路の安全データは追加確認が必要です。'
  },
  '휠체어/편의시설 근거': { zh: '轮椅/便利设施依据', en: 'Wheelchair/facility evidence', ja: '車いす・設備根拠' },
  '리프트, 경사로 또는 철도 편의시설 데이터가': {
    zh: '升降设备、坡道或铁路便利设施数据',
    en: 'Lift, ramp, or rail facility data',
    ja: 'リフト、スロープ、鉄道設備データが'
  },
  '휠체어 리프트/경사로 등 편의시설은 현장 확인이 필요합니다.': {
    zh: '轮椅升降设备、坡道等便利设施需要现场确认。',
    en: 'Facilities such as wheelchair lifts and ramps need on-site confirmation.',
    ja: '車いすリフト・スロープなどの設備は現地確認が必要です。'
  },
  '도보': { zh: '步行', en: 'Walking', ja: '徒歩' },
  '점수 데이터가 없어 확인이 필요합니다.': { zh: '没有评分数据，需要确认。', en: 'Score data is missing and needs confirmation.', ja: 'スコアデータがないため確認が必要です。' },
  '근무지 좌표': { zh: '工作地点坐标', en: 'Workplace coordinates', ja: '勤務地座標' },
  '근무지 좌표가 없어 지도 위치와 실제 주소를 함께 확인해야 합니다.': {
    zh: '缺少工作地点坐标，需要同时确认地图位置和实际地址。',
    en: 'Workplace coordinates are missing, so check both map location and actual address.',
    ja: '勤務地座標がないため、地図上の位置と実際の住所を合わせて確認する必要があります。'
  },
  '설정된 정보 확인 필요': { zh: '需确认已设置的信息', en: 'Configured information needs confirmation', ja: '設定済み情報の確認が必要' },
  '근로지원기관': { zh: '工作支持机构', en: 'Work support agency', ja: '就労支援機関' },
  '주소 확인 필요': { zh: '地址需确认', en: 'Address needs confirmation', ja: '住所の確認が必要' },
  '출퇴근 경로와 사업장 접근성 세부 정보는 지원 전 확인이 필요합니다.': {
    zh: '通勤路线和工作场所无障碍详情需在申请前确认。',
    en: 'Commute route and workplace accessibility details need confirmation before applying.',
    ja: '通勤経路と事業所アクセシビリティの詳細は応募前に確認が必要です。'
  },
  '지역 접근성 지도 추천을 보려면 로그인이 필요합니다.': { zh: '需要登录才能查看区域无障碍地图推荐。', en: 'Log in to view regional accessibility map recommendations.', ja: '地域アクセシビリティ地図推薦を見るにはログインが必要です。' },
  '지역 접근성 지도 추천을 불러오지 못했습니다.': { zh: '无法加载区域无障碍地图推荐。', en: 'Failed to load regional accessibility map recommendations.', ja: '地域アクセシビリティ地図推薦を読み込めませんでした。' },
  '추천 요청 상태를 확인할 수 없습니다.': { zh: '无法确认推荐请求状态。', en: 'Could not check recommendation request status.', ja: '推薦リクエスト状態を確認できません。' },
  '근로지원인 수행기관을 불러오지 못했습니다.': { zh: '无法加载工作支持人员执行机构。', en: 'Failed to load work support agencies.', ja: '就労支援員実施機関を読み込めませんでした。' },
  '추천 설명 요청에 필요한 프로필/공고 정보가 부족합니다.': { zh: '请求推荐说明所需的资料/职位信息不足。', en: 'Profile or job information needed for recommendation explanation is missing.', ja: '推薦説明リクエストに必要なプロフィール・求人情報が不足しています。' },
  '추천 설명을 요청할 공고 내부 ID가 없어 설명을 불러올 수 없습니다.': { zh: '没有请求推荐说明所需的职位内部 ID，无法加载说明。', en: 'The internal job ID needed for recommendation explanation is missing.', ja: '推薦説明をリクエストする求人内部IDがないため、説明を読み込めません。' },
  '지도 추천 결과를 준비하고 있습니다.': { zh: '正在准备地图推荐结果。', en: 'Preparing map recommendation results.', ja: '地図推薦結果を準備しています。' },
  '접근성 지도 분석 중입니다': { zh: '正在分析无障碍地图', en: 'Analyzing accessibility map', ja: 'アクセシビリティ地図を分析中です' },
  '요청이 완료될 때까지 이 화면을 다시 열어도 진행 상태가 이어집니다.': { zh: '在请求完成前，即使重新打开此画面，进度也会继续。', en: 'Until the request finishes, progress continues even if you reopen this screen.', ja: 'リクエスト完了まで、この画面を再度開いても進行状態は継続します。' },
  '스크랩 취소 확인': { zh: '确认取消收藏', en: 'Confirm unsave', ja: '保存解除確認' },
  '스크랩 확인': { zh: '确认收藏', en: 'Confirm save', ja: '保存確認' },
  '이 공고의 스크랩을 취소하시겠습니까?': { zh: '要取消收藏此职位吗？', en: 'Unsave this job?', ja: 'この求人の保存を解除しますか？' },
  '이 공고를 스크랩하시겠습니까?': { zh: '要收藏此职位吗？', en: 'Save this job?', ja: 'この求人を保存しますか？' },
  '스크랩 취소': { zh: '取消收藏', en: 'Unsave', ja: '保存解除' },
  '스크랩': { zh: '收藏', en: 'Save', ja: '保存' },
  '스크랩 확인 창 닫기': { zh: '关闭收藏确认窗口', en: 'Close save confirmation', ja: '保存確認画面を閉じる' },
  '처리 중': { zh: '处理中', en: 'Processing', ja: '処理中' },
  '스크랩 취소에 실패했습니다.': { zh: '取消收藏失败。', en: 'Failed to unsave.', ja: '保存解除に失敗しました。' },
  '스크랩 처리에 실패했습니다.': { zh: '收藏处理失败。', en: 'Failed to save.', ja: '保存処理に失敗しました。' },
  '선택 가능한 공고가 없어 상세 정보를 표시하지 않습니다.': { zh: '没有可选择的职位，因此不显示详情。', en: 'No selectable job is available, so details are not shown.', ja: '選択可能な求人がないため、詳細情報は表示しません。' },
  '선택한 프로필 기준으로 접근성 점수를 다시 계산하는 중입니다.': { zh: '正在根据所选资料重新计算无障碍评分。', en: 'Recalculating accessibility scores for the selected profile.', ja: '選択したプロフィール基準でアクセシビリティスコアを再計算しています。' },
  '상세 데이터를 불러오지 못했습니다.': { zh: '无法加载详细数据。', en: 'Failed to load detail data.', ja: '詳細データを読み込めませんでした。' },
  '높은 적합도': { zh: '高匹配度', en: 'High fit', ja: '高い適合度' },
  '검토 가능': { zh: '可查看', en: 'Review available', ja: '検討可能' },
  '추천 결과를 준비하고 있습니다.': { zh: '正在准备推荐结果。', en: 'Preparing recommendation results.', ja: '推薦結果を準備しています。' },
  '추천 결과를 준비하고 있습니다': { zh: '正在准备推荐结果', en: 'Preparing recommendation results', ja: '推薦結果を準備しています' },
  '요청이 끝날 때까지 페이지를 다시 열어도 진행 상태가 이어집니다.': {
    zh: '在请求结束前，即使重新打开页面，进度也会继续。',
    en: 'Until the request finishes, progress continues even if you reopen the page.',
    ja: 'リクエストが終わるまで、ページを再度開いても進行状態は継続します。'
  },
  '양손 사용': { zh: '双手使用', en: 'Both hands use', ja: '両手使用' },
  '시력': { zh: '视力', en: 'Vision', ja: '視力' },
  '듣기·말하기': { zh: '听力/言语', en: 'Hearing/speaking', ja: '聞く・話す' },
  '손작업': { zh: '手部操作', en: 'Hand work', ja: '手作業' },
  '들어올리기': { zh: '搬举', en: 'Lifting', ja: '持ち上げ' },
  '서기·걷기': { zh: '站立/步行', en: 'Standing/walking', ja: '立つ・歩く' },
  '공고 상세 창 닫기': { zh: '关闭职位详情窗口', en: 'Close job detail panel', ja: '求人詳細画面を閉じる' },
  '직무 적합도 및 추천 설명': { zh: '岗位匹配度和推荐说明', en: 'Job fit and recommendation explanation', ja: '職務適合度と推薦説明' },
  'AI 직무 적합도 및 추천 설명': { zh: 'AI 岗位匹配度和推荐说明', en: 'AI job fit and recommendation explanation', ja: 'AI職務適合度と推薦説明' },
  '직무 적합도 점수': { zh: '岗位匹配度分数', en: 'Job fit score', ja: '職務適合度スコア' },
  '직무 기준': { zh: '岗位标准', en: 'Job criteria', ja: '職務基準' },
  '프로필 직무와 공고 조건이 유사합니다.': { zh: '资料中的岗位与职位条件相似。', en: 'Your profile role is similar to the job conditions.', ja: 'プロフィール職務と求人条件が類似しています。' },
  '지원 전 직무 조건 확인이 필요합니다.': { zh: '申请前需确认岗位条件。', en: 'Check job conditions before applying.', ja: '応募前に職務条件の確認が必要です。' },
  '추천 설명을 기준으로 공고 조건을 확인해 주세요.': { zh: '请根据推荐说明确认职位条件。', en: 'Use the recommendation explanation to review job conditions.', ja: '推薦説明を基準に求人条件を確認してください。' },
  '교육·취업역량 추천': { zh: '教育/就业能力推荐', en: 'Education and employability recommendations', ja: '教育・就職能力推薦' },
  '작업 환경': { zh: '工作环境', en: 'Work environment', ja: '作業環境' },
  '지원 요건': { zh: '申请条件', en: 'Application requirements', ja: '応募要件' },
  '선택: 전체': { zh: '选择：全部', en: 'Selected: All', ja: '選択：すべて' },
  '1차 직무를 선택해 주세요.': { zh: '请选择一级岗位。', en: 'Select a first-level job category.', ja: '1次職務を選択してください。' },
  '2차 직군을 선택해 주세요.': { zh: '请选择二级职群。', en: 'Select a second-level job group.', ja: '2次職群を選択してください。' },
  '선택 가능한 희망 직무 목록이 없습니다.': { zh: '没有可选择的期望岗位列表。', en: 'No desired job options are available.', ja: '選択可能な希望職務一覧がありません。' },
  '인기 공고를 불러오지 못했습니다.': { zh: '无法加载热门职位。', en: 'Failed to load popular jobs.', ja: '人気求人を読み込めませんでした。' },
  '프로필을 불러오지 못했습니다.': { zh: '无法加载个人资料。', en: 'Failed to load profile.', ja: 'プロフィールを読み込めませんでした。' },
  '퀵 추천을 불러오지 못했습니다.': { zh: '无法加载快速推荐。', en: 'Failed to load quick recommendations.', ja: 'クイック推薦を読み込めませんでした。' },
  '퀵 추천 요청 상태를 확인할 수 없습니다.': { zh: '无法确认快速推荐请求状态。', en: 'Could not check quick recommendation request status.', ja: 'クイック推薦リクエスト状態を確認できません。' },
  '추천 설명을 요청할 기업명 또는 직무명이 없습니다.': { zh: '缺少请求推荐说明所需的企业名称或岗位名称。', en: 'Company or job name is missing for the recommendation explanation request.', ja: '推薦説明リクエストに必要な企業名または職務名がありません。' },
  '추천 설명을 요청할 필수 정보가 부족합니다.': { zh: '请求推荐说明所需的必填信息不足。', en: 'Required information for recommendation explanation is missing.', ja: '推薦説明リクエストに必要な必須情報が不足しています。' },
  '현재 인기 공고': { zh: '当前热门职位', en: 'Popular jobs now', ja: '現在の人気求人' },
  '사람들이 많이 스크랩한 공고들을 스크랩 해보세요.': { zh: '查看并收藏许多人保存的职位。', en: 'Explore jobs many people have saved.', ja: '多くの人が保存した求人を確認してみてください。' },
  '인기 공고 TOP 20': { zh: '热门职位 TOP 20', en: 'Top 20 popular jobs', ja: '人気求人TOP20' },
  '인기 공고를 불러오는 중입니다.': { zh: '正在加载热门职位。', en: 'Loading popular jobs.', ja: '人気求人を読み込んでいます。' },
  '인기 공고 목록': { zh: '热门职位列表', en: 'Popular job list', ja: '人気求人一覧' },
  '퀵 맞춤 일자리 추천': { zh: '快速个性化职位推荐', en: 'Quick personalized job recommendations', ja: 'クイックカスタム求人推薦' },
  'AI 직무 적합도 기반 추천 결과': { zh: '基于 AI 岗位匹配度的推荐结果', en: 'Recommendations based on AI job fit', ja: 'AI職務適合度に基づく推薦結果' },
  '최신 공고 기반 추천 결과': { zh: '基于最新职位的推荐结果', en: 'Recommendations based on latest jobs', ja: '最新求人に基づく推薦結果' },
  '퀵 추천 필터': { zh: '快速推荐筛选', en: 'Quick recommendation filters', ja: 'クイック推薦フィルター' },
  'AI 직무 적합도': { zh: 'AI 岗位匹配度', en: 'AI job fit', ja: 'AI職務適合度' },
  '프로필 기반 직무 적합도 계산': { zh: '计算基于资料的岗位匹配度', en: 'Calculate profile-based job fit', ja: 'プロフィール基準の職務適合度を計算' },
  '최신 공고만 조회': { zh: '仅查看最新职位', en: 'Show latest jobs only', ja: '最新求人のみ表示' },
  '퀵 추천 결과': { zh: '快速推荐结果', en: 'Quick recommendation results', ja: 'クイック推薦結果' },
  '로그인 후 퀵 맞춤 일자리 추천 결과를 확인할 수 있습니다.': { zh: '登录后可查看快速个性化职位推荐结果。', en: 'Log in to view quick personalized job recommendations.', ja: 'ログイン後にクイックカスタム求人推薦結果を確認できます。' },
  '프로필을 불러오는 중입니다.': { zh: '正在加载个人资料。', en: 'Loading profile.', ja: 'プロフィールを読み込んでいます。' },
  '검색을 누르면 퀵 추천 결과를 조회합니다.': { zh: '点击搜索后查询快速推荐结果。', en: 'Search to view quick recommendation results.', ja: '検索するとクイック推薦結果を照会します。' },
  '퀵 추천 공고 목록': { zh: '快速推荐职位列表', en: 'Quick recommendation job list', ja: 'クイック推薦求人一覧' },
  '예상': { zh: '预计', en: 'Expected', ja: '予想' },
  '최신 공고 순 정렬': { zh: '按最新职位排序', en: 'Sort by newest jobs', ja: '最新求人順に並び替え' },
  '근무지 위치': { zh: '工作地点位置', en: 'Workplace location', ja: '勤務地位置' },
  '연동된 지도 정보입니다.': { zh: '这是已关联的地图信息。', en: 'This is linked map information.', ja: '連携された地図情報です。' },
  '작업환경(양손 사용)': { zh: '工作环境（双手使用）', en: 'Work environment (both hands use)', ja: '作業環境（両手使用）' },
  '작업환경(시력)': { zh: '工作环境（视力）', en: 'Work environment (vision)', ja: '作業環境（視力）' },
  '작업환경(듣기·말하기)': { zh: '工作环境（听力/言语）', en: 'Work environment (hearing/speaking)', ja: '作業環境（聞く・話す）' },
  '작업환경(손작업)': { zh: '工作环境（手部操作）', en: 'Work environment (hand work)', ja: '作業環境（手作業）' },
  '작업환경(들어올리기)': { zh: '工作环境（搬举）', en: 'Work environment (lifting)', ja: '作業環境（持ち上げ）' },
  '작업환경(서기·걷기)': { zh: '工作环境（站立/步行）', en: 'Work environment (standing/walking)', ja: '作業環境（立つ・歩く）' },
  '지도 위치 데이터가 없습니다.': { zh: '没有地图位置数据。', en: 'No map location data.', ja: '地図位置データがありません。' },
  '근무지 주소': { zh: '工作地点地址', en: 'Workplace address', ja: '勤務地住所' },
  '급여형태': { zh: '薪资形式', en: 'Pay type', ja: '給与形態' },
  '모집마감일': { zh: '招聘截止日', en: 'Application deadline', ja: '募集締切日' },
  '공고등록일': { zh: '职位登记日', en: 'Job posted date', ja: '求人登録日' },
  '전체 스크랩 수': { zh: '总收藏数', en: 'Total saves', ja: '総保存数' },
  '내 스크랩 여부': { zh: '我的收藏状态', en: 'My saved status', ja: '自分の保存有無' },
  '마감 처리일': { zh: '截止处理日', en: 'Closed date', ja: '締切処理日' },
  '원본 주소': { zh: '原始地址', en: 'Original address', ja: '元住所' },
  '매칭 주소': { zh: '匹配地址', en: 'Matched address', ja: 'マッチング住所' },
  '스크랩 공고를 불러오지 못했습니다.': { zh: '无法加载收藏职位。', en: 'Failed to load saved jobs.', ja: '保存求人を読み込めませんでした。' },
  '추가 연락': { zh: '补充联系方式', en: 'Additional contact', ja: '追加連絡先' },
  '세부 학력·경력': { zh: '详细学历/经历', en: 'Detailed education/career', ja: '詳細な学歴・経歴' },
  '희망 근무조건': { zh: '期望工作条件', en: 'Desired work conditions', ja: '希望勤務条件' },
  '소개 보강': { zh: '补充介绍', en: 'Improve introduction', ja: '紹介の補強' },
  '회원가입 세션을 확인할 수 없습니다. 다시 로그인해 주세요.': { zh: '无法确认注册会话。请重新登录。', en: 'Could not confirm the sign-up session. Please log in again.', ja: '登録セッションを確認できません。もう一度ログインしてください。' },
  '회원가입 처리에 실패했습니다.': { zh: '注册处理失败。', en: 'Sign-up failed.', ja: '登録処理に失敗しました。' },
  '단계': { zh: '步骤', en: 'Step', ja: 'ステップ' },
  '기본 정보 입력': { zh: '输入基本信息', en: 'Enter basic information', ja: '基本情報入力' },
  '처음이신가요? 브릿지워크를 시작하기 위해 꼭 필요한 정보만 먼저 입력해요. 기본 프로필 생성 후 자세한 내용을 입력해 나가요.': {
    zh: '第一次使用吗？先填写开始 BridgeWork 所需的最基本信息。创建默认资料后，可继续补充详细内容。',
    en: 'New here? First enter only the information needed to start BridgeWork. After creating a default profile, you can add details.',
    ja: '初めてですか？BridgeWorkを始めるために必要な情報だけを先に入力します。基本プロフィール作成後、詳細を追加できます。'
  },
  '회원가입 옵션을 불러오는 중입니다...': { zh: '正在加载注册选项...', en: 'Loading sign-up options...', ja: '登録オプションを読み込んでいます...' },
  '회원가입 옵션을 확인할 수 없습니다.': { zh: '无法确认注册选项。', en: 'Could not check sign-up options.', ja: '登録オプションを確認できません。' },
  '고용형태, 희망 직무 옵션을 다시 불러와 주세요.': { zh: '请重新加载雇用形式和期望岗位选项。', en: 'Reload employment type and desired job options.', ja: '雇用形態、希望職務オプションを再読み込みしてください。' },
  '이전': { zh: '上一步', en: 'Previous', ja: '前へ' },
  '온보딩 단계': { zh: '入门步骤', en: 'Onboarding steps', ja: 'オンボーディングステップ' },
  '예정': { zh: '预计', en: 'Planned', ja: '予定' },
  '홍길동': { zh: '张三', en: 'Jane Doe', ja: '山田太郎' },
  '서울 OO구 OO동': { zh: '首尔 OO区 OO洞', en: 'OO-dong, OO-gu, Seoul', ja: 'ソウルOO区OO洞' },
  '주요 경력 한 줄': { zh: '主要经历一句话', en: 'One-line main experience', ja: '主な経歴を一行で' },
  '예) 수원시 청년센터 행정보조 2년': { zh: '例）水原市青年中心行政助理 2 年', en: 'Example: 2 years admin assistant at Suwon Youth Center', ja: '例）水原市青年センター行政補助2年' },
  '가능한 고용형태': { zh: '可接受的雇用形式', en: 'Available employment types', ja: '可能な雇用形態' },
  '다중 선택 가능': { zh: '可多选', en: 'Multiple selections allowed', ja: '複数選択可' },
  '장애 정보는 추천 이유와 근무 지원사항 판단에 사용됩니다. 분류가 명확하지 않다면 기타를 선택하고 설명에 필요한 내용을 남겨 주세요.': {
    zh: '残障信息用于推荐理由和工作支持事项判断。如分类不明确，请选择其他，并留下必要说明。',
    en: 'Disability information is used for recommendation reasons and workplace support. If the category is unclear, choose Other and add needed details.',
    ja: '障害情報は推薦理由と勤務支援事項の判断に使用されます。分類が明確でない場合はその他を選び、必要な説明を残してください。'
  },
  '장애인 등록 여부': { zh: '残障登记状态', en: 'Disability registration status', ja: '障害者登録の有無' },
  '간단하게 본인을 소개해 주세요. 채용 담당자에게 표시될 수 있어요.': {
    zh: '请简单介绍自己。内容可能会显示给招聘负责人。',
    en: 'Briefly introduce yourself. It may be shown to recruiters.',
    ja: '簡単に自己紹介してください。採用担当者に表示される場合があります。'
  },
  '기본 정보 입력 완료!': { zh: '基本信息输入完成！', en: 'Basic information complete!', ja: '基本情報入力完了！' },
  '지금부터 일자리를 추천받을 수 있어요.': { zh: '现在可以开始接收职位推荐。', en: 'You can now receive job recommendations.', ja: 'これから求人推薦を受けられます。' },
  '더 정확한 추천을 위해': { zh: '为了更准确的推荐', en: 'For more accurate recommendations', ja: 'より正確な推薦のために' },
  '상세 정보': { zh: '详细信息', en: 'Detailed information', ja: '詳細情報' },
  '를 추가하면': { zh: '添加后', en: 'by adding', ja: 'を追加すると' },
  '추천 판단에 쓰이는 정보가 최대': { zh: '用于推荐判断的信息最多可增加到', en: 'information used for recommendations can increase up to', ja: '推薦判断に使う情報が最大' },
  '까지 늘어나요.': { zh: '。', en: '.', ja: 'まで増えます。' },
  '입력 항목': { zh: '输入项目', en: 'Input items', ja: '入力項目' },
  '방금 완료한 정보': { zh: '刚完成的信息', en: 'Information just completed', ja: '完了したばかりの情報' },
  '추가 항목': { zh: '追加项目', en: 'Additional items', ja: '追加項目' },
  '개 묶음 선택 정보': { zh: '组选择信息', en: 'grouped selections', ja: '件のグループ選択情報' },
  '예상 시간': { zh: '预计时间', en: 'Estimated time', ja: '予想時間' },
  '약': { zh: '约', en: 'About', ja: '約' },
  '분': { zh: '分钟', en: 'min', ja: '分' },
  '나중에도 가능': { zh: '以后也可以', en: 'Can do later', ja: '後でも可能' },
  '건너뛰고 시작하기': { zh: '跳过并开始', en: 'Skip and start', ja: 'スキップして始める' },
  '상세 정보 입력하기': { zh: '输入详细信息', en: 'Enter details', ja: '詳細情報を入力' },
  '나중에 프로필 관리에서 언제든지 추가 및 수정할 수 있어요': {
    zh: '以后可随时在资料管理中添加或修改。',
    en: 'You can add or edit it later anytime in profile management.',
    ja: '後でプロフィール管理からいつでも追加・修正できます。'
  },
  '법령 준수, 분쟁 대응, 보안 목적의 인증 기록, 처리 로그, 문의 이력은 일반 데이터와 분리 보관될 수 있습니다.': {
    zh: '为遵守法律、处理纠纷和安全目的，认证记录、处理日志和咨询记录可能会与一般数据分开保管。',
    en: 'Authentication records, processing logs, and inquiry history may be stored separately from general data for legal compliance, dispute handling, and security.',
    ja: '法令遵守、紛争対応、セキュリティ目的の認証記録、処理ログ、問い合わせ履歴は一般データと分離保管される場合があります。'
  },
  '재가입 제한 기간이나 동일 소셜 계정 재가입 조건은 운영 정책 확정 전까지 단정하지 않고 확인 필요로 안내합니다.': {
    zh: '重新注册限制期限或同一社交账户重新注册条件，在运营政策最终确定前不会断定，并会提示为需要确认。',
    en: 'Rejoin restriction periods or conditions for the same social account are not finalized until policy is confirmed and are shown as needing confirmation.',
    ja: '再登録制限期間や同一ソーシャルアカウントでの再登録条件は、運営方針確定前までは断定せず、確認が必要として案内します。'
  },
  '탈퇴 신청은 30일 유예 기간과 개인정보 보관 범위를 확인한 뒤 진행합니다.': {
    zh: '注销申请会在确认 30 天宽限期和个人信息保管范围后进行。',
    en: 'Withdrawal proceeds after reviewing the 30-day grace period and personal data retention scope.',
    ja: '退会申請は30日の猶予期間と個人情報保管範囲を確認した後に進めます。'
  },
  '탈퇴 신청 후 30일 유예 기간이 적용되며, 탈퇴 확정 시 개인정보는 삭제 또는 비식별 처리됩니다. 법령상 필요한 기록은 일반 서비스 데이터와 분리 보관될 수 있습니다.': {
    zh: '注销申请后适用 30 天宽限期；注销确认后，个人信息会被删除或去标识化。法律要求的记录可能会与一般服务数据分开保管。',
    en: 'A 30-day grace period applies after withdrawal request. When withdrawal is confirmed, personal data is deleted or de-identified. Records required by law may be stored separately from general service data.',
    ja: '退会申請後は30日の猶予期間が適用され、退会確定時に個人情報は削除または非識別化されます。法令上必要な記録は一般サービスデータと分離保管される場合があります。'
  },
  '시급': { zh: '时薪', en: 'Hourly pay', ja: '時給' },
  '연봉': { zh: '年薪', en: 'Annual salary', ja: '年俸' },
  '학력무관': { zh: '学历不限', en: 'Any education', ja: '学歴不問' },
  '관계없음': { zh: '不限', en: 'No preference', ja: '関係なし' },
  '경력무관': { zh: '经验不限', en: 'Any experience', ja: '経歴不問' },
  '신입가능': { zh: '新人可申请', en: 'Entry level accepted', ja: '未経験応募可' },
  '고등학교': { zh: '高中', en: 'High school', ja: '高校' },
  '전문대': { zh: '专科', en: 'College', ja: '専門学校' },
  '초대졸': { zh: '专科毕业', en: 'College graduate', ja: '短大・専門卒' },
  '대학교': { zh: '大学', en: 'University', ja: '大学' },
  '학사': { zh: '学士', en: 'Bachelor', ja: '学士' },
  '제주도': { zh: '济州道', en: 'Jeju-do', ja: '済州道' },
  'AI 적합도 정보가 없거나 계산 대기 중입니다.': { zh: '没有 AI 匹配度信息，或正在等待计算。', en: 'AI fit information is unavailable or waiting to be calculated.', ja: 'AI適合度情報がないか、計算待ちです。' },
  '직무명': { zh: '岗位名称', en: 'Job title', ja: '職務名' },
  '최신 공고 정보는 확인 가능합니다.': { zh: '可查看最新职位信息。', en: 'Latest job information is available.', ja: '最新求人情報は確認できます。' },
  '채용 여부는 기업의 실제 판단과 다를 수 있습니다.': { zh: '招聘结果可能与企业的实际判断不同。', en: 'Hiring status may differ from the company’s actual decision.', ja: '採用可否は企業の実際の判断と異なる場合があります。' },
  '퀵 맞춤 일자리 추천을 보려면 로그인이 필요합니다.': { zh: '需要登录才能查看快速个性化职位推荐。', en: 'Log in to view quick personalized job recommendations.', ja: 'クイックカスタム求人推薦を見るにはログインが必要です。' },
  '퀵 맞춤 일자리 추천을 불러오지 못했습니다.': { zh: '无法加载快速个性化职位推荐。', en: 'Failed to load quick personalized job recommendations.', ja: 'クイックカスタム求人推薦を読み込めませんでした。' },
  '공고 상태 변경일': { zh: '职位状态变更日', en: 'Job status updated date', ja: '求人状態変更日' },
  'BridgeWork는 장애인 구직자가 추천 이유와 접근성 정보를 함께 확인하며 일자리를 탐색하도록 돕습니다.': {
    zh: 'BridgeWork 帮助残障求职者在查看推荐理由和无障碍信息的同时寻找职位。',
    en: 'BridgeWork helps disabled job seekers explore jobs with recommendation reasons and accessibility information.',
    ja: 'BridgeWorkは、障害のある求職者が推薦理由とアクセシビリティ情報を確認しながら仕事を探せるよう支援します。'
  },
  '자주 묻는 질문': { zh: '常见问题', en: 'Frequently Asked Questions', ja: 'よくある質問' },
  'BridgeWork의 맞춤 추천, 접근성 점수, 개인정보 입력, 채용 공고 색인 정책을 안내합니다.': {
    zh: '介绍 BridgeWork 的个性化推荐、无障碍评分、个人信息输入和招聘职位索引政策。',
    en: 'Learn about BridgeWork personalized recommendations, accessibility scores, personal information input, and job indexing policy.',
    ja: 'BridgeWorkのカスタム推薦、アクセシビリティスコア、個人情報入力、求人インデックス方針を案内します。'
  },
  'BridgeWork 로그인': { zh: 'BridgeWork 登录', en: 'BridgeWork Login', ja: 'BridgeWorkログイン' },
  '카카오 또는 네이버 계정으로 로그인 후 온보딩을 진행하세요.': { zh: '请使用 Kakao 或 Naver 账户登录后继续入门流程。', en: 'Log in with Kakao or Naver, then continue onboarding.', ja: 'KakaoまたはNaverアカウントでログイン後、オンボーディングを進めてください。' },
  'OAuth 클라이언트 정보는 `.env.local`의 `REACT_APP_KAKAO_CLIENT_ID`, `REACT_APP_NAVER_CLIENT_ID`로 설정합니다.': {
    zh: 'OAuth 客户端信息通过 `.env.local` 中的 `REACT_APP_KAKAO_CLIENT_ID`、`REACT_APP_NAVER_CLIENT_ID` 设置。',
    en: 'Set OAuth client information with `REACT_APP_KAKAO_CLIENT_ID` and `REACT_APP_NAVER_CLIENT_ID` in `.env.local`.',
    ja: 'OAuthクライアント情報は`.env.local`の`REACT_APP_KAKAO_CLIENT_ID`、`REACT_APP_NAVER_CLIENT_ID`で設定します。'
  },
  '인가 코드를 검증하고 있습니다.': { zh: '正在验证授权码。', en: 'Verifying authorization code.', ja: '認可コードを検証しています。' },
  '정책 문서 목록': { zh: '政策文档列表', en: 'Policy document list', ja: 'ポリシー文書一覧' },
  '정책 내용에 대한 문의, 개인정보 열람·정정·삭제 요청, 접근성 정보 오류 제보는 고객센터를 통해 접수할 수 있습니다.': {
    zh: '关于政策内容的咨询、个人信息查看/更正/删除请求，以及无障碍信息错误反馈，可通过帮助中心提交。',
    en: 'Questions about policies, requests to view/correct/delete personal information, and accessibility data issue reports can be submitted through support.',
    ja: 'ポリシー内容への問い合わせ、個人情報の閲覧・訂正・削除依頼、アクセシビリティ情報エラー報告はサポートから受け付けできます。'
  },
  '근로기준법상 취업 가능한 노동 가능 연령은 원칙적으로 만 15세 이상입니다.': {
    zh: '根据劳动标准法，原则上可就业年龄为满 15 岁以上。',
    en: 'Under labor standards law, the working age is generally 15 or older.',
    ja: '労働基準法上、就業可能な労働年齢は原則として満15歳以上です。'
  },
  '파일을 선택해 주세요.': { zh: '请选择文件。', en: 'Select a file.', ja: 'ファイルを選択してください。' },
  '다만 근무지 주변 이동·대중교통 통근 정보는 근거 데이터가 부족해서, 지원 전 확인이 필요해요.': {
    zh: '不过，工作地点周边移动和公共交通通勤信息的依据数据不足，申请前需要确认。',
    en: 'However, nearby travel and public transit commute data is limited, so it needs confirmation before applying.',
    ja: 'ただし、勤務地周辺の移動・公共交通通勤情報は根拠データが不足しているため、応募前に確認が必要です。'
  },
  '미응답': { zh: '未回应', en: 'No response', ja: '未回答' },
  'BridgeWork 서비스 소개 이미지': { zh: 'BridgeWork 服务介绍图片', en: 'BridgeWork service introduction image', ja: 'BridgeWorkサービス紹介画像' },
  '한국어': { zh: '韩语', en: 'Korean', ja: '韓国語' },
  '공고 상태': { zh: '职位状态', en: 'Job status', ja: '求人状態' },
  '공고 생성일': { zh: '职位创建日', en: 'Job created date', ja: '求人作成日' },
  '공고 수정일': { zh: '职位更新日', en: 'Job updated date', ja: '求人更新日' },
  '높음': { zh: '高', en: 'High', ja: '高い' },
  'BridgeWork는 어떤 서비스인가요?': { zh: 'BridgeWork 是什么服务？', en: 'What is BridgeWork?', ja: 'BridgeWorkはどんなサービスですか？' },
  'BridgeWork는 장애인 구직자가 직무 적합도, 근무 조건, 출퇴근 접근성 정보를 함께 확인하며 지원 판단을 할 수 있도록 돕는 일자리 추천 서비스입니다.': {
    zh: 'BridgeWork 是一项职位推荐服务，帮助残障求职者同时查看岗位匹配度、工作条件和通勤无障碍信息，以便判断是否申请。',
    en: 'BridgeWork is a job recommendation service that helps disabled job seekers review job fit, working conditions, and commute accessibility before applying.',
    ja: 'BridgeWorkは、障害のある求職者が職務適合度、勤務条件、通勤アクセシビリティ情報を一緒に確認し、応募判断をしやすくする求人推薦サービスです。'
  },
  '접근성 점수는 지원 가능 여부를 단정하나요?': { zh: '无障碍评分会断定能否申请吗？', en: 'Does the accessibility score decide whether I can apply?', ja: 'アクセシビリティスコアは応募可否を断定しますか？' },
  '아니요. 접근성 점수는 공개 데이터와 사용자 선택 조건을 바탕으로 확인이 필요한 요소를 정리하는 참고 정보이며, 실제 근무 가능 여부는 채용 담당자와 최신 현장 정보를 함께 확인해야 합니다.': {
    zh: '不会。无障碍评分只是根据公开数据和用户选择条件整理需要确认的事项。实际能否工作，需要与招聘负责人和最新现场信息一起确认。',
    en: 'No. The accessibility score is reference information based on public data and your selected conditions. Actual work feasibility should be confirmed with the recruiter and current site information.',
    ja: 'いいえ。アクセシビリティスコアは、公開データとユーザーの選択条件をもとに確認が必要な点を整理する参考情報です。実際に働けるかどうかは、採用担当者と最新の現地情報をあわせて確認する必要があります。'
  },
  '장애 유형 정보는 필수인가요?': { zh: '必须填写残障类型信息吗？', en: 'Is disability type information required?', ja: '障害種別の情報は必須ですか？' },
  '맞춤 추천에 필요한 최소 정보는 온보딩에서 요청하지만, 민감한 상세 설명과 보조기기 등은 선택 입력으로 다룹니다.': {
    zh: '入门流程会请求个性化推荐所需的最低限度信息，但敏感的详细说明和辅助器具等按可选信息处理。',
    en: 'Onboarding asks for the minimum information needed for personalized recommendations, while sensitive details and assistive devices are optional.',
    ja: 'カスタム推薦に必要な最小限の情報はオンボーディングで確認しますが、詳細な説明や補助機器などの敏感な情報は任意入力として扱います。'
  },
  '채용 공고 상세 페이지도 검색에 노출되나요?': { zh: '招聘详情页也会出现在搜索结果中吗？', en: 'Are job detail pages shown in search results?', ja: '求人詳細ページも検索に表示されますか？' },
  '현재 React 앱에는 공개 공고 상세 URL이 없어서 검색 노출 대상에서 제외되어 있습니다. 추후 공개 공고 상세 라우트와 서버 기반 sitemap 생성이 준비되면 공고별 색인을 검토할 수 있습니다.': {
    zh: '目前 React 应用没有公开的职位详情 URL，因此不纳入搜索曝光。今后若准备好公开职位详情路由和基于服务器的 sitemap 生成，可再评估按职位建立索引。',
    en: 'Not currently. The React app does not have public job detail URLs, so they are excluded from search indexing. Job-level indexing can be reviewed after public detail routes and server-generated sitemaps are ready.',
    ja: '現在、Reactアプリには公開求人詳細URLがないため、検索表示の対象から除外しています。今後、公開求人詳細ルートとサーバー生成のsitemapが整備されたら、求人ごとのインデックスを検討できます。'
  },
  '추천 이유를 함께 보여주는 일자리 탐색': { zh: '查看推荐理由的职位探索', en: 'Explore jobs with recommendation reasons', ja: '推薦理由も確認できる仕事探し' },
  'BridgeWork는 공고 목록만 나열하지 않고 직무 조건, 근무 형태, 출퇴근 접근성 등 사용자가 판단에 참고할 수 있는 이유를 함께 제공합니다.': {
    zh: 'BridgeWork 不只是列出职位，还会提供岗位条件、工作形式、通勤无障碍等可帮助用户判断的理由。',
    en: 'BridgeWork does more than list jobs. It also shows reasons to consider, such as job requirements, work type, and commute accessibility.',
    ja: 'BridgeWorkは求人一覧を並べるだけでなく、職務条件、勤務形態、通勤アクセシビリティなど、判断に役立つ理由も一緒に提供します。'
  },
  '접근성 정보를 안전하게 표현': { zh: '安全地表达无障碍信息', en: 'Describe accessibility information safely', ja: 'アクセシビリティ情報を安全に表現' },
  '데이터가 부족한 항목은 불가능으로 단정하지 않고 확인 필요로 안내합니다. 지도 정보는 목록과 상세 패널에서도 확인할 수 있도록 설계합니다.': {
    zh: '对数据不足的项目，不会断定为无法使用，而是提示需要确认。地图信息也设计为可在列表和详情面板中查看。',
    en: 'When data is limited, BridgeWork says confirmation is needed instead of calling something impossible. Map information is also available in lists and detail panels.',
    ja: 'データが不足している項目は不可能と断定せず、「確認が必要」と案内します。地図情報は一覧と詳細パネルでも確認できるよう設計しています。'
  },
  '공개 데이터와 백엔드 중계 구조': { zh: '公开数据与后端中继结构', en: 'Public data and backend mediation', ja: '公開データとバックエンド中継構造' },
  '프론트엔드는 Spring Backend만 호출하고, 필요한 AI/GIS 계산은 백엔드를 통해 처리합니다. 이를 통해 사용자 데이터와 외부 서비스 연동 경계를 명확히 유지합니다.': {
    zh: '前端只调用 Spring Backend，所需的 AI/GIS 计算通过后端处理。这样可以清楚地维护用户数据与外部服务集成之间的边界。',
    en: 'The frontend calls only the Spring Backend, and required AI/GIS calculations are handled through the backend. This keeps a clear boundary between user data and external services.',
    ja: 'フロントエンドはSpring Backendのみを呼び出し、必要なAI/GIS計算はバックエンド経由で処理します。これにより、ユーザーデータと外部サービス連携の境界を明確に保ちます。'
  },
  'BridgeWork는 장애인 구직자의 직무 적합도와 접근성 정보를 함께 확인할 수 있는 일자리 추천 서비스입니다.': {
    zh: 'BridgeWork 是一项职位推荐服务，可同时查看残障求职者的岗位匹配度和无障碍信息。',
    en: 'BridgeWork is a job recommendation service that shows job fit and accessibility information for disabled job seekers.',
    ja: 'BridgeWorkは、障害のある求職者の職務適合度とアクセシビリティ情報を一緒に確認できる求人推薦サービスです。'
  },
  'BridgeWork | 장애인 맞춤 일자리 추천 플랫폼': {
    zh: 'BridgeWork | 残障人士个性化职位推荐平台',
    en: 'BridgeWork | Personalized Job Recommendations for Disabled Job Seekers',
    ja: 'BridgeWork | 障害のある方向け求人推薦プラットフォーム'
  },
  'BridgeWork는 장애 유형, 근무 조건, 출퇴근 접근성을 고려해 장애인 구직자에게 적합한 일자리를 추천하는 서비스입니다.': {
    zh: 'BridgeWork 会考虑残障类型、工作条件和通勤无障碍，为残障求职者推荐合适的职位。',
    en: 'BridgeWork recommends suitable jobs for disabled job seekers by considering disability type, working conditions, and commute accessibility.',
    ja: 'BridgeWorkは、障害種別、勤務条件、通勤アクセシビリティを考慮し、障害のある求職者に適した仕事を推薦するサービスです。'
  },
  '서비스 소개 | BridgeWork': { zh: '服务介绍 | BridgeWork', en: 'About | BridgeWork', ja: 'サービス紹介 | BridgeWork' },
  'BridgeWork가 장애인 구직자의 추천 이유, 접근성 정보, 데이터 부족 상황을 어떻게 안전하게 안내하는지 확인하세요.': {
    zh: '了解 BridgeWork 如何安全地说明残障求职者的推荐理由、无障碍信息和数据不足情况。',
    en: 'See how BridgeWork safely explains recommendation reasons, accessibility information, and limited data situations for disabled job seekers.',
    ja: 'BridgeWorkが、障害のある求職者への推薦理由、アクセシビリティ情報、データ不足の状況をどのように安全に案内するか確認できます。'
  },
  '자주 묻는 질문 | BridgeWork': { zh: '常见问题 | BridgeWork', en: 'FAQ | BridgeWork', ja: 'よくある質問 | BridgeWork' },
  'BridgeWork의 맞춤 일자리 추천, 접근성 점수, 개인정보 입력, 채용 공고 색인 정책에 대한 답변을 확인하세요.': {
    zh: '查看有关 BridgeWork 个性化职位推荐、无障碍评分、个人信息输入和招聘职位索引政策的回答。',
    en: 'Find answers about BridgeWork personalized job recommendations, accessibility scores, personal information input, and job indexing policy.',
    ja: 'BridgeWorkのカスタム求人推薦、アクセシビリティスコア、個人情報入力、求人インデックス方針についての回答を確認できます。'
  },
  '지역 접근성 지도 | BridgeWork': { zh: '区域无障碍地图 | BridgeWork', en: 'Local Accessibility Map | BridgeWork', ja: '地域アクセシビリティ地図 | BridgeWork' },
  '관심 공고 주변의 이동 경로, 접근성 점수, 확인이 필요한 요소를 지도와 목록으로 함께 확인하세요.': {
    zh: '在地图和列表中同时查看感兴趣职位周边的移动路线、无障碍评分和需要确认的事项。',
    en: 'Review routes, accessibility scores, and items to confirm around saved jobs in both map and list views.',
    ja: '気になる求人周辺の移動経路、アクセシビリティスコア、確認が必要な項目を地図と一覧で確認できます。'
  },
  '스크랩한 공고 | BridgeWork': { zh: '收藏职位 | BridgeWork', en: 'Saved Jobs | BridgeWork', ja: '保存した求人 | BridgeWork' },
  '로그인 후 저장한 공고를 접근성 점수, 추천 이유, 마감 상태 기준으로 다시 비교하세요.': {
    zh: '登录后，可按无障碍评分、推荐理由和截止状态重新比较已收藏的职位。',
    en: 'After logging in, compare saved jobs again by accessibility score, recommendation reason, and deadline status.',
    ja: 'ログイン後、保存した求人をアクセシビリティスコア、推薦理由、締切状況で再比較できます。'
  },
  '회원가입 | BridgeWork': { zh: '注册 | BridgeWork', en: 'Sign Up | BridgeWork', ja: '会員登録 | BridgeWork' },
  'BridgeWork 가입 후 직무 선호도, 근무 조건, 접근성 정보를 반영한 맞춤 일자리 추천을 시작하세요.': {
    zh: '注册 BridgeWork 后，开始接收反映岗位偏好、工作条件和无障碍信息的个性化职位推荐。',
    en: 'Sign up for BridgeWork to start personalized job recommendations based on job preferences, working conditions, and accessibility information.',
    ja: 'BridgeWorkに登録し、職務希望、勤務条件、アクセシビリティ情報を反映したカスタム求人推薦を始めましょう。'
  },
  '내 프로필 | BridgeWork': { zh: '我的资料 | BridgeWork', en: 'My Profile | BridgeWork', ja: 'マイプロフィール | BridgeWork' },
  '희망 직무, 경력, 근무 조건, 접근성 관련 선택 정보를 관리하고 추천 기준을 업데이트하세요.': {
    zh: '管理期望岗位、经验、工作条件和无障碍相关选择信息，并更新推荐标准。',
    en: 'Manage preferred roles, experience, working conditions, and accessibility choices, and update your recommendation criteria.',
    ja: '希望職務、経歴、勤務条件、アクセシビリティ関連の選択情報を管理し、推薦基準を更新できます。'
  },
  '환경설정 | BridgeWork': { zh: '设置 | BridgeWork', en: 'Settings | BridgeWork', ja: '設定 | BridgeWork' },
  '계정 정보, 접근성 환경, 알림, 약관 및 개인정보 설정을 한곳에서 확인하고 관리하세요.': {
    zh: '在一个位置查看并管理账户信息、无障碍环境、通知、条款和个人信息设置。',
    en: 'Review and manage account information, accessibility settings, notifications, terms, and privacy settings in one place.',
    ja: 'アカウント情報、アクセシビリティ環境、通知、規約、個人情報設定を一か所で確認・管理できます。'
  },
  '서비스 이용약관 | BridgeWork': { zh: '服务使用条款 | BridgeWork', en: 'Terms of Service | BridgeWork', ja: '利用規約 | BridgeWork' },
  '개인정보 처리방침 | BridgeWork': { zh: '隐私政策 | BridgeWork', en: 'Privacy Policy | BridgeWork', ja: 'プライバシーポリシー | BridgeWork' },
  '페이지를 찾을 수 없습니다 | BridgeWork': { zh: '找不到页面 | BridgeWork', en: 'Page Not Found | BridgeWork', ja: 'ページが見つかりません | BridgeWork' },
  '요청하신 페이지를 찾을 수 없습니다. BridgeWork의 일자리 추천과 접근성 정보는 홈에서 다시 확인할 수 있습니다.': {
    zh: '找不到请求的页面。可从首页重新查看 BridgeWork 的职位推荐和无障碍信息。',
    en: 'The requested page could not be found. You can return home to review BridgeWork job recommendations and accessibility information.',
    ja: 'リクエストされたページが見つかりません。BridgeWorkの求人推薦とアクセシビリティ情報はホームで再度確認できます。'
  }
};

function translateScoreText(normalized, translationLocale) {
  const scoreMatch = normalized.match(/^(\d+(?:\.\d+)?)점$/);
  if (!scoreMatch) {
    return '';
  }

  const [, score] = scoreMatch;
  return {
    zh: `${score} 分`,
    en: `${score} pts`,
    ja: `${score}点`
  }[translationLocale] || '';
}

function translateNumberedHeading(normalized, translationLocale) {
  const headingMatch = normalized.match(/^(\d+\.\s*)(.+)$/);
  if (!headingMatch) {
    return '';
  }

  const [, prefix, title] = headingMatch;
  const translatedTitle = UI_TEXT_TRANSLATIONS[title.trim()]?.[translationLocale];

  return translatedTitle ? `${prefix}${translatedTitle}` : '';
}

export function translateUiText(value, locale) {
  if (!value || locale === 'ko') {
    return value;
  }

  const normalized = String(value).replace(/\s+/g, ' ').trim();
  const translationLocale = locale === 'zh-CN' ? 'zh' : locale;
  const translated = UI_TEXT_TRANSLATIONS[normalized]?.[translationLocale];

  const leading = String(value).match(/^\s*/)?.[0] || '';
  const trailing = String(value).match(/\s*$/)?.[0] || '';

  if (translated) {
    return `${leading}${translated}${trailing}`;
  }

  const scoreTranslated = translateScoreText(normalized, translationLocale);
  if (scoreTranslated) {
    return `${leading}${scoreTranslated}${trailing}`;
  }

  const numberedHeadingTranslated = translateNumberedHeading(normalized, translationLocale);
  if (numberedHeadingTranslated) {
    return `${leading}${numberedHeadingTranslated}${trailing}`;
  }

  const compositeSeparators = /(\s*>\s*|\s+\/\s+|\s+·\s+)/;
  if (!compositeSeparators.test(normalized)) {
    return value;
  }

  const translatedParts = normalized.split(compositeSeparators).map((part) => {
    if (compositeSeparators.test(part) || !part.trim()) {
      return part;
    }

    return UI_TEXT_TRANSLATIONS[part.trim()]?.[translationLocale] || part;
  });
  const compositeTranslated = translatedParts.join('');

  if (compositeTranslated === normalized) {
    return value;
  }

  return `${leading}${compositeTranslated}${trailing}`;
}
