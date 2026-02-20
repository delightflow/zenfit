import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { WorkoutLog } from '../store/useStore';

interface Props {
  workoutLogs: WorkoutLog[];
}

export default function WorkoutCalendar({ workoutLogs }: Props) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  // Get days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sun

  // Create date strings for quick lookup
  const logDates = new Set(workoutLogs.map((l) => l.date));

  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  // Calculate this month stats
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  const thisMonthLogs = workoutLogs.filter((l) => l.date.startsWith(monthStr));
  const thisMonthWorkouts = thisMonthLogs.length;
  const thisMonthCalories = thisMonthLogs.reduce((sum, l) => sum + l.calories, 0);
  const thisMonthMinutes = thisMonthLogs.reduce((sum, l) => sum + l.duration, 0);

  // Build calendar grid
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const todayDate = today.getDate();

  return (
    <View style={styles.container}>
      <Text style={styles.monthTitle}>{year}년 {monthNames[month]}</Text>

      {/* Monthly stats */}
      <View style={styles.monthStats}>
        <View style={styles.monthStat}>
          <Text style={styles.monthStatValue}>{thisMonthWorkouts}</Text>
          <Text style={styles.monthStatLabel}>운동 횟수</Text>
        </View>
        <View style={styles.monthStat}>
          <Text style={styles.monthStatValue}>{thisMonthMinutes}</Text>
          <Text style={styles.monthStatLabel}>총 시간(분)</Text>
        </View>
        <View style={styles.monthStat}>
          <Text style={[styles.monthStatValue, { color: Colors.accent }]}>{thisMonthCalories}</Text>
          <Text style={styles.monthStatLabel}>kcal</Text>
        </View>
      </View>

      {/* Day names */}
      <View style={styles.dayNameRow}>
        {dayNames.map((d) => (
          <Text key={d} style={[styles.dayNameText, d === '일' && { color: Colors.accent }]}>
            {d}
          </Text>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.calendarGrid}>
        {cells.map((day, i) => {
          if (day === null) return <View key={i} style={styles.cell} />;

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isWorkout = logDates.has(dateStr);
          const isToday = day === todayDate;
          const isFuture = day > todayDate;

          return (
            <View key={i} style={[styles.cell, isToday && styles.cellToday]}>
              <Text style={[
                styles.cellText,
                isWorkout && styles.cellTextWorkout,
                isFuture && styles.cellTextFuture,
                isToday && styles.cellTextToday,
              ]}>
                {day}
              </Text>
              {isWorkout && <View style={styles.workoutDot} />}
            </View>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={styles.workoutDot} />
          <Text style={styles.legendText}>운동 완료</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.workoutDot, { backgroundColor: Colors.surface }]} />
          <Text style={styles.legendText}>미완료</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  monthTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  monthStats: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  monthStat: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  monthStatValue: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.primary },
  monthStatLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  dayNameRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  dayNameText: {
    flex: 1,
    textAlign: 'center',
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellToday: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
  },
  cellText: {
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  cellTextWorkout: {
    fontWeight: '700',
    color: Colors.primary,
  },
  cellTextFuture: {
    color: Colors.textMuted,
    opacity: 0.5,
  },
  cellTextToday: {
    fontWeight: '700',
    color: Colors.primary,
  },
  workoutDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    gap: Spacing.lg,
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendText: { fontSize: 10, color: Colors.textMuted },
});
