import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Vibration, Modal, FlatList, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { useStore } from '../../store/useStore';
import {
  generateWorkoutPlan,
  getRecommendedParts,
  exercises as allExercises,
  WorkoutPlan,
  WorkoutPlanItem,
  SetDetail,
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
  const [currentSet, setCurrentSet] = useState(0); // 0-indexed
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [restTime, setRestTime] = useState(0);
  const [startTime] = useState(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [swapIndex, setSwapIndex] = useState<number | null>(null);

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
  const totalSets = plan.exercises.reduce((sum, e) => sum + e.setDetails.length, 0);

  const handleStartWorkout = () => {
    setPhase('exercise');
    setCurrentExIndex(0);
    setCurrentSet(0);
    setTimer(0);
    setIsTimerRunning(true);
  };

  const handleSetComplete = () => {
    Vibration.vibrate(200);

    // Mark current set as completed
    const updated = { ...plan };
    updated.exercises[currentExIndex].setDetails[currentSet].completed = true;
    setPlan({ ...updated });

    if (currentSet < currentPlanItem.setDetails.length - 1) {
      // More sets remaining - start rest
      setCurrentSet((prev) => prev + 1);
      setRestTime(currentPlanItem.restSeconds);
      setPhase('rest');
      setIsTimerRunning(true);
    } else if (currentExIndex < totalExercises - 1) {
      // Next exercise
      setCurrentExIndex((prev) => prev + 1);
      setCurrentSet(0);
      setRestTime(currentPlanItem.restSeconds + 15);
      setPhase('rest');
      setIsTimerRunning(true);
    } else {
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
    setPlan({ ...plan, exercises: plan.exercises.filter((_, i) => i !== index) });
  };

  const handleSwapExercise = (newEx: Exercise) => {
    if (!plan || swapIndex === null) return;
    const old = plan.exercises[swapIndex];
    const defaultWeight = newEx.equipment === 'bodyweight' ? 0 : 20;
    const newSetDetails: SetDetail[] = Array.from({ length: newEx.defaultSets }, () => ({
      weight: defaultWeight,
      reps: newEx.defaultReps,
    }));
    setPlan({
      ...plan,
      exercises: plan.exercises.map((item, i) =>
        i === swapIndex
          ? { ...item, exercise: newEx, setDetails: newSetDetails, restSeconds: newEx.restSeconds }
          : item
      ),
    });
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

  // Per-set weight/reps editing
  const handleUpdateSetWeight = (exIndex: number, setIndex: number, delta: number) => {
    if (!plan) return;
    const updated = { ...plan };
    const sd = { ...updated.exercises[exIndex].setDetails[setIndex] };
    sd.weight = Math.max(0, sd.weight + delta);
    updated.exercises[exIndex] = {
      ...updated.exercises[exIndex],
      setDetails: updated.exercises[exIndex].setDetails.map((s, i) => i === setIndex ? sd : s),
    };
    setPlan({ ...updated });
  };

  const handleUpdateSetReps = (exIndex: number, setIndex: number, value: string) => {
    if (!plan) return;
    const updated = { ...plan };
    const sd = { ...updated.exercises[exIndex].setDetails[setIndex] };
    sd.reps = value;
    updated.exercises[exIndex] = {
      ...updated.exercises[exIndex],
      setDetails: updated.exercises[exIndex].setDetails.map((s, i) => i === setIndex ? sd : s),
    };
    setPlan({ ...updated });
  };

  const handleAddSet = (exIndex: number) => {
    if (!plan) return;
    const item = plan.exercises[exIndex];
    const lastSet = item.setDetails[item.setDetails.length - 1];
    const newSet: SetDetail = { weight: lastSet.weight, reps: lastSet.reps };
    setPlan({
      ...plan,
      exercises: plan.exercises.map((e, i) =>
        i === exIndex ? { ...e, setDetails: [...e.setDetails, newSet] } : e
      ),
    });
  };

  const handleRemoveSet = (exIndex: number) => {
    if (!plan || plan.exercises[exIndex].setDetails.length <= 1) return;
    setPlan({
      ...plan,
      exercises: plan.exercises.map((e, i) =>
        i === exIndex ? { ...e, setDetails: e.setDetails.slice(0, -1) } : e
      ),
    });
  };

  // ===== Preview Phase (PlanFit style) =====
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
            <View style={styles.planStats}>
              <Text style={styles.planStat}>🏋️ {totalExercises}개 운동</Text>
              <Text style={styles.planStat}>⏱️ ~{plan.estimatedMinutes}분</Text>
              <Text style={styles.planStat}>🔥 ~{plan.estimatedCalories} kcal</Text>
            </View>
          </View>

          {plan.exercises.map((item, exIdx) => {
            const isWeighted = item.exercise.equipment !== 'bodyweight';
            return (
              <View key={item.exercise.id + exIdx} style={styles.exerciseCard}>
                {/* Exercise Header */}
                <View style={styles.exerciseCardHeader}>
                  <TouchableOpacity style={styles.exerciseNumberBadge} onPress={() => setSwapIndex(exIdx)}>
                    <Text style={styles.exerciseNumberText}>{exIdx + 1}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ flex: 1 }} onPress={() => setSwapIndex(exIdx)}>
                    <Text style={styles.exerciseCardName}>{item.exercise.name}</Text>
                    <Text style={styles.exerciseCardDetail}>
                      {BODY_PART_EMOJI[item.exercise.bodyPart]} {BODY_PART_LABELS[item.exercise.bodyPart]}
                      {'  '}|{'  '}{isWeighted ? item.exercise.equipment : '맨몸'}
                      {'  '}|{'  '}운동 대체 →
                    </Text>
                  </TouchableOpacity>
                  {plan.exercises.length > 2 && (
                    <TouchableOpacity onPress={() => handleRemoveExercise(exIdx)} style={styles.removeBtn}>
                      <Text style={styles.removeBtnText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Per-set rows (PlanFit style) */}
                {item.setDetails.map((sd, setIdx) => (
                  <View
                    key={setIdx}
                    style={[styles.setRow, setIdx === 0 && styles.setRowFirst]}
                  >
                    <Text style={styles.setLabel}>{setIdx + 1}세트</Text>

                    {isWeighted ? (
                      <>
                        {/* Weight */}
                        <View style={styles.setValueGroup}>
                          <TouchableOpacity style={styles.miniBtn} onPress={() => handleUpdateSetWeight(exIdx, setIdx, -2.5)}>
                            <Text style={styles.miniBtnText}>-</Text>
                          </TouchableOpacity>
                          <View style={styles.setValueBox}>
                            <Text style={styles.setValueNum}>{sd.weight}</Text>
                            <Text style={styles.setValueUnit}>kg</Text>
                          </View>
                          <TouchableOpacity style={styles.miniBtn} onPress={() => handleUpdateSetWeight(exIdx, setIdx, 2.5)}>
                            <Text style={styles.miniBtnText}>+</Text>
                          </TouchableOpacity>
                        </View>

                        <Text style={styles.setDivider}>/</Text>

                        {/* Reps */}
                        <View style={styles.setValueGroup}>
                          <TextInput
                            style={styles.repsInput}
                            value={sd.reps}
                            onChangeText={(v) => handleUpdateSetReps(exIdx, setIdx, v)}
                            keyboardType="default"
                            selectTextOnFocus
                          />
                          <Text style={styles.setValueUnit}>회</Text>
                        </View>
                      </>
                    ) : (
                      /* Bodyweight - just reps/time */
                      <View style={styles.setValueGroup}>
                        <TextInput
                          style={styles.repsInputWide}
                          value={sd.reps}
                          onChangeText={(v) => handleUpdateSetReps(exIdx, setIdx, v)}
                          keyboardType="default"
                          selectTextOnFocus
                        />
                        <Text style={styles.setValueUnit}>{sd.reps.includes('초') ? '' : '회'}</Text>
                      </View>
                    )}
                  </View>
                ))}

                {/* Add/Remove Set buttons */}
                <View style={styles.setActionRow}>
                  <TouchableOpacity style={styles.setActionBtn} onPress={() => handleRemoveSet(exIdx)}>
                    <Text style={styles.setActionText}>- 세트 삭제</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.setActionBtn} onPress={() => handleAddSet(exIdx)}>
                    <Text style={styles.setActionText}>+ 세트 추가</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

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

  // ===== Exercise Phase (PlanFit style) =====
  if (phase === 'exercise') {
    const ex = currentPlanItem.exercise;
    const sd = currentPlanItem.setDetails[currentSet];
    const isWeighted = ex.equipment !== 'bodyweight';

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.exercisePhase}>
          {/* Top bar */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => setPhase('preview')}>
              <Text style={styles.backButton}>←</Text>
            </TouchableOpacity>
            <Text style={styles.timerText}>{formatTime(timer)}</Text>
          </View>

          {/* Progress */}
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${((currentExIndex * currentPlanItem.setDetails.length + currentSet) / totalSets) * 100}%` },
              ]}
            />
          </View>

          {/* Exercise tip card */}
          <View style={styles.tipCard}>
            <Text style={styles.tipCardText}>
              {ex.tips[0] || ex.guide[0]}
            </Text>
          </View>

          {/* Exercise Info */}
          <Text style={styles.exPhaseTitle}>{ex.name}</Text>
          <Text style={styles.exPhaseSubtitle}>
            {BODY_PART_EMOJI[ex.bodyPart]} {BODY_PART_LABELS[ex.bodyPart]}
            {ex.secondaryParts?.map((p) => ` + ${BODY_PART_LABELS[p]}`).join('')}
          </Text>

          {/* Set Details (PlanFit style) */}
          <ScrollView style={styles.setListScroll} showsVerticalScrollIndicator={false}>
            {currentPlanItem.setDetails.map((s, idx) => {
              const isCurrent = idx === currentSet;
              const isDone = s.completed;
              return (
                <View
                  key={idx}
                  style={[
                    styles.exSetRow,
                    isCurrent && styles.exSetRowCurrent,
                    isDone && styles.exSetRowDone,
                  ]}
                >
                  <Text style={[styles.exSetLabel, isCurrent && styles.exSetLabelCurrent]}>
                    {isDone ? '✓' : `${idx + 1}세트`}
                  </Text>

                  {isWeighted && (
                    <>
                      <Text style={[styles.exSetValue, isCurrent && styles.exSetValueCurrent]}>
                        {s.weight}
                      </Text>
                      <Text style={styles.exSetUnit}>kg</Text>
                      <Text style={styles.exSetDivider}>/</Text>
                    </>
                  )}

                  <Text style={[styles.exSetValue, isCurrent && styles.exSetValueCurrent]}>
                    {s.reps}
                  </Text>
                  <Text style={styles.exSetUnit}>{s.reps.includes('초') ? '' : '회'}</Text>
                </View>
              );
            })}
          </ScrollView>

          {/* Bottom buttons */}
          <View style={styles.bottomBtns}>
            <TouchableOpacity style={styles.restTimerBtn} onPress={() => {
              setRestTime(currentPlanItem.restSeconds);
              setPhase('rest');
              setIsTimerRunning(true);
            }}>
              <Text style={styles.restTimerBtnText}>휴식 타이머</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.setCompleteBtn} onPress={handleSetComplete}>
              <Text style={styles.setCompleteBtnText}>
                {currentSet < currentPlanItem.setDetails.length - 1
                  ? '세트 완료'
                  : currentExIndex < totalExercises - 1
                    ? '다음 운동 →'
                    : '운동 완료! 🎉'}
              </Text>
            </TouchableOpacity>
          </View>
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

  // Exercise Card (Preview)
  exerciseCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  exerciseNumberBadge: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  exerciseNumberText: { color: Colors.primary, fontWeight: '700', fontSize: FontSize.sm },
  exerciseCardName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  exerciseCardDetail: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },

  // Per-set row
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.surface,
    gap: Spacing.sm,
  },
  setRowFirst: {
    borderTopWidth: 0,
  },
  setLabel: {
    width: 48,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  setValueGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  setValueBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    minWidth: 50,
    justifyContent: 'center',
  },
  setValueNum: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.text,
  },
  setValueUnit: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginLeft: 2,
  },
  setDivider: {
    fontSize: FontSize.lg,
    color: Colors.textMuted,
    marginHorizontal: 4,
  },
  miniBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  miniBtnText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '700' },
  repsInput: {
    backgroundColor: Colors.surface,
    color: Colors.text,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    fontSize: FontSize.lg,
    fontWeight: '800',
    textAlign: 'center',
    minWidth: 44,
    height: 32,
  },
  repsInputWide: {
    backgroundColor: Colors.surface,
    color: Colors.text,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    fontSize: FontSize.lg,
    fontWeight: '800',
    textAlign: 'center',
    minWidth: 60,
    height: 32,
  },

  // Set action row
  setActionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.surface,
    paddingTop: Spacing.sm,
  },
  setActionBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  setActionText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600' },

  removeBtn: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  removeBtnText: { color: Colors.accent, fontSize: FontSize.sm, fontWeight: '700' },

  startBtn: {
    marginHorizontal: Spacing.lg, marginTop: Spacing.lg,
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md, alignItems: 'center',
  },
  startBtnText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.background },

  // ===== Exercise Phase =====
  exercisePhase: { flex: 1, padding: Spacing.lg },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timerText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '700' },
  progressBarBg: {
    height: 4, backgroundColor: Colors.surface, borderRadius: 2, marginTop: Spacing.sm,
  },
  progressBarFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },

  tipCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.lg,
    marginTop: Spacing.lg, alignItems: 'center',
  },
  tipCardText: { color: Colors.textSecondary, fontSize: FontSize.sm, textAlign: 'center', lineHeight: 22 },

  exPhaseTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text, textAlign: 'center', marginTop: Spacing.lg },
  exPhaseSubtitle: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.xs },

  setListScroll: { flex: 1, marginTop: Spacing.lg },

  // Exercise set rows
  exSetRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.card, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  exSetRowCurrent: {
    borderWidth: 1.5, borderColor: Colors.primary,
  },
  exSetRowDone: {
    opacity: 0.5,
  },
  exSetLabel: { width: 48, fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: '600' },
  exSetLabelCurrent: { color: Colors.primary },
  exSetValue: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text },
  exSetValueCurrent: { color: Colors.primary },
  exSetUnit: { fontSize: FontSize.sm, color: Colors.textMuted },
  exSetDivider: { fontSize: FontSize.lg, color: Colors.textMuted, marginHorizontal: 4 },

  // Bottom buttons
  bottomBtns: {
    flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md,
  },
  restTimerBtn: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg,
    borderWidth: 1, borderColor: Colors.primary,
  },
  restTimerBtnText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '600' },
  setCompleteBtn: {
    flex: 1, backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md, alignItems: 'center',
  },
  setCompleteBtnText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.background },

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

  // Swap Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.card, borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl, padding: Spacing.lg, maxHeight: '70%',
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
});
