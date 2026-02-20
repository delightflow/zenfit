import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { useStore } from '../../store/useStore';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';

interface SimResult {
  month: number;
  weight: number;
  bodyFat: number;
  muscle: number;
  description: string;
}

function calculateSimulation(
  weight: number, targetWeight: number, height: number, age: number,
  gender: 'male' | 'female', goal: string, streak: number, totalWorkouts: number
): SimResult[] {
  // Base calculations
  const bmi = weight / ((height / 100) ** 2);
  const baseFat = gender === 'male'
    ? (1.20 * bmi + 0.23 * age - 16.2)
    : (1.20 * bmi + 0.23 * age - 5.4);
  const bodyFat = Math.max(5, Math.min(45, baseFat));
  const muscleMass = weight * (1 - bodyFat / 100) * 0.75;

  // Consistency factor (based on streak and total workouts)
  const consistency = Math.min(1.0, (streak * 0.05 + totalWorkouts * 0.02));
  const effectiveFactor = 0.5 + consistency * 0.5; // 50-100% effectiveness

  const results: SimResult[] = [];

  for (let m = 0; m <= 6; m++) {
    let w = weight;
    let bf = bodyFat;
    let mm = muscleMass;

    if (goal === 'lose') {
      // Lose ~0.5-1kg/month with exercise
      w = weight - (m * 0.8 * effectiveFactor);
      bf = bodyFat - (m * 0.7 * effectiveFactor);
      mm = muscleMass + (m * 0.15 * effectiveFactor);
    } else if (goal === 'gain') {
      // Gain ~0.3-0.5kg muscle/month
      w = weight + (m * 0.4 * effectiveFactor);
      bf = bodyFat - (m * 0.3 * effectiveFactor);
      mm = muscleMass + (m * 0.35 * effectiveFactor);
    } else {
      w = weight - (m * 0.2 * effectiveFactor);
      bf = bodyFat - (m * 0.4 * effectiveFactor);
      mm = muscleMass + (m * 0.2 * effectiveFactor);
    }

    // Descriptions
    const descriptions = [
      '현재 상태입니다.',
      '체지방이 줄기 시작하고 근력이 향상됩니다.',
      '옷이 편해지기 시작합니다. 체력이 눈에 띄게 좋아집니다.',
      '주변에서 변화를 알아챕니다. 근육이 더 선명해집니다.',
      '체형 변화가 확실하게 보입니다. 자신감이 급상승합니다.',
      '거의 목표에 도달합니다. 운동이 생활의 일부가 됩니다.',
      '목표 달성! 새로운 라이프스타일이 완성되었습니다.',
    ];

    results.push({
      month: m,
      weight: Math.round(w * 10) / 10,
      bodyFat: Math.round(Math.max(5, bf) * 10) / 10,
      muscle: Math.round(mm * 10) / 10,
      description: descriptions[m],
    });
  }

  return results;
}

function MiniChart({ data, color, label, unit }: {
  data: number[], color: string, label: string, unit: string
}) {
  const chartW = 300;
  const chartH = 80;
  const padding = 30;
  const min = Math.min(...data) - 1;
  const max = Math.max(...data) + 1;
  const range = max - min || 1;

  return (
    <View style={styles.miniChartContainer}>
      <Text style={styles.miniChartLabel}>{label}</Text>
      <Svg width={chartW} height={chartH + 20}>
        {/* Y labels */}
        <SvgText x={0} y={15} fill={Colors.textMuted} fontSize={10}>
          {max.toFixed(1)}
        </SvgText>
        <SvgText x={0} y={chartH + 5} fill={Colors.textMuted} fontSize={10}>
          {min.toFixed(1)}
        </SvgText>

        {/* Lines + dots */}
        {data.map((val, i) => {
          const x = padding + (i / (data.length - 1)) * (chartW - padding * 2);
          const y = 10 + ((max - val) / range) * (chartH - 10);
          const nextI = i + 1;
          return (
            <View key={i}>
              {nextI < data.length && (
                <Line
                  x1={x}
                  y1={y}
                  x2={padding + (nextI / (data.length - 1)) * (chartW - padding * 2)}
                  y2={10 + ((max - data[nextI]) / range) * (chartH - 10)}
                  stroke={color}
                  strokeWidth={2}
                />
              )}
              <Rect
                x={x - 3} y={y - 3} width={6} height={6} rx={3}
                fill={i === 0 ? Colors.textMuted : color}
              />
              <SvgText
                x={x} y={chartH + 18}
                fill={Colors.textMuted} fontSize={9} textAnchor="middle"
              >
                {i === 0 ? '현재' : `${i}개월`}
              </SvgText>
            </View>
          );
        })}
      </Svg>
      <Text style={styles.miniChartResult}>
        {data[0].toFixed(1)} → {data[data.length - 1].toFixed(1)} {unit}
        ({data[data.length - 1] > data[0] ? '+' : ''}{(data[data.length - 1] - data[0]).toFixed(1)})
      </Text>
    </View>
  );
}

export default function SimulationScreen() {
  const profile = useStore((s) => s.profile);
  const streak = useStore((s) => s.streak);
  const workoutLogs = useStore((s) => s.workoutLogs);
  const [simResults, setSimResults] = useState<SimResult[] | null>(null);
  const [loading, setLoading] = useState(false);

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>AI 체형 시뮬레이션</Text>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderEmoji}>✨</Text>
          <Text style={styles.placeholderText}>온보딩을 먼저 완료해주세요</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSimulate = () => {
    setLoading(true);
    // Simulate a brief loading for UX
    setTimeout(() => {
      const results = calculateSimulation(
        profile.weight, profile.targetWeight, profile.height, profile.age,
        profile.gender, profile.goal, streak, workoutLogs.length
      );
      setSimResults(results);
      setLoading(false);
    }, 1000);
  };

  const goalLabel = profile.goal === 'lose' ? '체중 감량' : profile.goal === 'gain' ? '근육 증가' : '체력 향상';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>AI 체형 시뮬레이션</Text>
        <Text style={styles.subtitle}>운동을 꾸준히 하면 어떻게 변할까?</Text>

        {/* Current status card */}
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>현재 상태</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <Text style={styles.statusValue}>{profile.weight}</Text>
              <Text style={styles.statusUnit}>kg</Text>
            </View>
            <Text style={styles.statusArrow}>→</Text>
            <View style={styles.statusItem}>
              <Text style={[styles.statusValue, { color: Colors.primary }]}>{profile.targetWeight}</Text>
              <Text style={styles.statusUnit}>kg 목표</Text>
            </View>
          </View>
          <View style={styles.statusInfo}>
            <Text style={styles.statusInfoText}>🎯 {goalLabel} | 🔥 {streak}일 연속</Text>
            <Text style={styles.statusInfoText}>📅 총 {workoutLogs.length}회 운동 완료</Text>
          </View>
        </View>

        {/* Simulate button */}
        {!simResults && (
          <TouchableOpacity
            style={styles.simButton}
            onPress={handleSimulate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.background} />
            ) : (
              <Text style={styles.simButtonText}>🔮 6개월 후 시뮬레이션 시작</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Results */}
        {simResults && (
          <>
            {/* Charts */}
            <MiniChart
              data={simResults.map((r) => r.weight)}
              color={Colors.primary}
              label="체중 변화"
              unit="kg"
            />
            <MiniChart
              data={simResults.map((r) => r.bodyFat)}
              color={Colors.accent}
              label="체지방률 변화"
              unit="%"
            />
            <MiniChart
              data={simResults.map((r) => r.muscle)}
              color="#4DA6FF"
              label="근육량 변화"
              unit="kg"
            />

            {/* Timeline */}
            <View style={styles.timeline}>
              {simResults.map((r, i) => (
                <View key={i} style={styles.timelineItem}>
                  <View style={styles.timelineLine}>
                    <View style={[
                      styles.timelineDot,
                      i === 0 && styles.timelineDotCurrent,
                      i === simResults.length - 1 && styles.timelineDotGoal,
                    ]} />
                    {i < simResults.length - 1 && <View style={styles.timelineConnector} />}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineMonth}>
                      {i === 0 ? '현재' : `${i}개월 후`}
                    </Text>
                    <Text style={styles.timelineDesc}>{r.description}</Text>
                    <View style={styles.timelineStats}>
                      <Text style={styles.timelineStat}>{r.weight}kg</Text>
                      <Text style={styles.timelineStat}>체지방 {r.bodyFat}%</Text>
                      <Text style={styles.timelineStat}>근육 {r.muscle}kg</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Motivation */}
            <View style={styles.motivationBox}>
              <Text style={styles.motivationEmoji}>💪</Text>
              <Text style={styles.motivationText}>
                {streak > 0
                  ? `지금까지 ${streak}일 연속으로 해냈어요!\n이 속도라면 목표 달성이 더 빨라질 수 있습니다.`
                  : '오늘부터 시작하세요!\n꾸준함이 최고의 무기입니다.'}
              </Text>
            </View>

            {/* Reset button */}
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => setSimResults(null)}
            >
              <Text style={styles.resetBtnText}>다시 시뮬레이션</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Note */}
        <View style={styles.noteCard}>
          <Text style={styles.noteIcon}>💡</Text>
          <Text style={styles.noteText}>
            시뮬레이션은 운동 꾸준함, 체질, 식단에 따라 달라집니다.{'\n'}
            AI 기반 체형 이미지 생성 기능이 곧 업데이트됩니다.
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
  placeholderEmoji: { fontSize: 64, marginBottom: Spacing.md },
  placeholderText: { fontSize: FontSize.md, color: Colors.textSecondary },

  // Status card
  statusCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  statusTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
  statusRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  statusItem: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  statusValue: { fontSize: FontSize.hero, fontWeight: '800', color: Colors.text },
  statusUnit: { fontSize: FontSize.sm, color: Colors.textMuted },
  statusArrow: { fontSize: FontSize.xl, color: Colors.primary },
  statusInfo: { gap: 4 },
  statusInfoText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },

  // Simulate button
  simButton: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md, alignItems: 'center', marginBottom: Spacing.lg,
  },
  simButtonText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.background },

  // Mini charts
  miniChartContainer: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md,
    marginBottom: Spacing.md, alignItems: 'center',
  },
  miniChartLabel: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm, alignSelf: 'flex-start' },
  miniChartResult: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600', marginTop: Spacing.xs },

  // Timeline
  timeline: { marginBottom: Spacing.md },
  timelineItem: { flexDirection: 'row', minHeight: 80 },
  timelineLine: { width: 24, alignItems: 'center' },
  timelineDot: {
    width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.surface,
    borderWidth: 2, borderColor: Colors.textMuted,
  },
  timelineDotCurrent: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  timelineDotGoal: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  timelineConnector: { flex: 1, width: 2, backgroundColor: Colors.surface },
  timelineContent: {
    flex: 1, paddingLeft: Spacing.sm, paddingBottom: Spacing.md,
  },
  timelineMonth: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text },
  timelineDesc: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  timelineStats: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xs },
  timelineStat: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '600' },

  // Motivation
  motivationBox: {
    backgroundColor: Colors.streakBg, borderRadius: BorderRadius.lg, padding: Spacing.lg,
    alignItems: 'center', marginBottom: Spacing.md, borderWidth: 1, borderColor: '#4D3500',
  },
  motivationEmoji: { fontSize: 32, marginBottom: Spacing.sm },
  motivationText: { fontSize: FontSize.sm, color: Colors.streak, textAlign: 'center', lineHeight: 20 },

  // Reset
  resetBtn: {
    paddingVertical: Spacing.sm, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.primary, borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  resetBtnText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '600' },

  noteCard: {
    flexDirection: 'row', gap: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md,
  },
  noteIcon: { fontSize: 16 },
  noteText: { flex: 1, fontSize: FontSize.xs, color: Colors.textMuted, lineHeight: 18 },
});
