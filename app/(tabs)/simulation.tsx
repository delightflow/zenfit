import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Image, Alert, Platform, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { useStore, BodyPhoto } from '../../store/useStore';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';
import Constants from 'expo-constants';

const GEMINI_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_API_KEY
  || process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const { width: SCREEN_W } = Dimensions.get('window');
const PHOTO_SIZE = (SCREEN_W - Spacing.lg * 2 - Spacing.sm) / 2;

// ─── Tab type ───
type TabKey = 'photo' | 'chart';

// ─── Simulation calculation (kept from before) ───
interface SimResult {
  month: number; weight: number; bodyFat: number; muscle: number; description: string;
}

function calculateSimulation(
  weight: number, targetWeight: number, height: number, age: number,
  gender: 'male' | 'female', goal: string, streak: number, totalWorkouts: number,
): SimResult[] {
  const bmi = weight / ((height / 100) ** 2);
  const baseFat = gender === 'male' ? (1.20 * bmi + 0.23 * age - 16.2) : (1.20 * bmi + 0.23 * age - 5.4);
  const bodyFat = Math.max(5, Math.min(45, baseFat));
  const muscleMass = weight * (1 - bodyFat / 100) * 0.75;
  const consistency = Math.min(1.0, (streak * 0.05 + totalWorkouts * 0.02));
  const ef = 0.5 + consistency * 0.5;
  const results: SimResult[] = [];
  const descs = [
    '현재 상태입니다.', '체지방이 줄기 시작하고 근력이 향상됩니다.',
    '옷이 편해지기 시작합니다. 체력이 눈에 띄게 좋아집니다.',
    '주변에서 변화를 알아챕니다. 근육이 더 선명해집니다.',
    '체형 변화가 확실하게 보입니다. 자신감이 급상승합니다.',
    '거의 목표에 도달합니다. 운동이 생활의 일부가 됩니다.',
    '목표 달성! 새로운 라이프스타일이 완성되었습니다.',
  ];
  for (let m = 0; m <= 6; m++) {
    let w = weight, bf = bodyFat, mm = muscleMass;
    if (goal === 'lose') { w -= m * 0.8 * ef; bf -= m * 0.7 * ef; mm += m * 0.15 * ef; }
    else if (goal === 'gain') { w += m * 0.4 * ef; bf -= m * 0.3 * ef; mm += m * 0.35 * ef; }
    else { w -= m * 0.2 * ef; bf -= m * 0.4 * ef; mm += m * 0.2 * ef; }
    results.push({ month: m, weight: Math.round(w * 10) / 10, bodyFat: Math.round(Math.max(5, bf) * 10) / 10, muscle: Math.round(mm * 10) / 10, description: descs[m] });
  }
  return results;
}

// ─── Mini Chart ───
function MiniChart({ data, color, label, unit }: { data: number[], color: string, label: string, unit: string }) {
  const chartW = 300, chartH = 80, pad = 30;
  const min = Math.min(...data) - 1, max = Math.max(...data) + 1;
  const range = max - min || 1;
  return (
    <View style={styles.miniChartContainer}>
      <Text style={styles.miniChartLabel}>{label}</Text>
      <Svg width={chartW} height={chartH + 20}>
        <SvgText x={0} y={15} fill={Colors.textMuted} fontSize={10}>{max.toFixed(1)}</SvgText>
        <SvgText x={0} y={chartH + 5} fill={Colors.textMuted} fontSize={10}>{min.toFixed(1)}</SvgText>
        {data.map((val, i) => {
          const x = pad + (i / (data.length - 1)) * (chartW - pad * 2);
          const y = 10 + ((max - val) / range) * (chartH - 10);
          const ni = i + 1;
          return (
            <View key={i}>
              {ni < data.length && (
                <Line x1={x} y1={y} x2={pad + (ni / (data.length - 1)) * (chartW - pad * 2)} y2={10 + ((max - data[ni]) / range) * (chartH - 10)} stroke={color} strokeWidth={2} />
              )}
              <Rect x={x - 3} y={y - 3} width={6} height={6} rx={3} fill={i === 0 ? Colors.textMuted : color} />
              <SvgText x={x} y={chartH + 18} fill={Colors.textMuted} fontSize={9} textAnchor="middle">{i === 0 ? '현재' : `${i}개월`}</SvgText>
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

// ─── Gemini Vision Analysis ───
async function analyzeBodyPhoto(base64: string, profile: any): Promise<string> {
  if (!GEMINI_KEY) return '(API 키가 설정되지 않았습니다)';
  try {
    const prompt = `당신은 피트니스 전문 트레이너입니다. 이 체형 사진을 분석해주세요.

사용자 정보: ${profile.gender === 'male' ? '남성' : '여성'}, ${profile.age}세, ${profile.height}cm, ${profile.weight}kg
목표: ${profile.goal === 'lose' ? '체중 감량' : profile.goal === 'gain' ? '근육 증가' : '체력 향상'} (목표 체중: ${profile.targetWeight}kg)

다음 항목을 200자 이내로 분석해주세요:
1. 현재 체형 평가 (간단히)
2. 추정 체지방률
3. 6개월 후 예상 변화
4. 맞춤 운동 조언 1가지

친근하고 동기부여가 되는 톤으로 작성해주세요. 한국어로 답변하세요.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: 'image/jpeg', data: base64 } },
            ],
          }],
        }),
      }
    );
    const json = await res.json();
    return json?.candidates?.[0]?.content?.parts?.[0]?.text || '분석 결과를 가져올 수 없습니다.';
  } catch (e) {
    return '분석 중 오류가 발생했습니다. 네트워크를 확인해주세요.';
  }
}

// ─── Main Screen ───
export default function SimulationScreen() {
  const profile = useStore((s) => s.profile);
  const streak = useStore((s) => s.streak);
  const workoutLogs = useStore((s) => s.workoutLogs);
  const bodyPhotos = useStore((s) => s.bodyPhotos);
  const addBodyPhoto = useStore((s) => s.addBodyPhoto);
  const updateBodyPhoto = useStore((s) => s.updateBodyPhoto);
  const removeBodyPhoto = useStore((s) => s.removeBodyPhoto);

  const [tab, setTab] = useState<TabKey>('photo');
  const [simResults, setSimResults] = useState<SimResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null); // photo id being analyzed
  const [selectedPhoto, setSelectedPhoto] = useState<BodyPhoto | null>(null);

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

  const pickImage = async (useCamera: boolean) => {
    try {
      if (useCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('권한 필요', '카메라 접근 권한이 필요합니다.');
          return;
        }
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.7,
            base64: true,
            allowsEditing: true,
            aspect: [3, 4],
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.7,
            base64: true,
            allowsEditing: true,
            aspect: [3, 4],
          });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const id = `photo_${Date.now()}`;

      const newPhoto: BodyPhoto = {
        id,
        date: dateStr,
        uri: asset.uri,
        weight: profile.weight,
      };
      addBodyPhoto(newPhoto);

      // Auto-analyze with Gemini
      if (asset.base64 && GEMINI_KEY) {
        setAnalyzing(id);
        const analysis = await analyzeBodyPhoto(asset.base64, profile);
        updateBodyPhoto(id, { aiAnalysis: analysis });
        setAnalyzing(null);
      }
    } catch (e) {
      Alert.alert('오류', '사진을 불러올 수 없습니다.');
    }
  };

  const handleDeletePhoto = (photo: BodyPhoto) => {
    Alert.alert('사진 삭제', '이 사진을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => {
        removeBodyPhoto(photo.id);
        if (selectedPhoto?.id === photo.id) setSelectedPhoto(null);
      }},
    ]);
  };

  const handleSimulate = () => {
    setLoading(true);
    setTimeout(() => {
      const results = calculateSimulation(
        profile.weight, profile.targetWeight, profile.height, profile.age,
        profile.gender, profile.goal, streak, workoutLogs.length,
      );
      setSimResults(results);
      setLoading(false);
    }, 800);
  };

  const goalLabel = profile.goal === 'lose' ? '체중 감량' : profile.goal === 'gain' ? '근육 증가' : '체력 향상';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>AI 체형 시뮬레이션</Text>
        <Text style={styles.subtitle}>사진으로 변화를 기록하고, AI가 분석합니다</Text>

        {/* Tab Switcher */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'photo' && styles.tabBtnActive]}
            onPress={() => setTab('photo')}
          >
            <Text style={[styles.tabText, tab === 'photo' && styles.tabTextActive]}>
              📸 체형 사진
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'chart' && styles.tabBtnActive]}
            onPress={() => setTab('chart')}
          >
            <Text style={[styles.tabText, tab === 'chart' && styles.tabTextActive]}>
              📊 수치 예측
            </Text>
          </TouchableOpacity>
        </View>

        {/* ══════ Photo Tab ══════ */}
        {tab === 'photo' && (
          <>
            {/* Upload Buttons */}
            <View style={styles.uploadRow}>
              <TouchableOpacity style={styles.uploadBtn} onPress={() => pickImage(true)}>
                <Text style={styles.uploadIcon}>📷</Text>
                <Text style={styles.uploadLabel}>촬영</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadBtn} onPress={() => pickImage(false)}>
                <Text style={styles.uploadIcon}>🖼️</Text>
                <Text style={styles.uploadLabel}>앨범</Text>
              </TouchableOpacity>
            </View>

            {/* Selected Photo Detail */}
            {selectedPhoto && (
              <View style={styles.detailCard}>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailDate}>{selectedPhoto.date}</Text>
                  <TouchableOpacity onPress={() => setSelectedPhoto(null)}>
                    <Text style={styles.detailClose}>✕</Text>
                  </TouchableOpacity>
                </View>
                <Image source={{ uri: selectedPhoto.uri }} style={styles.detailImage} />
                {selectedPhoto.weight && (
                  <Text style={styles.detailWeight}>{selectedPhoto.weight}kg</Text>
                )}
                {analyzing === selectedPhoto.id ? (
                  <View style={styles.analysisLoading}>
                    <ActivityIndicator color={Colors.primary} />
                    <Text style={styles.analysisLoadingText}>AI 분석 중...</Text>
                  </View>
                ) : selectedPhoto.aiAnalysis ? (
                  <View style={styles.analysisCard}>
                    <Text style={styles.analysisTitle}>🤖 AI 체형 분석</Text>
                    <Text style={styles.analysisText}>{selectedPhoto.aiAnalysis}</Text>
                  </View>
                ) : null}
              </View>
            )}

            {/* Photo Grid */}
            {bodyPhotos.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>
                  체형 기록 ({bodyPhotos.length}장)
                </Text>
                <View style={styles.photoGrid}>
                  {[...bodyPhotos].reverse().map((photo) => (
                    <TouchableOpacity
                      key={photo.id}
                      style={[
                        styles.photoThumb,
                        selectedPhoto?.id === photo.id && styles.photoThumbSelected,
                      ]}
                      onPress={() => setSelectedPhoto(photo)}
                      onLongPress={() => handleDeletePhoto(photo)}
                    >
                      <Image source={{ uri: photo.uri }} style={styles.photoThumbImage} />
                      <View style={styles.photoThumbOverlay}>
                        <Text style={styles.photoThumbDate}>{photo.date.slice(5)}</Text>
                        {photo.weight && (
                          <Text style={styles.photoThumbWeight}>{photo.weight}kg</Text>
                        )}
                      </View>
                      {analyzing === photo.id && (
                        <View style={styles.photoAnalyzingOverlay}>
                          <ActivityIndicator color="#fff" size="small" />
                        </View>
                      )}
                      {photo.aiAnalysis && (
                        <View style={styles.photoAiBadge}>
                          <Text style={styles.photoAiBadgeText}>AI</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Before/After Comparison */}
                {bodyPhotos.length >= 2 && (
                  <View style={styles.compareCard}>
                    <Text style={styles.compareTitle}>Before / After</Text>
                    <View style={styles.compareRow}>
                      <View style={styles.compareItem}>
                        <Image source={{ uri: bodyPhotos[0].uri }} style={styles.compareImage} />
                        <Text style={styles.compareLabel}>{bodyPhotos[0].date.slice(5)}</Text>
                        {bodyPhotos[0].weight && <Text style={styles.compareWeight}>{bodyPhotos[0].weight}kg</Text>}
                      </View>
                      <Text style={styles.compareArrow}>→</Text>
                      <View style={styles.compareItem}>
                        <Image source={{ uri: bodyPhotos[bodyPhotos.length - 1].uri }} style={styles.compareImage} />
                        <Text style={styles.compareLabel}>{bodyPhotos[bodyPhotos.length - 1].date.slice(5)}</Text>
                        {bodyPhotos[bodyPhotos.length - 1].weight && <Text style={styles.compareWeight}>{bodyPhotos[bodyPhotos.length - 1].weight}kg</Text>}
                      </View>
                    </View>
                    {bodyPhotos[0].weight && bodyPhotos[bodyPhotos.length - 1].weight && (
                      <Text style={styles.compareDiff}>
                        {(() => {
                          const diff = bodyPhotos[bodyPhotos.length - 1].weight! - bodyPhotos[0].weight!;
                          return diff > 0 ? `+${diff.toFixed(1)}kg` : `${diff.toFixed(1)}kg`;
                        })()}
                      </Text>
                    )}
                  </View>
                )}
              </>
            ) : (
              <View style={styles.emptyPhotos}>
                <Text style={styles.emptyEmoji}>📸</Text>
                <Text style={styles.emptyTitle}>체형 사진을 찍어보세요</Text>
                <Text style={styles.emptyDesc}>
                  사진을 업로드하면 AI가 체형을 분석하고{'\n'}
                  운동 효과를 예측합니다
                </Text>
              </View>
            )}

            {/* Tips */}
            <View style={styles.tipsCard}>
              <Text style={styles.tipsTitle}>📌 체형 사진 촬영 팁</Text>
              <Text style={styles.tipsText}>
                • 같은 장소, 같은 조명에서 촬영{'\n'}
                • 밝은 단색 배경 추천{'\n'}
                • 정면/측면 모두 촬영하면 더 정확{'\n'}
                • 매주 같은 요일, 같은 시간에 촬영{'\n'}
                • 꾹 눌러서 삭제
              </Text>
            </View>
          </>
        )}

        {/* ══════ Chart Tab (existing simulation) ══════ */}
        {tab === 'chart' && (
          <>
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

            {!simResults && (
              <TouchableOpacity style={styles.simButton} onPress={handleSimulate} disabled={loading}>
                {loading ? <ActivityIndicator color={Colors.background} /> : (
                  <Text style={styles.simButtonText}>🔮 6개월 후 시뮬레이션 시작</Text>
                )}
              </TouchableOpacity>
            )}

            {simResults && (
              <>
                <MiniChart data={simResults.map((r) => r.weight)} color={Colors.primary} label="체중 변화" unit="kg" />
                <MiniChart data={simResults.map((r) => r.bodyFat)} color={Colors.accent} label="체지방률 변화" unit="%" />
                <MiniChart data={simResults.map((r) => r.muscle)} color="#4DA6FF" label="근육량 변화" unit="kg" />

                <View style={styles.timeline}>
                  {simResults.map((r, i) => (
                    <View key={i} style={styles.timelineItem}>
                      <View style={styles.timelineLine}>
                        <View style={[styles.timelineDot, i === 0 && styles.timelineDotCurrent, i === simResults.length - 1 && styles.timelineDotGoal]} />
                        {i < simResults.length - 1 && <View style={styles.timelineConnector} />}
                      </View>
                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineMonth}>{i === 0 ? '현재' : `${i}개월 후`}</Text>
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

                <View style={styles.motivationBox}>
                  <Text style={styles.motivationEmoji}>💪</Text>
                  <Text style={styles.motivationText}>
                    {streak > 0
                      ? `지금까지 ${streak}일 연속으로 해냈어요!\n이 속도라면 목표 달성이 더 빨라질 수 있습니다.`
                      : '오늘부터 시작하세요!\n꾸준함이 최고의 무기입니다.'}
                  </Text>
                </View>

                <TouchableOpacity style={styles.resetBtn} onPress={() => setSimResults(null)}>
                  <Text style={styles.resetBtnText}>다시 시뮬레이션</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  title: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.md },

  placeholder: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.xl,
  },
  placeholderEmoji: { fontSize: 64, marginBottom: Spacing.md },
  placeholderText: { fontSize: FontSize.md, color: Colors.textSecondary },

  // Tabs
  tabRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  tabBtn: {
    flex: 1, paddingVertical: Spacing.sm, alignItems: 'center',
    borderRadius: BorderRadius.md, backgroundColor: Colors.surface,
  },
  tabBtnActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: Colors.background },

  // Upload
  uploadRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  uploadBtn: {
    flex: 1, backgroundColor: Colors.card, borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.cardBorder, borderStyle: 'dashed',
  },
  uploadIcon: { fontSize: 32, marginBottom: Spacing.xs },
  uploadLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },

  // Detail Card
  detailCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md,
    marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.primary,
  },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  detailDate: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  detailClose: { fontSize: FontSize.lg, color: Colors.textMuted, padding: Spacing.xs },
  detailImage: {
    width: '100%', height: 300, borderRadius: BorderRadius.md, backgroundColor: Colors.surface,
    resizeMode: 'cover',
  },
  detailWeight: {
    fontSize: FontSize.lg, fontWeight: '700', color: Colors.primary,
    textAlign: 'center', marginTop: Spacing.sm,
  },
  analysisLoading: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingTop: Spacing.md, justifyContent: 'center',
  },
  analysisLoadingText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  analysisCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginTop: Spacing.md,
  },
  analysisTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary, marginBottom: Spacing.sm },
  analysisText: { fontSize: FontSize.sm, color: Colors.text, lineHeight: 22 },

  // Photo Grid
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  photoThumb: {
    width: PHOTO_SIZE, height: PHOTO_SIZE * 1.3, borderRadius: BorderRadius.md,
    overflow: 'hidden', backgroundColor: Colors.surface,
  },
  photoThumbSelected: { borderWidth: 2, borderColor: Colors.primary },
  photoThumbImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  photoThumbOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)', padding: Spacing.xs,
  },
  photoThumbDate: { fontSize: FontSize.xs, color: '#fff', fontWeight: '600' },
  photoThumbWeight: { fontSize: FontSize.xs, color: Colors.primary },
  photoAnalyzingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center',
  },
  photoAiBadge: {
    position: 'absolute', top: Spacing.xs, right: Spacing.xs,
    backgroundColor: Colors.primary, borderRadius: BorderRadius.sm, paddingHorizontal: 6, paddingVertical: 2,
  },
  photoAiBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.background },

  // Compare
  compareCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  compareTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm, textAlign: 'center' },
  compareRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  compareItem: { alignItems: 'center' },
  compareImage: {
    width: PHOTO_SIZE * 0.8, height: PHOTO_SIZE * 1.0, borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface, resizeMode: 'cover',
  },
  compareLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: Spacing.xs },
  compareWeight: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '600' },
  compareArrow: { fontSize: FontSize.xl, color: Colors.primary, fontWeight: '700' },
  compareDiff: {
    fontSize: FontSize.lg, fontWeight: '800', color: Colors.primary,
    textAlign: 'center', marginTop: Spacing.sm,
  },

  // Empty
  emptyPhotos: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.xl,
    alignItems: 'center', marginBottom: Spacing.lg,
  },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  emptyDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  // Tips
  tipsCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md,
  },
  tipsTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  tipsText: { fontSize: FontSize.xs, color: Colors.textMuted, lineHeight: 20 },

  // Status card (chart tab)
  statusCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  statusTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, marginBottom: Spacing.md },
  statusItem: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  statusValue: { fontSize: FontSize.hero, fontWeight: '800', color: Colors.text },
  statusUnit: { fontSize: FontSize.sm, color: Colors.textMuted },
  statusArrow: { fontSize: FontSize.xl, color: Colors.primary },
  statusInfo: { gap: 4 },
  statusInfoText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },

  // Sim button
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
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.surface, borderWidth: 2, borderColor: Colors.textMuted },
  timelineDotCurrent: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  timelineDotGoal: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  timelineConnector: { flex: 1, width: 2, backgroundColor: Colors.surface },
  timelineContent: { flex: 1, paddingLeft: Spacing.sm, paddingBottom: Spacing.md },
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
});
