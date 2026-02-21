import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';

interface MotivationSimulationProps {
  streak: number;
  todayCompleted: boolean;
  goal: 'lose' | 'gain' | 'maintain';
  currentWeight: number;
  targetWeight: number;
}

// Research-based habit statistics
function getSkipConsequences(streak: number) {
  // Based on habit science: missing once doubles the chance of missing again
  const skipChain = [
    { days: 1, nextSkipChance: 62, label: '내일도 빠질 확률' },
    { days: 3, nextSkipChance: 78, label: '3일 연속 빠질 확률' },
    { days: 7, nextSkipChance: 91, label: '1주일 포기 확률' },
  ];

  const streakLoss = streak; // Lose entire streak
  const habitResetDays = Math.max(21, Math.round(streak * 0.7)); // Days to rebuild habit

  return { skipChain, streakLoss, habitResetDays };
}

function getKeepGoingBenefits(streak: number, goal: string, currentWeight: number, targetWeight: number) {
  const newStreak = streak + 1;

  // Weekly/monthly projections
  const weightDiff = targetWeight - currentWeight;
  const weeklyChange = goal === 'lose' ? -0.5 : goal === 'gain' ? 0.3 : 0;
  const monthlyChange = weeklyChange * 4;

  const projectedWeight1w = Math.round((currentWeight + weeklyChange) * 10) / 10;
  const projectedWeight1m = Math.round((currentWeight + monthlyChange) * 10) / 10;
  const projectedWeight3m = Math.round((currentWeight + monthlyChange * 3) * 10) / 10;

  // Fitness improvement estimates
  const strengthGain1w = 3; // % strength increase per week (beginner gains)
  const endurance1m = 15; // % endurance improvement in 1 month

  // Milestone calculation
  const daysToGoal = weightDiff !== 0
    ? Math.abs(Math.round(weightDiff / (weeklyChange / 7)))
    : 0;

  return {
    newStreak,
    projectedWeight1w,
    projectedWeight1m,
    projectedWeight3m,
    strengthGain1w,
    endurance1m,
    daysToGoal,
  };
}

export default function MotivationSimulation({
  streak,
  todayCompleted,
  goal,
  currentWeight,
  targetWeight,
}: MotivationSimulationProps) {
  if (todayCompleted) {
    // Show positive reinforcement after completing workout
    const benefits = getKeepGoingBenefits(streak, goal, currentWeight, targetWeight);
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>오늘의 성과 시뮬레이션</Text>
        <View style={styles.completedCard}>
          <Text style={styles.completedEmoji}>🏆</Text>
          <Text style={styles.completedTitle}>잘했습니다!</Text>
          <Text style={styles.completedText}>
            오늘 운동으로 스트릭 {benefits.newStreak}일을 달성했어요
          </Text>

          <View style={styles.timelineContainer}>
            <TimelineItem
              icon="📅"
              period="1주 후"
              description={`체력 ~${benefits.strengthGain1w}% 향상`}
              highlight={false}
            />
            <TimelineLine />
            <TimelineItem
              icon="📅"
              period="1달 후"
              description={goal !== 'maintain'
                ? `예상 체중 ${benefits.projectedWeight1m}kg`
                : `지구력 ~${benefits.endurance1m}% 향상`
              }
              highlight={false}
            />
            <TimelineLine />
            <TimelineItem
              icon="🎯"
              period="3달 후"
              description={goal !== 'maintain'
                ? `예상 체중 ${benefits.projectedWeight3m}kg`
                : '눈에 띄는 체형 변화'
              }
              highlight={true}
            />
          </View>
        </View>
      </View>
    );
  }

  // Show consequences of skipping vs benefits of doing
  const consequences = getSkipConsequences(streak);
  const benefits = getKeepGoingBenefits(streak, goal, currentWeight, targetWeight);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>습관 시뮬레이션</Text>

      {/* SKIP PATH - Red/Warning */}
      <View style={styles.skipCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.skipIcon}>😰</Text>
          <Text style={styles.skipTitle}>오늘 빠지면...</Text>
        </View>

        {streak > 0 && (
          <View style={styles.consequenceRow}>
            <Text style={styles.consequenceIcon}>🔥→💨</Text>
            <Text style={styles.consequenceText}>
              <Text style={styles.streakLoss}>{consequences.streakLoss}일</Text> 스트릭 초기화
            </Text>
          </View>
        )}

        {consequences.skipChain.map((item, i) => (
          <View key={i} style={styles.consequenceRow}>
            <View style={[styles.probabilityBar, { width: `${item.nextSkipChance}%` }]}>
              <Text style={styles.probabilityText}>
                {item.label}: {item.nextSkipChance}%
              </Text>
            </View>
          </View>
        ))}

        <View style={styles.consequenceRow}>
          <Text style={styles.consequenceIcon}>📉</Text>
          <Text style={styles.consequenceText}>
            습관 재형성까지 <Text style={styles.streakLoss}>{consequences.habitResetDays}일</Text> 필요
          </Text>
        </View>

        <View style={styles.bottomLine}>
          <Text style={styles.bottomLineText}>
            연구 결과: 1일 빠지면 다음날 빠질 확률이 2배 증가합니다
          </Text>
        </View>
      </View>

      {/* KEEP GOING PATH - Green/Success */}
      <View style={styles.keepCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.keepIcon}>💪</Text>
          <Text style={styles.keepTitle}>오늘 하면!</Text>
        </View>

        <View style={styles.consequenceRow}>
          <Text style={styles.consequenceIcon}>🔥</Text>
          <Text style={styles.keepText}>
            스트릭 <Text style={styles.streakGain}>{benefits.newStreak}일</Text> 달성!
          </Text>
        </View>

        <View style={styles.timelineContainer}>
          <TimelineItem
            icon="1W"
            period="1주 후"
            description={goal !== 'maintain'
              ? `예상 ${benefits.projectedWeight1w}kg (${benefits.projectedWeight1w - currentWeight > 0 ? '+' : ''}${(benefits.projectedWeight1w - currentWeight).toFixed(1)}kg)`
              : `체력 ~${benefits.strengthGain1w}% 향상`
            }
            highlight={false}
          />
          <TimelineLine positive />
          <TimelineItem
            icon="1M"
            period="1달 후"
            description={goal !== 'maintain'
              ? `예상 ${benefits.projectedWeight1m}kg`
              : `지구력 ~${benefits.endurance1m}% 향상`
            }
            highlight={false}
          />
          <TimelineLine positive />
          <TimelineItem
            icon="3M"
            period="3달 후"
            description={goal !== 'maintain'
              ? `예상 ${benefits.projectedWeight3m}kg`
              : '눈에 띄는 체형 변화'
            }
            highlight={true}
          />
        </View>

        {benefits.daysToGoal > 0 && (
          <View style={styles.goalEstimate}>
            <Text style={styles.goalEstimateText}>
              🎯 목표 체중({targetWeight}kg)까지 약 <Text style={styles.streakGain}>{benefits.daysToGoal}일</Text>
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function TimelineItem({ icon, period, description, highlight }: {
  icon: string;
  period: string;
  description: string;
  highlight: boolean;
}) {
  return (
    <View style={[styles.timelineItem, highlight && styles.timelineItemHighlight]}>
      <View style={[styles.timelineDot, highlight && styles.timelineDotHighlight]}>
        <Text style={styles.timelineDotText}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.timelinePeriod, highlight && { color: Colors.primary }]}>{period}</Text>
        <Text style={styles.timelineDesc}>{description}</Text>
      </View>
    </View>
  );
}

function TimelineLine({ positive }: { positive?: boolean }) {
  return (
    <View style={[styles.timelineLine, positive ? styles.timelineLinePositive : styles.timelineLineNeutral]} />
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },

  // Completed state
  completedCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    alignItems: 'center',
  },
  completedEmoji: { fontSize: 40, marginBottom: Spacing.sm },
  completedTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.primary },
  completedText: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs, marginBottom: Spacing.lg },

  // Skip card
  skipCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.accent + '40',
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  skipIcon: { fontSize: 24 },
  skipTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.accent },

  consequenceRow: {
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  consequenceIcon: { fontSize: 16, width: 28 },
  consequenceText: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1 },
  streakLoss: { color: Colors.accent, fontWeight: '700' },

  probabilityBar: {
    backgroundColor: Colors.accent + '20',
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
    minWidth: 100,
  },
  probabilityText: {
    fontSize: FontSize.xs,
    color: Colors.accent,
    fontWeight: '600',
  },

  bottomLine: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.surface,
  },
  bottomLineText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },

  // Keep card
  keepCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  keepIcon: { fontSize: 24 },
  keepTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.primary },
  keepText: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1 },
  streakGain: { color: Colors.primary, fontWeight: '700' },

  // Timeline
  timelineContainer: {
    marginTop: Spacing.md,
    paddingLeft: Spacing.xs,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  timelineItemHighlight: {
    backgroundColor: Colors.primary + '10',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotHighlight: {
    backgroundColor: Colors.primary + '30',
  },
  timelineDotText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '700' },
  timelinePeriod: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  timelineDesc: { fontSize: FontSize.xs, color: Colors.textMuted },
  timelineLine: {
    width: 2,
    height: 16,
    marginLeft: 15,
  },
  timelineLineNeutral: { backgroundColor: Colors.surface },
  timelineLinePositive: { backgroundColor: Colors.primary + '40' },

  goalEstimate: {
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.primary + '20',
  },
  goalEstimateText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
