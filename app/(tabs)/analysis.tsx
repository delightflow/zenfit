import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { useStore } from '../../store/useStore';
import BodyChart from '../../components/BodyChart';
import WorkoutCalendar from '../../components/WorkoutCalendar';
import { useState } from 'react';

type Tab = 'calendar' | 'body';

export default function AnalysisScreen() {
  const profile = useStore((s) => s.profile);
  const streak = useStore((s) => s.streak);
  const bestStreak = useStore((s) => s.bestStreak);
  const workoutLogs = useStore((s) => s.workoutLogs);
  const [tab, setTab] = useState<Tab>('calendar');

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>분석</Text>
        <View style={styles.placeholder}>
          <Text style={styles.emoji}>📊</Text>
          <Text style={styles.placeholderText}>온보딩을 먼저 완료해주세요</Text>
        </View>
      </SafeAreaView>
    );
  }

  const goalLabel = profile.goal === 'lose' ? '체중 감량' : profile.goal === 'gain' ? '근육 증가' : '체력 향상';
  const totalWorkouts = workoutLogs.length;
  const totalCalories = workoutLogs.reduce((sum, log) => sum + log.calories, 0);
  const totalMinutes = workoutLogs.reduce((sum, log) => sum + log.duration, 0);

  // Weekly stats (last 7 days)
  const today = new Date();
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const weekLogs = workoutLogs.filter((l) => last7.includes(l.date));
  const weekDays = weekLogs.length;
  const weekCalories = weekLogs.reduce((sum, l) => sum + l.calories, 0);
  const weekMinutes = weekLogs.reduce((sum, l) => sum + l.duration, 0);
  const avgDuration = weekDays > 0 ? Math.round(weekMinutes / weekDays) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>운동 분석</Text>

        {/* Summary stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalWorkouts}</Text>
            <Text style={styles.statLabel}>총 운동</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>현재 스트릭</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.accent }]}>{totalCalories}</Text>
            <Text style={styles.statLabel}>kcal 소모</Text>
          </View>
        </View>

        {/* Weekly summary bar */}
        <View style={styles.weekSummary}>
          <Text style={styles.weekSummaryTitle}>이번 주 요약</Text>
          <View style={styles.weekBarRow}>
            {last7.map((dateStr, i) => {
              const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
              const d = new Date(dateStr);
              const dayName = dayNames[d.getDay()];
              const hasLog = workoutLogs.some((l) => l.date === dateStr);
              const isToday = i === 6;
              return (
                <View key={dateStr} style={styles.weekBarCol}>
                  <View style={[
                    styles.weekBar,
                    hasLog && styles.weekBarFilled,
                    isToday && !hasLog && styles.weekBarToday,
                  ]}>
                    {hasLog && <Text style={{ fontSize: 10 }}>✓</Text>}
                  </View>
                  <Text style={[styles.weekBarLabel, isToday && { color: Colors.primary }]}>
                    {dayName}
                  </Text>
                </View>
              );
            })}
          </View>
          <View style={styles.weekStatsRow}>
            <Text style={styles.weekStatText}>{weekDays}/7일 운동</Text>
            <Text style={styles.weekStatText}>{weekCalories} kcal</Text>
            <Text style={styles.weekStatText}>평균 {avgDuration}분</Text>
          </View>
        </View>

        {/* Tab switcher */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'calendar' && styles.tabBtnActive]}
            onPress={() => setTab('calendar')}
          >
            <Text style={[styles.tabBtnText, tab === 'calendar' && styles.tabBtnTextActive]}>
              📅 캘린더
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'body' && styles.tabBtnActive]}
            onPress={() => setTab('body')}
          >
            <Text style={[styles.tabBtnText, tab === 'body' && styles.tabBtnTextActive]}>
              📈 체성분 예측
            </Text>
          </TouchableOpacity>
        </View>

        {tab === 'calendar' ? (
          <>
            <WorkoutCalendar workoutLogs={workoutLogs} />

            {/* Goal info */}
            <View style={styles.goalCard}>
              <Text style={styles.goalIcon}>🎯</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.goalTitle}>{goalLabel} 플랜</Text>
                <Text style={styles.goalDetail}>
                  {profile.weight}kg → {profile.targetWeight}kg ({profile.weight > profile.targetWeight ? '-' : '+'}{Math.abs(profile.weight - profile.targetWeight)}kg)
                </Text>
              </View>
            </View>

            {/* Recent workouts */}
            {workoutLogs.length > 0 && (
              <View style={styles.recentCard}>
                <Text style={styles.recentTitle}>최근 운동 기록</Text>
                {workoutLogs.slice(-5).reverse().map((log, i) => (
                  <View key={i} style={styles.recentRow}>
                    <Text style={styles.recentDate}>{log.date}</Text>
                    <Text style={styles.recentDetail}>
                      {log.exercises}개 | {log.duration}분 | {log.calories}kcal
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          <>
            <Text style={styles.bodySubtitle}>6개월 변화 예측 (주식처럼 보기)</Text>
            <BodyChart
              currentWeight={profile.weight}
              targetWeight={profile.targetWeight}
              goal={profile.goal}
              height={profile.height}
              age={profile.age}
              gender={profile.gender}
            />
          </>
        )}

        {/* Prediction note */}
        <View style={styles.noteCard}>
          <Text style={styles.noteIcon}>💡</Text>
          <Text style={styles.noteText}>
            꾸준한 운동 기준 예측치입니다.{'\n'}
            실제 결과는 식단, 수면, 유전적 요인에 따라 달라질 수 있습니다.
          </Text>
        </View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  title: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
  bodySubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.md },

  placeholder: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.xl,
  },
  emoji: { fontSize: 64, marginBottom: Spacing.md },
  placeholderText: { fontSize: FontSize.md, color: Colors.textSecondary },

  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  statCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: BorderRadius.md,
    padding: Spacing.md, alignItems: 'center',
  },
  statValue: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.primary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },

  // Week summary
  weekSummary: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  weekSummaryTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  weekBarRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.sm },
  weekBarCol: { alignItems: 'center', gap: 4 },
  weekBar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  weekBarFilled: { backgroundColor: Colors.primary },
  weekBarToday: { borderWidth: 2, borderColor: Colors.primary },
  weekBarLabel: { fontSize: 10, color: Colors.textMuted },
  weekStatsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  weekStatText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' },

  // Tabs
  tabRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  tabBtn: {
    flex: 1, paddingVertical: Spacing.sm, backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md, alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.primary },
  tabBtnText: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: '600' },
  tabBtnTextActive: { color: Colors.primary },

  goalCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.card, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  goalIcon: { fontSize: 28 },
  goalTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  goalDetail: { fontSize: FontSize.sm, color: Colors.primary, marginTop: 2 },

  // Recent workouts
  recentCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  recentTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  recentRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.surface,
  },
  recentDate: { fontSize: FontSize.sm, color: Colors.text },
  recentDetail: { fontSize: FontSize.xs, color: Colors.textSecondary },

  noteCard: {
    flexDirection: 'row', gap: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  noteIcon: { fontSize: 16 },
  noteText: { flex: 1, fontSize: FontSize.xs, color: Colors.textMuted, lineHeight: 18 },
});
