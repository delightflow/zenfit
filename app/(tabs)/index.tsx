import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { useStore } from '../../store/useStore';
import { router } from 'expo-router';
import { getRecommendedParts, BODY_PART_LABELS, BODY_PART_EMOJI } from '../../data/exercises';

const { width } = Dimensions.get('window');

const MOTIVATION_MESSAGES = [
  { skip: '오늘 빠지면 스트릭이 초기화됩니다!', do: '지금 시작하면 내일의 나에게 감사할 거예요' },
  { skip: '근육은 쉬는 동안 사라지지만, 습관은 더 빨리 사라집니다', do: '30분만 투자하세요. 그게 전부입니다' },
  { skip: '어제의 노력이 물거품이 될 수 있어요', do: '완벽하지 않아도 됩니다. 시작만 하세요' },
  { skip: '포기는 한 번의 스킵에서 시작됩니다', do: '오늘의 운동이 한 달 후의 몸을 만듭니다' },
  { skip: '스트릭을 유지하는 사람이 목표를 달성합니다', do: '매일 조금씩, 그게 비결입니다' },
];

function StreakCard() {
  const streak = useStore((s) => s.streak);
  const bestStreak = useStore((s) => s.bestStreak);
  const todayCompleted = useStore((s) => s.todayCompleted);

  return (
    <View style={styles.streakCard}>
      <View style={styles.streakHeader}>
        <Text style={styles.streakEmoji}>🔥</Text>
        <View>
          <Text style={styles.streakCount}>{streak}</Text>
          <Text style={styles.streakLabel}>일 연속</Text>
        </View>
      </View>
      <View style={styles.streakStats}>
        <View style={styles.streakStat}>
          <Text style={styles.streakStatValue}>{bestStreak}</Text>
          <Text style={styles.streakStatLabel}>최고 기록</Text>
        </View>
        <View style={styles.streakDivider} />
        <View style={styles.streakStat}>
          <Text style={[styles.streakStatValue, { color: todayCompleted ? Colors.success : Colors.accent }]}>
            {todayCompleted ? '완료!' : '미완료'}
          </Text>
          <Text style={styles.streakStatLabel}>오늘</Text>
        </View>
      </View>
    </View>
  );
}

function WeekView() {
  const lastWorkoutDate = useStore((s) => s.lastWorkoutDate);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const today = new Date();
  const todayDay = today.getDay();

  return (
    <View style={styles.weekView}>
      {days.map((day, i) => {
        const isToday = i === todayDay;
        const isPast = i < todayDay;
        // Simple check: mark today as done if lastWorkoutDate matches
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const isDone = isToday && lastWorkoutDate === todayStr;

        return (
          <View key={day} style={[styles.weekDay, isToday && styles.weekDayToday]}>
            <Text style={[styles.weekDayText, isToday && styles.weekDayTextToday]}>{day}</Text>
            <View style={[
              styles.weekDot,
              isDone && styles.weekDotDone,
              isToday && !isDone && styles.weekDotToday,
              isPast && !isDone && styles.weekDotMissed,
            ]}>
              {isDone && <Text style={{ fontSize: 10 }}>✓</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function MotivationCard() {
  const todayCompleted = useStore((s) => s.todayCompleted);
  const streak = useStore((s) => s.streak);
  const msg = MOTIVATION_MESSAGES[streak % MOTIVATION_MESSAGES.length];

  if (todayCompleted) {
    return (
      <View style={[styles.motivationCard, { borderColor: Colors.success }]}>
        <Text style={styles.motivationEmoji}>🎉</Text>
        <Text style={styles.motivationTitle}>오늘 운동 완료!</Text>
        <Text style={styles.motivationText}>잘했어요! 내일도 이 기세를 유지하세요.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.motivationCard, { borderColor: Colors.warning }]}>
      <Text style={styles.motivationEmoji}>⚡</Text>
      <Text style={styles.motivationTitle}>{msg.do}</Text>
      <Text style={[styles.motivationText, { color: Colors.accent }]}>⚠️ {msg.skip}</Text>
    </View>
  );
}

function TodayWorkout() {
  const todayCompleted = useStore((s) => s.todayCompleted);
  const profile = useStore((s) => s.profile);

  const dayOfWeek = new Date().getDay();
  const parts = profile ? getRecommendedParts(dayOfWeek, profile.goal) : [];

  return (
    <View style={styles.todayCard}>
      <View style={styles.todayHeader}>
        <Text style={styles.todayTitle}>오늘의 운동</Text>
        <Text style={styles.todaySubtitle}>
          {profile?.goal === 'lose' ? '체중 감량 플랜' : profile?.goal === 'gain' ? '근육 증가 플랜' : '체력 향상 플랜'}
        </Text>
      </View>

      <View style={styles.todayParts}>
        {parts.map((part) => (
          <View key={part} style={styles.partChip}>
            <Text style={styles.partChipText}>{BODY_PART_EMOJI[part]} {BODY_PART_LABELS[part]}</Text>
          </View>
        ))}
      </View>

      <View style={styles.todayStats}>
        <View style={styles.todayStat}>
          <Text style={styles.todayStatIcon}>🏋️</Text>
          <Text style={styles.todayStatValue}>5~6개 운동</Text>
        </View>
        <View style={styles.todayStat}>
          <Text style={styles.todayStatIcon}>⏱️</Text>
          <Text style={styles.todayStatValue}>~30분</Text>
        </View>
        <View style={styles.todayStat}>
          <Text style={styles.todayStatIcon}>🔥</Text>
          <Text style={styles.todayStatValue}>~400 kcal</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.startButton, todayCompleted && styles.startButtonDone]}
        disabled={todayCompleted}
        onPress={() => router.push('/workout')}
      >
        <Text style={styles.startButtonText}>
          {todayCompleted ? '✅ 오늘 운동 완료!' : '🚀 운동 시작하기'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function HomeScreen() {
  const profile = useStore((s) => s.profile);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>안녕하세요, {profile?.name || '회원'}님 👋</Text>
            <Text style={styles.subGreeting}>오늘도 함께 성장해요!</Text>
          </View>
        </View>

        <StreakCard />
        <WeekView />
        <MotivationCard />
        <TodayWorkout />

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  greeting: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
  },
  subGreeting: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },

  // Streak Card
  streakCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.streakBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#4D3500',
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  streakEmoji: {
    fontSize: 48,
  },
  streakCount: {
    fontSize: FontSize.hero,
    fontWeight: '800',
    color: Colors.streak,
  },
  streakLabel: {
    fontSize: FontSize.md,
    color: Colors.streak,
    fontWeight: '600',
    marginTop: -4,
  },
  streakStats: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#4D3500',
  },
  streakStat: {
    flex: 1,
    alignItems: 'center',
  },
  streakStatValue: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.streak,
  },
  streakStatLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  streakDivider: {
    width: 1,
    backgroundColor: '#4D3500',
  },

  // Week View
  weekView: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  weekDay: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  weekDayToday: {},
  weekDayText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  weekDayTextToday: {
    color: Colors.primary,
    fontWeight: '700',
  },
  weekDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDotDone: {
    backgroundColor: Colors.success,
  },
  weekDotToday: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  weekDotMissed: {
    backgroundColor: Colors.surface,
  },

  // Motivation
  motivationCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
  },
  motivationEmoji: {
    fontSize: 28,
    marginBottom: Spacing.sm,
  },
  motivationTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  motivationText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  // Today's Workout
  todayCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  todayHeader: {
    marginBottom: Spacing.md,
  },
  todayTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
  },
  todaySubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  todayParts: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  partChip: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  partChipText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  todayStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  todayStat: {
    alignItems: 'center',
  },
  todayStatIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  todayStatValue: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  startButtonDone: {
    backgroundColor: Colors.surface,
  },
  startButtonText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.background,
  },
});
