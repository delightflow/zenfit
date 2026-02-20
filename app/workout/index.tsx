import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Vibration, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { useStore } from '../../store/useStore';
import {
  generateWorkoutPlan,
  getRecommendedParts,
  exercises as allExercises,
  WorkoutPlan,
  Exercise,
  BODY_PART_LABELS,
  BODY_PART_EMOJI,
  BodyPart,
} from '../../data/exercises';

type Phase = 'preview' | 'exercise' | 'rest' | 'complete';

export default function WorkoutScreen() {
  const profile = useStore((s) => s.profile);
  const completeToday = useStore((s) => s.completeToday);
  const addWorkoutLog = useStore((s) => s.addWorkoutLog);

  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [phase, setPhase] = useState<Phase>('preview');
  const [currentExIndex, setCurrentExIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [restTime, setRestTime] = useState(0);
  const [startTime] = useState(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [swapIndex, setSwapIndex] = useState<number | null>(null); // For exercise swap modal

  // Generate workout plan
  useEffect(() => {
    if (!profile) return;
    const dayOfWeek = new Date().getDay();
    const parts = getRecommendedParts(dayOfWeek, profile.goal);
    const workout = generateWorkoutPlan(profile.goal, profile.experience, parts);
    setPlan(workout);
  }, [profile]);

  // Timer logic
  useEffect(() => {
    if (isTimerRunning && phase === 'rest') {
      timerRef.current = setInterval(() => {
        setRestTime((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsTimerRunning(false);
            Vibration.vibrate(500);
            setPhase('exercise');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (isTimerRunning && phase === 'exercise') {
      timerRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, phase]);

  if (!plan || !profile) return null;

  const currentPlanItem = plan.exercises[currentExIndex];
  const totalExercises = plan.exercises.length;

  const handleStartWorkout = () => {
    setPhase('exercise');
    setCurrentExIndex(0);
    setCurrentSet(1);
    setTimer(0);
    setIsTimerRunning(true);
  };

  const handleSetComplete = () => {
    Vibration.vibrate(200);
    if (currentSet < currentPlanItem.sets) {
      // More sets remaining - start rest
      setCurrentSet((prev) => prev + 1);
      setRestTime(currentPlanItem.restSeconds);
      setPhase('rest');
      setIsTimerRunning(true);
    } else if (currentExIndex < totalExercises - 1) {
      // Next exercise - start rest
      setCurrentExIndex((prev) => prev + 1);
      setCurrentSet(1);
      setRestTime(currentPlanItem.restSeconds + 15); // Extra rest between exercises
      setPhase('rest');
      setIsTimerRunning(true);
    } else {
      // Workout complete
      handleWorkoutComplete();
    }
  };

  const handleSkipRest = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsTimerRunning(false);
    setRestTime(0);
    setPhase('exercise');
    setIsTimerRunning(true);
  };

  const handleWorkoutComplete = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsTimerRunning(false);
    setPhase('complete');

    const duration = Math.round((Date.now() - startTime) / 60000);
    completeToday();
    addWorkoutLog({
      date: new Date().toISOString().split('T')[0],
      completed: true,
      exercises: totalExercises,
      duration,
      calories: plan.estimatedCalories,
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  // ===== Customize Handlers =====
  const handleRemoveExercise = (index: number) => {
    if (!plan || plan.exercises.length <= 2) return;
    const updated = { ...plan, exercises: plan.exercises.filter((_, i) => i !== index) };
    setPlan(updated);
  };

  const handleSwapExercise = (newEx: Exercise) => {
    if (!plan || swapIndex === null) return;
    const old = plan.exercises[swapIndex];
    const updated = {
      ...plan,
      exercises: plan.exercises.map((item, i) =>
        i === swapIndex
          ? { ...item, exercise: newEx, sets: newEx.defaultSets, reps: newEx.defaultReps, restSeconds: newEx.restSeconds }
          : item
      ),
    };
    setPlan(updated);
    setSwapIndex(null);
  };

  const getSwapCandidates = (): Exercise[] => {
    if (!plan || swapIndex === null) return [];
    const currentEx = plan.exercises[swapIndex].exercise;
    const currentIds = plan.exercises.map((e) => e.exercise.id);
    return allExercises.filter(
      (e) => e.bodyPart === currentEx.bodyPart && !currentIds.includes(e.id)
    );
  };

  // ===== Preview Phase =====
  if (phase === 'preview') {
    const swapCandidates = getSwapCandidates();

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backButton}>← 뒤로</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.planHeader}>
            <Text style={styles.planTitle}>{plan.name}</Text>
            <Text style={styles.customHint}>운동을 탭하여 교체하거나 X로 삭제하세요</Text>
            <View style={styles.planStats}>
              <Text style={styles.planStat}>🏋️ {totalExercises}개 운동</Text>
              <Text style={styles.planStat}>⏱️ ~{plan.estimatedMinutes}분</Text>
              <Text style={styles.planStat}>🔥 ~{plan.estimatedCalories} kcal</Text>
            </View>
          </View>

          {plan.exercises.map((item, i) => (
            <View key={item.exercise.id + i} style={styles.previewCard}>
              <TouchableOpacity style={styles.previewNumber} onPress={() => setSwapIndex(i)}>
                <Text style={styles.previewNumberText}>{i + 1}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => setSwapIndex(i)}>
                <Text style={styles.previewName}>{item.exercise.name}</Text>
                <Text style={styles.previewDetail}>
                  {BODY_PART_EMOJI[item.exercise.bodyPart]} {BODY_PART_LABELS[item.exercise.bodyPart]}
                  {'  '}|{'  '}{item.sets}세트 x {item.reps}
                </Text>
              </TouchableOpacity>
              {plan.exercises.length > 2 && (
                <TouchableOpacity onPress={() => handleRemoveExercise(i)} style={styles.removeBtn}>
                  <Text style={styles.removeBtnText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          <TouchableOpacity style={styles.startBtn} onPress={handleStartWorkout}>
            <Text style={styles.startBtnText}>운동 시작 🚀</Text>
          </TouchableOpacity>

          <View style={{ height: Spacing.xxl }} />
        </ScrollView>

        {/* Swap Modal */}
        <Modal visible={swapIndex !== null} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>운동 교체</Text>
                <TouchableOpacity onPress={() => setSwapIndex(null)}>
                  <Text style={styles.modalClose}>닫기</Text>
                </TouchableOpacity>
              </View>
              {swapIndex !== null && (
                <Text style={styles.modalSubtitle}>
                  {plan.exercises[swapIndex].exercise.name} → 같은 부위 다른 운동
                </Text>
              )}
              {swapCandidates.length === 0 ? (
                <Text style={styles.modalEmpty}>교체 가능한 운동이 없습니다</Text>
              ) : (
                <FlatList
                  data={swapCandidates}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.swapItem} onPress={() => handleSwapExercise(item)}>
                      <Text style={styles.swapEmoji}>{BODY_PART_EMOJI[item.bodyPart]}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.swapName}>{item.name}</Text>
                        <Text style={styles.swapDetail}>
                          {item.equipment === 'bodyweight' ? '맨몸' : item.equipment} | {item.defaultSets}세트 x {item.defaultReps}
                        </Text>
                      </View>
                      <Text style={styles.swapDiff}>
                        {item.difficulty === 'beginner' ? '🌱' : item.difficulty === 'intermediate' ? '🌿' : '🌳'}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // ===== Exercise Phase =====
  if (phase === 'exercise') {
    const ex = currentPlanItem.exercise;
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.exerciseContainer}>
          {/* Progress */}
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>
              {currentExIndex + 1}/{totalExercises}
            </Text>
            <Text style={styles.timerText}>{formatTime(timer)}</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${((currentExIndex * currentPlanItem.sets + currentSet - 1) / (totalExercises * currentPlanItem.sets)) * 100}%` },
              ]}
            />
          </View>

          {/* Exercise Info */}
          <View style={styles.exerciseInfo}>
            <Text style={styles.exerciseEmoji}>
              {BODY_PART_EMOJI[ex.bodyPart]}
            </Text>
            <Text style={styles.exerciseName}>{ex.name}</Text>
            <Text style={styles.exercisePart}>
              {BODY_PART_LABELS[ex.bodyPart]}
              {ex.secondaryParts?.map((p) => ` + ${BODY_PART_LABELS[p]}`).join('')}
            </Text>
          </View>

          {/* Set Info */}
          <View style={styles.setInfo}>
            <Text style={styles.setLabel}>세트</Text>
            <Text style={styles.setCount}>
              {currentSet} / {currentPlanItem.sets}
            </Text>
            <Text style={styles.repsText}>{currentPlanItem.reps} 회</Text>
          </View>

          {/* Guide */}
          <ScrollView style={styles.guideScroll} showsVerticalScrollIndicator={false}>
            {ex.guide.map((step, i) => (
              <View key={i} style={styles.guideStep}>
                <Text style={styles.guideStepNum}>{i + 1}</Text>
                <Text style={styles.guideStepText}>{step}</Text>
              </View>
            ))}
            {ex.tips.length > 0 && (
              <View style={styles.tipBox}>
                <Text style={styles.tipTitle}>💡 팁</Text>
                {ex.tips.map((tip, i) => (
                  <Text key={i} style={styles.tipText}>• {tip}</Text>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Complete Set Button */}
          <TouchableOpacity style={styles.completeSetBtn} onPress={handleSetComplete}>
            <Text style={styles.completeSetBtnText}>
              {currentSet < currentPlanItem.sets
                ? `세트 완료 ✓`
                : currentExIndex < totalExercises - 1
                  ? '다음 운동으로 →'
                  : '운동 완료! 🎉'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ===== Rest Phase =====
  if (phase === 'rest') {
    const nextEx = currentExIndex < totalExercises
      ? plan.exercises[currentExIndex]
      : null;

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.restContainer}>
          <Text style={styles.restLabel}>휴식 시간</Text>
          <Text style={styles.restTimer}>{formatTime(restTime)}</Text>
          <Text style={styles.restHint}>다음: {nextEx?.exercise.name}</Text>

          {/* Motivation during rest */}
          <View style={styles.restMotivation}>
            <Text style={styles.restMotivationText}>
              {restTime > 30 ? '호흡을 가다듬으세요 😮‍💨' : '거의 다 쉬었어요! 준비하세요 💪'}
            </Text>
          </View>

          <TouchableOpacity style={styles.skipRestBtn} onPress={handleSkipRest}>
            <Text style={styles.skipRestBtnText}>휴식 건너뛰기 →</Text>
          </TouchableOpacity>

          {/* Ad placeholder */}
          <View style={styles.adPlaceholder}>
            <Text style={styles.adText}>📢 광고 영역 (구독 시 제거)</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ===== Complete Phase =====
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.completeContainer}>
        <Text style={styles.completeEmoji}>🎉</Text>
        <Text style={styles.completeTitle}>운동 완료!</Text>
        <Text style={styles.completeSubtitle}>오늘도 해냈습니다!</Text>

        <View style={styles.completeSummary}>
          <View style={styles.completeStat}>
            <Text style={styles.completeStatValue}>{totalExercises}</Text>
            <Text style={styles.completeStatLabel}>운동</Text>
          </View>
          <View style={styles.completeStat}>
            <Text style={styles.completeStatValue}>
              {Math.round((Date.now() - startTime) / 60000)}
            </Text>
            <Text style={styles.completeStatLabel}>분</Text>
          </View>
          <View style={styles.completeStat}>
            <Text style={styles.completeStatValue}>~{plan.estimatedCalories}</Text>
            <Text style={styles.completeStatLabel}>kcal</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.homeBtnText}>홈으로 돌아가기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  backButton: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '600' },

  // Plan Preview
  planHeader: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  planTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text },
  planStats: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
  planStat: { color: Colors.textSecondary, fontSize: FontSize.sm },

  previewCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
    backgroundColor: Colors.card, borderRadius: BorderRadius.md, padding: Spacing.md,
  },
  previewNumber: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  previewNumberText: { color: Colors.primary, fontWeight: '700', fontSize: FontSize.sm },
  previewName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  previewDetail: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },

  startBtn: {
    marginHorizontal: Spacing.lg, marginTop: Spacing.lg,
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md, alignItems: 'center',
  },
  startBtnText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.background },

  // Exercise Phase
  exerciseContainer: { flex: 1, padding: Spacing.lg },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600' },
  timerText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '700' },
  progressBarBg: {
    height: 4, backgroundColor: Colors.surface, borderRadius: 2, marginTop: Spacing.sm,
  },
  progressBarFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },

  exerciseInfo: { alignItems: 'center', marginTop: Spacing.xl },
  exerciseEmoji: { fontSize: 48, marginBottom: Spacing.sm },
  exerciseName: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text },
  exercisePart: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs },

  setInfo: { alignItems: 'center', marginTop: Spacing.lg },
  setLabel: { fontSize: FontSize.sm, color: Colors.textMuted },
  setCount: { fontSize: FontSize.hero, fontWeight: '800', color: Colors.primary },
  repsText: { fontSize: FontSize.lg, color: Colors.text, fontWeight: '600' },

  guideScroll: { flex: 1, marginTop: Spacing.lg },
  guideStep: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  guideStepNum: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.surface,
    textAlign: 'center', lineHeight: 24, color: Colors.primary, fontWeight: '700', fontSize: FontSize.sm,
  },
  guideStepText: { flex: 1, color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20 },

  tipBox: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  tipTitle: { color: Colors.primary, fontWeight: '700', fontSize: FontSize.sm, marginBottom: Spacing.xs },
  tipText: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20 },

  completeSetBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.md,
  },
  completeSetBtnText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.background },

  // Rest Phase
  restContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  restLabel: { fontSize: FontSize.lg, color: Colors.textSecondary, fontWeight: '600' },
  restTimer: { fontSize: 80, fontWeight: '800', color: Colors.primary, marginVertical: Spacing.lg },
  restHint: { fontSize: FontSize.md, color: Colors.textMuted },
  restMotivation: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.md, padding: Spacing.lg,
    marginTop: Spacing.xl, width: '100%', alignItems: 'center',
  },
  restMotivationText: { fontSize: FontSize.md, color: Colors.text },
  skipRestBtn: {
    marginTop: Spacing.lg, backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl,
  },
  skipRestBtnText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '600' },
  adPlaceholder: {
    marginTop: Spacing.xl, backgroundColor: Colors.card, borderRadius: BorderRadius.md,
    padding: Spacing.lg, width: '100%', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.cardBorder, borderStyle: 'dashed',
  },
  adText: { color: Colors.textMuted, fontSize: FontSize.sm },

  // Complete Phase
  completeContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  completeEmoji: { fontSize: 80 },
  completeTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text, marginTop: Spacing.md },
  completeSubtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: Spacing.xs },
  completeSummary: {
    flexDirection: 'row', gap: Spacing.xl, marginTop: Spacing.xl,
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.xl,
  },
  completeStat: { alignItems: 'center' },
  completeStatValue: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.primary },
  completeStatLabel: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  homeBtn: {
    marginTop: Spacing.xl, backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.xxl,
  },
  homeBtnText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.background },

  // Customize
  customHint: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.xs },
  removeBtn: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  removeBtnText: { color: Colors.accent, fontSize: FontSize.sm, fontWeight: '700' },

  // Swap Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card, borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl, padding: Spacing.lg,
    maxHeight: '70%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  modalClose: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '600' },
  modalSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.md },
  modalEmpty: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center', padding: Spacing.xl },
  swapItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  swapEmoji: { fontSize: 24 },
  swapName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  swapDetail: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  swapDiff: { fontSize: 18 },
});
