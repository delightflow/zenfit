import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

export default function SimulationScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>AI 체형 시뮬레이션</Text>
      <View style={styles.content}>
        <Text style={styles.emoji}>✨</Text>
        <Text style={styles.subtitle}>미래의 나를 미리 만나보세요</Text>
        <Text style={styles.description}>
          현재 체형 사진을 업로드하면{'\n'}
          AI가 운동 목표 달성 시 예상 체형을{'\n'}
          시뮬레이션해 드립니다.
        </Text>

        <View style={styles.timeline}>
          {['1개월 후', '3개월 후', '6개월 후'].map((label) => (
            <View key={label} style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <Text style={styles.timelineLabel}>{label}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>📸 체형 사진 촬영하기</Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          Gemini AI 기반 이미지 생성{'\n'}
          개인정보는 기기에만 저장됩니다
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  title: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text, marginBottom: Spacing.lg },
  content: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.xl,
  },
  emoji: { fontSize: 64, marginBottom: Spacing.md },
  subtitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  description: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: Spacing.xl },
  timeline: { flexDirection: 'row', gap: Spacing.xl, marginBottom: Spacing.xl },
  timelineItem: { alignItems: 'center', gap: Spacing.xs },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary },
  timelineLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  button: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  buttonText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.background },
  note: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },
});
