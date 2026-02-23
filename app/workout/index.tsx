import { useState, useEffect, useRef, useCallback, Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Vibration, Modal, FlatList, TextInput, Platform, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

// === Dynamic imports: catch module-level failures ===
const MODULE_ERRORS: string[] = [];

let Colors: any, Spacing: any, FontSize: any, BorderRadius: any;
try {
  const theme = require('../../constants/theme');
  Colors = theme.Colors;
  Spacing = theme.Spacing;
  FontSize = theme.FontSize;
  BorderRadius = theme.BorderRadius;
} catch (e: any) {
  MODULE_ERRORS.push(`theme: ${e?.message}`);
  Colors = { background: '#0D0D0D', card: '#1A1A1A', cardBorder: '#2A2A2A', surface: '#242424', primary: '#4EEEB0', primaryDark: '#3BC494', accent: '#FF6B6B', warning: '#FFB84D', text: '#FFFFFF', textSecondary: '#9CA3AF', textMuted: '#6B7280', streak: '#FF9500', streakBg: '#2D1F00', success: '#4EEEB0', danger: '#FF4757' };
  Spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
  FontSize = { xs: 12, sm: 14, md: 16, lg: 18, xl: 24, xxl: 32, hero: 48 };
  BorderRadius = { sm: 8, md: 12, lg: 16, xl: 24, full: 9999 };
}

let getExerciseMedia: any;
try {
  getExerciseMedia = require('../../services/exercisedb').getExerciseMedia;
} catch (e) {}

let useStore: any;
try {
  useStore = require('../../store/useStore').useStore;
} catch (e: any) {
  MODULE_ERRORS.push(`store: ${e?.message}`);
}

let generateWorkoutPlan: any, getRecommendedParts: any, allExercises: any;
let BODY_PART_LABELS: any, BODY_PART_EMOJI: any;
try {
  const data = require('../../data/exercises');
  generateWorkoutPlan = data.generateWorkoutPlan;
  getRecommendedParts = data.getRecommendedParts;
  allExercises = data.exercises;
  BODY_PART_LABELS = data.BODY_PART_LABELS;
  BODY_PART_EMOJI = data.BODY_PART_EMOJI;
} catch (e: any) {
  MODULE_ERRORS.push(`exercises: ${e?.message}`);
}

type Phase = 'preview' | 'exercise' | 'rest' | 'complete';

// ErrorBoundary using PLAIN View (no SafeAreaView) to avoid cascading failures
class WorkoutErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('WorkoutScreen Error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#0D0D0D', justifyContent: 'center', alignItems: 'center', padding: 40, paddingTop: 80 }}>
          <Text style={{ fontSize: 48 }}>💥</Text>
          <Text style={{ color: '#FF6B6B', fontSize: 18, fontWeight: '700', marginTop: 16, textAlign: 'center' }}>
            운동 화면 오류 발생
          </Text>
          <Text style={{ color: '#999', fontSize: 14, marginTop: 12, textAlign: 'center', lineHeight: 20 }}>
            {this.state.error?.message || '알 수 없는 오류'}
          </Text>
          <Text style={{ color: '#666', fontSize: 11, marginTop: 8, textAlign: 'center', lineHeight: 16 }}>
            {this.state.error?.stack?.split('\n').slice(0, 3).join('\n')}
          </Text>
          <TouchableOpacity
            style={{ marginTop: 24, backgroundColor: '#4EEEB0', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 }}
            onPress={() => router.back()}
          >
            <Text style={{ color: '#0D0D0D', fontWeight: '700', fontSize: 16 }}>홈으로 돌아가기</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

// Safe Speech module loading
let Speech: any = null;
try {
  Speech = require('expo-speech');
} catch (e) {
  // expo-speech not available
}

// Background audio session (expo-av) - keeps app alive when screen off
let Audio: any = null;
let Video: any = null;
let ResizeMode: any = null;
try {
  const av = require('expo-av');
  Audio = av.Audio;
  Video = av.Video;
  ResizeMode = av.ResizeMode;
} catch (e) {
  // expo-av not available
}

// Notifications (Android foreground service hint)
let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
} catch (e) {
  // expo-notifications not available
}

// AdMob interstitial (휴식시간 광고)
let InterstitialAd: any = null;
let AdEventType: any = null;
let TestIds: any = null;
try {
  const admob = require('react-native-google-mobile-ads');
  InterstitialAd = admob.InterstitialAd;
  AdEventType = admob.AdEventType;
  TestIds = admob.TestIds;
} catch (e) {
  // react-native-google-mobile-ads not available
}

// 실제 배포 시 아래 ID를 AdMob 콘솔에서 발급받은 실제 광고 단위 ID로 교체
const ADMOB_INTERSTITIAL_ID = Platform.select({
  android: TestIds?.INTERSTITIAL ?? 'ca-app-pub-3940256099942544/1033173712',
  ios: TestIds?.INTERSTITIAL ?? 'ca-app-pub-3940256099942544/4411468910',
  default: TestIds?.INTERSTITIAL ?? 'ca-app-pub-3940256099942544/1033173712',
});

const WORKOUT_NOTIF_ID = 'zenfit-workout-active';

const initWorkoutNotificationChannel = async () => {
  if (Platform.OS !== 'android' || !Notifications) return;
  try {
    await Notifications.requestPermissionsAsync();
    await Notifications.setNotificationChannelAsync('workout-bg', {
      name: '운동 백그라운드',
      importance: Notifications.AndroidImportance?.LOW ?? 2,
      enableVibrate: false,
      showBadge: false,
    });
  } catch (e) {
    console.log('[ZenFit] Notification channel init failed:', e);
  }
};

const updateWorkoutNotification = async (title: string, body: string) => {
  if (Platform.OS !== 'android' || !Notifications) return;
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: WORKOUT_NOTIF_ID,
      content: {
        title,
        body,
        sticky: true,
        autoDismiss: false,
        data: { workoutActive: true },
        android: { channelId: 'workout-bg', ongoing: true, priority: 'low' },
      } as any,
      trigger: null,
    });
  } catch (e) {
    console.log('[ZenFit] Notification update failed:', e);
  }
};

const dismissWorkoutNotification = async () => {
  if (Platform.OS !== 'android' || !Notifications) return;
  try {
    await Notifications.dismissNotificationAsync(WORKOUT_NOTIF_ID);
  } catch (e) {}
};

const setupBackgroundAudio = async () => {
  try {
    if (Audio?.setAudioModeAsync) {
      await Audio.setAudioModeAsync({
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
      });
    }
  } catch (e) {
    console.log('[ZenFit] Background audio setup failed:', e);
  }
};

// Voice coaching helper
const speak = (text: string) => {
  try {
    Speech?.speak(text, { language: 'ko-KR', rate: 0.9, pitch: 1.0 });
  } catch (e) {
    // Silently fail if TTS unavailable
  }
};

// Pre-recorded Korean number sounds (expo-av) - works in background unlike expo-speech
const COUNT_SOUND_SOURCES: Record<number, any> = {
  1: require('../../assets/sounds/1.mp3'),
  2: require('../../assets/sounds/2.mp3'),
  3: require('../../assets/sounds/3.mp3'),
  4: require('../../assets/sounds/4.mp3'),
  5: require('../../assets/sounds/5.mp3'),
  6: require('../../assets/sounds/6.mp3'),
  7: require('../../assets/sounds/7.mp3'),
  8: require('../../assets/sounds/8.mp3'),
  9: require('../../assets/sounds/9.mp3'),
  10: require('../../assets/sounds/10.mp3'),
  11: require('../../assets/sounds/11.mp3'),
  12: require('../../assets/sounds/12.mp3'),
  13: require('../../assets/sounds/13.mp3'),
  14: require('../../assets/sounds/14.mp3'),
  15: require('../../assets/sounds/15.mp3'),
  16: require('../../assets/sounds/16.mp3'),
  17: require('../../assets/sounds/17.mp3'),
  18: require('../../assets/sounds/18.mp3'),
  19: require('../../assets/sounds/19.mp3'),
  20: require('../../assets/sounds/20.mp3'),
  21: require('../../assets/sounds/21.mp3'),
  22: require('../../assets/sounds/22.mp3'),
  23: require('../../assets/sounds/23.mp3'),
  24: require('../../assets/sounds/24.mp3'),
  25: require('../../assets/sounds/25.mp3'),
  26: require('../../assets/sounds/26.mp3'),
  27: require('../../assets/sounds/27.mp3'),
  28: require('../../assets/sounds/28.mp3'),
  29: require('../../assets/sounds/29.mp3'),
  30: require('../../assets/sounds/30.mp3'),
};

const PHRASE_SOUND_SOURCES = {
  start: require('../../assets/sounds/start.mp3'),
  set_complete: require('../../assets/sounds/set_complete.mp3'),
  go: require('../../assets/sounds/go.mp3'),
  rest: require('../../assets/sounds/rest.mp3'),
};

let _activeCountSound: any = null;

const playCountAudio = async (source: any) => {
  try {
    if (!Audio?.Sound) return;
    if (_activeCountSound) {
      _activeCountSound.stopAsync().catch(() => {});
      _activeCountSound.unloadAsync().catch(() => {});
      _activeCountSound = null;
    }
    const { sound } = await Audio.Sound.createAsync(source, { volume: 1.0 });
    _activeCountSound = sound;
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status: any) => {
      if (status?.didJustFinish) {
        sound.unloadAsync().catch(() => {});
        if (_activeCountSound === sound) _activeCountSound = null;
      }
    });
  } catch (e) {
    console.log('[ZenFit] Count audio failed:', e);
  }
};

const speakCount = (n: number) => {
  const src = COUNT_SOUND_SOURCES[n];
  if (src) {
    playCountAudio(src);
  } else {
    // fallback for numbers > 30
    try { Speech?.speak(`${n}`, { language: 'ko-KR', rate: 1.0 }); } catch (e) {}
  }
};

// Safe vibration helper
const vibrate = (pattern?: number | number[]) => {
  try {
    Vibration.vibrate(pattern);
  } catch (e) {
    // Silently fail
  }
};

// If module imports failed, show error immediately
export default function WorkoutScreenWrapper() {
  if (MODULE_ERRORS.length > 0) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0D0D0D', justifyContent: 'center', alignItems: 'center', padding: 40, paddingTop: 80 }}>
        <Text style={{ fontSize: 48 }}>⚠️</Text>
        <Text style={{ color: '#FF6B6B', fontSize: 18, fontWeight: '700', marginTop: 16, textAlign: 'center' }}>
          모듈 로드 실패
        </Text>
        <Text style={{ color: '#999', fontSize: 14, marginTop: 12, textAlign: 'center', lineHeight: 20 }}>
          {MODULE_ERRORS.join('\n')}
        </Text>
        <TouchableOpacity
          style={{ marginTop: 24, backgroundColor: '#4EEEB0', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 }}
          onPress={() => router.back()}
        >
          <Text style={{ color: '#0D0D0D', fontWeight: '700', fontSize: 16 }}>돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <WorkoutErrorBoundary>
      <WorkoutScreenInner />
    </WorkoutErrorBoundary>
  );
}

function WorkoutScreenInner() {
  const profile = useStore((s: any) => s.profile);
  const completeToday = useStore((s: any) => s.completeToday);
  const addWorkoutLog = useStore((s: any) => s.addWorkoutLog);

  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('preview');
  const [currentExIndex, setCurrentExIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(0); // 0-indexed
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [restTime, setRestTime] = useState(0);
  const [startTime] = useState(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [swapIndex, setSwapIndex] = useState<number | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [repCount, setRepCount] = useState(0); // Auto voice counting
  const [autoCountActive, setAutoCountActive] = useState(false); // Auto counting state
  const [countSpeed, setCountSpeed] = useState(3); // Seconds between counts
  const [exerciseMedia, setExerciseMedia] = useState<{ imageUrl: string; videoUrl: string } | null>(null);
  const autoCountRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const silentSoundRef = useRef<any>(null);
  const interstitialRef = useRef<any>(null);
  const adReadyRef = useRef(false);

  const loadInterstitialAd = () => {
    try {
      if (!InterstitialAd || !AdEventType || !ADMOB_INTERSTITIAL_ID) return;
      const ad = InterstitialAd.createForAdRequest(ADMOB_INTERSTITIAL_ID, { requestNonPersonalizedAdsOnly: false });
      ad.addAdEventListener(AdEventType.LOADED, () => { adReadyRef.current = true; });
      ad.addAdEventListener(AdEventType.CLOSED, () => {
        adReadyRef.current = false;
        loadInterstitialAd(); // 다음 휴식을 위해 미리 로드
      });
      ad.addAdEventListener(AdEventType.ERROR, () => { adReadyRef.current = false; });
      ad.load();
      interstitialRef.current = ad;
    } catch (e) {
      console.log('[ZenFit] AdMob load failed:', e);
    }
  };

  const showInterstitialIfReady = () => {
    try {
      if (adReadyRef.current && interstitialRef.current) {
        interstitialRef.current.show();
      }
    } catch (e) {}
  };

  // Setup background audio on mount + cleanup on unmount
  useEffect(() => {
    setupBackgroundAudio();
    initWorkoutNotificationChannel();
    loadInterstitialAd(); // 광고 미리 로드
    return () => {
      if (silentSoundRef.current) {
        silentSoundRef.current.stopAsync().catch(() => {});
        silentSoundRef.current.unloadAsync().catch(() => {});
        silentSoundRef.current = null;
      }
      dismissWorkoutNotification();
    };
  }, []);

  // Background silent audio loop - keeps JS thread alive when screen is off
  // Starts when exercise/rest phase begins, stops on complete
  // Also manages Android foreground notification for background process keepalive
  useEffect(() => {
    if (phase === 'exercise' || phase === 'rest') {
      (async () => {
        try {
          if (!Audio?.Sound) return;
          if (silentSoundRef.current) return; // already running
          const { sound } = await Audio.Sound.createAsync(
            require('../../assets/silent.wav'),
            { isLooping: true, volume: 0.001 }
          );
          silentSoundRef.current = sound;
          await sound.playAsync();
          console.log('[ZenFit] Background silent loop started');
        } catch (e) {
          console.log('[ZenFit] Background loop error:', e);
        }
      })();
      // Android: show ongoing notification (foreground service hint)
      const exName = plan?.exercises[currentExIndex]?.exercise?.name ?? '운동';
      const setNum = currentSet + 1;
      const phaseLabel = phase === 'rest' ? '휴식 중' : `${setNum}세트 진행 중`;
      updateWorkoutNotification('RunFit 운동 중 🏋️', `${exName} · ${phaseLabel}`);
    } else {
      (async () => {
        try {
          if (silentSoundRef.current) {
            await silentSoundRef.current.stopAsync();
            await silentSoundRef.current.unloadAsync();
            silentSoundRef.current = null;
            console.log('[ZenFit] Background silent loop stopped');
          }
        } catch (e) {}
      })();
      dismissWorkoutNotification();
    }
  }, [phase, currentExIndex, currentSet]);

  // Auto counting effect - counts reps automatically with voice
  useEffect(() => {
    if (autoCountActive && voiceEnabled && phase === 'exercise') {
      const currentPlan = plan?.exercises[currentExIndex];
      if (!currentPlan) return;
      const targetReps = parseInt(currentPlan.setDetails[currentSet]?.reps) || 15;

      autoCountRef.current = setInterval(() => {
        setRepCount((prev) => {
          const next = prev + 1;
          speakCount(next);
          vibrate(50);
          if (next >= targetReps) {
            // Finished counting - stop auto count
            setTimeout(() => {
              setAutoCountActive(false);
              playCountAudio(PHRASE_SOUND_SOURCES.set_complete);
            }, 500);
          }
          return next;
        });
      }, countSpeed * 1000);

      // Play "시작" sound when auto count begins
      if (repCount === 0) {
        playCountAudio(PHRASE_SOUND_SOURCES.start);
      }
    }
    return () => {
      if (autoCountRef.current) {
        clearInterval(autoCountRef.current);
        autoCountRef.current = null;
      }
    };
  }, [autoCountActive, voiceEnabled, phase, countSpeed, currentExIndex, currentSet]);

  // Fetch exercise media from ExerciseDB when exercise changes
  useEffect(() => {
    if (!plan || phase === 'preview' || phase === 'complete') return;
    const ex = plan.exercises[currentExIndex]?.exercise;
    if (!ex || !getExerciseMedia) return;
    setExerciseMedia(null);
    getExerciseMedia(ex.name, ex.bodyPart).then((media: any) => {
      if (media?.imageUrl) setExerciseMedia(media);
    }).catch(() => {});
  }, [currentExIndex, phase, plan]);

  // Generate workout plan
  useEffect(() => {
    if (!profile) {
      setPlanError(`프로필이 없습니다. 온보딩을 다시 진행해주세요.`);
      return;
    }
    try {
      const dayOfWeek = new Date().getDay();
      const goal = profile.goal || 'maintain';
      const experience = profile.experience || 'beginner';
      const parts = getRecommendedParts(dayOfWeek, goal);
      console.log('[ZenFit] Plan generation:', { dayOfWeek, goal, experience, parts, profileKeys: Object.keys(profile) });
      const workout = generateWorkoutPlan(goal, experience, parts);
      console.log('[ZenFit] Plan result:', { exerciseCount: workout?.exercises?.length, name: workout?.name });
      if (workout && workout.exercises && workout.exercises.length > 0) {
        setPlan(workout);
        setPlanError(null);
      } else {
        setPlanError(`운동 플랜이 비어있습니다. (goal=${goal}, exp=${experience}, parts=${parts.join(',')})`);
      }
    } catch (e: any) {
      console.error('[ZenFit] Plan error:', e);
      setPlanError(`플랜 생성 오류: ${e?.message || '알 수 없는 오류'}\n${e?.stack?.split('\n').slice(0, 2).join('\n') || ''}`);
    }
  }, [profile]);

  // Timer logic
  useEffect(() => {
    if (isTimerRunning && phase === 'rest') {
      timerRef.current = setInterval(() => {
        setRestTime((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsTimerRunning(false);
            vibrate(500);
            setPhase('exercise');
            playCountAudio(PHRASE_SOUND_SOURCES.go);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (isTimerRunning && phase === 'exercise') {
      timerRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, phase]);

  if (!plan || !profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg }}>
          <TouchableOpacity onPress={() => router.back()} style={{ position: 'absolute', top: Spacing.lg, left: Spacing.lg }}>
            <Text style={styles.backButton}>← 뒤로</Text>
          </TouchableOpacity>
          {planError ? (
            <>
              <Text style={{ fontSize: 48 }}>⚠️</Text>
              <Text style={{ color: Colors.accent, marginTop: Spacing.md, fontSize: FontSize.md, textAlign: 'center' }}>
                {planError}
              </Text>
              <TouchableOpacity
                style={{ marginTop: Spacing.lg, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl }}
                onPress={() => router.back()}
              >
                <Text style={{ color: Colors.background, fontWeight: '700', fontSize: FontSize.md }}>홈으로 돌아가기</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={{ color: Colors.textSecondary, marginTop: Spacing.md, fontSize: FontSize.md }}>
                운동 플랜 생성 중...
              </Text>
              <Text style={{ color: Colors.textMuted, marginTop: Spacing.sm, fontSize: FontSize.xs }}>
                프로필: {profile ? '있음' : '없음'} | 플랜: {plan ? '있음' : '없음'}
              </Text>
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const currentPlanItem = plan.exercises[currentExIndex];
  const totalExercises = plan.exercises.length;
  const totalSets = plan.exercises.reduce((sum, e) => sum + e.setDetails.length, 0);

  const handleStartWorkout = () => {
    if (!plan || plan.exercises.length === 0) return;
    setPhase('exercise');
    setCurrentExIndex(0);
    setCurrentSet(0);
    setTimer(0);
    setRepCount(0);
    setAutoCountActive(false);
    setIsTimerRunning(true);
    if (voiceEnabled) {
      try {
        const ex = plan.exercises[0].exercise;
        speak(`운동을 시작합니다. 첫 번째, ${ex.name}. ${ex.voiceCoaching?.[0] || '화이팅!'}`);
      } catch (e) {
        // Silently fail
      }
    }
  };

  const handleSetComplete = () => {
    vibrate(200);
    setAutoCountActive(false);

    // Mark current set as completed
    const updated = { ...plan };
    updated.exercises[currentExIndex].setDetails[currentSet].completed = true;
    setPlan({ ...updated });

    if (currentSet < currentPlanItem.setDetails.length - 1) {
      // More sets remaining - start rest
      const nextSet = currentSet + 1;
      setCurrentSet(nextSet);
      setRepCount(0);
      setRestTime(currentPlanItem.restSeconds);
      setPhase('rest');
      setIsTimerRunning(true);
      showInterstitialIfReady(); // 휴식시간 광고
      if (voiceEnabled) {
        speak(`${currentSet + 1}세트 완료! 잠시 쉬세요.`);
      }
    } else if (currentExIndex < totalExercises - 1) {
      // Next exercise
      const nextIdx = currentExIndex + 1;
      const nextEx = plan.exercises[nextIdx].exercise;
      setCurrentExIndex(nextIdx);
      setCurrentSet(0);
      setRepCount(0);
      setRestTime(currentPlanItem.restSeconds + 15);
      setPhase('rest');
      setIsTimerRunning(true);
      showInterstitialIfReady(); // 운동 간 휴식시간 광고
      if (voiceEnabled) {
        speak(`${currentPlanItem.exercise.name} 완료! 다음은 ${nextEx.name}입니다.`);
      }
    } else {
      handleWorkoutComplete();
    }
  };

  const handleSkipRest = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsTimerRunning(false);
    setRestTime(0);
    setRepCount(0);
    setPhase('exercise');
    setIsTimerRunning(true);
    if (voiceEnabled) {
      const ex = plan.exercises[currentExIndex].exercise;
      const coaching = ex.voiceCoaching[currentSet % ex.voiceCoaching.length];
      speak(coaching || '준비됐죠? 가보자!');
    }
  };

  const handleWorkoutComplete = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setAutoCountActive(false);
    setIsTimerRunning(false);
    setPhase('complete');

    const duration = Math.round((Date.now() - startTime) / 60000);
    completeToday();
    addWorkoutLog({
      date: new Date().toISOString().split('T')[0],
      completed: true,
      exercises: totalExercises,
      duration,
      calories: plan.estimatedCalories,
    });

    if (voiceEnabled) {
      speak('운동 완료! 오늘도 해냈습니다. 정말 대단해요!');
    }
    vibrate([0, 200, 100, 200, 100, 400]);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  // ===== Customize Handlers =====
  const handleRemoveExercise = (index: number) => {
    if (!plan || plan.exercises.length <= 2) return;
    setPlan({ ...plan, exercises: plan.exercises.filter((_, i) => i !== index) });
  };

  const handleSwapExercise = (newEx: Exercise) => {
    if (!plan || swapIndex === null) return;
    const old = plan.exercises[swapIndex];
    const defaultWeight = newEx.equipment === 'bodyweight' ? 0 : 20;
    const newSetDetails: SetDetail[] = Array.from({ length: newEx.defaultSets }, () => ({
      weight: defaultWeight,
      reps: newEx.defaultReps,
    }));
    setPlan({
      ...plan,
      exercises: plan.exercises.map((item, i) =>
        i === swapIndex
          ? { ...item, exercise: newEx, setDetails: newSetDetails, restSeconds: newEx.restSeconds }
          : item
      ),
    });
    setSwapIndex(null);
  };

  const getSwapCandidates = (): Exercise[] => {
    if (!plan || swapIndex === null) return [];
    const currentEx = plan.exercises[swapIndex].exercise;
    const currentIds = plan.exercises.map((e) => e.exercise.id);
    return allExercises.filter(
      (e) => e.bodyPart === currentEx.bodyPart && !currentIds.includes(e.id)
    );
  };

  // Per-set weight/reps editing
  const handleUpdateSetWeight = (exIndex: number, setIndex: number, delta: number) => {
    if (!plan) return;
    const updated = { ...plan };
    const sd = { ...updated.exercises[exIndex].setDetails[setIndex] };
    sd.weight = Math.max(0, sd.weight + delta);
    updated.exercises[exIndex] = {
      ...updated.exercises[exIndex],
      setDetails: updated.exercises[exIndex].setDetails.map((s, i) => i === setIndex ? sd : s),
    };
    setPlan({ ...updated });
  };

  const handleUpdateSetReps = (exIndex: number, setIndex: number, value: string) => {
    if (!plan) return;
    const updated = { ...plan };
    const sd = { ...updated.exercises[exIndex].setDetails[setIndex] };
    sd.reps = value;
    updated.exercises[exIndex] = {
      ...updated.exercises[exIndex],
      setDetails: updated.exercises[exIndex].setDetails.map((s, i) => i === setIndex ? sd : s),
    };
    setPlan({ ...updated });
  };

  const handleAddSet = (exIndex: number) => {
    if (!plan) return;
    const item = plan.exercises[exIndex];
    const lastSet = item.setDetails[item.setDetails.length - 1];
    const newSet: SetDetail = { weight: lastSet.weight, reps: lastSet.reps };
    setPlan({
      ...plan,
      exercises: plan.exercises.map((e, i) =>
        i === exIndex ? { ...e, setDetails: [...e.setDetails, newSet] } : e
      ),
    });
  };

  const handleRemoveSet = (exIndex: number) => {
    if (!plan || plan.exercises[exIndex].setDetails.length <= 1) return;
    setPlan({
      ...plan,
      exercises: plan.exercises.map((e, i) =>
        i === exIndex ? { ...e, setDetails: e.setDetails.slice(0, -1) } : e
      ),
    });
  };

  // ===== Preview Phase (PlanFit style) =====
  if (phase === 'preview') {
    const swapCandidates = getSwapCandidates();

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backButton}>← 뒤로</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.planHeader}>
            <Text style={styles.planTitle}>{plan.name}</Text>
            <View style={styles.planStats}>
              <Text style={styles.planStat}>🏋️ {totalExercises}개 운동</Text>
              <Text style={styles.planStat}>⏱️ ~{plan.estimatedMinutes}분</Text>
              <Text style={styles.planStat}>🔥 ~{plan.estimatedCalories} kcal</Text>
            </View>
          </View>

          {plan.exercises.map((item, exIdx) => {
            const isWeighted = item.exercise.equipment !== 'bodyweight';
            return (
              <View key={item.exercise.id + exIdx} style={styles.exerciseCard}>
                {/* Exercise Header */}
                <View style={styles.exerciseCardHeader}>
                  <TouchableOpacity style={styles.exerciseNumberBadge} onPress={() => setSwapIndex(exIdx)}>
                    <Text style={styles.exerciseNumberText}>{exIdx + 1}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ flex: 1 }} onPress={() => setSwapIndex(exIdx)}>
                    <Text style={styles.exerciseCardName}>{item.exercise.name}</Text>
                    <Text style={styles.exerciseCardDetail}>
                      {BODY_PART_EMOJI[item.exercise.bodyPart]} {BODY_PART_LABELS[item.exercise.bodyPart]}
                      {'  '}|{'  '}{isWeighted ? item.exercise.equipment : '맨몸'}
                      {'  '}|{'  '}운동 대체 →
                    </Text>
                  </TouchableOpacity>
                  {plan.exercises.length > 2 && (
                    <TouchableOpacity onPress={() => handleRemoveExercise(exIdx)} style={styles.removeBtn}>
                      <Text style={styles.removeBtnText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Per-set rows (PlanFit style) */}
                {item.setDetails.map((sd, setIdx) => (
                  <View
                    key={setIdx}
                    style={[styles.setRow, setIdx === 0 && styles.setRowFirst]}
                  >
                    <Text style={styles.setLabel}>{setIdx + 1}세트</Text>

                    {isWeighted ? (
                      <>
                        {/* Weight */}
                        <View style={styles.setValueGroup}>
                          <TouchableOpacity style={styles.miniBtn} onPress={() => handleUpdateSetWeight(exIdx, setIdx, -2.5)}>
                            <Text style={styles.miniBtnText}>-</Text>
                          </TouchableOpacity>
                          <View style={styles.setValueBox}>
                            <Text style={styles.setValueNum}>{sd.weight}</Text>
                            <Text style={styles.setValueUnit}>kg</Text>
                          </View>
                          <TouchableOpacity style={styles.miniBtn} onPress={() => handleUpdateSetWeight(exIdx, setIdx, 2.5)}>
                            <Text style={styles.miniBtnText}>+</Text>
                          </TouchableOpacity>
                        </View>

                        <Text style={styles.setDivider}>/</Text>

                        {/* Reps */}
                        <View style={styles.setValueGroup}>
                          <TextInput
                            style={styles.repsInput}
                            value={sd.reps}
                            onChangeText={(v) => handleUpdateSetReps(exIdx, setIdx, v)}
                            keyboardType="default"
                            selectTextOnFocus
                          />
                          <Text style={styles.setValueUnit}>회</Text>
                        </View>
                      </>
                    ) : (
                      /* Bodyweight - just reps/time */
                      <View style={styles.setValueGroup}>
                        <TextInput
                          style={styles.repsInputWide}
                          value={sd.reps}
                          onChangeText={(v) => handleUpdateSetReps(exIdx, setIdx, v)}
                          keyboardType="default"
                          selectTextOnFocus
                        />
                        <Text style={styles.setValueUnit}>{sd.reps.includes('초') ? '' : '회'}</Text>
                      </View>
                    )}
                  </View>
                ))}

                {/* Add/Remove Set buttons */}
                <View style={styles.setActionRow}>
                  <TouchableOpacity style={styles.setActionBtn} onPress={() => handleRemoveSet(exIdx)}>
                    <Text style={styles.setActionText}>- 세트 삭제</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.setActionBtn} onPress={() => handleAddSet(exIdx)}>
                    <Text style={styles.setActionText}>+ 세트 추가</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          <TouchableOpacity style={styles.startBtn} onPress={handleStartWorkout}>
            <Text style={styles.startBtnText}>운동 시작 🚀</Text>
          </TouchableOpacity>

          <View style={{ height: Spacing.xxl }} />
        </ScrollView>

        {/* Swap Modal */}
        <Modal visible={swapIndex !== null} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>운동 교체</Text>
                <TouchableOpacity onPress={() => setSwapIndex(null)}>
                  <Text style={styles.modalClose}>닫기</Text>
                </TouchableOpacity>
              </View>
              {swapIndex !== null && (
                <Text style={styles.modalSubtitle}>
                  {plan.exercises[swapIndex].exercise.name} → 같은 부위 다른 운동
                </Text>
              )}
              {swapCandidates.length === 0 ? (
                <Text style={styles.modalEmpty}>교체 가능한 운동이 없습니다</Text>
              ) : (
                <FlatList
                  data={swapCandidates}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.swapItem} onPress={() => handleSwapExercise(item)}>
                      <Text style={styles.swapEmoji}>{BODY_PART_EMOJI[item.bodyPart]}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.swapName}>{item.name}</Text>
                        <Text style={styles.swapDetail}>
                          {item.equipment === 'bodyweight' ? '맨몸' : item.equipment} | {item.defaultSets}세트 x {item.defaultReps}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // ===== Exercise Phase (PlanFit style) =====
  if (phase === 'exercise') {
    const ex = currentPlanItem.exercise;
    const sd = currentPlanItem.setDetails[currentSet];
    const isWeighted = ex.equipment !== 'bodyweight';

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.exercisePhase}>
          {/* Top bar */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => setPhase('preview')}>
              <Text style={styles.backButton}>←</Text>
            </TouchableOpacity>
            <Text style={styles.timerText}>{formatTime(timer)}</Text>
          </View>

          {/* Progress */}
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${((currentExIndex * currentPlanItem.setDetails.length + currentSet) / totalSets) * 100}%` },
              ]}
            />
          </View>

          {/* Voice + Guide toggle */}
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, voiceEnabled && styles.toggleBtnActive]}
              onPress={() => setVoiceEnabled(!voiceEnabled)}
            >
              <Text style={styles.toggleBtnText}>{voiceEnabled ? '🔊 음성 ON' : '🔇 음성 OFF'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, showGuide && styles.toggleBtnActive]}
              onPress={() => setShowGuide(!showGuide)}
            >
              <Text style={styles.toggleBtnText}>📖 가이드</Text>
            </TouchableOpacity>
          </View>

          {/* Exercise tip / guide card */}
          {showGuide ? (
            <View style={styles.guideCard}>
              <Text style={styles.guideTitle}>운동 가이드</Text>
              {ex.guide.map((step, i) => (
                <View key={i} style={styles.guideStep}>
                  <Text style={styles.guideStepNum}>{i + 1}</Text>
                  <Text style={styles.guideStepText}>{step}</Text>
                </View>
              ))}
              {ex.warnings.length > 0 && (
                <View style={styles.warningBox}>
                  <Text style={styles.warningTitle}>⚠️ 주의사항</Text>
                  {ex.warnings.map((w, i) => (
                    <Text key={i} style={styles.warningText}>• {w}</Text>
                  ))}
                </View>
              )}
              {ex.tips.length > 0 && (
                <View style={styles.tipsBox}>
                  <Text style={styles.tipsTitle}>💡 팁</Text>
                  {ex.tips.map((t, i) => (
                    <Text key={i} style={styles.tipsText}>• {t}</Text>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.tipCard}>
              <Text style={styles.tipCardText}>
                {ex.tips[0] || ex.guide[0]}
              </Text>
            </View>
          )}

          {/* Exercise Media (ExerciseDB video or image) */}
          {exerciseMedia?.videoUrl && Video ? (
            <View style={styles.exerciseMediaCard}>
              <Video
                source={{ uri: exerciseMedia.videoUrl }}
                style={styles.exerciseMediaImage}
                resizeMode={ResizeMode?.COVER ?? 'cover'}
                shouldPlay
                isLooping
                isMuted
                useNativeControls={false}
              />
            </View>
          ) : exerciseMedia?.imageUrl ? (
            <View style={styles.exerciseMediaCard}>
              <Image
                source={{ uri: exerciseMedia.imageUrl }}
                style={styles.exerciseMediaImage}
                resizeMode="cover"
              />
            </View>
          ) : null}

          {/* Exercise Info */}
          <Text style={styles.exPhaseTitle}>{ex.name}</Text>
          <Text style={styles.exPhaseSubtitle}>
            {BODY_PART_EMOJI[ex.bodyPart]} {BODY_PART_LABELS[ex.bodyPart]}
            {ex.secondaryParts?.map((p) => ` + ${BODY_PART_LABELS[p]}`).join('')}
          </Text>

          {/* Auto Voice Counter - background audio supported */}
          {voiceEnabled && !sd.reps.includes('초') && (
            <View style={styles.autoCounterContainer}>
              {/* Count display */}
              <View style={styles.repCounterBtn}>
                <Text style={styles.repCounterNumber}>{repCount}</Text>
                <Text style={styles.repCounterLabel}>/ {sd.reps}회</Text>
              </View>

              {/* Control buttons */}
              <View style={styles.autoCountControls}>
                {!autoCountActive ? (
                  <TouchableOpacity
                    style={styles.autoCountStartBtn}
                    onPress={() => {
                      setRepCount(0);
                      setAutoCountActive(true);
                    }}
                  >
                    <Text style={styles.autoCountStartText}>
                      {repCount > 0 ? '다시 시작' : '자동 카운트 시작'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.autoCountStopBtn}
                    onPress={() => setAutoCountActive(false)}
                  >
                    <Text style={styles.autoCountStopText}>일시정지</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Speed control */}
              <View style={styles.speedRow}>
                <Text style={styles.speedLabel}>속도:</Text>
                {[2, 3, 4, 5].map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.speedBtn, countSpeed === s && styles.speedBtnActive]}
                    onPress={() => setCountSpeed(s)}
                  >
                    <Text style={[styles.speedBtnText, countSpeed === s && styles.speedBtnTextActive]}>
                      {s}초
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Set Details (PlanFit style) */}
          <ScrollView style={styles.setListScroll} showsVerticalScrollIndicator={false}>
            {currentPlanItem.setDetails.map((s, idx) => {
              const isCurrent = idx === currentSet;
              const isDone = s.completed;
              return (
                <View
                  key={idx}
                  style={[
                    styles.exSetRow,
                    isCurrent && styles.exSetRowCurrent,
                    isDone && styles.exSetRowDone,
                  ]}
                >
                  <Text style={[styles.exSetLabel, isCurrent && styles.exSetLabelCurrent]}>
                    {isDone ? '✓' : `${idx + 1}세트`}
                  </Text>

                  {isWeighted && (
                    <>
                      <Text style={[styles.exSetValue, isCurrent && styles.exSetValueCurrent]}>
                        {s.weight}
                      </Text>
                      <Text style={styles.exSetUnit}>kg</Text>
                      <Text style={styles.exSetDivider}>/</Text>
                    </>
                  )}

                  <Text style={[styles.exSetValue, isCurrent && styles.exSetValueCurrent]}>
                    {s.reps}
                  </Text>
                  <Text style={styles.exSetUnit}>{s.reps.includes('초') ? '' : '회'}</Text>
                </View>
              );
            })}
          </ScrollView>

          {/* Bottom buttons */}
          <View style={styles.bottomBtns}>
            <TouchableOpacity style={styles.restTimerBtn} onPress={() => {
              setRestTime(currentPlanItem.restSeconds);
              setPhase('rest');
              setIsTimerRunning(true);
            }}>
              <Text style={styles.restTimerBtnText}>휴식 타이머</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.setCompleteBtn} onPress={handleSetComplete}>
              <Text style={styles.setCompleteBtnText}>
                {currentSet < currentPlanItem.setDetails.length - 1
                  ? '세트 완료'
                  : currentExIndex < totalExercises - 1
                    ? '다음 운동 →'
                    : '운동 완료! 🎉'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ===== Rest Phase =====
  if (phase === 'rest') {
    const nextEx = currentExIndex < totalExercises
      ? plan.exercises[currentExIndex]
      : null;

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.restContainer}>
          <Text style={styles.restLabel}>휴식 시간</Text>
          <Text style={styles.restTimer}>{formatTime(restTime)}</Text>
          <Text style={styles.restHint}>다음: {nextEx?.exercise.name}</Text>

          <View style={styles.restMotivation}>
            <Text style={styles.restMotivationText}>
              {restTime > 30 ? '호흡을 가다듬으세요 😮‍💨' : '거의 다 쉬었어요! 준비하세요 💪'}
            </Text>
          </View>

          <TouchableOpacity style={styles.skipRestBtn} onPress={handleSkipRest}>
            <Text style={styles.skipRestBtnText}>휴식 건너뛰기 →</Text>
          </TouchableOpacity>

          {/* Ad placeholder */}
          <View style={styles.adPlaceholder}>
            <Text style={styles.adText}>📢 광고 영역 (구독 시 제거)</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ===== Complete Phase =====
  const streak = useStore.getState().streak;
  const bestStreak = useStore.getState().bestStreak;
  const duration = Math.round((Date.now() - startTime) / 60000);
  const completedSets = plan.exercises.reduce(
    (sum, e) => sum + e.setDetails.filter((s) => s.completed).length, 0
  );
  const totalVolume = plan.exercises.reduce(
    (sum, e) => sum + e.setDetails.reduce(
      (s2, sd) => s2 + (sd.completed ? sd.weight * parseInt(sd.reps) || 0 : 0), 0
    ), 0
  );

  const celebMessages = [
    '대단해요! 오늘의 운동이 내일의 나를 만듭니다.',
    '당신은 상위 10%의 꾸준함을 가진 사람입니다!',
    '근육이 자라고 있어요. 느끼시나요?',
    '포기하지 않은 당신이 진짜 승리자입니다!',
    '오늘도 한계를 넘었습니다. 내일이 기대됩니다!',
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.completeContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.completeEmoji}>🎉</Text>
        <Text style={styles.completeTitle}>운동 완료!</Text>
        <Text style={styles.completeMessage}>
          {celebMessages[streak % celebMessages.length]}
        </Text>

        {/* Streak update */}
        <View style={styles.streakUpdate}>
          <Text style={styles.streakUpdateEmoji}>🔥</Text>
          <Text style={styles.streakUpdateText}>{streak}일 연속 달성!</Text>
          {streak === bestStreak && streak > 1 && (
            <View style={styles.newRecordBadge}>
              <Text style={styles.newRecordText}>NEW RECORD!</Text>
            </View>
          )}
        </View>

        {/* Summary grid */}
        <View style={styles.completeSummary}>
          <View style={styles.completeStat}>
            <Text style={styles.completeStatValue}>{totalExercises}</Text>
            <Text style={styles.completeStatLabel}>운동</Text>
          </View>
          <View style={styles.completeStat}>
            <Text style={styles.completeStatValue}>{completedSets}</Text>
            <Text style={styles.completeStatLabel}>세트</Text>
          </View>
          <View style={styles.completeStat}>
            <Text style={styles.completeStatValue}>{duration}</Text>
            <Text style={styles.completeStatLabel}>분</Text>
          </View>
          <View style={styles.completeStat}>
            <Text style={styles.completeStatValue}>~{plan.estimatedCalories}</Text>
            <Text style={styles.completeStatLabel}>kcal</Text>
          </View>
        </View>

        {totalVolume > 0 && (
          <View style={styles.volumeCard}>
            <Text style={styles.volumeLabel}>총 볼륨</Text>
            <Text style={styles.volumeValue}>{totalVolume.toLocaleString()} kg</Text>
          </View>
        )}

        {/* Exercise breakdown */}
        <View style={styles.breakdownCard}>
          <Text style={styles.breakdownTitle}>운동 상세</Text>
          {plan.exercises.map((item, i) => {
            const doneSets = item.setDetails.filter((s) => s.completed).length;
            return (
              <View key={i} style={styles.breakdownRow}>
                <Text style={styles.breakdownName}>
                  {BODY_PART_EMOJI[item.exercise.bodyPart]} {item.exercise.name}
                </Text>
                <Text style={styles.breakdownDetail}>
                  {doneSets}/{item.setDetails.length} 세트
                </Text>
              </View>
            );
          })}
        </View>

        <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.homeBtnText}>홈으로 돌아가기</Text>
        </TouchableOpacity>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  backButton: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '600' },

  // Plan Preview
  planHeader: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  planTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text },
  planStats: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
  planStat: { color: Colors.textSecondary, fontSize: FontSize.sm },

  // Exercise Card (Preview)
  exerciseCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  exerciseNumberBadge: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  exerciseNumberText: { color: Colors.primary, fontWeight: '700', fontSize: FontSize.sm },
  exerciseCardName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  exerciseCardDetail: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },

  // Per-set row
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.surface,
    gap: Spacing.sm,
  },
  setRowFirst: {
    borderTopWidth: 0,
  },
  setLabel: {
    width: 48,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  setValueGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  setValueBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    minWidth: 50,
    justifyContent: 'center',
  },
  setValueNum: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.text,
  },
  setValueUnit: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginLeft: 2,
  },
  setDivider: {
    fontSize: FontSize.lg,
    color: Colors.textMuted,
    marginHorizontal: 4,
  },
  miniBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  miniBtnText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '700' },
  repsInput: {
    backgroundColor: Colors.surface,
    color: Colors.text,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    fontSize: FontSize.lg,
    fontWeight: '800',
    textAlign: 'center',
    minWidth: 44,
    height: 32,
  },
  repsInputWide: {
    backgroundColor: Colors.surface,
    color: Colors.text,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    fontSize: FontSize.lg,
    fontWeight: '800',
    textAlign: 'center',
    minWidth: 60,
    height: 32,
  },

  // Set action row
  setActionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.surface,
    paddingTop: Spacing.sm,
  },
  setActionBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  setActionText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600' },

  removeBtn: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  removeBtnText: { color: Colors.accent, fontSize: FontSize.sm, fontWeight: '700' },

  startBtn: {
    marginHorizontal: Spacing.lg, marginTop: Spacing.lg,
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md, alignItems: 'center',
  },
  startBtnText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.background },

  // ===== Exercise Phase =====
  exercisePhase: { flex: 1, padding: Spacing.lg },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timerText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '700' },
  progressBarBg: {
    height: 4, backgroundColor: Colors.surface, borderRadius: 2, marginTop: Spacing.sm,
  },
  progressBarFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },

  exerciseMediaCard: {
    width: '100%', height: 160, borderRadius: BorderRadius.lg, overflow: 'hidden',
    marginTop: Spacing.md, backgroundColor: Colors.card,
  },
  exerciseMediaImage: { width: '100%', height: '100%' },

  tipCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.lg,
    marginTop: Spacing.lg, alignItems: 'center',
  },
  tipCardText: { color: Colors.textSecondary, fontSize: FontSize.sm, textAlign: 'center', lineHeight: 22 },

  exPhaseTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text, textAlign: 'center', marginTop: Spacing.lg },
  exPhaseSubtitle: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.xs },

  // Auto Counter
  autoCounterContainer: {
    marginTop: Spacing.md,
  },
  repCounterBtn: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.xl, padding: Spacing.md,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.primary,
  },
  repCounterNumber: {
    fontSize: 56, fontWeight: '900', color: Colors.primary,
  },
  repCounterLabel: {
    fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs,
  },
  autoCountControls: {
    flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm,
  },
  autoCountStartBtn: {
    flex: 1, backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md, alignItems: 'center',
  },
  autoCountStartText: {
    fontSize: FontSize.md, fontWeight: '700', color: Colors.background,
  },
  autoCountStopBtn: {
    flex: 1, backgroundColor: Colors.accent, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md, alignItems: 'center',
  },
  autoCountStopText: {
    fontSize: FontSize.md, fontWeight: '700', color: '#fff',
  },
  speedRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginTop: Spacing.sm, justifyContent: 'center',
  },
  speedLabel: {
    fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '600',
  },
  speedBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.full,
  },
  speedBtnActive: {
    backgroundColor: Colors.primary,
  },
  speedBtnText: {
    fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600',
  },
  speedBtnTextActive: {
    color: Colors.background,
  },

  setListScroll: { flex: 1, marginTop: Spacing.lg },

  // Exercise set rows
  exSetRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.card, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  exSetRowCurrent: {
    borderWidth: 1.5, borderColor: Colors.primary,
  },
  exSetRowDone: {
    opacity: 0.5,
  },
  exSetLabel: { width: 48, fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: '600' },
  exSetLabelCurrent: { color: Colors.primary },
  exSetValue: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text },
  exSetValueCurrent: { color: Colors.primary },
  exSetUnit: { fontSize: FontSize.sm, color: Colors.textMuted },
  exSetDivider: { fontSize: FontSize.lg, color: Colors.textMuted, marginHorizontal: 4 },

  // Bottom buttons
  bottomBtns: {
    flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md,
  },
  restTimerBtn: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg,
    borderWidth: 1, borderColor: Colors.primary,
  },
  restTimerBtnText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '600' },
  setCompleteBtn: {
    flex: 1, backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md, alignItems: 'center',
  },
  setCompleteBtnText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.background },

  // Rest Phase
  restContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  restLabel: { fontSize: FontSize.lg, color: Colors.textSecondary, fontWeight: '600' },
  restTimer: { fontSize: 80, fontWeight: '800', color: Colors.primary, marginVertical: Spacing.lg },
  restHint: { fontSize: FontSize.md, color: Colors.textMuted },
  restMotivation: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.md, padding: Spacing.lg,
    marginTop: Spacing.xl, width: '100%', alignItems: 'center',
  },
  restMotivationText: { fontSize: FontSize.md, color: Colors.text },
  skipRestBtn: {
    marginTop: Spacing.lg, backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl,
  },
  skipRestBtnText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '600' },
  adPlaceholder: {
    marginTop: Spacing.xl, backgroundColor: Colors.card, borderRadius: BorderRadius.md,
    padding: Spacing.lg, width: '100%', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.cardBorder, borderStyle: 'dashed',
  },
  adText: { color: Colors.textMuted, fontSize: FontSize.sm },

  // Toggle row
  toggleRow: {
    flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md,
  },
  toggleBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.full,
  },
  toggleBtnActive: {
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.primary,
  },
  toggleBtnText: { color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: '600' },

  // Guide card
  guideCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md,
    marginTop: Spacing.md,
  },
  guideTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary, marginBottom: Spacing.sm },
  guideStep: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xs },
  guideStepNum: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.primary,
    textAlign: 'center', lineHeight: 20, fontSize: FontSize.xs, color: Colors.background, fontWeight: '700',
  },
  guideStepText: { flex: 1, fontSize: FontSize.sm, color: Colors.text, lineHeight: 20 },
  warningBox: { marginTop: Spacing.sm, backgroundColor: '#2D1F00', borderRadius: BorderRadius.sm, padding: Spacing.sm },
  warningTitle: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.warning, marginBottom: 4 },
  warningText: { fontSize: FontSize.xs, color: Colors.warning, lineHeight: 18 },
  tipsBox: { marginTop: Spacing.sm },
  tipsTitle: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.primary, marginBottom: 4 },
  tipsText: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 18 },

  // Complete Phase
  completeContainer: { flexGrow: 1, alignItems: 'center', padding: Spacing.lg, paddingTop: Spacing.xxl },
  completeEmoji: { fontSize: 80 },
  completeTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text, marginTop: Spacing.md },
  completeMessage: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: Spacing.sm, textAlign: 'center', lineHeight: 22 },
  streakUpdate: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.streakBg, borderRadius: BorderRadius.md, padding: Spacing.md,
    marginTop: Spacing.lg, borderWidth: 1, borderColor: '#4D3500',
  },
  streakUpdateEmoji: { fontSize: 24 },
  streakUpdateText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.streak },
  newRecordBadge: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm, paddingVertical: 2,
  },
  newRecordText: { fontSize: FontSize.xs, fontWeight: '800', color: Colors.background },
  completeSummary: {
    flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg,
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.lg, width: '100%',
    justifyContent: 'space-around',
  },
  completeStat: { alignItems: 'center' },
  completeStatValue: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.primary },
  completeStatLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  volumeCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.md, padding: Spacing.md,
    marginTop: Spacing.md, width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  volumeLabel: { fontSize: FontSize.md, color: Colors.textSecondary, fontWeight: '600' },
  volumeValue: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.primary },
  breakdownCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md,
    marginTop: Spacing.md, width: '100%',
  },
  breakdownTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  breakdownRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.surface,
  },
  breakdownName: { fontSize: FontSize.sm, color: Colors.text },
  breakdownDetail: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },
  homeBtn: {
    marginTop: Spacing.xl, backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.xxl, width: '100%', alignItems: 'center',
  },
  homeBtnText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.background },

  // Swap Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.card, borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl, padding: Spacing.lg, maxHeight: '70%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  modalClose: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '600' },
  modalSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.md },
  modalEmpty: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center', padding: Spacing.xl },
  swapItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  swapEmoji: { fontSize: 24 },
  swapName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  swapDetail: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
});
