import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

export default function AnalysisScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>분석</Text>
      <View style={styles.placeholder}>
        <Text style={styles.emoji}>📊</Text>
        <Text style={styles.placeholderTitle}>운동 분석 (Phase 2)</Text>
        <Text style={styles.placeholderText}>
          운동 기록이 쌓이면 부위별 근력 차트,{'\n'}운동 균형도, 주간 통계를 확인할 수 있어요.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  title: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text, marginBottom: Spacing.lg },
  placeholder: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.xl,
  },
  emoji: { fontSize: 64, marginBottom: Spacing.md },
  placeholderTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  placeholderText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
