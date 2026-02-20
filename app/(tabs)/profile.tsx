import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { useStore, UserProfile } from '../../store/useStore';

export default function ProfileScreen() {
  const profile = useStore((s) => s.profile);
  const setProfile = useStore((s) => s.setProfile);
  const streak = useStore((s) => s.streak);
  const bestStreak = useStore((s) => s.bestStreak);
  const workoutLogs = useStore((s) => s.workoutLogs);
  const [editMode, setEditMode] = useState(false);
  const [editProfile, setEditProfile] = useState<UserProfile | null>(null);

  const goalLabels: Record<string, string> = { lose: '체중 감량', gain: '근육 증가', maintain: '체력 유지' };
  const expLabels: Record<string, string> = { beginner: '초보', intermediate: '중급', advanced: '고급' };
  const genderLabels: Record<string, string> = { male: '남성', female: '여성' };

  const totalCalories = workoutLogs.reduce((sum, l) => sum + l.calories, 0);
  const totalMinutes = workoutLogs.reduce((sum, l) => sum + l.duration, 0);

  const handleEdit = () => {
    setEditProfile(profile ? { ...profile } : null);
    setEditMode(true);
  };

  const handleSave = () => {
    if (editProfile) {
      setProfile(editProfile);
    }
    setEditMode(false);
  };

  const handleResetOnboarding = () => {
    Alert.alert(
      '온보딩 초기화',
      '프로필과 운동 기록이 모두 삭제됩니다. 정말 초기화하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '초기화',
          style: 'destructive',
          onPress: () => {
            useStore.getState().setOnboarded(false);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>프로필</Text>

        {/* Avatar & Name */}
        <View style={styles.card}>
          <Text style={styles.avatar}>{profile?.gender === 'female' ? '💪🏻' : '🧑‍💪'}</Text>
          <Text style={styles.name}>{profile?.name || '사용자'}</Text>
          <Text style={styles.goal}>
            {goalLabels[profile?.goal || 'lose']} | {expLabels[profile?.experience || 'beginner']}
          </Text>
          <TouchableOpacity style={styles.editBtn} onPress={handleEdit}>
            <Text style={styles.editBtnText}>프로필 수정</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
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

        {/* Lifetime stats */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>누적 기록</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>총 운동 시간</Text>
            <Text style={styles.infoValue}>{totalMinutes}분 ({Math.round(totalMinutes / 60)}시간)</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>총 소모 칼로리</Text>
            <Text style={styles.infoValue}>{totalCalories.toLocaleString()} kcal</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>평균 운동 시간</Text>
            <Text style={styles.infoValue}>
              {workoutLogs.length > 0 ? Math.round(totalMinutes / workoutLogs.length) : 0}분
            </Text>
          </View>
        </View>

        {/* Body info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>신체 정보</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>성별</Text>
            <Text style={styles.infoValue}>{genderLabels[profile?.gender || 'male']}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>나이</Text>
            <Text style={styles.infoValue}>{profile?.age || '-'}세</Text>
          </View>
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
            <Text style={styles.infoLabel}>운동 요일</Text>
            <Text style={styles.infoValue}>
              {profile?.workoutDays?.map((d) => ['일', '월', '화', '수', '목', '금', '토'][d]).join(', ') || '-'}
            </Text>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>설정</Text>
          <TouchableOpacity style={styles.settingRow}>
            <Text style={styles.settingLabel}>⭐ 프리미엄 구독 (광고 제거)</Text>
            <Text style={styles.settingArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingRow} onPress={handleResetOnboarding}>
            <Text style={[styles.settingLabel, { color: Colors.accent }]}>🔄 온보딩 다시 하기</Text>
            <Text style={styles.settingArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* App info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>ZenFit v1.0.0</Text>
          <Text style={styles.appInfoText}>Duolingo-style Fitness</Text>
        </View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editMode} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setEditMode(false)}>
                <Text style={styles.modalCancel}>취소</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>프로필 수정</Text>
              <TouchableOpacity onPress={handleSave}>
                <Text style={styles.modalSave}>저장</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {editProfile && (
                <>
                  <Text style={styles.editLabel}>이름</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editProfile.name}
                    onChangeText={(v) => setEditProfile({ ...editProfile, name: v })}
                    placeholder="이름"
                    placeholderTextColor={Colors.textMuted}
                  />

                  <Text style={styles.editLabel}>나이</Text>
                  <TextInput
                    style={styles.editInput}
                    value={String(editProfile.age)}
                    onChangeText={(v) => setEditProfile({ ...editProfile, age: parseInt(v) || 0 })}
                    keyboardType="numeric"
                    placeholderTextColor={Colors.textMuted}
                  />

                  <Text style={styles.editLabel}>키 (cm)</Text>
                  <TextInput
                    style={styles.editInput}
                    value={String(editProfile.height)}
                    onChangeText={(v) => setEditProfile({ ...editProfile, height: parseInt(v) || 0 })}
                    keyboardType="numeric"
                    placeholderTextColor={Colors.textMuted}
                  />

                  <Text style={styles.editLabel}>현재 체중 (kg)</Text>
                  <TextInput
                    style={styles.editInput}
                    value={String(editProfile.weight)}
                    onChangeText={(v) => setEditProfile({ ...editProfile, weight: parseFloat(v) || 0 })}
                    keyboardType="numeric"
                    placeholderTextColor={Colors.textMuted}
                  />

                  <Text style={styles.editLabel}>목표 체중 (kg)</Text>
                  <TextInput
                    style={styles.editInput}
                    value={String(editProfile.targetWeight)}
                    onChangeText={(v) => setEditProfile({ ...editProfile, targetWeight: parseFloat(v) || 0 })}
                    keyboardType="numeric"
                    placeholderTextColor={Colors.textMuted}
                  />

                  <Text style={styles.editLabel}>목표</Text>
                  <View style={styles.optionRow}>
                    {(['lose', 'gain', 'maintain'] as const).map((g) => (
                      <TouchableOpacity
                        key={g}
                        style={[styles.optionBtn, editProfile.goal === g && styles.optionBtnActive]}
                        onPress={() => setEditProfile({ ...editProfile, goal: g })}
                      >
                        <Text style={[styles.optionText, editProfile.goal === g && styles.optionTextActive]}>
                          {goalLabels[g]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.editLabel}>경험 수준</Text>
                  <View style={styles.optionRow}>
                    {(['beginner', 'intermediate', 'advanced'] as const).map((e) => (
                      <TouchableOpacity
                        key={e}
                        style={[styles.optionBtn, editProfile.experience === e && styles.optionBtnActive]}
                        onPress={() => setEditProfile({ ...editProfile, experience: e })}
                      >
                        <Text style={[styles.optionText, editProfile.experience === e && styles.optionTextActive]}>
                          {expLabels[e]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  editBtn: {
    marginTop: Spacing.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xs,
    borderWidth: 1, borderColor: Colors.primary, borderRadius: BorderRadius.full,
  },
  editBtnText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '600' },

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

  settingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    width: '100%', paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.cardBorder,
  },
  settingLabel: { fontSize: FontSize.md, color: Colors.text },
  settingArrow: { fontSize: FontSize.md, color: Colors.textMuted },

  appInfo: { alignItems: 'center', marginTop: Spacing.lg },
  appInfoText: { fontSize: FontSize.xs, color: Colors.textMuted },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.card, borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl, padding: Spacing.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalCancel: { color: Colors.textMuted, fontSize: FontSize.md },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  modalSave: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '700' },

  editLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.md, marginBottom: Spacing.xs },
  editInput: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.md, color: Colors.text, fontSize: FontSize.md,
  },
  optionRow: { flexDirection: 'row', gap: Spacing.sm },
  optionBtn: {
    flex: 1, paddingVertical: Spacing.sm, backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md, alignItems: 'center',
  },
  optionBtnActive: { backgroundColor: Colors.primary },
  optionText: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '600' },
  optionTextActive: { color: Colors.background },
});
