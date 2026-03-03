import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';

interface MotivationSimulationProps {
  streak: number;
  todayCompleted: boolean;
  goal: 'lose' | 'gain' | 'maintain';
  currentWeight: number;
  targetWeight: number;
  workoutDays?: number[];   // 실제 스케줄 요일 (0=일 ~ 6=토)
  completedSessions?: number; // 총 완료 세션 수
}

/**
 * 실제 운동 스케줄 기반 체중/체력 예측
 * weeklyFreq: 실제 주당 운동 횟수로 진행 속도 조정
 */
function buildProjections(
  goal: string,
  currentWeight: number,
  targetWeight: number,
  weeklyFreq: number,
) {
  // 주 5회 기준 체중 변화: 감량 -0.5kg/주, 증량 +0.3kg/주
  const baseWeekly = goal === 'lose' ? -0.5 : goal === 'gain' ? 0.3 : 0;
  const adjusted = baseWeekly * (weeklyFreq / 5); // 실제 빈도로 조정

  const proj1w = Math.round((currentWeight + adjusted) * 10) / 10;
  const proj1m = Math.round((currentWeight + adjusted * 4) * 10) / 10;
  const proj3m = Math.round((currentWeight + adjusted * 12) * 10) / 10;

  const weightDiff = targetWeight - currentWeight;
  const daysToGoal = adjusted !== 0 && weightDiff !== 0
    ? Math.abs(Math.round(weightDiff / (adjusted / 7)))
    : 0;

  return { proj1w, proj1m, proj3m, daysToGoal };
}

export default function MotivationSimulation({
  streak,
  todayCompleted,
  goal,
  currentWeight,
  targetWeight,
  workoutDays = [1, 2, 3, 4, 5],
  completedSessions = 0,
}: MotivationSimulationProps) {
  const weeklyFreq = workoutDays.length || 3;
  const { proj1w, proj1m, proj3m, daysToGoal } = buildProjections(
    goal, currentWeight, targetWeight, weeklyFreq,
  );
  const habitResetDays = Math.max(21, Math.round(streak * 0.7));

  // ── 운동 완료 후: 긍정 강화 ─────────────────────────────────────────────
  if (todayCompleted) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>오늘의 성과</Text>
        <View style={styles.completedCard}>
          <Text style={styles.completedEmoji}>🏆</Text>
          <Text style={styles.completedTitle}>잘했습니다! 스트릭 {streak}일</Text>
          <View style={styles.completedRow}>
            <PillStat label="1달 후" value={goal !== 'maintain' ? `${proj1m}kg` : '지구력 +15%'} positive />
            <PillStat label="3달 후" value={goal !== 'maintain' ? `${proj3m}kg` : '체형 변화'} positive />
            {daysToGoal > 0 && (
              <PillStat label={`목표(${targetWeight}kg)`} value={`${daysToGoal}일`} positive />
            )}
          </View>
          <Text style={styles.scheduleNote}>주 {weeklyFreq}회 스케줄 기준</Text>
        </View>
      </View>
    );
  }

  // ── 운동 전: 좌우 비교 시뮬레이션 ──────────────────────────────────────
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>습관 시뮬레이션</Text>
      <View style={styles.comparisonCard}>
        {/* 왼쪽: 안 하면 */}
        <View style={styles.leftCol}>
          <Text style={styles.headerSkip}>😰 안 하면</Text>

          {streak > 0 && (
            <Row label="스트릭" value={`🔥${streak}일 초기화`} danger />
          )}
          <Row label="내일 빠질 확률" value="62%" danger />
          <Row label="3일 연속" value="78%" danger />
          <Row label="1주 포기" value="91%" danger />
          <Row label="습관 재형성" value={`${habitResetDays}일`} danger />
        </View>

        <View style={styles.divider} />

        {/* 오른쪽: 하면! */}
        <View style={styles.rightCol}>
          <Text style={styles.headerDo}>💪 하면!</Text>

          <Row label="스트릭" value={`🔥${streak + 1}일`} positive />
          <Row
            label="1주 후"
            value={goal !== 'maintain' ? `${proj1w}kg` : '체력 +3%'}
            positive
          />
          <Row
            label="1달 후"
            value={goal !== 'maintain' ? `${proj1m}kg` : '지구력 +15%'}
            positive
          />
          <Row
            label="3달 후"
            value={goal !== 'maintain' ? `${proj3m}kg` : '체형 변화'}
            positive
          />
          {daysToGoal > 0 && (
            <Row label={`목표 D-`} value={`${daysToGoal}일`} positive />
          )}
        </View>
      </View>
      <Text style={styles.footnote}>
        주 {weeklyFreq}회 스케줄 기준 · 1일 빠지면 다음날 빠질 확률 2배 (habit science)
      </Text>
    </View>
  );
}

function Row({
  label,
  value,
  danger,
  positive,
}: {
  label: string;
  value: string;
  danger?: boolean;
  positive?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, danger && styles.valueDanger, positive && styles.valuePositive]}>
        {value}
      </Text>
    </View>
  );
}

function PillStat({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <View style={[styles.pill, positive && styles.pillPositive]}>
      <Text style={styles.pillLabel}>{label}</Text>
      <Text style={[styles.pillValue, positive && styles.pillValuePositive]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },

  // ── 완료 상태 ──────────────────────────────────────────────────────────
  completedCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    alignItems: 'center',
  },
  completedEmoji: { fontSize: 32, marginBottom: Spacing.xs },
  completedTitle: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: Spacing.md,
  },
  completedRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  scheduleNote: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },

  // ── 좌우 비교 카드 ──────────────────────────────────────────────────────
  comparisonCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.surface,
  },
  leftCol: {
    flex: 1,
    padding: Spacing.md,
    backgroundColor: Colors.accent + '08',
  },
  rightCol: {
    flex: 1,
    padding: Spacing.md,
    backgroundColor: Colors.primary + '08',
  },
  divider: {
    width: 1,
    backgroundColor: Colors.surface,
  },
  headerSkip: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.accent,
    marginBottom: Spacing.sm,
  },
  headerDo: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },

  // ── Row ──────────────────────────────────────────────────────────────
  row: {
    marginBottom: Spacing.xs + 2,
  },
  rowLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  rowValue: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text,
  },
  valueDanger: {
    color: Colors.accent,
  },
  valuePositive: {
    color: Colors.primary,
  },

  // ── Pill ─────────────────────────────────────────────────────────────
  pill: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    alignItems: 'center',
    minWidth: 70,
  },
  pillPositive: {
    backgroundColor: Colors.primary + '20',
  },
  pillLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  pillValue: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text,
  },
  pillValuePositive: {
    color: Colors.primary,
  },

  // ── 각주 ─────────────────────────────────────────────────────────────
  footnote: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },
});
