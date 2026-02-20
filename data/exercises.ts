export type BodyPart = 'chest' | 'back' | 'shoulder' | 'arms' | 'legs' | 'core' | 'cardio';
export type Equipment = 'bodyweight' | 'dumbbell' | 'barbell' | 'machine' | 'cable' | 'band' | 'none';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Exercise {
  id: string;
  name: string;
  bodyPart: BodyPart;
  secondaryParts?: BodyPart[];
  equipment: Equipment;
  difficulty: Difficulty;
  defaultSets: number;
  defaultReps: string; // "12" or "30초" for time-based
  restSeconds: number;
  caloriesPerSet: number;
  guide: string[];      // Step-by-step instructions
  tips: string[];       // Pro tips
  warnings: string[];   // Safety warnings
  voiceCoaching: string[]; // Phrases for voice coaching during exercise
}

export const BODY_PART_LABELS: Record<BodyPart, string> = {
  chest: '가슴',
  back: '등',
  shoulder: '어깨',
  arms: '팔',
  legs: '하체',
  core: '코어',
  cardio: '유산소',
};

export const BODY_PART_EMOJI: Record<BodyPart, string> = {
  chest: '🫁',
  back: '🔙',
  shoulder: '🦾',
  arms: '💪',
  legs: '🦵',
  core: '🎯',
  cardio: '🏃',
};

export const exercises: Exercise[] = [
  // ===== 가슴 (Chest) =====
  {
    id: 'pushup',
    name: '푸시업',
    bodyPart: 'chest',
    secondaryParts: ['arms', 'shoulder'],
    equipment: 'bodyweight',
    difficulty: 'beginner',
    defaultSets: 3,
    defaultReps: '15',
    restSeconds: 60,
    caloriesPerSet: 8,
    guide: [
      '바닥에 엎드려 양손을 어깨 너비보다 약간 넓게 짚습니다',
      '발끝과 손바닥으로 몸을 지탱하며, 몸이 일직선이 되게 합니다',
      '팔꿈치를 굽혀 가슴이 바닥에 가까워질 때까지 내려갑니다',
      '가슴과 삼두근에 힘을 주며 팔을 펴서 올라옵니다',
    ],
    tips: [
      '코어에 힘을 유지하여 허리가 처지지 않게 하세요',
      '팔꿈치 각도를 45도로 유지하면 어깨 부상을 예방할 수 있습니다',
      '호흡: 내려갈 때 들이쉬고, 올라올 때 내쉽니다',
    ],
    warnings: ['손목이 아프면 주먹을 쥐고 하거나 푸시업 바를 사용하세요'],
    voiceCoaching: ['내려가세요... 천천히...', '올라오세요! 힘차게!', '코어 힘 유지!', '좋아요, 계속!'],
  },
  {
    id: 'incline_pushup',
    name: '인클라인 푸시업',
    bodyPart: 'chest',
    secondaryParts: ['arms'],
    equipment: 'bodyweight',
    difficulty: 'beginner',
    defaultSets: 3,
    defaultReps: '12',
    restSeconds: 60,
    caloriesPerSet: 6,
    guide: [
      '벤치나 의자에 양손을 짚고 기울어진 자세를 만듭니다',
      '몸이 일직선이 되도록 코어에 힘을 줍니다',
      '팔을 굽혀 가슴을 벤치 쪽으로 내립니다',
      '가슴에 힘을 주며 팔을 펴서 올라옵니다',
    ],
    tips: ['일반 푸시업이 어려운 초보자에게 추천', '높이가 높을수록 쉬워집니다'],
    warnings: ['지지대가 미끄러지지 않는지 확인하세요'],
    voiceCoaching: ['내려가세요...', '올라오세요!', '폼 유지!'],
  },
  {
    id: 'db_bench_press',
    name: '덤벨 벤치프레스',
    bodyPart: 'chest',
    secondaryParts: ['arms', 'shoulder'],
    equipment: 'dumbbell',
    difficulty: 'intermediate',
    defaultSets: 4,
    defaultReps: '10',
    restSeconds: 90,
    caloriesPerSet: 10,
    guide: [
      '벤치에 등을 대고 누워 양손에 덤벨을 잡습니다',
      '덤벨을 가슴 위로 들어 올려 팔을 편 상태에서 시작합니다',
      '팔꿈치를 굽혀 덤벨을 가슴 옆으로 천천히 내립니다',
      '가슴에 힘을 주며 덤벨을 위로 밀어 올립니다',
    ],
    tips: [
      '견갑골(날개뼈)을 모아 등에 아치를 만드세요',
      '발바닥을 바닥에 단단히 고정하세요',
      '덤벨이 가슴 중앙 위에서 만나도록 합니다',
    ],
    warnings: ['무거운 무게는 보조자와 함께 하세요', '어깨 통증 시 즉시 중단'],
    voiceCoaching: ['천천히 내려놓으세요...', '밀어 올리세요!', '견갑골 모아주세요!', '좋습니다!'],
  },
  {
    id: 'db_fly',
    name: '덤벨 플라이',
    bodyPart: 'chest',
    equipment: 'dumbbell',
    difficulty: 'intermediate',
    defaultSets: 3,
    defaultReps: '12',
    restSeconds: 60,
    caloriesPerSet: 8,
    guide: [
      '벤치에 누워 양손에 덤벨을 가슴 위로 들어올립니다',
      '팔꿈치를 약간 구부린 상태를 유지합니다',
      '양팔을 옆으로 활짝 벌리며 덤벨을 내립니다',
      '가슴을 조이는 느낌으로 양팔을 모아 올립니다',
    ],
    tips: ['팔꿈치 각도를 일정하게 유지하세요', '가슴 근육의 스트레칭을 느끼세요'],
    warnings: ['너무 무거운 무게는 어깨 부상 위험이 있습니다'],
    voiceCoaching: ['넓게 벌리세요...', '가슴을 모아주세요!', '천천히, 컨트롤!'],
  },

  // ===== 등 (Back) =====
  {
    id: 'pullup',
    name: '풀업 (턱걸이)',
    bodyPart: 'back',
    secondaryParts: ['arms'],
    equipment: 'bodyweight',
    difficulty: 'advanced',
    defaultSets: 3,
    defaultReps: '8',
    restSeconds: 120,
    caloriesPerSet: 12,
    guide: [
      '바를 어깨 너비보다 약간 넓게 잡고 매달립니다',
      '견갑골을 아래로 당기며 몸을 끌어올립니다',
      '턱이 바 위로 올라올 때까지 당깁니다',
      '천천히 팔을 펴며 내려옵니다',
    ],
    tips: [
      '반동을 사용하지 마세요 (키핑 금지)',
      '등 근육으로 당기는 느낌에 집중하세요',
      '못하면 밴드 보조 풀업부터 시작하세요',
    ],
    warnings: ['어깨를 으쓱하지 않도록 주의하세요'],
    voiceCoaching: ['당기세요! 위로!', '천천히 내려오세요...', '등 근육에 집중!', '대단해요!'],
  },
  {
    id: 'db_row',
    name: '덤벨 로우',
    bodyPart: 'back',
    secondaryParts: ['arms'],
    equipment: 'dumbbell',
    difficulty: 'beginner',
    defaultSets: 3,
    defaultReps: '12',
    restSeconds: 60,
    caloriesPerSet: 8,
    guide: [
      '한쪽 손과 무릎을 벤치에 올려 상체를 수평으로 만듭니다',
      '반대 손으로 덤벨을 잡고 팔을 아래로 늘어뜨립니다',
      '팔꿈치를 뒤로 당기며 덤벨을 옆구리 쪽으로 끌어올립니다',
      '등 근육을 조인 후 천천히 내립니다',
    ],
    tips: ['등이 둥글게 말리지 않게 하세요', '팔꿈치를 몸에 붙여 당기세요'],
    warnings: ['허리를 비틀지 마세요'],
    voiceCoaching: ['당기세요!', '등 조여주세요!', '천천히 내려놓으세요...'],
  },
  {
    id: 'superman',
    name: '슈퍼맨',
    bodyPart: 'back',
    secondaryParts: ['core'],
    equipment: 'bodyweight',
    difficulty: 'beginner',
    defaultSets: 3,
    defaultReps: '15',
    restSeconds: 45,
    caloriesPerSet: 5,
    guide: [
      '바닥에 엎드려 양팔과 양다리를 쭉 폅니다',
      '동시에 양팔과 양다리를 바닥에서 들어올립니다',
      '2~3초간 자세를 유지합니다',
      '천천히 내려놓습니다',
    ],
    tips: ['목을 과도하게 젖히지 마세요', '복부에 힘을 유지하세요'],
    warnings: ['허리 통증이 있으면 높이를 줄이세요'],
    voiceCoaching: ['올리세요!', '유지... 유지...', '내려놓으세요', '좋아요!'],
  },
  {
    id: 'band_pulldown',
    name: '밴드 랫풀다운',
    bodyPart: 'back',
    secondaryParts: ['arms'],
    equipment: 'band',
    difficulty: 'beginner',
    defaultSets: 3,
    defaultReps: '15',
    restSeconds: 60,
    caloriesPerSet: 6,
    guide: [
      '밴드를 높은 곳에 고정하고 양손으로 잡습니다',
      '무릎을 꿇거나 서서 팔을 위로 쭉 펴 시작합니다',
      '팔꿈치를 옆구리 쪽으로 당기며 밴드를 끌어내립니다',
      '등 근육을 조인 후 천천히 돌아갑니다',
    ],
    tips: ['가슴을 펴고 어깨를 내린 상태를 유지하세요'],
    warnings: ['밴드가 튕기지 않게 조심하세요'],
    voiceCoaching: ['당기세요!', '등 수축!', '천천히 돌아가세요...'],
  },

  // ===== 어깨 (Shoulder) =====
  {
    id: 'db_shoulder_press',
    name: '덤벨 숄더프레스',
    bodyPart: 'shoulder',
    secondaryParts: ['arms'],
    equipment: 'dumbbell',
    difficulty: 'intermediate',
    defaultSets: 3,
    defaultReps: '10',
    restSeconds: 90,
    caloriesPerSet: 9,
    guide: [
      '양손에 덤벨을 잡고 어깨 높이에서 시작합니다',
      '팔꿈치가 90도로 구부러진 상태에서 시작합니다',
      '덤벨을 머리 위로 밀어 올립니다',
      '천천히 시작 위치로 내립니다',
    ],
    tips: ['허리를 과도하게 젖히지 마세요', '코어에 힘을 유지하세요'],
    warnings: ['어깨 통증 시 무게를 줄이거나 중단하세요'],
    voiceCoaching: ['밀어 올리세요!', '천천히 내려오세요...', '코어 힘!'],
  },
  {
    id: 'lateral_raise',
    name: '사이드 레터럴 레이즈',
    bodyPart: 'shoulder',
    equipment: 'dumbbell',
    difficulty: 'beginner',
    defaultSets: 3,
    defaultReps: '15',
    restSeconds: 45,
    caloriesPerSet: 6,
    guide: [
      '양손에 가벼운 덤벨을 잡고 몸 옆에 늘어뜨립니다',
      '팔꿈치를 약간 구부린 채 양팔을 옆으로 들어올립니다',
      '어깨 높이까지 올린 후 잠시 멈춥니다',
      '천천히 내립니다',
    ],
    tips: ['새끼손가락이 위로 가도록 약간 기울이면 효과적입니다', '반동을 쓰지 마세요'],
    warnings: ['너무 높이 올리면 어깨 충돌 증후군 위험이 있습니다'],
    voiceCoaching: ['올리세요... 천천히!', '어깨 높이!', '내려오세요...', '가볍게!'],
  },
  {
    id: 'front_raise',
    name: '프론트 레이즈',
    bodyPart: 'shoulder',
    equipment: 'dumbbell',
    difficulty: 'beginner',
    defaultSets: 3,
    defaultReps: '12',
    restSeconds: 45,
    caloriesPerSet: 5,
    guide: [
      '양손에 덤벨을 잡고 허벅지 앞에 놓습니다',
      '팔을 앞으로 들어올려 어깨 높이까지 올립니다',
      '잠시 멈춘 후 천천히 내립니다',
      '한 팔씩 번갈아 해도 됩니다',
    ],
    tips: ['상체가 뒤로 젖혀지지 않게 하세요'],
    warnings: ['무거운 무게는 허리에 무리가 갑니다'],
    voiceCoaching: ['올리세요!', '어깨 높이까지!', '내려오세요...'],
  },

  // ===== 팔 (Arms) =====
  {
    id: 'bicep_curl',
    name: '바이셉 컬',
    bodyPart: 'arms',
    equipment: 'dumbbell',
    difficulty: 'beginner',
    defaultSets: 3,
    defaultReps: '12',
    restSeconds: 60,
    caloriesPerSet: 5,
    guide: [
      '양손에 덤벨을 잡고 팔을 몸 옆에 늘어뜨립니다',
      '팔꿈치를 고정한 채 덤벨을 어깨 쪽으로 들어올립니다',
      '이두근을 최대한 조인 후 잠시 멈춥니다',
      '천천히 시작 위치로 내립니다',
    ],
    tips: ['팔꿈치가 앞뒤로 움직이지 않게 고정하세요', '완전히 내려서 전체 가동범위를 사용하세요'],
    warnings: ['반동으로 들지 마세요'],
    voiceCoaching: ['올리세요!', '이두근 조여주세요!', '천천히 내리세요...'],
  },
  {
    id: 'tricep_dip',
    name: '트라이셉 딥스',
    bodyPart: 'arms',
    secondaryParts: ['chest'],
    equipment: 'bodyweight',
    difficulty: 'intermediate',
    defaultSets: 3,
    defaultReps: '10',
    restSeconds: 60,
    caloriesPerSet: 7,
    guide: [
      '의자나 벤치 끝에 손을 짚고 엉덩이를 앞으로 빼냅니다',
      '다리를 앞으로 뻗고 팔로 체중을 지탱합니다',
      '팔꿈치를 뒤로 굽혀 몸을 내립니다',
      '삼두근에 힘을 주며 팔을 펴서 올라옵니다',
    ],
    tips: ['팔꿈치가 옆으로 벌어지지 않게 하세요', '다리를 구부리면 더 쉬워집니다'],
    warnings: ['어깨 통증이 있으면 범위를 줄이세요'],
    voiceCoaching: ['내려가세요...', '올라오세요!', '삼두근 힘!'],
  },
  {
    id: 'hammer_curl',
    name: '해머 컬',
    bodyPart: 'arms',
    equipment: 'dumbbell',
    difficulty: 'beginner',
    defaultSets: 3,
    defaultReps: '12',
    restSeconds: 60,
    caloriesPerSet: 5,
    guide: [
      '덤벨을 세로로 잡고 (망치 쥐듯) 팔을 늘어뜨립니다',
      '팔꿈치를 고정한 채 덤벨을 어깨 쪽으로 올립니다',
      '전완근과 이두근에 힘이 들어가는 것을 느끼세요',
      '천천히 내립니다',
    ],
    tips: ['바이셉 컬과 번갈아 하면 팔 전체를 고르게 발달시킬 수 있습니다'],
    warnings: [],
    voiceCoaching: ['올리세요!', '조여주세요!', '내리세요...'],
  },

  // ===== 하체 (Legs) =====
  {
    id: 'squat',
    name: '스쿼트',
    bodyPart: 'legs',
    secondaryParts: ['core'],
    equipment: 'bodyweight',
    difficulty: 'beginner',
    defaultSets: 4,
    defaultReps: '15',
    restSeconds: 60,
    caloriesPerSet: 10,
    guide: [
      '발을 어깨 너비로 벌리고 발끝을 약간 바깥으로 향하게 합니다',
      '의자에 앉듯이 엉덩이를 뒤로 빼며 무릎을 굽힙니다',
      '허벅지가 바닥과 평행이 될 때까지 내려갑니다',
      '발뒤꿈치로 밀며 일어납니다',
    ],
    tips: [
      '무릎이 발끝을 넘어가도 괜찮습니다 (무릎 건강하다면)',
      '가슴을 펴고 시선은 정면을 유지하세요',
      '발뒤꿈치에 체중을 실으세요',
    ],
    warnings: ['무릎 통증 시 범위를 줄이세요'],
    voiceCoaching: ['앉으세요!', '더 깊이!', '일어나세요!', '좋아요, 계속!'],
  },
  {
    id: 'lunge',
    name: '런지',
    bodyPart: 'legs',
    secondaryParts: ['core'],
    equipment: 'bodyweight',
    difficulty: 'beginner',
    defaultSets: 3,
    defaultReps: '10(각)',
    restSeconds: 60,
    caloriesPerSet: 9,
    guide: [
      '똑바로 선 상태에서 한 발을 앞으로 크게 내딛습니다',
      '뒷다리 무릎이 바닥에 거의 닿을 때까지 내려갑니다',
      '앞발 뒤꿈치로 밀며 시작 위치로 돌아옵니다',
      '반대 다리로 반복합니다',
    ],
    tips: ['상체를 곧게 유지하세요', '앞무릎이 90도를 유지하게 하세요'],
    warnings: ['균형이 안 잡히면 벽을 잡고 하세요'],
    voiceCoaching: ['내려가세요!', '올라오세요!', '반대쪽!', '균형 유지!'],
  },
  {
    id: 'goblet_squat',
    name: '고블릿 스쿼트',
    bodyPart: 'legs',
    secondaryParts: ['core'],
    equipment: 'dumbbell',
    difficulty: 'intermediate',
    defaultSets: 3,
    defaultReps: '12',
    restSeconds: 90,
    caloriesPerSet: 11,
    guide: [
      '덤벨을 양손으로 가슴 앞에 세로로 잡습니다',
      '발을 어깨 너비보다 약간 넓게 벌립니다',
      '엉덩이를 뒤로 빼며 깊이 스쿼트합니다',
      '팔꿈치가 무릎 안쪽을 스치도록 내려갑니다',
      '발뒤꿈치로 밀며 일어납니다',
    ],
    tips: ['덤벨의 무게 덕분에 자세가 더 안정됩니다', '깊은 스쿼트 연습에 좋습니다'],
    warnings: ['허리를 둥글게 말지 마세요'],
    voiceCoaching: ['내려가세요!', '깊이!', '올라오세요!'],
  },
  {
    id: 'calf_raise',
    name: '카프 레이즈',
    bodyPart: 'legs',
    equipment: 'bodyweight',
    difficulty: 'beginner',
    defaultSets: 3,
    defaultReps: '20',
    restSeconds: 30,
    caloriesPerSet: 4,
    guide: [
      '양발을 어깨 너비로 벌리고 서세요',
      '발가락 끝으로 밀며 최대한 높이 올라갑니다',
      '종아리가 최대로 수축된 상태에서 1초 유지합니다',
      '천천히 내려옵니다',
    ],
    tips: ['계단 끝에서 하면 가동범위가 늘어납니다', '한 발씩 하면 더 효과적입니다'],
    warnings: [],
    voiceCoaching: ['올라가세요!', '유지!', '내려오세요...'],
  },
  {
    id: 'wall_sit',
    name: '월 싯',
    bodyPart: 'legs',
    secondaryParts: ['core'],
    equipment: 'bodyweight',
    difficulty: 'beginner',
    defaultSets: 3,
    defaultReps: '30초',
    restSeconds: 60,
    caloriesPerSet: 7,
    guide: [
      '벽에 등을 대고 기대어 서세요',
      '천천히 미끄러져 내려가 허벅지가 바닥과 평행이 되게 합니다',
      '무릎 각도 90도를 유지하며 버팁니다',
      '정해진 시간만큼 유지합니다',
    ],
    tips: ['허벅지 근육이 타는 느낌이 정상입니다', '호흡을 참지 마세요'],
    warnings: ['무릎 통증 시 각도를 조절하세요'],
    voiceCoaching: ['버텨요!', '조금만 더!', '포기하지 마세요!', '잘하고 있어요!'],
  },

  // ===== 코어 (Core) =====
  {
    id: 'plank',
    name: '플랭크',
    bodyPart: 'core',
    equipment: 'bodyweight',
    difficulty: 'beginner',
    defaultSets: 3,
    defaultReps: '30초',
    restSeconds: 45,
    caloriesPerSet: 5,
    guide: [
      '팔꿈치를 바닥에 짚고 엎드립니다',
      '발끝과 팔꿈치로 몸을 지탱합니다',
      '머리부터 발끝까지 일직선을 유지합니다',
      '복부에 힘을 주고 정해진 시간 동안 유지합니다',
    ],
    tips: [
      '엉덩이가 올라가거나 내려가지 않게 하세요',
      '호흡을 계속하세요, 숨을 참지 마세요',
      '시선은 바닥을 향하세요 (목 중립)',
    ],
    warnings: ['허리 통증 시 무릎 플랭크로 변경하세요'],
    voiceCoaching: ['유지하세요!', '허리 쳐지지 않게!', '10초 남았어요!', '잘 버텨요!'],
  },
  {
    id: 'crunch',
    name: '크런치',
    bodyPart: 'core',
    equipment: 'bodyweight',
    difficulty: 'beginner',
    defaultSets: 3,
    defaultReps: '20',
    restSeconds: 45,
    caloriesPerSet: 5,
    guide: [
      '바닥에 누워 무릎을 세우고 발바닥을 바닥에 붙입니다',
      '양손을 가슴 앞에 교차하거나 귀 옆에 가볍게 댑니다',
      '복부에 힘을 주며 어깨를 바닥에서 들어올립니다',
      '천천히 내려옵니다',
    ],
    tips: ['목을 당기지 마세요', '시선은 천장을 향합니다', '상복부에 집중하세요'],
    warnings: ['목이 아프면 손으로 머리를 받치지 마세요'],
    voiceCoaching: ['올리세요!', '복근 조여주세요!', '내려오세요...', '계속!'],
  },
  {
    id: 'russian_twist',
    name: '러시안 트위스트',
    bodyPart: 'core',
    equipment: 'bodyweight',
    difficulty: 'intermediate',
    defaultSets: 3,
    defaultReps: '20(좌우)',
    restSeconds: 45,
    caloriesPerSet: 7,
    guide: [
      '바닥에 앉아 무릎을 약간 구부리고 발을 들어올립니다',
      '상체를 약간 뒤로 기울여 V자 모양을 만듭니다',
      '양손을 모아 좌우로 번갈아 비틀어 줍니다',
      '복부 옆(복사근)에 힘이 들어가는 것을 느끼세요',
    ],
    tips: ['더 어렵게 하려면 무게를 들고 하세요', '천천히, 컨트롤하며 하세요'],
    warnings: ['허리 통증 시 범위를 줄이세요'],
    voiceCoaching: ['좌!', '우!', '코어 힘!', '속도 유지!'],
  },
  {
    id: 'leg_raise',
    name: '레그 레이즈',
    bodyPart: 'core',
    equipment: 'bodyweight',
    difficulty: 'intermediate',
    defaultSets: 3,
    defaultReps: '15',
    restSeconds: 60,
    caloriesPerSet: 7,
    guide: [
      '바닥에 누워 다리를 쭉 펴고 양손은 엉덩이 옆에 놓습니다',
      '복부에 힘을 주며 다리를 천천히 들어올립니다',
      '다리가 바닥과 직각이 될 때까지 올립니다',
      '천천히 내리되, 바닥에 닿기 직전에 멈춥니다',
    ],
    tips: ['허리가 바닥에서 뜨지 않게 하세요', '양손을 엉덩이 아래에 놓으면 허리 보호에 도움'],
    warnings: ['허리가 아프면 무릎을 구부려서 하세요'],
    voiceCoaching: ['올리세요!', '천천히 내리세요...', '바닥에 안 닿게!', '코어!'],
  },
  {
    id: 'mountain_climber',
    name: '마운틴 클라이머',
    bodyPart: 'core',
    secondaryParts: ['cardio'],
    equipment: 'bodyweight',
    difficulty: 'intermediate',
    defaultSets: 3,
    defaultReps: '30초',
    restSeconds: 45,
    caloriesPerSet: 10,
    guide: [
      '푸시업 자세에서 시작합니다',
      '한쪽 무릎을 가슴 쪽으로 빠르게 당깁니다',
      '다리를 바꿔가며 달리듯이 반복합니다',
      '코어에 힘을 유지하며 빠르게 진행합니다',
    ],
    tips: ['엉덩이가 올라가지 않게 하세요', '속도를 조절하며 폼을 유지하세요'],
    warnings: ['손목이 아프면 쉬세요'],
    voiceCoaching: ['빨리! 빨리!', '속도 올리세요!', '거의 다 됐어요!', '멈추지 마세요!'],
  },

  // ===== 유산소 (Cardio) =====
  {
    id: 'jumping_jack',
    name: '점핑잭',
    bodyPart: 'cardio',
    equipment: 'bodyweight',
    difficulty: 'beginner',
    defaultSets: 3,
    defaultReps: '30초',
    restSeconds: 30,
    caloriesPerSet: 8,
    guide: [
      '양발을 모으고 팔을 옆에 놓고 서세요',
      '점프하며 다리를 벌리고 양팔을 머리 위로 올립니다',
      '다시 점프하며 시작 자세로 돌아옵니다',
      '리듬감 있게 반복합니다',
    ],
    tips: ['무릎을 살짝 굽혀 착지 충격을 줄이세요'],
    warnings: ['무릎이나 발목이 약하면 낮은 강도로 시작하세요'],
    voiceCoaching: ['점프! 점프!', '팔 높이!', '리듬 유지!'],
  },
  {
    id: 'burpee',
    name: '버피',
    bodyPart: 'cardio',
    secondaryParts: ['chest', 'legs', 'core'],
    equipment: 'bodyweight',
    difficulty: 'advanced',
    defaultSets: 3,
    defaultReps: '10',
    restSeconds: 90,
    caloriesPerSet: 15,
    guide: [
      '서서 시작합니다',
      '스쿼트 자세로 내려가 양손을 바닥에 짚습니다',
      '양발을 뒤로 차서 푸시업 자세를 만듭니다',
      '푸시업을 1회 실시합니다',
      '발을 앞으로 당기고 점프하며 일어나 양팔을 머리 위로 뻗습니다',
    ],
    tips: ['초보자는 푸시업이나 점프를 생략해도 됩니다', '페이스를 유지하세요'],
    warnings: ['심박수가 너무 올라가면 쉬세요'],
    voiceCoaching: ['내려가세요!', '차세요!', '올라오세요! 점프!', '다시!'],
  },
  {
    id: 'high_knees',
    name: '하이니즈',
    bodyPart: 'cardio',
    secondaryParts: ['legs', 'core'],
    equipment: 'bodyweight',
    difficulty: 'beginner',
    defaultSets: 3,
    defaultReps: '30초',
    restSeconds: 30,
    caloriesPerSet: 9,
    guide: [
      '서서 시작합니다',
      '무릎을 번갈아가며 허리 높이까지 빠르게 들어올립니다',
      '제자리에서 달리듯이 합니다',
      '팔도 함께 사용하여 리듬을 만드세요',
    ],
    tips: ['복근에 힘을 유지하세요', '발 앞부분으로 착지하세요'],
    warnings: ['무릎이나 발목이 아프면 속도를 줄이세요'],
    voiceCoaching: ['무릎 높이!', '빨리! 빨리!', '팔도 같이!', '좋아요!'],
  },
  {
    id: 'jump_squat',
    name: '점프 스쿼트',
    bodyPart: 'cardio',
    secondaryParts: ['legs'],
    equipment: 'bodyweight',
    difficulty: 'intermediate',
    defaultSets: 3,
    defaultReps: '12',
    restSeconds: 60,
    caloriesPerSet: 12,
    guide: [
      '일반 스쿼트 자세에서 시작합니다',
      '스쿼트로 내려간 후 폭발적으로 점프합니다',
      '부드럽게 착지하며 바로 다음 스쿼트로 이어갑니다',
    ],
    tips: ['착지 시 무릎을 부드럽게 굽혀 충격을 흡수하세요'],
    warnings: ['무릎 관절이 약한 분은 일반 스쿼트를 하세요'],
    voiceCoaching: ['내려가세요!', '점프!', '착지!', '다시!'],
  },
];

// ===== 운동 프로그램 생성 =====

export interface WorkoutPlan {
  name: string;
  exercises: {
    exercise: Exercise;
    sets: number;
    reps: string;
    restSeconds: number;
  }[];
  estimatedMinutes: number;
  estimatedCalories: number;
}

export function generateWorkoutPlan(
  goal: 'lose' | 'gain' | 'maintain',
  experience: 'beginner' | 'intermediate' | 'advanced',
  targetParts: BodyPart[]
): WorkoutPlan {
  const difficultyFilter: Difficulty[] =
    experience === 'beginner'
      ? ['beginner']
      : experience === 'intermediate'
        ? ['beginner', 'intermediate']
        : ['beginner', 'intermediate', 'advanced'];

  // Filter exercises by body parts and difficulty
  const available = exercises.filter(
    (e) => targetParts.includes(e.bodyPart) && difficultyFilter.includes(e.difficulty)
  );

  // Select exercises (5-7 based on goal)
  const count = goal === 'lose' ? 6 : goal === 'gain' ? 5 : 6;
  const selected = shuffleAndPick(available, Math.min(count, available.length));

  // Adjust sets/reps based on goal
  const plan = selected.map((exercise) => {
    let sets = exercise.defaultSets;
    let reps = exercise.defaultReps;

    if (goal === 'lose') {
      // More reps, shorter rest
      sets = Math.max(3, sets);
      if (!reps.includes('초')) {
        const baseReps = parseInt(reps) || 12;
        reps = String(Math.min(baseReps + 5, 20));
      }
    } else if (goal === 'gain') {
      // More sets, lower reps, longer rest
      sets = Math.min(sets + 1, 5);
      if (!reps.includes('초') && !reps.includes('(')) {
        const baseReps = parseInt(reps) || 12;
        reps = String(Math.max(baseReps - 2, 6));
      }
    }

    return {
      exercise,
      sets,
      reps,
      restSeconds: goal === 'lose' ? Math.max(30, exercise.restSeconds - 15) : exercise.restSeconds,
    };
  });

  const totalSets = plan.reduce((sum, p) => sum + p.sets, 0);
  const estimatedCalories = plan.reduce((sum, p) => sum + p.exercise.caloriesPerSet * p.sets, 0);
  const estimatedMinutes = Math.round(totalSets * 1.5 + totalSets * (plan[0]?.restSeconds || 60) / 60);

  const goalNames = { lose: '체중 감량', gain: '근육 증가', maintain: '체력 향상' };

  return {
    name: `${goalNames[goal]} 워크아웃`,
    exercises: plan,
    estimatedMinutes,
    estimatedCalories,
  };
}

function shuffleAndPick<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ===== 요일별 추천 부위 =====

export function getRecommendedParts(dayOfWeek: number, goal: 'lose' | 'gain' | 'maintain'): BodyPart[] {
  if (goal === 'lose') {
    const patterns: BodyPart[][] = [
      ['cardio', 'core', 'legs'],     // 일
      ['chest', 'arms', 'cardio'],     // 월
      ['legs', 'core', 'cardio'],      // 화
      ['back', 'shoulder', 'cardio'],  // 수
      ['cardio', 'core', 'legs'],      // 목
      ['chest', 'arms', 'cardio'],     // 금
      ['legs', 'back', 'core'],        // 토
    ];
    return patterns[dayOfWeek];
  }

  if (goal === 'gain') {
    const patterns: BodyPart[][] = [
      ['legs', 'core'],                // 일
      ['chest', 'arms'],               // 월
      ['back', 'shoulder'],            // 화
      ['legs', 'core'],                // 수
      ['chest', 'arms'],               // 목
      ['back', 'shoulder'],            // 금
      ['legs', 'arms', 'core'],        // 토
    ];
    return patterns[dayOfWeek];
  }

  // maintain
  const patterns: BodyPart[][] = [
    ['cardio', 'core'],              // 일
    ['chest', 'back', 'arms'],       // 월
    ['legs', 'cardio'],              // 화
    ['shoulder', 'arms', 'core'],    // 수
    ['cardio', 'legs'],              // 목
    ['chest', 'back'],               // 금
    ['core', 'cardio', 'legs'],      // 토
  ];
  return patterns[dayOfWeek];
}
