import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { useStore } from '../../store/useStore';

export default function ProfileScreen() {
  const profile = useStore((s) => s.profile);
  const streak = useStore((s) => s.streak);
  const bestStreak = useStore((s) => s.bestStreak);
  const workoutLogs = useStore((s) => s.workoutLogs);

  const goalLabels = { lose: '체중 감량', gain: '근육 증가', maintain: '체력 유지' };
  const expLabels = { beginner: '초보', intermediate: '중급', advanced: '고급' };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>프로필</Text>

        <View style={styles.card}>
          <Text style={styles.avatar}>🧑‍💪</Text>
          <Text style={styles.name}>{profile?.name || '사용자'}</Text>
          <Text style={styles.goal}>{goalLabels[profile?.goal || 'lose']} | {expLabels[profile?.experience || 'beginner']}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>🔥 {streak}</Text>
            <Text style={styles.statLabel}>현재 스트릭</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>🏆 {bestStreak}</Text>
            <Text style={styles.statLabel}>최고 기록</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>📅 {workoutLogs.length}</Text>
            <Text style={styles.statLabel}>총 운동</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>신체 정보</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>키</Text>
            <Text style={styles.infoValue}>{profile?.height || '-'} cm</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>현재 체중</Text>
            <Text style={styles.infoValue}>{profile?.weight || '-'} kg</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>목표 체중</Text>
            <Text style={styles.infoValue}>{profile?.targetWeight || '-'} kg</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>나이</Text>
            <Text style={styles.infoValue}>{profile?.age || '-'}세</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.subscribeButton}>
          <Text style={styles.subscribeText}>⭐ 프리미엄 구독 (광고 제거)</Text>
        </TouchableOpacity>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  title: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text, marginBottom: Spacing.lg },
  card: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.lg,
    alignItems: 'center', marginBottom: Spacing.md,
  },
  avatar: { fontSize: 64, marginBottom: Spacing.sm },
  name: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  goal: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  statCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: BorderRadius.md,
    padding: Spacing.md, alignItems: 'center',
  },
  statValue: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.xs },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md, alignSelf: 'flex-start' },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', width: '100%',
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.cardBorder,
  },
  infoLabel: { fontSize: FontSize.md, color: Colors.textSecondary },
  infoValue: { fontSize: FontSize.md, color: Colors.text, fontWeight: '600' },
  subscribeButton: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.primary,
  },
  subscribeText: { fontSize: FontSize.md, color: Colors.primary, fontWeight: '600' },
});
