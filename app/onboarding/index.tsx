import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { useStore, UserProfile } from '../../store/useStore';

const { width } = Dimensions.get('window');

type Step = 'welcome' | 'name' | 'gender' | 'body' | 'goal' | 'experience' | 'schedule' | 'done';

const STEPS: Step[] = ['welcome', 'name', 'gender', 'body', 'goal', 'experience', 'schedule', 'done'];

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

  const stepIndex = STEPS.indexOf(step);
  const progress = (stepIndex / (STEPS.length - 1)) * 100;

  const next = () => {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  };

  const finish = () => {
    const profile: UserProfile = {
      name,
      gender,
      age: parseInt(age) || 25,
      height: parseInt(height) || 175,
      weight: parseInt(weight) || 75,
      targetWeight: parseInt(targetWeight) || 70,
      goal,
      experience,
      workoutDays,
    };
    setProfile(profile);
    setOnboarded(true);
    router.replace('/(tabs)');
  };

  const toggleDay = (day: number) => {
    setWorkoutDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
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
            <Text style={styles.appName}>ZenFit</Text>
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
            <Text style={styles.stepEmoji}>🎯</Text>
            <Text style={styles.stepTitle}>운동 목표는?</Text>
            {[
              { key: 'lose' as const, emoji: '🔥', label: '체중 감량', desc: '체지방을 줄이고 건강해지기' },
              { key: 'gain' as const, emoji: '💪', label: '근육 증가', desc: '근육량을 늘리고 체형 개선' },
              { key: 'maintain' as const, emoji: '⚡', label: '체력 향상', desc: '전반적인 체력과 지구력 향상' },
            ].map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[styles.goalCard, goal === item.key && styles.goalCardSelected]}
                onPress={() => setGoal(item.key)}
              >
                <Text style={styles.goalEmoji}>{item.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.goalLabel, goal === item.key && styles.goalLabelSelected]}>{item.label}</Text>
                  <Text style={styles.goalDesc}>{item.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.primaryButton} onPress={next}>
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
            <Text style={styles.stepEmoji}>📅</Text>
            <Text style={styles.stepTitle}>운동 요일을 선택하세요</Text>
            <Text style={styles.stepSubtitle}>선택한 날에 알림을 보내드려요</Text>
            <View style={styles.daysRow}>
              {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayButton, workoutDays.includes(i) && styles.dayButtonSelected]}
                  onPress={() => toggleDay(i)}
                >
                  <Text style={[styles.dayButtonText, workoutDays.includes(i) && styles.dayButtonTextSelected]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.primaryButton, workoutDays.length === 0 && styles.disabledButton]}
              onPress={next}
              disabled={workoutDays.length === 0}
            >
              <Text style={styles.primaryButtonText}>다음</Text>
            </TouchableOpacity>
          </View>
        )}

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
  stepTitle: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
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

  // Days
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
