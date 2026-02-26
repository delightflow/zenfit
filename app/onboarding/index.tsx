import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Dimensions, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { useStore, UserProfile } from '../../store/useStore';

const { width } = Dimensions.get('window');

type Step = 'welcome' | 'name' | 'gender' | 'body' | 'goal' | 'focus' | 'experience' | 'schedule' | 'duration' | 'recommend' | 'done';

const STEPS: Step[] = ['welcome', 'name', 'gender', 'body', 'goal', 'focus', 'experience', 'schedule', 'duration', 'recommend', 'done'];

export default function OnboardingScreen() {
  const setProfile = useStore((s) => s.setProfile);
  const setOnboarded = useStore((s) => s.setOnboarded);

  const [step, setStep] = useState<Step>('welcome');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState('25');
  const [height, setHeight] = useState('175');
  const [weight, setWeight] = useState('75');
  const [targetWeight, setTargetWeight] = useState('70');
  const [goal, setGoal] = useState<'lose' | 'gain' | 'maintain'>('lose');
  const [experience, setExperience] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [workoutDays, setWorkoutDays] = useState<number[]>([1, 3, 5]); // Mon, Wed, Fri
  const [workoutFreq, setWorkoutFreq] = useState<number>(3); // 주간 운동 횟수

  const stepIndex = STEPS.indexOf(step);
  const progress = (stepIndex / (STEPS.length - 1)) * 100;

  const next = () => {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  };

  const finish = () => {
    const bw = parseInt(weight) || 75;
    const selectedGoal = GOAL_OPTIONS.find((o) => o.key === goalKey)?.goal ?? goal;

    // 체중 대비 1RM 추정 multiplier (성별 × 경험수준)
    const RM_MULT: Record<string, Record<string, { bench: number; squat: number; deadlift: number }>> = {
      male: {
        beginner:     { bench: 0.5,  squat: 0.75, deadlift: 1.0 },
        intermediate: { bench: 1.0,  squat: 1.5,  deadlift: 2.0 },
        advanced:     { bench: 1.5,  squat: 2.0,  deadlift: 2.5 },
      },
      female: {
        beginner:     { bench: 0.3,  squat: 0.5,  deadlift: 0.65 },
        intermediate: { bench: 0.65, squat: 1.0,  deadlift: 1.3  },
        advanced:     { bench: 1.0,  squat: 1.3,  deadlift: 1.65 },
      },
    };
    const mult = RM_MULT[gender][experience];
    const estimatedOneRM = {
      bench:    Math.round(bw * mult.bench),
      squat:    Math.round(bw * mult.squat),
      deadlift: Math.round(bw * mult.deadlift),
    };

    const profile: UserProfile = {
      name,
      gender,
      age: parseInt(age) || 25,
      height: parseInt(height) || 175,
      weight: bw,
      targetWeight: parseInt(targetWeight) || 70,
      goal: selectedGoal,
      experience,
      workoutDays,
      estimatedOneRM,
      focusAreas,
      planWeeks: durationMode === 'custom-weeks' ? (parseInt(customWeeks) || 8) : planWeeks,
    };
    setProfile(profile);
    setOnboarded(true);
    router.replace('/(tabs)');
  };

  const FREQ_TO_DAYS: Record<number, number[]> = {
    1: [1], 2: [1, 4], 3: [1, 3, 5],
    4: [1, 2, 4, 5], 5: [1, 2, 3, 4, 5], 6: [1, 2, 3, 4, 5, 6],
  };

  const selectFreq = (freq: number) => {
    setWorkoutFreq(freq);
    setWorkoutDays(FREQ_TO_DAYS[freq] ?? [1, 3, 5]);
  };

  const GOAL_OPTIONS = [
    { key: 'start',  goal: 'gain' as const,     icon: '🏋️', label: '웨이트 트레이닝 시작', desc: '웨이트 트레이닝에 필요한 기초를 다져요' },
    { key: 'muscle', goal: 'gain' as const,     icon: '💪', label: '근육량 증가',           desc: '근육을 키워 더 강하고 균형 잡힌 몸을 만들어요' },
    { key: 'diet',   goal: 'lose' as const,     icon: '🔥', label: '다이어트',              desc: '체중을 감량하고 건강한 체형을 만들어요' },
    { key: 'target', goal: 'maintain' as const, icon: '🎯', label: '특정 부위 공략',        desc: '특정 부위를 집중적으로 강화하고 개선해요' },
    { key: 'habit',  goal: 'maintain' as const, icon: '💚', label: '건강한 습관 만들기',    desc: '꾸준히 실천할 수 있는 건강한 습관을 만들어요' },
    { key: 'sports', goal: 'maintain' as const, icon: '⚡', label: '스포츠 능력 강화',      desc: '운동 능력을 높여 더 나은 퍼포먼스를 달성해요' },
  ];
  const [goalKey, setGoalKey] = useState<string>('start');
  const [planWeeks, setPlanWeeks] = useState<number>(8);
  const [customWeeks, setCustomWeeks] = useState<string>('');
  const [durationMode, setDurationMode] = useState<'preset' | 'custom-weeks' | 'custom-date'>('preset');
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [recommendIndex, setRecommendIndex] = useState(0);
  const recommendScrollRef = useRef<ScrollView>(null);

  const FOCUS_OPTIONS = [
    '평생 숙제 다이어트', '뱃살, 옆구리살 빼기', '팔뚝 군살 제거', '슬림한 하체 라인 만들기',
    '벌크업 하기', '넓은 어깨 갖기', '마른 몸 벗어나기', '굵고 큰 팔 만들기',
    '탄탄한 몸 만들기', '힙업', '하체 근력 강화', '직각 어깨 갖기',
    '전체적인 근육량 증가', '선명한 복근 만들기', '심폐 지구력 향상',
    '체력 향상', '체지방 제거', '체중 증가',
    '민첩성 향상', '유연성 향상', '근력 향상', '지구력 향상', '신체 균형 향상',
  ];

  const getEndDate = (weeks: number) => {
    const d = new Date();
    d.setDate(d.getDate() + weeks * 7);
    return `${d.getFullYear()}년 ${String(d.getMonth() + 1).padStart(2, '0')}월 ${String(d.getDate()).padStart(2, '0')}일 종료`;
  };

  const DURATION_PRESETS = [
    { weeks: 12, desc: '더 긴 운동 기간을 원할 때 추천' },
    { weeks: 8,  desc: '균형 잡힌 운동 기간을 원할 때 추천' },
    { weeks: 6,  desc: '단기간 집중 운동을 원할 때 추천' },
  ];

  const ALL_PLANS = [
    { id: 'abs', icon: '🎯', badge: 'PREMIUM', title: '복근 조각 플랜', levels: ['입문', '초급', '중급', '고급 이상'], desc: '복부 근육을 세밀하게 나누어 조각처럼 만드는 플랜이에요. 코어를 단단히 다져 선명하고 강한 복근을 완성해 보세요.', goals: ['lose', 'maintain'], focus: ['선명한 복근 만들기', '탄탄한 몸 만들기'] },
    { id: 'bulk', icon: '💪', badge: null, title: '벌크업 플랜', levels: ['입문', '초급', '중급', '고급 이상'], desc: '벌크업은 체중과 근육량을 동시에 늘릴 수 있는 과정이에요. 마른 몸이 고민이거나 더 큰 몸을 원한다면 도전해 보세요!', goals: ['gain'], focus: ['벌크업 하기', '전체적인 근육량 증가', '굵고 큰 팔 만들기', '마른 몸 벗어나기'] },
    { id: 'diet', icon: '🔥', badge: null, title: '체지방 제거 플랜', levels: ['입문', '초급', '중급'], desc: '유산소와 웨이트를 조합해 체지방을 효과적으로 태우는 플랜이에요. 건강한 다이어트를 도와드려요.', goals: ['lose'], focus: ['평생 숙제 다이어트', '뱃살, 옆구리살 빼기', '체지방 제거'] },
    { id: 'lower', icon: '🦵', badge: null, title: '하체 집중 플랜', levels: ['입문', '초급', '중급', '고급 이상'], desc: '하체 근육을 집중적으로 강화하는 플랜이에요. 탄탄한 하체와 힙업 효과를 동시에 얻을 수 있어요.', goals: ['maintain', 'lose'], focus: ['슬림한 하체 라인 만들기', '힙업', '하체 근력 강화'] },
    { id: 'shoulder', icon: '⚡', badge: null, title: '어깨 & 등 완성 플랜', levels: ['중급', '고급 이상'], desc: '넓고 강한 어깨와 두꺼운 등을 만드는 플랜이에요. 직각 어깨와 V라인을 동시에 완성해요.', goals: ['gain', 'maintain'], focus: ['넓은 어깨 갖기', '직각 어깨 갖기'] },
    { id: 'beginner', icon: '🌱', badge: 'NEW', title: '초보자 기초 플랜', levels: ['입문'], desc: '운동 처음이어도 괜찮아요. 기초 체력과 올바른 자세부터 차근차근 만들어가는 플랜이에요.', goals: ['gain', 'lose', 'maintain'], focus: ['마른 몸 벗어나기', '건강한 습관 만들기'] },
    { id: 'cardio', icon: '💚', badge: null, title: '심폐 지구력 향상 플랜', levels: ['입문', '초급', '중급'], desc: '유산소 능력과 지구력을 향상시키는 플랜이에요. 체력이 눈에 띄게 좋아지는 것을 느끼실 거예요.', goals: ['maintain'], focus: ['심폐 지구력 향상', '체력 향상', '지구력 향상'] },
    { id: 'shaping', icon: '🔥', badge: null, title: '쉐이핑 플랜', levels: ['입문', '초급', '중급', '고급 이상'], desc: '군살 없는 탄탄한 몸매를 만들기를 원하시는 분들께 추천 드려요. 칼로리 소모와 근육량 증가를 균형있게 조합하는데 초점을 맞춘 플랜이에요.', goals: ['lose', 'maintain'], focus: ['탄탄한 몸 만들기', '체지방 제거', '평생 숙제 다이어트'] },
    { id: 'wide-shoulder', icon: '⚡', badge: 'PREMIUM', title: '넓은 어깨 만들기', levels: ['입문', '초급', '중급', '고급 이상'], desc: '어깨 근육을 집중적으로 키워 남성스러운 역삼각형 체형을 완성하는 플랜이에요. 넓은 어깨와 균형 잡힌 상체 비율을 만들어 보세요.', goals: ['gain', 'maintain'], focus: ['넓은 어깨 갖기', '직각 어깨 갖기'] },
  ];

  const getRecommendedPlans = () => {
    const selectedGoal = GOAL_OPTIONS.find((o) => o.key === goalKey)?.goal ?? 'maintain';
    const scored = ALL_PLANS.map((p) => {
      let score = 0;
      if (p.goals.includes(selectedGoal)) score += 3;
      focusAreas.forEach((fa) => { if (p.focus.includes(fa)) score += 2; });
      if (experience === 'beginner' && p.levels.includes('입문')) score += 1;
      if (experience === 'intermediate' && p.levels.includes('중급')) score += 1;
      if (experience === 'advanced' && p.levels.includes('고급 이상')) score += 1;
      return { ...p, score };
    });
    return scored.sort((a, b) => b.score - a.score).slice(0, 7);
  };

  const toggleFocus = (item: string) => {
    setFocusAreas((prev) =>
      prev.includes(item) ? prev.filter((f) => f !== item) : [...prev, item]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {step !== 'welcome' && (
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {step === 'welcome' && (
          <View style={styles.center}>
            <Text style={styles.logo}>🏋️‍♂️</Text>
            <Text style={styles.appName}>심핏</Text>
            <Text style={styles.tagline}>AI가 만드는 나만의 운동 습관</Text>
            <Text style={styles.description}>
              매일 조금씩, 꾸준히.{'\n'}
              듀오링고처럼 운동 습관을 만들어보세요.
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={next}>
              <Text style={styles.primaryButtonText}>시작하기 🚀</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'name' && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepEmoji}>👋</Text>
            <Text style={styles.stepTitle}>이름이 뭐예요?</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="이름 입력"
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />
            <TouchableOpacity
              style={[styles.primaryButton, !name && styles.disabledButton]}
              onPress={next}
              disabled={!name}
            >
              <Text style={styles.primaryButtonText}>다음</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'gender' && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepEmoji}>🧬</Text>
            <Text style={styles.stepTitle}>성별을 선택해주세요</Text>
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={[styles.optionCard, gender === 'male' && styles.optionCardSelected]}
                onPress={() => setGender('male')}
              >
                <Text style={styles.optionEmoji}>🧑</Text>
                <Text style={[styles.optionText, gender === 'male' && styles.optionTextSelected]}>남성</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.optionCard, gender === 'female' && styles.optionCardSelected]}
                onPress={() => setGender('female')}
              >
                <Text style={styles.optionEmoji}>👩</Text>
                <Text style={[styles.optionText, gender === 'female' && styles.optionTextSelected]}>여성</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={next}>
              <Text style={styles.primaryButtonText}>다음</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'body' && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepEmoji}>📏</Text>
            <Text style={styles.stepTitle}>신체 정보를 알려주세요</Text>
            {[
              { label: '나이', value: age, set: setAge, unit: '세' },
              { label: '키', value: height, set: setHeight, unit: 'cm' },
              { label: '현재 체중', value: weight, set: setWeight, unit: 'kg' },
              { label: '목표 체중', value: targetWeight, set: setTargetWeight, unit: 'kg' },
            ].map((field) => (
              <View key={field.label} style={styles.inputRow}>
                <Text style={styles.inputLabel}>{field.label}</Text>
                <View style={styles.inputGroup}>
                  <TextInput
                    style={styles.numberInput}
                    value={field.value}
                    onChangeText={field.set}
                    keyboardType="numeric"
                    placeholderTextColor={Colors.textMuted}
                  />
                  <Text style={styles.inputUnit}>{field.unit}</Text>
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.primaryButton} onPress={next}>
              <Text style={styles.primaryButtonText}>다음</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'goal' && (
          <View style={styles.stepContainer}>
            <Text style={styles.aiCoachLabel}>AI 코치 플랜 추천</Text>
            <Text style={styles.stepTitle}>가장 중요한 목표는{'\n'}무엇인가요?</Text>
            <Text style={styles.stepSubtitle}>적절한 운동 추천에 필요해요!</Text>
            {GOAL_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[styles.goalCard, goalKey === item.key && styles.goalCardSelected]}
                onPress={() => setGoalKey(item.key)}
              >
                <Text style={styles.goalEmoji}>{item.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.goalLabel, goalKey === item.key && styles.goalLabelSelected]}>{item.label}</Text>
                  <Text style={styles.goalDesc}>{item.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.primaryButton, { marginTop: Spacing.lg }]} onPress={next}>
              <Text style={styles.primaryButtonText}>다음</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'focus' && (
          <View style={styles.stepContainer}>
            <Text style={styles.aiCoachLabel}>AI 코치 플랜 추천</Text>
            <Text style={styles.stepTitle}>어떤 부분에 초점을 맞춰{'\n'}운동하고 싶으신가요?</Text>
            <Text style={styles.stepSubtitle}>여러 목표를 선택하면, 구체적인 운동 추천에 도움이 돼요</Text>
            <View style={styles.chipsWrap}>
              {FOCUS_OPTIONS.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.chip, focusAreas.includes(item) && styles.chipSelected]}
                  onPress={() => toggleFocus(item)}
                >
                  <Text style={[styles.chipText, focusAreas.includes(item) && styles.chipTextSelected]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.focusHint}>2개 이상 선택해 주세요</Text>
            <TouchableOpacity
              style={[styles.primaryButton, { marginTop: Spacing.md }, focusAreas.length < 2 && styles.disabledButton]}
              onPress={next}
              disabled={focusAreas.length < 2}
            >
              <Text style={styles.primaryButtonText}>다음</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'experience' && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepEmoji}>📊</Text>
            <Text style={styles.stepTitle}>운동 경험은?</Text>
            {[
              { key: 'beginner' as const, emoji: '🌱', label: '초보', desc: '운동을 시작한지 3개월 미만' },
              { key: 'intermediate' as const, emoji: '🌿', label: '중급', desc: '3개월~1년 운동 경험' },
              { key: 'advanced' as const, emoji: '🌳', label: '고급', desc: '1년 이상 꾸준히 운동' },
            ].map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[styles.goalCard, experience === item.key && styles.goalCardSelected]}
                onPress={() => setExperience(item.key)}
              >
                <Text style={styles.goalEmoji}>{item.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.goalLabel, experience === item.key && styles.goalLabelSelected]}>{item.label}</Text>
                  <Text style={styles.goalDesc}>{item.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.primaryButton} onPress={next}>
              <Text style={styles.primaryButtonText}>다음</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'schedule' && (
          <View style={styles.stepContainer}>
            <Text style={styles.aiCoachLabel}>AI 코치 플랜 추천</Text>
            <Text style={styles.stepTitle}>일주일에 몇 회{'\n'}운동하실 예정인가요?</Text>
            <Text style={styles.stepSubtitle}>언제든지 변경할 수 있어요</Text>
            {[6, 5, 4, 3, 2, 1].map((freq) => (
              <TouchableOpacity
                key={freq}
                style={[styles.freqButton, workoutFreq === freq && styles.freqButtonSelected]}
                onPress={() => selectFreq(freq)}
              >
                <Text style={[styles.freqButtonText, workoutFreq === freq && styles.freqButtonTextSelected]}>
                  {freq}회
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.primaryButton, { marginTop: Spacing.lg }]} onPress={next}>
              <Text style={styles.primaryButtonText}>다음</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'duration' && (
          <View style={styles.stepContainer}>
            <Text style={styles.aiCoachLabel}>AI 코치 플랜 추천</Text>
            <Text style={styles.stepTitle}>원하는 플랜 기간을{'\n'}선택해 주세요</Text>
            <Text style={styles.stepSubtitle}>언제든지 변경할 수 있어요.</Text>

            {DURATION_PRESETS.map(({ weeks, desc }) => (
              <TouchableOpacity
                key={weeks}
                style={[styles.durationCard, durationMode === 'preset' && planWeeks === weeks && styles.durationCardSelected]}
                onPress={() => { setDurationMode('preset'); setPlanWeeks(weeks); }}
              >
                <View style={styles.durationRow}>
                  <Text style={[styles.durationWeeks, durationMode === 'preset' && planWeeks === weeks && styles.durationWeeksSelected]}>
                    {weeks}주
                  </Text>
                  <Text style={styles.durationEndDate}>{getEndDate(weeks)}</Text>
                </View>
                <Text style={styles.durationDesc}>{desc}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.durationCard, durationMode === 'custom-weeks' && styles.durationCardSelected]}
              onPress={() => setDurationMode('custom-weeks')}
            >
              <Text style={[styles.durationWeeks, durationMode === 'custom-weeks' && styles.durationWeeksSelected]}>맞춤 플랜 기간</Text>
              <Text style={styles.durationDesc}>원하는 주 수 직접 선택</Text>
              {durationMode === 'custom-weeks' && (
                <TextInput
                  style={styles.customWeeksInput}
                  value={customWeeks}
                  onChangeText={setCustomWeeks}
                  keyboardType="numeric"
                  placeholder="주 수 입력 (예: 10)"
                  placeholderTextColor={Colors.textMuted}
                  autoFocus
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.durationCard, durationMode === 'custom-date' && styles.durationCardSelected]}
              onPress={() => setDurationMode('custom-date')}
            >
              <Text style={[styles.durationWeeks, durationMode === 'custom-date' && styles.durationWeeksSelected]}>맞춤 종료일</Text>
              <Text style={styles.durationDesc}>원하는 종료 날짜 직접 선택</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.primaryButton, { marginTop: Spacing.lg }]} onPress={next}>
              <Text style={styles.primaryButtonText}>다음</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'recommend' && (() => {
          const plans = getRecommendedPlans();
          const currentPlan = plans[recommendIndex] ?? plans[0];
          return (
            <View style={styles.recommendContainer}>
              <Text style={styles.aiCoachLabel}>AI 코치 플랜 추천</Text>
              <Text style={styles.stepTitle}>가장 추천드리고{'\n'}싶은 플랜이에요</Text>

              {/* 카드 캐러셀 */}
              <ScrollView
                ref={recommendScrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
                  const idx = Math.round(e.nativeEvent.contentOffset.x / (width - Spacing.lg * 2));
                  setRecommendIndex(idx);
                }}
                style={styles.planCarousel}
                contentContainerStyle={{ paddingHorizontal: 0 }}
              >
                {plans.map((plan) => (
                  <View key={plan.id} style={[styles.planCard, { width: width - Spacing.lg * 2 }]}>
                    {plan.badge && (
                      <View style={styles.planBadge}>
                        <Text style={styles.planBadgeText}>✦ {plan.badge}</Text>
                      </View>
                    )}
                    <View style={styles.planLevels}>
                      {plan.levels.map((lv) => (
                        <View key={lv} style={styles.planLevelChip}>
                          <Text style={styles.planLevelText}>{lv}</Text>
                        </View>
                      ))}
                    </View>
                    <Text style={styles.planIcon}>{plan.icon}</Text>
                    <Text style={styles.planTitle}>{plan.title}</Text>
                    <Text style={styles.planDesc}>{plan.desc}</Text>
                  </View>
                ))}
              </ScrollView>

              {/* 페이지 도트 */}
              <View style={styles.dotsRow}>
                {plans.map((_, i) => (
                  <View key={i} style={[styles.dot, recommendIndex === i && styles.dotActive]} />
                ))}
              </View>

              {/* 버튼 */}
              <TouchableOpacity style={[styles.primaryButton, styles.recommendBtn]} onPress={next}>
                <Text style={styles.primaryButtonText}>{currentPlan?.badge ? '✦ 이 플랜 선택하기' : '이 플랜 선택하기'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={next}>
                <Text style={styles.secondaryButtonText}>모든 플랜 보기</Text>
              </TouchableOpacity>
            </View>
          );
        })()}

        {step === 'done' && (
          <View style={styles.center}>
            <Text style={styles.doneEmoji}>🎉</Text>
            <Text style={styles.doneTitle}>준비 완료!</Text>
            <Text style={styles.doneText}>
              {name}님, 환영합니다!{'\n'}
              주 {workoutDays.length}회 운동으로{'\n'}
              목표를 향해 시작해볼까요?
            </Text>
            <View style={styles.doneSummary}>
              <Text style={styles.doneSummaryItem}>🎯 {goal === 'lose' ? '체중 감량' : goal === 'gain' ? '근육 증가' : '체력 향상'}</Text>
              <Text style={styles.doneSummaryItem}>📏 {weight}kg → {targetWeight}kg</Text>
              <Text style={styles.doneSummaryItem}>📅 주 {workoutDays.length}회 운동</Text>
              {(() => {
                const bw = parseInt(weight) || 75;
                const RM_MULT: Record<string, Record<string, { bench: number; squat: number; deadlift: number }>> = {
                  male:   { beginner: { bench: 0.5, squat: 0.75, deadlift: 1.0 }, intermediate: { bench: 1.0, squat: 1.5, deadlift: 2.0 }, advanced: { bench: 1.5, squat: 2.0, deadlift: 2.5 } },
                  female: { beginner: { bench: 0.3, squat: 0.5,  deadlift: 0.65 }, intermediate: { bench: 0.65, squat: 1.0, deadlift: 1.3 }, advanced: { bench: 1.0, squat: 1.3, deadlift: 1.65 } },
                };
                const m = RM_MULT[gender][experience];
                return (
                  <>
                    <Text style={[styles.doneSummaryItem, { marginTop: 8, color: Colors.primary, fontWeight: '700' }]}>💪 추정 1RM</Text>
                    <Text style={styles.doneSummaryItem}>벤치프레스 ~{Math.round(bw * m.bench)}kg  스쿼트 ~{Math.round(bw * m.squat)}kg  데드리프트 ~{Math.round(bw * m.deadlift)}kg</Text>
                  </>
                );
              })()}
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={finish}>
              <Text style={styles.primaryButtonText}>운동 시작하기! 💪</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  progressBar: {
    height: 4, backgroundColor: Colors.surface, marginHorizontal: Spacing.lg,
    borderRadius: 2, marginTop: Spacing.sm,
  },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
  content: { flexGrow: 1, padding: Spacing.lg },

  // Center layout
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logo: { fontSize: 80, marginBottom: Spacing.md },
  appName: { fontSize: 42, fontWeight: '800', color: Colors.text, marginBottom: Spacing.sm },
  tagline: { fontSize: FontSize.lg, color: Colors.primary, fontWeight: '600', marginBottom: Spacing.md },
  description: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: Spacing.xl },

  // Step layout
  stepContainer: { flex: 1, justifyContent: 'center' },
  stepEmoji: { fontSize: 48, marginBottom: Spacing.md },
  stepTitle: { fontSize: 28, fontWeight: '800', color: Colors.text, marginBottom: Spacing.sm, lineHeight: 36 },
  stepSubtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.lg },

  // Text input
  textInput: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.md, padding: Spacing.md,
    fontSize: FontSize.xl, color: Colors.text, marginBottom: Spacing.lg,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },

  // Number inputs
  inputRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.md,
  },
  inputLabel: { fontSize: FontSize.md, color: Colors.textSecondary, flex: 1 },
  inputGroup: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  numberInput: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.sm, padding: Spacing.sm,
    width: 80, textAlign: 'center', fontSize: FontSize.lg, color: Colors.text,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  inputUnit: { fontSize: FontSize.sm, color: Colors.textMuted, width: 30 },

  // Options
  optionsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  optionCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, alignItems: 'center', borderWidth: 2, borderColor: 'transparent',
  },
  optionCardSelected: { borderColor: Colors.primary },
  optionEmoji: { fontSize: 36, marginBottom: Spacing.sm },
  optionText: { fontSize: FontSize.md, color: Colors.textSecondary, fontWeight: '600' },
  optionTextSelected: { color: Colors.primary },

  // Goal cards
  goalCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.card, borderRadius: BorderRadius.md, padding: Spacing.md,
    marginBottom: Spacing.sm, borderWidth: 2, borderColor: 'transparent',
  },
  goalCardSelected: { borderColor: Colors.primary },
  goalEmoji: { fontSize: 28 },
  goalLabel: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  goalLabelSelected: { color: Colors.primary },
  goalDesc: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },

  // AI Coach label
  aiCoachLabel: {
    fontSize: FontSize.sm, color: Colors.primary, fontWeight: '700',
    marginBottom: Spacing.sm, letterSpacing: 0.5,
  },

  // Focus area chips (멀티셀렉트 태그)
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  chip: {
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full, backgroundColor: Colors.card,
    borderWidth: 1.5, borderColor: Colors.cardBorder,
  },
  chipSelected: { borderColor: Colors.primary, backgroundColor: Colors.surface },
  chipText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  chipTextSelected: { color: Colors.primary },
  focusHint: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.xs },

  // Frequency buttons (경쟁사 스타일 큰 버튼 리스트)
  freqButton: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.sm, borderWidth: 2, borderColor: 'transparent',
  },
  freqButtonSelected: { borderColor: Colors.primary, backgroundColor: Colors.surface },
  freqButtonText: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textSecondary },
  freqButtonTextSelected: { color: Colors.primary },

  // Recommend step
  recommendContainer: { flex: 1 },
  planCarousel: { marginTop: Spacing.lg, marginHorizontal: -Spacing.lg },
  planCard: {
    marginHorizontal: Spacing.lg, backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl, padding: Spacing.xl,
    borderWidth: 2, borderColor: Colors.primary,
    alignItems: 'center', minHeight: 340,
  },
  planBadge: {
    alignSelf: 'flex-start', backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: 4,
    marginBottom: Spacing.sm,
  },
  planBadgeText: { color: Colors.background, fontWeight: '800', fontSize: FontSize.xs },
  planLevels: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: Spacing.md, alignSelf: 'flex-start' },
  planLevelChip: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 3,
  },
  planLevelText: { color: Colors.textSecondary, fontSize: FontSize.xs },
  planIcon: { fontSize: 64, marginBottom: Spacing.md },
  planTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text, marginBottom: Spacing.sm, textAlign: 'center' },
  planDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: Spacing.md },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.surface },
  dotActive: { backgroundColor: Colors.primary, width: 20 },
  recommendBtn: { marginTop: Spacing.lg },
  secondaryButton: {
    borderRadius: BorderRadius.md, paddingVertical: Spacing.md,
    alignItems: 'center', marginTop: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  secondaryButtonText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },

  // Duration cards
  durationCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 2, borderColor: 'transparent',
  },
  durationCardSelected: { borderColor: Colors.primary },
  durationRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm, marginBottom: 2 },
  durationWeeks: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text },
  durationWeeksSelected: { color: Colors.primary },
  durationEndDate: { fontSize: FontSize.sm, color: Colors.textMuted },
  durationDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  customWeeksInput: {
    marginTop: Spacing.sm, backgroundColor: Colors.surface, borderRadius: BorderRadius.sm,
    padding: Spacing.sm, fontSize: FontSize.lg, color: Colors.text,
    borderWidth: 1, borderColor: Colors.primary,
  },

  // Days (legacy, kept for compatibility)
  daysRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.xl },
  dayButton: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  dayButtonSelected: { backgroundColor: Colors.primary },
  dayButtonText: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: '600' },
  dayButtonTextSelected: { color: Colors.background },

  // Done
  doneEmoji: { fontSize: 80, marginBottom: Spacing.md },
  doneTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text, marginBottom: Spacing.sm },
  doneText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: Spacing.lg },
  doneSummary: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.md, padding: Spacing.lg,
    width: '100%', marginBottom: Spacing.xl,
  },
  doneSummaryItem: { fontSize: FontSize.md, color: Colors.text, marginBottom: Spacing.sm },

  // Buttons
  primaryButton: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.md,
  },
  primaryButtonText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.background },
  disabledButton: { opacity: 0.4 },
});
