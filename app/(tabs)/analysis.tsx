import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { useStore } from '../../store/useStore';
import BodyChart from '../../components/BodyChart';

export default function AnalysisScreen() {
  const profile = useStore((s) => s.profile);
  const streak = useStore((s) => s.streak);
  const bestStreak = useStore((s) => s.bestStreak);
  const workoutLogs = useStore((s) => s.workoutLogs);

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>체성분 분석</Text>
        <Text style={styles.subtitle}>6개월 변화 예측 (주식처럼 보기)</Text>

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

        {/* Body Composition Charts */}
        <BodyChart
          currentWeight={profile.weight}
          targetWeight={profile.targetWeight}
          goal={profile.goal}
          height={profile.height}
          age={profile.age}
          gender={profile.gender}
        />

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
  title: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.lg },

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

  goalCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.card, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.lg,
  },
  goalIcon: { fontSize: 28 },
  goalTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  goalDetail: { fontSize: FontSize.sm, color: Colors.primary, marginTop: 2 },

  noteCard: {
    flexDirection: 'row', gap: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  noteIcon: { fontSize: 16 },
  noteText: { flex: 1, fontSize: FontSize.xs, color: Colors.textMuted, lineHeight: 18 },
});
