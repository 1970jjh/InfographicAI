
import { InfographicStyle, SizeOption, ColorOption } from '../types';

export const SIZE_OPTIONS: SizeOption[] = [
  { id: 'mobile-story', label: '모바일 (9:16)', subLabel: 'Shorts, TikTok', ratio: '9:16' },
  { id: 'webtoon-4', label: '4컷 웹툰', subLabel: '인스타툰, 숏폼', ratio: '9:16' },
  { id: 'webtoon-8', label: '8컷 웹툰', subLabel: '블로그, 스토리', ratio: '9:16' },
  { id: 'long-scroll', label: '롱 스크롤', subLabel: '웹툰, 상세페이지', ratio: '9:16' },
  { id: 'instagram-sq', label: '스퀘어 (1:1)', subLabel: 'Instagram', ratio: '1:1' },
  { id: 'card-news', label: '카드뉴스', subLabel: 'SNS 홍보용', ratio: '1:1' },
  { id: 'presentation-wide', label: '와이드 (16:9)', subLabel: 'PPT, YouTube', ratio: '16:9' },
  { id: 'presentation-std', label: '표준 (4:3)', subLabel: 'Classic PPT', ratio: '4:3' },
  { id: 'a4-portrait', label: 'A4 세로', subLabel: '보고서, 문서', ratio: '3:4' },
  { id: 'a4-landscape', label: 'A4 가로', subLabel: '가로형 보고서', ratio: '4:3' },
];

export const COLOR_OPTIONS: ColorOption[] = [
  { id: 'red', name: 'Red', class: 'bg-red-500', hex: '#ef4444' },
  { id: 'orange', name: 'Orange', class: 'bg-orange-500', hex: '#f97316' },
  { id: 'yellow', name: 'Yellow', class: 'bg-yellow-400', hex: '#facc15' },
  { id: 'green', name: 'Green', class: 'bg-green-500', hex: '#22c55e' },
  { id: 'teal', name: 'Teal', class: 'bg-teal-500', hex: '#14b8a6' },
  { id: 'blue', name: 'Blue', class: 'bg-blue-500', hex: '#3b82f6' },
  { id: 'indigo', name: 'Indigo', class: 'bg-indigo-500', hex: '#6366f1' },
  { id: 'purple', name: 'Purple', class: 'bg-purple-500', hex: '#a855f7' },
  { id: 'pink', name: 'Pink', class: 'bg-pink-500', hex: '#ec4899' },
  { id: 'rose', name: 'Rose', class: 'bg-rose-500', hex: '#f43f5e' },
  { id: 'brown', name: 'Brown', class: 'bg-amber-800', hex: '#92400e' },
  { id: 'slate', name: 'Slate', class: 'bg-slate-500', hex: '#64748b' },
  { id: 'black', name: 'Black', class: 'bg-black', hex: '#000000' },
  { id: 'white', name: 'White', class: 'bg-white border border-slate-200', hex: '#ffffff' },
  { id: 'warm', name: 'Warm', class: 'bg-orange-200', hex: 'Warm Tone' },
  { id: 'cool', name: 'Cool', class: 'bg-blue-200', hex: 'Cool Tone' },
];

export const INFOGRAPHIC_STYLES: InfographicStyle[] = [
  {
    id: 'dynamic-glassmorphism',
    name: 'Dynamic Glassmorphism',
    description: '반투명한 유리 카드 뒤에서 은은한 오로라 같은 컬러가 움직이는 생동감 있는 스타일',
    longDescription: '최신 UI 트렌드인 글래스모피즘(Glassmorphism)을 극대화한 스타일입니다. 배경에는 오로라처럼 부드럽게 흐르는 화려한 그라데이션이 깔려있고, 그 위에 반투명한 불투명 유리 질감의 카드들이 배치되어 정보의 계층 구조를 명확히 보여줍니다. 세련되고 현대적이며, IT 서비스나 트렌디한 마케팅 자료에 적합합니다.',
    previewImage: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'noise-texture',
    name: 'Noise Texture Overlay',
    description: '미묘한 필름 그레인 질감을 깔아 종이 인쇄물 같은 고급스러운 촉감을 전달',
    longDescription: '디지털 화면에서도 아날로그의 감성을 느낄 수 있도록 미세한 노이즈(Grain) 텍스처를 전체적으로 입힌 스타일입니다. 마치 고급 수입지에 인쇄된 듯한 질감을 주어 시각적 피로도를 낮추고 감성적인 몰입감을 제공합니다. 차분하고 진정성 있는 메시지 전달에 효과적입니다.',
    previewImage: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'minimalism',
    name: 'Minimalism',
    description: '여백의 미를 살린 깔끔하고 세련된 스타일. 본질에 집중',
    longDescription: '불필요한 장식 요소를 모두 제거하고, 오직 핵심 콘텐츠와 타이포그래피, 그리고 넓은 여백(Negative Space)만을 활용하는 스타일입니다. 극도의 단순함 속에서 세련미를 찾으며, 정보의 가독성을 최우선으로 합니다. 갤러리나 명품 브랜드의 브로슈어 같은 느낌을 줍니다.',
    previewImage: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'bento-grid',
    name: 'Bento Grid',
    description: '도시락 통처럼 정보를 직관적인 박스 형태로 배치하여 구조적이고 모던한 느낌',
    longDescription: '애플의 홍보 자료나 웹사이트에서 자주 보이는 벤토(Bento) 도시락 형태의 그리드 레이아웃입니다. 각기 다른 크기의 둥근 사각형 박스 안에 이미지, 텍스트, 그래프를 나누어 담아 복잡한 정보를 매우 체계적이고 정리된 느낌으로 보여줍니다. 한눈에 많은 정보를 파악하기 좋습니다.',
    previewImage: 'https://images.unsplash.com/photo-1579547621706-1a9c79d5c9f1?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk/Dark',
    description: '검정 배경에 형광색 포인트(네온)를 사용하여 미래지향적이고 강렬한 인상',
    longDescription: '어두운 배경 속에 네온 사인처럼 빛나는 형광 그린, 핑크, 사이안 컬러를 사용하여 강렬한 대비를 줍니다. 글리치 효과나 회로도 패턴이 가미되어 하이테크, 미래 도시, 게임, 블록체인 등 혁신적이고 파격적인 주제를 다룰 때 압도적인 주목도를 자랑합니다.',
    previewImage: 'https://images.unsplash.com/photo-1515630278258-407f66498911?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'typography',
    name: 'Typography-driven',
    description: '굵고 큰 폰트를 과감하게 사용하여 텍스트 자체로 메시지를 강력하게 전달',
    longDescription: '이미지보다는 글자 그 자체를 그래픽 요소로 활용합니다. 화면을 가득 채우는 거대한 헤드라인 폰트, 감각적인 자간과 행간 조절을 통해 메시지를 강하게 호소합니다. 잡지 표지나 포스터처럼 시각적인 임팩트가 크며, 슬로건 위주의 콘텐츠에 적합합니다.',
    previewImage: 'https://images.unsplash.com/photo-1505682634904-d7c8d95cdc50?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'parallax',
    name: 'Parallax Layered',
    description: '깊이감과 입체적인 몰입감을 제공하는 레이어드 스타일',
    longDescription: '여러 장의 종이를 겹쳐 놓은 듯한 층(Layer) 구조를 활용하여 화면에 깊이감을 만듭니다. 그림자를 적절히 사용하여 요소들이 공중에 떠 있는 듯한 착시를 주며, 평면적인 화면보다 훨씬 풍부하고 입체적인 경험을 제공합니다.',
    previewImage: 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'neumorphism',
    name: 'Neumorphism',
    description: '요소가 배경에서 부드럽게 튀어나오거나 들어간 듯한 소프트 UI 스타일',
    longDescription: '뉴모피즘(Neumorphism)은 스큐어모피즘과 플랫 디자인의 중간 지점으로, 빛과 그림자만을 이용해 버튼이나 카드가 배경에서 부드럽게 융기된 듯한 형태를 표현합니다. 매우 부드럽고 촉각적인 느낌을 주며, 편안하고 깨끗한 이미지를 전달합니다.',
    previewImage: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'brutalism',
    name: 'Brutalism',
    description: '거칠고 투박하며 파격적인 레이아웃으로 예술적이고 힙한 느낌',
    longDescription: '기존의 디자인 규칙을 깨뜨리는 파격적인 스타일입니다. 원색적인 컬러, 다듬어지지 않은 듯한 폰트, 불규칙한 배치를 통해 날것의 에너지와 개성을 표출합니다. 예술, 패션, 스트릿 컬처 등 트렌디하고 힙한 브랜드 이미지에 어울립니다.',
    previewImage: 'https://images.unsplash.com/photo-1594908900066-3f47337549d8?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'isometric',
    name: 'Isometric 3D',
    description: '3차원 입체 투시를 활용하여 귀엽고 트렌디하며 공간감을 살린 디자인',
    longDescription: '대각선 방향에서 내려다보는 3D 아이소메트릭(Isometric) 뷰를 사용하여 아기자기하면서도 전문적인 느낌을 줍니다. 건물, 데이터 흐름, 프로세스 등을 모형처럼 표현하여 복잡한 시스템을 직관적으로 설명하는 데 탁월합니다.',
    previewImage: 'https://images.unsplash.com/photo-1506318137071-a8bcbf67cc77?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'retro-futurism',
    name: 'Retro Futurism',
    description: '80-90년대에 상상했던 미래의 느낌과 현대적인 감각을 결합한 힙한 스타일',
    longDescription: '80년대 신스웨이브(Synthwave)나 90년대 초기 인터넷 감성을 현대적으로 재해석했습니다. 네온 그리드, 크롬 질감, 픽셀 폰트 등을 사용하여 노스텔지어와 미래지향적인 느낌을 동시에 줍니다. 독특하고 기억에 남는 비주얼을 만듭니다.',
    previewImage: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'gamification',
    name: 'Gamification',
    description: '게임 요소(배지, 레벨, 진행바)를 활용하여 흥미를 유도하는 즐거운 스타일',
    longDescription: '정보를 마치 RPG 게임의 UI처럼 표현합니다. 진행률 표시줄(Progress Bar), 배지, 능력치 육각형 그래프(Stat Hexagon), 레벨업 알림 같은 요소를 디자인에 녹여내어, 지루할 수 있는 정보를 재미있고 성취감을 주는 방식으로 전달합니다.',
    previewImage: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'ai-digital',
    name: 'AI DIGITAL',
    description: '신경망, 노드 연결, 빛나는 입자 효과를 사용하여 인공지능의 느낌 강조',
    longDescription: '인공지능, 빅데이터, 네트워크 연결을 시각화한 스타일입니다. 어두운 배경 위로 빛나는 점과 선들이 연결되는 신경망 패턴, 데이터의 흐름을 나타내는 파티클 효과 등을 사용하여 최첨단 기술과 지능적인 이미지를 강조합니다.',
    previewImage: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'apple',
    name: 'Apple Style',
    description: '극도의 심플함, 고해상도 이미지, 부드러운 여백이 특징인 프리미엄 스타일',
    longDescription: 'Apple의 제품 소개 페이지처럼 프리미엄하고 미니멀한 감성을 추구합니다. 압도적인 고화질의 제품/대상 이미지 하나를 중앙에 배치하고, 얇고 세련된 산세리프 폰트로 절제된 설명을 곁들여 고급스러움을 극대화합니다.',
    previewImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'samsung',
    name: 'Samsung Galaxy',
    description: '깊은 블랙 배경에 선명한 홀로그래픽 그래픽과 엣지있는 폰트',
    longDescription: '삼성 갤럭시 언팩 행사에서 볼 수 있는 스타일입니다. Deep Black 배경에 대비되는 매우 선명하고 채도 높은 홀로그래픽 컬러, 날렵하고 기하학적인 폰트, 그리고 메탈릭한 질감을 사용하여 혁신적이고 단단한 이미지를 줍니다.',
    previewImage: 'https://images.unsplash.com/photo-1617042375876-a13e36732a04?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'google',
    name: 'Google Style',
    description: 'Material Design 3 기반의 둥근 모서리, 파스텔 톤과 원색의 조화',
    longDescription: 'Google의 Material Design 3 가이드라인을 따릅니다. 넉넉한 둥근 모서리(Rounded Corner), 파스텔 톤의 배경색과 구글의 시그니처 4색(파랑, 빨강, 노랑, 초록)을 포인트로 사용하여 친근하고 실용적이며 사용자 친화적인 느낌을 줍니다.',
    previewImage: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'nvidia',
    name: 'Nvidia Style',
    description: '검정 배경에 시그니처 그린 컬러와 기하학적 패턴을 사용한 하드웨어적 느낌',
    longDescription: 'Nvidia의 아이덴티티를 반영하여 검은색 배경에 형광 라임 그린(Lime Green)을 포인트로 사용합니다. 삼각형 메쉬 패턴, 회로 기판의 라인, 날카로운 앵글 등을 활용하여 고성능, 하드웨어, 게이밍 퍼포먼스의 느낌을 강렬하게 전달합니다.',
    previewImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'
  },
];
