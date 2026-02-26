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

  {
    id: 'diamond_pushup',
    name: '다이아몬드 푸시업',
    bodyPart: 'chest',
    secondaryParts: ['arms'],
    equipment: 'bodyweight',
    difficulty: 'intermediate',
    defaultSets: 3,
    defaultReps: '10',
    restSeconds: 60,
    caloriesPerSet: 9,
    guide: [
      '양손의 엄지와 검지를 붙여 다이아몬드 모양을 만듭니다',
      '가슴 아래에 손을 위치시키고 푸시업 자세를 잡습니다',
      '팔꿈치를 몸에 붙인 채 천천히 내려갑니다',
      '삼두근과 가슴 안쪽에 힘을 주며 올라옵니다',
    ],
    tips: ['가슴 안쪽과 삼두근을 동시에 단련할 수 있습니다', '일반 푸시업보다 난이도가 높습니다'],
    warnings: ['손목에 무리가 갈 수 있으니 통증 시 중단하세요'],
    voiceCoaching: ['내려가세요...', '팔꿈치 붙여!', '올라오세요!', '좋아요!'],
  },
  {
    id: 'decline_pushup',
    name: '디클라인 푸시업',
    bodyPart: 'chest',
    secondaryParts: ['shoulder', 'arms'],
    equipment: 'bodyweight',
    difficulty: 'intermediate',
    defaultSets: 3,
    defaultReps: '12',
    restSeconds: 60,
    caloriesPerSet: 9,
    guide: [
      '발을 의자나 벤치 위에 올려놓습니다',
      '양손을 어깨 너비로 바닥에 짚습니다',
      '몸이 일직선이 되도록 코어에 힘을 줍니다',
      '팔을 굽혀 내려갔다 밀어 올립니다',
    ],
    tips: ['윗가슴(상부 흉근)을 집중적으로 단련합니다', '발 높이가 높을수록 어깨 개입이 커집니다'],
    warnings: ['어깨 통증 시 높이를 낮추세요'],
    voiceCoaching: ['내려가세요...', '가슴에 집중!', '밀어 올리세요!'],
  },
  {
    id: 'wide_pushup',
    name: '와이드 푸시업',
    bodyPart: 'chest',
    equipment: 'bodyweight',
    difficulty: 'beginner',
    defaultSets: 3,
    defaultReps: '15',
    restSeconds: 60,
    caloriesPerSet: 8,
    guide: [
      '양손을 어깨 너비의 1.5배로 넓게 짚습니다',
      '푸시업 자세에서 몸을 일직선으로 유지합니다',
      '천천히 내려가며 가슴 바깥쪽 스트레칭을 느낍니다',
      '가슴에 힘을 주며 올라옵니다',
    ],
    tips: ['가슴 바깥쪽을 더 많이 자극합니다', '내려갈 때 가슴이 늘어나는 느낌에 집중하세요'],
    warnings: ['어깨가 불편하면 손 간격을 좁히세요'],
    voiceCoaching: ['넓게!', '내려가세요...', '올라오세요!'],
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

  {
    id: 'inverted_row',
    name: '인버티드 로우',
    bodyPart: 'back',
    secondaryParts: ['arms'],
    equipment: 'bodyweight',
    difficulty: 'intermediate',
    defaultSets: 3,
    defaultReps: '10',
    restSeconds: 60,
    caloriesPerSet: 8,
    guide: [
      '낮은 바 아래에 누워 바를 어깨 너비로 잡습니다',
      '몸을 일직선으로 유지하며 가슴을 바 쪽으로 당깁니다',
      '견갑골을 모으며 등 근육을 수축합니다',
      '천천히 내려옵니다',
    ],
    tips: ['풀업이 안 되는 분에게 좋은 대안입니다', '테이블 아래에서도 할 수 있습니다'],
    warnings: ['바가 안정적으로 고정되어 있는지 확인하세요'],
    voiceCoaching: ['당기세요!', '견갑골 모아!', '천천히 내려오세요...'],
  },
  {
    id: 'db_deadlift',
    name: '덤벨 데드리프트',
    bodyPart: 'back',
    secondaryParts: ['legs', 'core'],
    equipment: 'dumbbell',
    difficulty: 'intermediate',
    defaultSets: 3,
    defaultReps: '10',
    restSeconds: 90,
    caloriesPerSet: 12,
    guide: [
      '양손에 덤벨을 잡고 발을 어깨 너비로 벌립니다',
      '엉덩이를 뒤로 빼며 상체를 앞으로 숙입니다',
      '덤벨이 정강이를 따라 내려가도록 합니다',
      '엉덩이와 햄스트링에 힘을 주며 일어납니다',
    ],
    tips: ['등을 항상 곧게 유지하세요 (아치 금지)', '바닥에 내려놓지 않고 허벅지 중간까지 내려도 됩니다'],
    warnings: ['허리를 둥글게 말면 부상 위험이 높습니다', '무거운 무게는 충분히 숙련된 후 시도하세요'],
    voiceCoaching: ['엉덩이 뒤로!', '등 곧게!', '일어나세요!', '좋습니다!'],
  },
  {
    id: 'reverse_fly',
    name: '리버스 플라이',
    bodyPart: 'back',
    secondaryParts: ['shoulder'],
    equipment: 'dumbbell',
    difficulty: 'beginner',
    defaultSets: 3,
    defaultReps: '15',
    restSeconds: 45,
    caloriesPerSet: 5,
    guide: [
      '가벼운 덤벨을 양손에 잡고 상체를 앞으로 숙입니다',
      '팔을 아래로 늘어뜨린 상태에서 시작합니다',
      '팔꿈치를 약간 구부린 채 양팔을 옆으로 들어올립니다',
      '견갑골을 모으며 등 상부를 수축한 후 천천히 내립니다',
    ],
    tips: ['후면 삼각근과 등 상부를 동시에 단련합니다', '가벼운 무게로 정확한 폼이 중요합니다'],
    warnings: ['허리가 둥글어지지 않게 주의하세요'],
    voiceCoaching: ['벌리세요!', '견갑골 모아!', '내려오세요...'],
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

  {
    id: 'arnold_press',
    name: '아놀드 프레스',
    bodyPart: 'shoulder',
    secondaryParts: ['arms'],
    equipment: 'dumbbell',
    difficulty: 'intermediate',
    defaultSets: 3,
    defaultReps: '10',
    restSeconds: 90,
    caloriesPerSet: 9,
    guide: [
      '양손에 덤벨을 잡고 가슴 앞에서 손바닥이 얼굴을 향하게 합니다',
      '팔을 올리면서 손목을 회전시켜 손바닥이 정면을 향하게 합니다',
      '머리 위로 완전히 밀어 올립니다',
      '역순으로 내려오며 손목을 다시 회전시킵니다',
    ],
    tips: ['전면·측면·후면 삼각근을 모두 자극하는 효율적인 운동입니다', '회전 동작을 부드럽게 하세요'],
    warnings: ['어깨 유연성이 부족하면 가벼운 무게로 시작하세요'],
    voiceCoaching: ['회전하며 올리세요!', '위로!', '돌리며 내려오세요...'],
  },
  {
    id: 'pike_pushup',
    name: '파이크 푸시업',
    bodyPart: 'shoulder',
    secondaryParts: ['arms', 'chest'],
    equipment: 'bodyweight',
    difficulty: 'intermediate',
    defaultSets: 3,
    defaultReps: '10',
    restSeconds: 60,
    caloriesPerSet: 8,
    guide: [
      '푸시업 자세에서 엉덩이를 높이 들어 거꾸로 V자를 만듭니다',
      '손과 발 간격을 좁혀 엉덩이가 최대한 높이 올라가게 합니다',
      '머리를 양손 사이로 내리며 팔을 굽힙니다',
      '어깨 힘으로 밀어 올립니다',
    ],
    tips: ['물구나무서기 푸시업의 전 단계 연습입니다', '어깨에 강한 자극을 줍니다'],
    warnings: ['목에 부담이 가면 범위를 줄이세요'],
    voiceCoaching: ['내려가세요...', '어깨 힘!', '올라오세요!'],
  },
  {
    id: 'rear_delt_fly',
    name: '리어 델트 플라이',
    bodyPart: 'shoulder',
    equipment: 'dumbbell',
    difficulty: 'beginner',
    defaultSets: 3,
    defaultReps: '15',
    restSeconds: 45,
    caloriesPerSet: 5,
    guide: [
      '가벼운 덤벨을 잡고 의자에 앉아 상체를 무릎 위로 숙입니다',
      '양팔을 아래로 늘어뜨린 상태에서 시작합니다',
      '팔꿈치를 약간 구부린 채 양팔을 뒤쪽으로 들어올립니다',
      '후면 삼각근을 조인 후 천천히 내립니다',
    ],
    tips: ['후면 삼각근은 자세 교정에 매우 중요합니다', '거울을 등지고 하면 폼 확인이 됩니다'],
    warnings: ['반동을 쓰지 마세요'],
    voiceCoaching: ['뒤로!', '조여주세요!', '내려오세요...'],
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

  {
    id: 'overhead_tricep_ext',
    name: '오버헤드 트라이셉 익스텐션',
    bodyPart: 'arms',
    equipment: 'dumbbell',
    difficulty: 'beginner',
    defaultSets: 3,
    defaultReps: '12',
    restSeconds: 60,
    caloriesPerSet: 5,
    guide: [
      '덤벨 하나를 양손으로 잡고 머리 위로 들어올립니다',
      '팔꿈치를 귀 옆에 고정합니다',
      '팔꿈치를 굽혀 덤벨을 머리 뒤로 천천히 내립니다',
      '삼두근에 힘을 주며 다시 위로 밀어 올립니다',
    ],
    tips: ['팔꿈치가 벌어지지 않게 고정하세요', '삼두근의 긴 머리를 집중 자극합니다'],
    warnings: ['무거운 무게는 팔꿈치에 무리가 갈 수 있습니다'],
    voiceCoaching: ['내려가세요...', '삼두근!', '올리세요!'],
  },
  {
    id: 'concentration_curl',
    name: '컨센트레이션 컬',
    bodyPart: 'arms',
    equipment: 'dumbbell',
    difficulty: 'intermediate',
    defaultSets: 3,
    defaultReps: '10',
    restSeconds: 60,
    caloriesPerSet: 4,
    guide: [
      '의자에 앉아 다리를 넓게 벌립니다',
      '한 손에 덤벨을 잡고 팔꿈치를 허벅지 안쪽에 고정합니다',
      '이두근에 집중하며 덤벨을 어깨 쪽으로 컬합니다',
      '천천히 내리며 한쪽당 세트를 완료합니다',
    ],
    tips: ['고립 운동의 대표 - 이두근 피크(봉우리)를 만드는 데 효과적입니다'],
    warnings: ['반동을 절대 쓰지 마세요'],
    voiceCoaching: ['올리세요!', '조여주세요!', '천천히 내리세요...'],
  },
  {
    id: 'tricep_kickback',
    name: '트라이셉 킥백',
    bodyPart: 'arms',
    equipment: 'dumbbell',
    difficulty: 'beginner',
    defaultSets: 3,
    defaultReps: '12',
    restSeconds: 45,
    caloriesPerSet: 4,
    guide: [
      '한 손과 무릎을 벤치에 올려 상체를 수평으로 만듭니다',
      '반대 손에 덤벨을 잡고 팔꿈치를 90도로 구부립니다',
      '팔꿈치를 고정한 채 팔을 뒤로 쭉 폅니다',
      '삼두근을 조인 후 천천히 되돌립니다',
    ],
    tips: ['팔이 완전히 펴졌을 때 삼두근을 확실히 조이세요', '가벼운 무게로 정확한 폼이 중요합니다'],
    warnings: [],
    voiceCoaching: ['뒤로 펴세요!', '조여주세요!', '돌아오세요...'],
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

  {
    id: 'bulgarian_split_squat',
    name: '불가리안 스플릿 스쿼트',
    bodyPart: 'legs',
    secondaryParts: ['core'],
    equipment: 'bodyweight',
    difficulty: 'intermediate',
    defaultSets: 3,
    defaultReps: '10(각)',
    restSeconds: 90,
    caloriesPerSet: 11,
    guide: [
      '뒤쪽 의자나 벤치에 한쪽 발등을 올려놓습니다',
      '앞쪽 다리로 체중을 지탱하며 서세요',
      '앞쪽 무릎을 굽혀 천천히 내려갑니다',
      '앞쪽 다리 힘으로 밀어 올라옵니다',
    ],
    tips: ['균형이 어려우면 벽을 잡고 하세요', '단측 하체 운동의 왕 - 좌우 불균형 교정에 탁월합니다'],
    warnings: ['앞무릎이 발끝을 넘어가지 않게 주의하세요'],
    voiceCoaching: ['내려가세요!', '깊이!', '올라오세요!', '반대쪽!'],
  },
  {
    id: 'romanian_deadlift',
    name: '루마니안 데드리프트',
    bodyPart: 'legs',
    secondaryParts: ['back', 'core'],
    equipment: 'dumbbell',
    difficulty: 'intermediate',
    defaultSets: 3,
    defaultReps: '10',
    restSeconds: 90,
    caloriesPerSet: 10,
    guide: [
      '양손에 덤벨을 잡고 어깨 너비로 서세요',
      '무릎을 살짝 구부린 상태를 유지합니다',
      '엉덩이를 뒤로 빼며 상체를 앞으로 숙입니다',
      '햄스트링이 늘어나는 느낌이 나면 엉덩이 힘으로 일어납니다',
    ],
    tips: ['등을 항상 곧게 유지하세요', '햄스트링(허벅지 뒤)과 둔근을 집중적으로 단련합니다'],
    warnings: ['허리가 둥글어지면 즉시 중단하세요'],
    voiceCoaching: ['엉덩이 뒤로!', '햄스트링 느끼세요!', '일어나세요!'],
  },
  {
    id: 'glute_bridge',
    name: '글루트 브릿지',
    bodyPart: 'legs',
    secondaryParts: ['core'],
    equipment: 'bodyweight',
    difficulty: 'beginner',
    defaultSets: 3,
    defaultReps: '15',
    restSeconds: 45,
    caloriesPerSet: 6,
    guide: [
      '바닥에 누워 무릎을 세우고 발바닥을 바닥에 붙입니다',
      '양팔은 몸 옆에 편하게 놓습니다',
      '엉덩이를 들어올려 무릎-엉덩이-어깨가 일직선이 되게 합니다',
      '둔근을 조인 후 천천히 내려옵니다',
    ],
    tips: ['둔근 활성화의 기본 운동입니다', '위에서 2초 유지하면 더 효과적입니다'],
    warnings: ['허리로 올리지 말고 엉덩이로 올리세요'],
    voiceCoaching: ['올리세요!', '엉덩이 조여!', '유지!', '내려오세요...'],
  },
  {
    id: 'sumo_squat',
    name: '스모 스쿼트',
    bodyPart: 'legs',
    secondaryParts: ['core'],
    equipment: 'bodyweight',
    difficulty: 'beginner',
    defaultSets: 3,
    defaultReps: '15',
    restSeconds: 60,
    caloriesPerSet: 9,
    guide: [
      '발을 어깨 너비의 2배로 넓게 벌리고 발끝을 바깥으로 돌립니다',
      '가슴을 펴고 상체를 곧게 유지합니다',
      '무릎을 발끝 방향으로 벌리며 앉습니다',
      '허벅지 안쪽에 힘을 주며 일어납니다',
    ],
    tips: ['내전근(허벅지 안쪽)을 효과적으로 자극합니다', '덤벨을 들면 강도를 높일 수 있습니다'],
    warnings: ['무릎이 안쪽으로 모이지 않게 주의하세요'],
    voiceCoaching: ['앉으세요!', '무릎 벌려!', '올라오세요!'],
  },
  {
    id: 'step_up',
    name: '스텝 업',
    bodyPart: 'legs',
    secondaryParts: ['core'],
    equipment: 'bodyweight',
    difficulty: 'beginner',
    defaultSets: 3,
    defaultReps: '12(각)',
    restSeconds: 60,
    caloriesPerSet: 8,
    guide: [
      '의자나 튼튼한 박스 앞에 서세요',
      '한쪽 발을 박스 위에 올려놓습니다',
      '올린 다리 힘으로 온몸을 밀어 올립니다',
      '천천히 내려와 반대쪽을 반복합니다',
    ],
    tips: ['올린 발로만 밀어 올리세요 (아래쪽 발로 반동 금지)', '높이를 조절하여 난이도를 변경할 수 있습니다'],
    warnings: ['지지대가 흔들리지 않는지 확인하세요'],
    voiceCoaching: ['올라가세요!', '한 발로!', '내려오세요...', '반대쪽!'],
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

  {
    id: 'bicycle_crunch',
    name: '바이시클 크런치',
    bodyPart: 'core',
    equipment: 'bodyweight',
    difficulty: 'intermediate',
    defaultSets: 3,
    defaultReps: '20(좌우)',
    restSeconds: 45,
    caloriesPerSet: 7,
    guide: [
      '바닥에 누워 양손을 귀 옆에 가볍게 댑니다',
      '한쪽 무릎을 가슴으로 당기며 반대쪽 팔꿈치를 무릎 쪽으로 비틀어 줍니다',
      '다리를 바꿔가며 자전거 페달 밟듯이 반복합니다',
      '상복부와 복사근을 함께 자극합니다',
    ],
    tips: ['속도보다 정확한 비틀림 동작이 중요합니다', '목을 당기지 말고 복근으로 올리세요'],
    warnings: ['목이 아프면 머리를 바닥에 대고 하세요'],
    voiceCoaching: ['좌! 우!', '비틀어!', '속도 유지!', '좋아요!'],
  },
  {
    id: 'side_plank',
    name: '사이드 플랭크',
    bodyPart: 'core',
    equipment: 'bodyweight',
    difficulty: 'intermediate',
    defaultSets: 3,
    defaultReps: '20초(각)',
    restSeconds: 30,
    caloriesPerSet: 5,
    guide: [
      '옆으로 누워 팔꿈치를 어깨 아래에 놓습니다',
      '엉덩이를 들어올려 머리-엉덩이-발이 일직선이 되게 합니다',
      '복사근(옆구리)에 힘을 주고 유지합니다',
      '정해진 시간 후 반대쪽으로 전환합니다',
    ],
    tips: ['복사근과 허리 안정화에 탁월합니다', '위쪽 팔을 하늘로 뻗으면 더 어렵습니다'],
    warnings: ['어깨에 무리가 가면 무릎을 바닥에 대고 하세요'],
    voiceCoaching: ['버텨요!', '엉덩이 올려!', '조금만 더!', '반대쪽!'],
  },
  {
    id: 'dead_bug',
    name: '데드 버그',
    bodyPart: 'core',
    equipment: 'bodyweight',
    difficulty: 'beginner',
    defaultSets: 3,
    defaultReps: '10(각)',
    restSeconds: 45,
    caloriesPerSet: 5,
    guide: [
      '바닥에 누워 양팔을 천장으로 뻗고 무릎을 90도로 들어올립니다',
      '한쪽 팔과 반대쪽 다리를 동시에 바닥 쪽으로 천천히 내립니다',
      '허리가 바닥에서 뜨지 않도록 코어에 힘을 줍니다',
      '시작 위치로 돌아와 반대쪽을 반복합니다',
    ],
    tips: ['허리 안정화의 핵심 운동입니다', '물리치료사들이 가장 추천하는 코어 운동 중 하나입니다'],
    warnings: ['허리가 바닥에서 뜨면 범위를 줄이세요'],
    voiceCoaching: ['내려가세요...', '허리 붙여!', '돌아오세요!', '반대쪽!'],
  },
  {
    id: 'bird_dog',
    name: '버드 독',
    bodyPart: 'core',
    secondaryParts: ['back'],
    equipment: 'bodyweight',
    difficulty: 'beginner',
    defaultSets: 3,
    defaultReps: '10(각)',
    restSeconds: 30,
    caloriesPerSet: 4,
    guide: [
      '네 발 자세(양손-양무릎)에서 시작합니다',
      '한쪽 팔을 앞으로, 반대쪽 다리를 뒤로 동시에 뻗습니다',
      '팔-등-다리가 일직선이 되게 2초 유지합니다',
      '시작 위치로 돌아와 반대쪽을 반복합니다',
    ],
    tips: ['균형감과 코어 안정성을 동시에 키웁니다', '시선은 바닥을 향하세요'],
    warnings: ['허리가 과도하게 젖혀지지 않게 하세요'],
    voiceCoaching: ['뻗으세요!', '유지!', '돌아오세요!', '반대쪽!'],
  },
  {
    id: 'v_up',
    name: 'V업',
    bodyPart: 'core',
    equipment: 'bodyweight',
    difficulty: 'advanced',
    defaultSets: 3,
    defaultReps: '10',
    restSeconds: 60,
    caloriesPerSet: 8,
    guide: [
      '바닥에 누워 양팔을 머리 위로 쭉 뻗습니다',
      '동시에 상체와 다리를 들어올려 V자를 만듭니다',
      '손끝으로 발끝을 터치합니다',
      '천천히 시작 위치로 돌아옵니다',
    ],
    tips: ['상·하복부를 동시에 강하게 자극합니다', '못하면 무릎을 구부려서 변형 동작으로 하세요'],
    warnings: ['허리 통증 시 중단하고 크런치로 대체하세요'],
    voiceCoaching: ['올리세요!', 'V자!', '터치!', '내려오세요...'],
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
  {
    id: 'skater_jump',
    name: '스케이터 점프',
    bodyPart: 'cardio',
    secondaryParts: ['legs'],
    equipment: 'bodyweight',
    difficulty: 'intermediate',
    defaultSets: 3,
    defaultReps: '30초',
    restSeconds: 45,
    caloriesPerSet: 10,
    guide: [
      '한쪽 다리로 서서 반대쪽 다리를 뒤로 교차시킵니다',
      '옆으로 크게 점프하며 반대 다리로 착지합니다',
      '착지 시 무릎을 살짝 굽혀 충격을 흡수합니다',
      '스케이트 타듯 좌우로 반복합니다',
    ],
    tips: ['유산소와 하체 근력을 동시에 키울 수 있습니다', '균형 감각이 향상됩니다'],
    warnings: ['미끄러운 바닥에서는 하지 마세요'],
    voiceCoaching: ['좌!', '우!', '크게 점프!', '리듬!'],
  },
  {
    id: 'shadow_boxing',
    name: '섀도 복싱',
    bodyPart: 'cardio',
    secondaryParts: ['arms', 'shoulder', 'core'],
    equipment: 'bodyweight',
    difficulty: 'beginner',
    defaultSets: 3,
    defaultReps: '1분',
    restSeconds: 30,
    caloriesPerSet: 12,
    guide: [
      '파이팅 자세로 서세요 (한 발 앞, 주먹 올림)',
      '잽-크로스-훅을 조합하여 허공에 펀치합니다',
      '발을 계속 움직이며 스텝을 밟습니다',
      '상체를 좌우로 움직이며 실전처럼 합니다',
    ],
    tips: ['전신 유산소이자 스트레스 해소에 최고입니다', '팔만 쓰지 말고 허리 회전으로 힘을 내세요'],
    warnings: ['팔꿈치를 완전히 펴지 말고 약간 여유를 두세요'],
    voiceCoaching: ['잽! 잽!', '크로스!', '훅!', '계속 움직여!'],
  },
  {
    id: 'bear_crawl',
    name: '베어 크롤',
    bodyPart: 'cardio',
    secondaryParts: ['core', 'shoulder', 'arms'],
    equipment: 'bodyweight',
    difficulty: 'intermediate',
    defaultSets: 3,
    defaultReps: '30초',
    restSeconds: 60,
    caloriesPerSet: 10,
    guide: [
      '네 발 자세에서 무릎을 바닥에서 살짝 들어올립니다',
      '오른손-왼발을 동시에 앞으로, 왼손-오른발을 동시에 앞으로 이동합니다',
      '엉덩이를 낮게 유지하며 앞으로 기어갑니다',
      '뒤로도 이동해 봅니다',
    ],
    tips: ['전신 협응력과 코어 안정성을 동시에 키웁니다', '천천히 정확하게 하는 것이 핵심입니다'],
    warnings: ['손목이 아프면 쉬세요', '공간이 충분한 곳에서 하세요'],
    voiceCoaching: ['기어가세요!', '엉덩이 낮게!', '뒤로!', '좋아요!'],
  },

  // ===== 가슴 - 웨이트 (Chest - Weight) =====
  {
    id: 'barbell_bench_press',
    name: '바벨 벤치프레스',
    bodyPart: 'chest',
    secondaryParts: ['arms', 'shoulder'],
    equipment: 'barbell',
    difficulty: 'intermediate',
    defaultSets: 4,
    defaultReps: '8',
    restSeconds: 90,
    caloriesPerSet: 14,
    guide: [
      '벤치에 눕고 양발을 바닥에 붙입니다. 등 자연스럽게 아치를 만듭니다',
      '어깨 너비보다 약간 넓게 바벨을 잡습니다 (오버그립)',
      '바벨을 랙에서 들어 가슴 위로 가져옵니다',
      '팔꿈치를 45~75도 각도로 유지하며 가슴 중앙으로 내립니다',
      '가슴에 닿으면 폭발적으로 밀어올립니다',
    ],
    tips: [
      '견갑골(날개뼈)을 뒤로 모으고 아래로 당겨 고정하세요',
      '발로 바닥을 밀어내듯이 밀면 더 큰 힘이 나옵니다',
      '호흡: 내릴 때 들이쉬고, 밀어올릴 때 내쉽니다',
    ],
    warnings: ['혼자 할 때는 스포터(보조자)를 두거나 세이프티 바를 설정하세요', '과도한 허리 아치는 부상 위험이 있습니다'],
    voiceCoaching: ['내리세요! 천천히!', '올려! 힘차게!', '가슴에 닿게!', '강하게!'],
  },
  {
    id: 'incline_barbell_press',
    name: '인클라인 바벨 벤치프레스',
    bodyPart: 'chest',
    secondaryParts: ['shoulder', 'arms'],
    equipment: 'barbell',
    difficulty: 'intermediate',
    defaultSets: 4,
    defaultReps: '8',
    restSeconds: 90,
    caloriesPerSet: 13,
    guide: [
      '인클라인 벤치를 30~45도로 조절하고 눕습니다',
      '어깨 너비보다 약간 넓게 바벨을 잡습니다',
      '바벨을 쇄골 아래 상부 가슴으로 내립니다',
      '가슴 상부를 수축하며 밀어올립니다',
    ],
    tips: [
      '각도가 너무 높으면 어깨 운동이 됩니다. 30~45도가 최적입니다',
      '상부 가슴을 의식하며 동작하세요',
    ],
    warnings: ['어깨 부상이 있다면 각도를 낮추거나 생략하세요'],
    voiceCoaching: ['상부 가슴!', '밀어올려!', '각도 유지!', '좋아요!'],
  },
  {
    id: 'cable_fly',
    name: '케이블 플라이',
    bodyPart: 'chest',
    secondaryParts: ['shoulder'],
    equipment: 'cable',
    difficulty: 'intermediate',
    defaultSets: 3,
    defaultReps: '12',
    restSeconds: 60,
    caloriesPerSet: 10,
    guide: [
      '케이블 머신 양쪽 풀리를 가슴 높이로 설정합니다',
      '양손에 핸들을 잡고 한 발 앞으로 나서서 균형을 잡습니다',
      '팔꿈치를 살짝 구부린 채로 가슴 앞에서 양손을 모읍니다',
      '가슴이 최대로 수축될 때까지 모은 뒤 천천히 돌아옵니다',
    ],
    tips: [
      '팔꿈치 각도를 일정하게 유지하세요 — 움직이는 것은 어깨 관절만입니다',
      '가슴 근육을 "껴안는" 느낌으로 동작하세요',
    ],
    warnings: ['어깨가 앞으로 말리지 않도록 주의하세요'],
    voiceCoaching: ['모아요!', '가슴 수축!', '천천히 열어!', '그 느낌!'],
  },
  {
    id: 'pec_deck',
    name: '펙 덱 플라이',
    bodyPart: 'chest',
    secondaryParts: [],
    equipment: 'machine',
    difficulty: 'beginner',
    defaultSets: 3,
    defaultReps: '12',
    restSeconds: 60,
    caloriesPerSet: 9,
    guide: [
      '시트 높이를 조절해 팔꿈치가 어깨 높이에 오게 합니다',
      '양팔을 패드에 올리고 가슴을 핀 모양으로 열어 시작합니다',
      '팔꿈치로 패드를 밀어 가슴 앞에서 모읍니다',
      '천천히 처음 자세로 돌아갑니다',
    ],
    tips: ['등 전체를 등받이에 붙이고 유지하세요', '가슴 근육만 사용하도록 집중하세요'],
    warnings: ['어깨가 앞으로 나오면 무게를 줄이세요'],
    voiceCoaching: ['가슴으로 눌러!', '수축!', '천천히!', '집중!'],
  },
  {
    id: 'machine_chest_press',
    name: '머신 체스트 프레스',
    bodyPart: 'chest',
    secondaryParts: ['arms', 'shoulder'],
    equipment: 'machine',
    difficulty: 'beginner',
    defaultSets: 3,
    defaultReps: '12',
    restSeconds: 60,
    caloriesPerSet: 11,
    guide: [
      '시트와 핸들 높이를 가슴 중앙에 맞게 조절합니다',
      '등을 등받이에 붙이고 핸들을 어깨 너비로 잡습니다',
      '핸들을 앞으로 밀어 팔이 거의 완전히 펴질 때까지 민 뒤 천천히 돌아옵니다',
    ],
    tips: ['초보자에게 안전하며 가슴 고립에 효과적입니다', '완전히 수축될 때까지 미세요'],
    warnings: ['어깨를 들어올리지 마세요'],
    voiceCoaching: ['밀어요!', '완전히!', '가슴 조여!', '좋아요!'],
  },
  {
    id: 'chest_dips',
    name: '체스트 딥스',
    bodyPart: 'chest',
    secondaryParts: ['arms', 'shoulder'],
    equipment: 'bodyweight',
    difficulty: 'intermediate',
    defaultSets: 3,
    defaultReps: '10',
    restSeconds: 75,
    caloriesPerSet: 12,
    guide: [
      '딥바를 잡고 팔을 뻗어 몸을 들어올립니다',
      '가슴을 앞으로 기울이고 팔꿈치를 바깥쪽으로 열면서 내려갑니다',
      '팔꿈치가 90도가 될 때까지 내려갑니다',
      '가슴과 삼두로 밀어 올라옵니다',
    ],
    tips: ['몸을 앞으로 기울일수록 가슴에 자극이 집중됩니다', '너무 깊이 내려가면 어깨 부담이 커집니다'],
    warnings: ['어깨 부상이 있다면 주의하세요', '처음에는 보조 밴드를 사용하세요'],
    voiceCoaching: ['내려가요!', '올라와!', '가슴 느끼며!', '강하게!'],
  },

  // ===== 등 - 웨이트 (Back - Weight) =====
  {
    id: 'barbell_deadlift',
    name: '바벨 데드리프트',
    bodyPart: 'back',
    secondaryParts: ['legs', 'core'],
    equipment: 'barbell',
    difficulty: 'advanced',
    defaultSets: 4,
    defaultReps: '5',
    restSeconds: 120,
    caloriesPerSet: 20,
    guide: [
      '발을 어깨 너비로 벌리고 바벨 바가 발 중앙 위에 오게 섭니다',
      '엉덩이를 뒤로 빼며 앉아 바벨을 어깨 너비로 잡습니다',
      '등을 곧게 펴고 가슴을 들어올립니다 (일자 등)',
      '다리로 바닥을 밀어내며 동시에 엉덩이를 앞으로 밀어 서있는 자세로 올라옵니다',
      '천천히 엉덩이부터 뒤로 빼며 바벨을 내립니다',
    ],
    tips: [
      '등이 둥글어지면 즉시 중단하세요 — 허리 디스크 부상의 주요 원인입니다',
      '바벨은 항상 몸에 가깝게 유지하세요 (정강이를 스치듯)',
      '호흡: 들어올리기 전 크게 들이쉬고 복압을 유지하며 올라갑니다',
    ],
    warnings: ['허리가 둥글어지면 즉시 중단하세요', '처음에는 가벼운 무게로 자세를 익히세요', '무거운 무게 시 벨트를 착용하세요'],
    voiceCoaching: ['등 펴요!', '다리로 밀어!', '천천히 내려!', '복압 유지!'],
  },
  {
    id: 'barbell_bent_row',
    name: '바벨 벤트오버 로우',
    bodyPart: 'back',
    secondaryParts: ['arms', 'core'],
    equipment: 'barbell',
    difficulty: 'intermediate',
    defaultSets: 4,
    defaultReps: '8',
    restSeconds: 90,
    caloriesPerSet: 15,
    guide: [
      '어깨 너비로 바벨을 잡고 무릎을 살짝 굽히며 상체를 45도 앞으로 숙입니다',
      '등을 곧게 유지한 채 바벨을 배꼽 쪽으로 당깁니다',
      '팔꿈치를 뒤로 당기며 등 근육을 최대로 수축합니다',
      '천천히 팔을 뻗어 내립니다',
    ],
    tips: [
      '팔로 당기지 말고 등으로 당기는 느낌으로 하세요',
      '상체가 너무 일어서지 않도록 각도를 유지하세요',
    ],
    warnings: ['허리가 굽지 않도록 코어를 항상 긴장하세요'],
    voiceCoaching: ['등으로 당겨!', '팔꿈치 뒤로!', '수축!', '천천히 내려!'],
  },
  {
    id: 'lat_pulldown',
    name: '랫 풀다운',
    bodyPart: 'back',
    secondaryParts: ['arms'],
    equipment: 'machine',
    difficulty: 'beginner',
    defaultSets: 4,
    defaultReps: '10',
    restSeconds: 75,
    caloriesPerSet: 12,
    guide: [
      '무릎 패드에 허벅지를 고정하고 어깨 너비보다 넓게 바를 잡습니다',
      '가슴을 약간 들고 등 상부를 살짝 뒤로 기울입니다',
      '팔꿈치를 아래로 당기며 바를 쇄골 위로 내립니다',
      '등근육을 수축시킨 채로 1초 유지 후 천천히 올립니다',
    ],
    tips: ['팔이 아닌 광배근(날개 근육)으로 당기세요', '바가 뒷목으로 오면 어깨 부상 위험 — 항상 앞으로'],
    warnings: ['뒷목으로 당기지 마세요'],
    voiceCoaching: ['광배근!', '당겨!', '수축!', '천천히 위로!'],
  },
  {
    id: 'seated_cable_row',
    name: '시티드 케이블 로우',
    bodyPart: 'back',
    secondaryParts: ['arms'],
    equipment: 'cable',
    difficulty: 'beginner',
    defaultSets: 4,
    defaultReps: '10',
    restSeconds: 75,
    caloriesPerSet: 11,
    guide: [
      '케이블 머신 앞에 앉아 발을 발판에 올리고 핸들을 잡습니다',
      '상체를 약간 앞으로 기울이며 팔을 앞으로 뻗어 시작합니다',
      '상체를 세우며 핸들을 배꼽 쪽으로 당깁니다',
      '등 근육이 수축될 때 1초 유지 후 천천히 돌아옵니다',
    ],
    tips: ['당길 때 팔꿈치가 몸에 붙도록 하세요', '상체가 너무 많이 움직이지 않도록 하세요'],
    warnings: ['허리로 동작하지 마세요 — 등 근육만 사용하세요'],
    voiceCoaching: ['당겨!', '배꼽으로!', '등 수축!', '천천히!'],
  },
  {
    id: 'face_pull',
    name: '페이스 풀',
    bodyPart: 'shoulder',
    secondaryParts: ['back'],
    equipment: 'cable',
    difficulty: 'beginner',
    defaultSets: 3,
    defaultReps: '15',
    restSeconds: 60,
    caloriesPerSet: 8,
    guide: [
      '케이블 풀리를 눈 높이로 설정하고 로프 핸들을 잡습니다',
      '한 발 뒤로 물러서서 양손을 뻗어 시작합니다',
      '로프를 얼굴 쪽으로 당기며 팔꿈치를 바깥과 위로 벌립니다',
      '리어 델트와 상부 등이 수축되면 1초 유지 후 돌아옵니다',
    ],
    tips: ['어깨 건강에 매우 좋은 운동입니다', '팔꿈치가 어깨보다 높아야 합니다'],
    warnings: ['무게보다 자세에 집중하세요'],
    voiceCoaching: ['얼굴로!', '팔꿈치 위로!', '수축!', '유지!'],
  },
  {
    id: 'hyperextension',
    name: '하이퍼익스텐션',
    bodyPart: 'back',
    secondaryParts: ['legs', 'core'],
    equipment: 'machine',
    difficulty: 'beginner',
    defaultSets: 3,
    defaultReps: '15',
    restSeconds: 60,
    caloriesPerSet: 9,
    guide: [
      '하이퍼익스텐션 벤치에 엎드려 발을 고정합니다',
      '팔을 가슴에 모으거나 머리 뒤에 놓습니다',
      '상체를 천천히 아래로 내립니다',
      '허리 근육으로 상체를 들어 몸이 일직선이 될 때까지 올립니다',
    ],
    tips: ['과도하게 위로 올리면 허리 과신전 — 일직선까지만 올리세요', '코어를 함께 긴장하세요'],
    warnings: ['허리 통증이 있다면 하지 마세요'],
    voiceCoaching: ['올려!', '허리 펴요!', '일직선!', '내려요!'],
  },
  {
    id: 'cable_pullover',
    name: '케이블 풀오버',
    bodyPart: 'back',
    secondaryParts: ['chest'],
    equipment: 'cable',
    difficulty: 'intermediate',
    defaultSets: 3,
    defaultReps: '12',
    restSeconds: 60,
    caloriesPerSet: 10,
    guide: [
      '케이블 머신 앞에 서서 위쪽 풀리의 핸들을 잡습니다',
      '팔을 쭉 뻗고 상체를 앞으로 기울입니다',
      '팔꿈치를 살짝 구부린 채 핸들을 허벅지까지 당깁니다',
      '광배근이 수축될 때 잠시 유지 후 천천히 올립니다',
    ],
    tips: ['광배근을 스트레칭하고 수축하는 느낌에 집중하세요'],
    warnings: ['어깨 유연성이 부족하면 범위를 줄이세요'],
    voiceCoaching: ['광배근!', '허벅지까지!', '수축!', '천천히 위로!'],
  },

  // ===== 어깨 - 웨이트 (Shoulder - Weight) =====
  {
    id: 'barbell_ohp',
    name: '바벨 오버헤드 프레스',
    bodyPart: 'shoulder',
    secondaryParts: ['arms', 'core'],
    equipment: 'barbell',
    difficulty: 'intermediate',
    defaultSets: 4,
    defaultReps: '8',
    restSeconds: 90,
    caloriesPerSet: 14,
    guide: [
      '서서 또는 앉아서 바벨을 쇄골 위에 올려놓습니다',
      '어깨 너비로 바벨을 잡고 팔꿈치를 앞으로 향합니다',
      '바벨을 머리 위로 수직으로 밀어올립니다',
      '팔이 완전히 펴질 때까지 밀고 천천히 내립니다',
    ],
    tips: ['코어를 단단히 조여 허리가 과신전되지 않게 하세요', '바벨이 얼굴 앞에서 직선으로 움직여야 합니다'],
    warnings: ['허리를 과도하게 젖히지 마세요', '어깨 워밍업 후 실시하세요'],
    voiceCoaching: ['밀어올려!', '팔 완전히!', '코어 유지!', '내려요!'],
  },
  {
    id: 'machine_shoulder_press',
    name: '머신 숄더프레스',
    bodyPart: 'shoulder',
    secondaryParts: ['arms'],
    equipment: 'machine',
    difficulty: 'beginner',
    defaultSets: 3,
    defaultReps: '12',
    restSeconds: 60,
    caloriesPerSet: 11,
    guide: [
      '시트를 조절해 핸들이 어깨 높이에 오게 합니다',
      '등을 등받이에 붙이고 핸들을 잡습니다',
      '팔이 완전히 펴질 때까지 밀어올립니다',
      '천천히 어깨 높이까지 내립니다',
    ],
    tips: ['초보자에게 안전하고 효과적입니다', '허리를 들지 말고 등을 붙이세요'],
    warnings: ['어깨 위로 너무 올리지 마세요'],
    voiceCoaching: ['밀어!', '위로!', '완전히!', '내려요!'],
  },
  {
    id: 'barbell_shrug',
    name: '바벨 슈러그',
    bodyPart: 'shoulder',
    secondaryParts: ['back'],
    equipment: 'barbell',
    difficulty: 'beginner',
    defaultSets: 3,
    defaultReps: '15',
    restSeconds: 60,
    caloriesPerSet: 9,
    guide: [
      '어깨 너비로 바벨을 잡고 팔을 쭉 뻗어 허벅지 앞에 놓습니다',
      '어깨를 귀 쪽으로 최대한 올립니다',
      '1~2초 수축 후 천천히 내립니다',
    ],
    tips: ['어깨를 돌리지 말고 위아래로만 움직이세요', '승모근 수축에 집중하세요'],
    warnings: ['목을 앞으로 내밀지 마세요'],
    voiceCoaching: ['어깨 올려!', '수축!', '내려요!', '승모근!'],
  },
  {
    id: 'upright_row',
    name: '업라이트 로우',
    bodyPart: 'shoulder',
    secondaryParts: ['arms', 'back'],
    equipment: 'barbell',
    difficulty: 'intermediate',
    defaultSets: 3,
    defaultReps: '12',
    restSeconds: 60,
    caloriesPerSet: 10,
    guide: [
      '어깨 너비보다 좁게 바벨을 잡고 허벅지 앞에 놓습니다',
      '팔꿈치가 바벨보다 높이 올라오도록 턱 쪽으로 당깁니다',
      '팔꿈치가 어깨 높이에 오면 1초 유지 후 내립니다',
    ],
    tips: ['팔꿈치가 항상 바벨보다 높아야 합니다'],
    warnings: ['어깨 충돌증후군이 있는 경우 피하세요', '너무 좁게 잡으면 어깨에 부담이 큽니다'],
    voiceCoaching: ['팔꿈치 위로!', '턱까지!', '내려요!', '어깨 수축!'],
  },
  {
    id: 'cable_lateral_raise',
    name: '케이블 사이드 레터럴 레이즈',
    bodyPart: 'shoulder',
    secondaryParts: [],
    equipment: 'cable',
    difficulty: 'beginner',
    defaultSets: 3,
    defaultReps: '15',
    restSeconds: 60,
    caloriesPerSet: 7,
    guide: [
      '케이블 머신 옆에 서서 아래 풀리의 핸들을 몸 반대편 손으로 잡습니다',
      '팔꿈치를 살짝 구부린 채 팔을 옆으로 들어올립니다',
      '어깨 높이까지 올린 뒤 천천히 내립니다',
    ],
    tips: ['덤벨보다 지속적인 장력이 가해져 효과적입니다', '어깨를 들어올리지 마세요'],
    warnings: ['무게보다 자세가 중요합니다'],
    voiceCoaching: ['옆으로!', '어깨 높이!', '천천히!', '수축!'],
  },

  // ===== 팔 - 웨이트 (Arms - Weight) =====
  {
    id: 'barbell_curl',
    name: '바벨 컬',
    bodyPart: 'arms',
    secondaryParts: [],
    equipment: 'barbell',
    difficulty: 'beginner',
    defaultSets: 3,
    defaultReps: '10',
    restSeconds: 60,
    caloriesPerSet: 9,
    guide: [
      '어깨 너비로 바벨을 언더그립으로 잡습니다',
      '팔꿈치를 몸통에 고정하고 바벨을 어깨 쪽으로 올립니다',
      '이두근이 완전히 수축될 때 1초 유지합니다',
      '천천히 시작 자세로 내립니다',
    ],
    tips: ['팔꿈치를 앞뒤로 흔들지 마세요', '손목을 중립으로 유지하세요'],
    warnings: ['과도한 반동을 사용하지 마세요'],
    voiceCoaching: ['올려!', '이두 수축!', '천천히 내려!', '팔꿈치 고정!'],
  },
  {
    id: 'ez_bar_curl',
    name: 'EZ바 컬',
    bodyPart: 'arms',
    secondaryParts: [],
    equipment: 'barbell',
    difficulty: 'beginner',
    defaultSets: 3,
    defaultReps: '10',
    restSeconds: 60,
    caloriesPerSet: 9,
    guide: [
      'EZ바의 구부러진 부분에 손을 올려 언더그립으로 잡습니다',
      '팔꿈치를 고정하고 바를 어깨 쪽으로 올립니다',
      '이두근 수축 시 1초 유지 후 천천히 내립니다',
    ],
    tips: ['손목에 가해지는 부담이 바벨 컬보다 적어 편합니다', '이두근 고립에 효과적입니다'],
    warnings: ['팔꿈치를 들지 마세요'],
    voiceCoaching: ['올려!', '수축!', '내려!', '팔꿈치 고정!'],
  },
  {
    id: 'preacher_curl',
    name: '프리처 컬',
    bodyPart: 'arms',
    secondaryParts: [],
    equipment: 'machine',
    difficulty: 'intermediate',
    defaultSets: 3,
    defaultReps: '10',
    restSeconds: 60,
    caloriesPerSet: 8,
    guide: [
      '프리처 컬 벤치에 팔을 올리고 덤벨 또는 바벨을 잡습니다',
      '상완을 패드에 완전히 밀착시킵니다',
      '팔꿈치를 굽혀 무게를 어깨 쪽으로 올립니다',
      '최대 수축 후 천천히 내립니다',
    ],
    tips: ['상완이 패드에서 떨어지면 의미가 없습니다', '이두근 하부까지 완전히 스트레칭하세요'],
    warnings: ['팔꿈치를 완전히 펴면 관절에 무리가 올 수 있습니다 — 약간 여유를 두세요'],
    voiceCoaching: ['올려!', '수축!', '천천히 내려!', '패드 붙여!'],
  },
  {
    id: 'cable_curl',
    name: '케이블 컬',
    bodyPart: 'arms',
    secondaryParts: [],
    equipment: 'cable',
    difficulty: 'beginner',
    defaultSets: 3,
    defaultReps: '12',
    restSeconds: 60,
    caloriesPerSet: 8,
    guide: [
      '케이블 머신 아래 풀리에 바 또는 로프를 연결합니다',
      '팔꿈치를 고정하고 언더그립으로 당겨 올립니다',
      '이두근 수축 시 1초 유지 후 천천히 내립니다',
    ],
    tips: ['지속적인 장력이 이두근에 유리합니다'],
    warnings: ['팔꿈치를 앞으로 들지 마세요'],
    voiceCoaching: ['당겨!', '수축!', '천천히!', '집중!'],
  },
  {
    id: 'skull_crusher',
    name: '스컬 크러셔',
    bodyPart: 'arms',
    secondaryParts: [],
    equipment: 'barbell',
    difficulty: 'intermediate',
    defaultSets: 3,
    defaultReps: '10',
    restSeconds: 75,
    caloriesPerSet: 9,
    guide: [
      '벤치에 누워 EZ바 또는 바벨을 어깨 너비로 잡습니다',
      '팔을 수직으로 들어올린 후 팔꿈치를 고정합니다',
      '팔꿈치만 구부려 바벨을 이마 위로 내립니다',
      '삼두근으로 밀어올려 시작 자세로 돌아옵니다',
    ],
    tips: ['팔꿈치가 바깥으로 벌어지지 않게 하세요', '천천히 내리는 것이 중요합니다'],
    warnings: ['무게가 이마에 닿을 수 있으니 집중하세요', '무거운 무게에서 스포터를 세우세요'],
    voiceCoaching: ['내려요!', '팔꿈치 고정!', '올려!', '삼두!'],
  },
  {
    id: 'close_grip_bench',
    name: '클로즈그립 벤치프레스',
    bodyPart: 'arms',
    secondaryParts: ['chest', 'shoulder'],
    equipment: 'barbell',
    difficulty: 'intermediate',
    defaultSets: 3,
    defaultReps: '10',
    restSeconds: 75,
    caloriesPerSet: 12,
    guide: [
      '벤치에 누워 어깨 너비 또는 그보다 좁게 바벨을 잡습니다',
      '팔꿈치를 몸 옆에 붙이며 바벨을 가슴으로 내립니다',
      '삼두근으로 밀어올립니다',
    ],
    tips: ['팔꿈치가 몸통 가까이 유지되어야 삼두에 집중됩니다'],
    warnings: ['손목이 꺾이지 않도록 주의하세요'],
    voiceCoaching: ['내려요!', '팔꿈치 붙여!', '삼두로 밀어!', '올려!'],
  },
  {
    id: 'cable_tricep_pushdown',
    name: '케이블 트라이셉 푸시다운',
    bodyPart: 'arms',
    secondaryParts: [],
    equipment: 'cable',
    difficulty: 'beginner',
    defaultSets: 3,
    defaultReps: '12',
    restSeconds: 60,
    caloriesPerSet: 8,
    guide: [
      '케이블 머신 위 풀리에 바 또는 로프를 연결합니다',
      '팔꿈치를 옆구리에 고정하고 핸들을 잡습니다',
      '팔꿈치만 펴며 아래로 밀어내립니다',
      '삼두근이 완전히 수축될 때 1초 유지 후 천천히 돌아옵니다',
    ],
    tips: ['팔꿈치가 움직이지 않아야 삼두에 고립됩니다', '로프를 사용하면 더 완전히 수축됩니다'],
    warnings: ['손목을 꺾지 마세요'],
    voiceCoaching: ['내려요!', '삼두 수축!', '천천히!', '팔꿈치 고정!'],
  },
  {
    id: 'reverse_curl',
    name: '리버스 컬',
    bodyPart: 'arms',
    secondaryParts: [],
    equipment: 'barbell',
    difficulty: 'beginner',
    defaultSets: 3,
    defaultReps: '12',
    restSeconds: 60,
    caloriesPerSet: 7,
    guide: [
      '바벨을 오버그립(손등이 위)으로 잡습니다',
      '팔꿈치를 고정하고 바벨을 어깨 쪽으로 올립니다',
      '완전히 올렸다가 천천히 내립니다',
    ],
    tips: ['전완근(brachioradialis)을 강화하는 데 효과적입니다'],
    warnings: ['손목이 꺾이지 않도록 중립을 유지하세요'],
    voiceCoaching: ['올려!', '전완근!', '천천히!', '손등 위!'],
  },

  // ===== 하체 - 웨이트 (Legs - Weight) =====
  {
    id: 'barbell_squat',
    name: '바벨 스쿼트',
    bodyPart: 'legs',
    secondaryParts: ['core', 'back'],
    equipment: 'barbell',
    difficulty: 'intermediate',
    defaultSets: 4,
    defaultReps: '8',
    restSeconds: 120,
    caloriesPerSet: 18,
    guide: [
      '스쿼트 랙에서 바벨을 어깨 위 승모근에 얹습니다',
      '발을 어깨 너비로 벌리고 발끝을 15~30도 바깥으로 향합니다',
      '가슴을 들고 등을 곧게 유지하며 엉덩이를 뒤아래로 내립니다',
      '허벅지가 바닥과 평행해질 때까지 내려갑니다',
      '발뒤꿈치로 바닥을 밀어내며 일어납니다',
    ],
    tips: [
      '무릎이 발끝 방향을 따라 움직여야 합니다 (안으로 쏠리지 않게)',
      '등을 항상 일직선으로 유지하세요',
      '호흡: 내려갈 때 들이쉬고, 올라올 때 내쉽니다',
    ],
    warnings: ['무릎이 안쪽으로 쏠리면 즉시 중단', '처음에는 빈 바로 자세부터 익히세요', '무거운 무게는 스포터 필요'],
    voiceCoaching: ['내려가요!', '엉덩이 뒤로!', '올라와!', '무릎 밖으로!'],
  },
  {
    id: 'leg_press',
    name: '레그 프레스',
    bodyPart: 'legs',
    secondaryParts: ['core'],
    equipment: 'machine',
    difficulty: 'beginner',
    defaultSets: 4,
    defaultReps: '10',
    restSeconds: 90,
    caloriesPerSet: 15,
    guide: [
      '시트에 앉아 발을 어깨 너비로 플레이트 위에 올립니다',
      '세이프티 바를 풀고 무릎을 굽혀 플레이트를 내립니다',
      '무릎이 90도가 될 때까지 내립니다',
      '발뒤꿈치로 밀어올려 처음 자세로 돌아옵니다',
    ],
    tips: ['발 위치를 높이 놓으면 둔근, 낮게 놓으면 대퇴사두에 자극이 집중됩니다', '무릎을 완전히 펴지 마세요 (관절 보호)'],
    warnings: ['세이프티 바를 반드시 잠그고 시작하세요', '허리를 등받이에서 떼지 마세요'],
    voiceCoaching: ['내려요!', '밀어!', '다리로!', '무릎 조심!'],
  },
  {
    id: 'leg_extension',
    name: '레그 익스텐션',
    bodyPart: 'legs',
    secondaryParts: [],
    equipment: 'machine',
    difficulty: 'beginner',
    defaultSets: 3,
    defaultReps: '12',
    restSeconds: 60,
    caloriesPerSet: 10,
    guide: [
      '레그 익스텐션 머신에 앉아 발 패드를 발목 위에 올립니다',
      '대퇴사두를 수축하며 다리를 완전히 폅니다',
      '1초 유지 후 천천히 내립니다',
    ],
    tips: ['대퇴사두 고립 운동으로 무릎 건강에도 좋습니다', '완전히 펴야 효과가 극대화됩니다'],
    warnings: ['무릎 부상이 있는 경우 가벼운 무게로 하세요'],
    voiceCoaching: ['펴요!', '대퇴사두!', '수축!', '천천히 내려!'],
  },
  {
    id: 'leg_curl',
    name: '레그 컬',
    bodyPart: 'legs',
    secondaryParts: [],
    equipment: 'machine',
    difficulty: 'beginner',
    defaultSets: 3,
    defaultReps: '12',
    restSeconds: 60,
    caloriesPerSet: 10,
    guide: [
      '레그 컬 머신에 엎드려 발 패드를 발목 위에 올립니다',
      '허벅지 뒤쪽(햄스트링)을 수축하며 발뒤꿈치를 엉덩이 쪽으로 당깁니다',
      '최대 수축 시 1초 유지 후 천천히 내립니다',
    ],
    tips: ['햄스트링은 대퇴사두보다 약한 경우가 많아 집중 운동이 필요합니다'],
    warnings: ['과도하게 엉덩이를 들지 마세요'],
    voiceCoaching: ['당겨요!', '햄스트링!', '수축!', '천천히!'],
  },
  {
    id: 'hip_thrust',
    name: '힙 쓰러스트',
    bodyPart: 'legs',
    secondaryParts: ['core'],
    equipment: 'barbell',
    difficulty: 'intermediate',
    defaultSets: 4,
    defaultReps: '12',
    restSeconds: 75,
    caloriesPerSet: 13,
    guide: [
      '벤치에 상부 등을 기대고 바벨을 골반 위에 올립니다',
      '무릎을 90도로 구부리고 발을 바닥에 붙입니다',
      '둔근을 수축하며 엉덩이를 위로 들어올립니다',
      '몸이 일직선이 될 때 1~2초 수축 후 내립니다',
    ],
    tips: ['둔근을 최대로 쥐어짜는 느낌으로 올리세요', '발뒤꿈치로 바닥을 밀어내세요'],
    warnings: ['바벨 아래 패드를 사용하면 골반 불편함을 줄일 수 있습니다'],
    voiceCoaching: ['엉덩이 위로!', '둔근 수축!', '일직선!', '내려요!'],
  },
  {
    id: 'hack_squat',
    name: '핵 스쿼트',
    bodyPart: 'legs',
    secondaryParts: ['core'],
    equipment: 'machine',
    difficulty: 'intermediate',
    defaultSets: 4,
    defaultReps: '10',
    restSeconds: 90,
    caloriesPerSet: 16,
    guide: [
      '핵 스쿼트 머신에 등을 기대고 발을 어깨 너비로 플레이트에 올립니다',
      '세이프티를 풀고 무릎을 굽혀 내려갑니다',
      '허벅지가 바닥과 평행하거나 더 낮아질 때까지 내려갑니다',
      '발뒤꿈치로 밀어 올라옵니다',
    ],
    tips: ['바벨 스쿼트보다 허리 부담이 적습니다', '발 위치로 자극 부위를 조절할 수 있습니다'],
    warnings: ['무릎이 안으로 쏠리지 않도록 주의'],
    voiceCoaching: ['내려요!', '밀어!', '대퇴사두!', '올라와!'],
  },
  {
    id: 'barbell_rdl',
    name: '바벨 루마니안 데드리프트',
    bodyPart: 'legs',
    secondaryParts: ['back', 'core'],
    equipment: 'barbell',
    difficulty: 'intermediate',
    defaultSets: 4,
    defaultReps: '10',
    restSeconds: 90,
    caloriesPerSet: 14,
    guide: [
      '어깨 너비로 바벨을 잡고 서있습니다',
      '무릎을 살짝 구부린 채로 고정하고 엉덩이를 뒤로 밀며 상체를 앞으로 숙입니다',
      '바벨을 허벅지를 따라 내리며 햄스트링이 당기는 것을 느낍니다',
      '엉덩이를 앞으로 밀며 상체를 올립니다',
    ],
    tips: ['등을 항상 일직선으로 유지하세요', '바벨이 몸에서 멀어지지 않도록 하세요'],
    warnings: ['허리를 굽히지 마세요'],
    voiceCoaching: ['엉덩이 뒤로!', '등 일직선!', '햄스트링 느껴요!', '올라와!'],
  },
  {
    id: 'db_walking_lunge',
    name: '덤벨 워킹 런지',
    bodyPart: 'legs',
    secondaryParts: ['core', 'shoulder'],
    equipment: 'dumbbell',
    difficulty: 'intermediate',
    defaultSets: 3,
    defaultReps: '20',
    restSeconds: 75,
    caloriesPerSet: 13,
    guide: [
      '양손에 덤벨을 들고 곧게 섭니다',
      '한 발을 앞으로 내딛으며 앞 무릎이 90도가 될 때까지 내려갑니다',
      '앞발로 밀어 일어나며 뒷발을 앞으로 내딛습니다',
      '계속 전진하며 반복합니다',
    ],
    tips: ['상체를 곧게 유지하세요', '앞 무릎이 발끝을 넘어가지 않도록 하세요'],
    warnings: ['공간이 충분한 곳에서 실시하세요', '무릎이 안으로 쏠리지 않게 주의'],
    voiceCoaching: ['내려요!', '밀어!', '앞으로!', '균형!'],
  },
  {
    id: 'seated_calf_raise',
    name: '시티드 카프 레이즈',
    bodyPart: 'legs',
    secondaryParts: [],
    equipment: 'machine',
    difficulty: 'beginner',
    defaultSets: 3,
    defaultReps: '20',
    restSeconds: 60,
    caloriesPerSet: 6,
    guide: [
      '시티드 카프 레이즈 머신에 앉아 패드를 허벅지에 올립니다',
      '발볼을 발판에 올리고 발뒤꿈치를 아래로 최대한 내립니다',
      '종아리로 밀어올려 발뒤꿈치를 최대한 높이 올립니다',
      '최대 수축 시 1초 유지 후 내립니다',
    ],
    tips: ['완전한 가동 범위로 실시하세요 (스트레칭~수축)', '서서 하는 것보다 가자미근에 더 집중됩니다'],
    warnings: ['통증이 있으면 즉시 중단하세요'],
    voiceCoaching: ['올려!', '수축!', '내려요!', '종아리!'],
  },

  // ===== 코어 - 웨이트 (Core - Weight) =====
  {
    id: 'cable_crunch',
    name: '케이블 크런치',
    bodyPart: 'core',
    secondaryParts: [],
    equipment: 'cable',
    difficulty: 'beginner',
    defaultSets: 3,
    defaultReps: '15',
    restSeconds: 60,
    caloriesPerSet: 9,
    guide: [
      '케이블 머신 앞에 무릎을 꿇고 위 풀리의 로프를 잡습니다',
      '로프를 머리 옆에 대고 복근으로 상체를 아래로 구부립니다',
      '완전히 수축할 때 잠시 유지 후 천천히 올라옵니다',
    ],
    tips: ['무게가 있어 복근 강화에 효과적입니다', '엉덩이를 뒤로 빼지 말고 복근으로만 동작하세요'],
    warnings: ['목으로 당기지 마세요'],
    voiceCoaching: ['구부려!', '복근 수축!', '천천히!', '집중!'],
  },
  {
    id: 'hanging_leg_raise',
    name: '행잉 레그 레이즈',
    bodyPart: 'core',
    secondaryParts: ['arms'],
    equipment: 'bodyweight',
    difficulty: 'intermediate',
    defaultSets: 3,
    defaultReps: '12',
    restSeconds: 75,
    caloriesPerSet: 11,
    guide: [
      '풀업 바에 매달려 어깨 너비로 잡습니다',
      '다리를 곧게 펴거나 살짝 구부린 채로 복근으로 다리를 올립니다',
      '다리가 바닥과 평행하거나 더 위로 올라가면 유지 후 내립니다',
    ],
    tips: ['반동을 쓰지 말고 복근의 힘으로만 올리세요', '천천히 내리는 것이 더 효과적입니다'],
    warnings: ['그립이 약하면 손목 스트랩을 사용하세요'],
    voiceCoaching: ['올려요!', '복근!', '천천히 내려!', '흔들지 마세요!'],
  },
  {
    id: 'ab_wheel_rollout',
    name: 'AB 롤아웃',
    bodyPart: 'core',
    secondaryParts: ['shoulder', 'back'],
    equipment: 'none',
    difficulty: 'advanced',
    defaultSets: 3,
    defaultReps: '10',
    restSeconds: 75,
    caloriesPerSet: 12,
    guide: [
      '무릎을 꿇고 AB 휠을 앞에 놓습니다',
      '코어를 단단히 조이고 AB 휠을 앞으로 굴립니다',
      '허리가 처지기 직전에 멈추고 복근으로 돌아옵니다',
    ],
    tips: ['처음에는 짧은 범위부터 시작하세요', '허리가 처지는 순간 중단하세요'],
    warnings: ['허리 부상의 위험이 있는 고급 운동입니다', '코어가 약하면 먼저 플랭크를 강화하세요'],
    voiceCoaching: ['코어 조여!', '앞으로!', '돌아와!', '허리 유지!'],
  },
  {
    id: 'decline_crunch',
    name: '디클라인 크런치',
    bodyPart: 'core',
    secondaryParts: [],
    equipment: 'machine',
    difficulty: 'beginner',
    defaultSets: 3,
    defaultReps: '15',
    restSeconds: 60,
    caloriesPerSet: 9,
    guide: [
      '디클라인 벤치에 발을 고정하고 눕습니다',
      '팔을 가슴에 모으거나 머리 뒤에 놓습니다',
      '복근으로 상체를 들어올려 앉는 자세를 만듭니다',
      '천천히 내립니다',
    ],
    tips: ['일반 크런치보다 범위가 커서 더 효과적입니다', '목으로 당기지 마세요'],
    warnings: ['목과 허리에 무리가 가지 않도록 천천히 하세요'],
    voiceCoaching: ['올라와!', '복근!', '천천히 내려!', '집중!'],
  },
];

// ===== 분할 루틴 정의 =====

export interface SplitDef {
  label: string;
  emoji: string;
  desc: string;
  parts: BodyPart[];
}

export const SPLIT_DEFS: Record<string, Record<'A' | 'B' | 'C', SplitDef>> = {
  gain: {
    A: { label: 'A 가슴·삼두', emoji: '🫁', desc: '가슴 + 삼두', parts: ['chest', 'arms'] },
    B: { label: 'B 등·이두', emoji: '🔙', desc: '등 + 이두', parts: ['back', 'arms'] },
    C: { label: 'C 하체·어깨', emoji: '🦵', desc: '하체 + 어깨', parts: ['legs', 'shoulder'] },
  },
  lose: {
    A: { label: 'A 상체', emoji: '💪', desc: '가슴 + 등 + 어깨', parts: ['chest', 'back', 'shoulder'] },
    B: { label: 'B 하체·코어', emoji: '🦵', desc: '하체 + 코어', parts: ['legs', 'core'] },
    C: { label: 'C 전신·유산소', emoji: '🏃', desc: '유산소 + 팔 + 코어', parts: ['cardio', 'arms', 'core'] },
  },
  maintain: {
    A: { label: 'A 밀기', emoji: '🫁', desc: '가슴 + 어깨 + 삼두', parts: ['chest', 'shoulder', 'arms'] },
    B: { label: 'B 당기기', emoji: '🔙', desc: '등 + 이두', parts: ['back', 'arms'] },
    C: { label: 'C 하체·코어', emoji: '🦵', desc: '하체 + 코어', parts: ['legs', 'core'] },
  },
};

export function getNextSplit(lastSplit: string | null): 'A' | 'B' | 'C' {
  if (!lastSplit) return 'A';
  if (lastSplit === 'A') return 'B';
  if (lastSplit === 'B') return 'C';
  return 'A';
}

// ===== 운동 프로그램 생성 =====

export interface SetDetail {
  weight: number; // kg, 0 for bodyweight
  reps: string;   // "12" or "30초"
  completed?: boolean;
}

export interface WorkoutPlanItem {
  exercise: Exercise;
  setDetails: SetDetail[]; // Per-set weight/reps (PlanFit style)
  restSeconds: number;
}

export interface WorkoutPlan {
  name: string;
  exercises: WorkoutPlanItem[];
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

    const defaultWeight = exercise.equipment === 'bodyweight' ? 0 : 20; // Default 20kg for weighted exercises
    const setDetails: SetDetail[] = Array.from({ length: sets }, () => ({
      weight: defaultWeight,
      reps,
    }));

    return {
      exercise,
      setDetails,
      restSeconds: goal === 'lose' ? Math.max(30, exercise.restSeconds - 15) : exercise.restSeconds,
    };
  });

  const totalSets = plan.reduce((sum, p) => sum + p.setDetails.length, 0);
  const estimatedCalories = plan.reduce((sum, p) => sum + p.exercise.caloriesPerSet * p.setDetails.length, 0);
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

// ===== 분할 기반 결정적 플랜 생성 =====

export function generateSplitPlan(
  goal: 'lose' | 'gain' | 'maintain',
  experience: 'beginner' | 'intermediate' | 'advanced',
  split: 'A' | 'B' | 'C',
  options: {
    savedExerciseIds?: string[];
    savedWeights?: Record<string, number>;
    blacklist?: string[];
  } = {}
): WorkoutPlan {
  const splitDefs = SPLIT_DEFS[goal] || SPLIT_DEFS.maintain;
  const splitDef = splitDefs[split];
  const targetParts = splitDef.parts;

  const difficultyFilter: Difficulty[] =
    experience === 'beginner'
      ? ['beginner']
      : experience === 'intermediate'
        ? ['beginner', 'intermediate']
        : ['beginner', 'intermediate', 'advanced'];

  const blacklist = options.blacklist ?? [];

  // 사용 가능한 운동 필터링 (부위 + 난이도 + 블랙리스트 제외)
  const available = exercises.filter(
    (e) => targetParts.includes(e.bodyPart) &&
           difficultyFilter.includes(e.difficulty) &&
           !blacklist.includes(e.id)
  );

  const count = goal === 'lose' ? 6 : goal === 'gain' ? 5 : 6;
  let selected: Exercise[];

  if (options.savedExerciseIds && options.savedExerciseIds.length > 0) {
    // 저장된 운동 목록 사용 (블랙리스트 제외된 운동은 대체)
    selected = [];
    for (const id of options.savedExerciseIds) {
      if (blacklist.includes(id)) continue;
      const ex = exercises.find((e) => e.id === id);
      if (ex) selected.push(ex);
    }
    // 부족하면 추가
    if (selected.length < count) {
      const usedIds = new Set(selected.map((e) => e.id));
      const extras = available.filter((e) => !usedIds.has(e.id));
      // 결정적 정렬: 난이도 → 이름 순
      extras.sort((a, b) => a.difficulty.localeCompare(b.difficulty) || a.name.localeCompare(b.name));
      for (const ex of extras) {
        if (selected.length >= count) break;
        selected.push(ex);
      }
    }
  } else {
    // 첫 번째 생성: 결정적 정렬 (난이도 → 이름 순)으로 선택
    const sorted = [...available].sort(
      (a, b) => a.difficulty.localeCompare(b.difficulty) || a.name.localeCompare(b.name)
    );
    selected = sorted.slice(0, Math.min(count, sorted.length));
  }

  // 목표별 세트/렙 조정 + 저장된 무게 적용
  const plan = selected.map((exercise) => {
    let sets = exercise.defaultSets;
    let reps = exercise.defaultReps;

    if (goal === 'lose') {
      sets = Math.max(3, sets);
      if (!reps.includes('초')) {
        const baseReps = parseInt(reps) || 12;
        reps = String(Math.min(baseReps + 5, 20));
      }
    } else if (goal === 'gain') {
      sets = Math.min(sets + 1, 5);
      if (!reps.includes('초') && !reps.includes('(')) {
        const baseReps = parseInt(reps) || 12;
        reps = String(Math.max(baseReps - 2, 6));
      }
    }

    // 저장된 무게 또는 기본 무게
    const savedWeight = options.savedWeights?.[exercise.id];
    const defaultWeight = exercise.equipment === 'bodyweight' ? 0 : 20;
    const weight = savedWeight ?? defaultWeight;

    const setDetails: SetDetail[] = Array.from({ length: sets }, () => ({
      weight,
      reps,
    }));

    return {
      exercise,
      setDetails,
      restSeconds: goal === 'lose' ? Math.max(30, exercise.restSeconds - 15) : exercise.restSeconds,
    };
  });

  const totalSets = plan.reduce((sum, p) => sum + p.setDetails.length, 0);
  const estimatedCalories = plan.reduce((sum, p) => sum + p.exercise.caloriesPerSet * p.setDetails.length, 0);
  const estimatedMinutes = Math.round(totalSets * 1.5 + totalSets * (plan[0]?.restSeconds || 60) / 60);

  return {
    name: `${splitDef.label} 워크아웃`,
    exercises: plan,
    estimatedMinutes,
    estimatedCalories,
  };
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
