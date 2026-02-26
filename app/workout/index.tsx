import { useState, useEffect, useRef, useCallback, Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Vibration, Modal, FlatList, TextInput, Platform, ActivityIndicator, Alert, Image, NativeModules, BackHandler, AppState } from 'react-native';
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

let generateWorkoutPlan: any, generateSplitPlan: any, getRecommendedParts: any, getNextSplit: any, allExercises: any;
let BODY_PART_LABELS: any, BODY_PART_EMOJI: any, SPLIT_DEFS: any;
try {
  const data = require('../../data/exercises');
  generateWorkoutPlan = data.generateWorkoutPlan;
  generateSplitPlan = data.generateSplitPlan;
  getRecommendedParts = data.getRecommendedParts;
  getNextSplit = data.getNextSplit;
  allExercises = data.exercises;
  BODY_PART_LABELS = data.BODY_PART_LABELS;
  BODY_PART_EMOJI = data.BODY_PART_EMOJI;
  SPLIT_DEFS = data.SPLIT_DEFS;
} catch (e: any) {
  MODULE_ERRORS.push(`exercises: ${e?.message}`);
}

let generateCoachingTimeline: any, getEventTimestamps: any, findEventAtTime: any;
try {
  const ac = require('../../services/audioCoaching');
  generateCoachingTimeline = ac.generateCoachingTimeline;
  getEventTimestamps = ac.getEventTimestamps;
  findEventAtTime = ac.findEventAtTime;
} catch {}

type Phase = 'preview' | 'exercise' | 'rest' | 'complete';
const EXERCISE_PREP_SECONDS = 20;
const TARGET_SESSION_MINUTES = 58;

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

// Keep screen awake during workout (운동 중 화면 꺼짐 방지)
let useKeepAwake: any = null;
try {
  useKeepAwake = require('expo-keep-awake').useKeepAwake;
} catch (e) {
  // expo-keep-awake not available
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

const AudioService = NativeModules.AudioServiceModule;

const updateWorkoutNotification = (title: string, body: string) => {
  if (Platform.OS !== 'android') return;
  try {
    AudioService?.start(title, body);
  } catch (e) {
    console.log('[ZenFit] AudioService start failed:', e);
  }
};

const dismissWorkoutNotification = () => {
  if (Platform.OS !== 'android') return;
  try {
    AudioService?.stop();
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

// Android: 네이티브 MediaPlayer로 res/raw 사운드 재생 (백그라운드/잠금화면 완전 지원)
// iOS: expo-av (staysActiveInBackground 로 백그라운드 지원)
// sound name 규칙: count_1 ~ count_30, phrase_start, phrase_set_complete, phrase_go, phrase_rest
const PHRASE_NATIVE_NAMES: Record<string, string> = {
  start: 'phrase_start',
  set_complete: 'phrase_set_complete',
  go: 'phrase_go',
  rest: 'phrase_rest',
};

const _sourceToNativeName = new Map<any, string>();
Object.entries(COUNT_SOUND_SOURCES).forEach(([n, src]) => {
  _sourceToNativeName.set(src, `count_${n}`);
});
Object.entries(PHRASE_SOUND_SOURCES).forEach(([key, src]) => {
  _sourceToNativeName.set(src, PHRASE_NATIVE_NAMES[key] ?? key);
});

let _activeCountSound: any = null;

const playCountAudio = async (source: any) => {
  // Android:
  // - active(일반 화면)에서는 expo-av를 우선 사용해 즉시 재생 안정성 확보
  // - background/잠금에서는 네이티브 서비스 재생 사용
  const androidBackground = Platform.OS === 'android' && AppState.currentState !== 'active';
  if (androidBackground) {
    try {
      const name = _sourceToNativeName.get(source);
      if (name) AudioService?.playSound(name);
    } catch (e) {
      console.log('[ZenFit] Native playSound failed:', e);
    }
    return;
  }
  // iOS: expo-av
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

// === Audio Coaching Engine Helper ===
const getSoundSource = (key: string): any => {
  if (key.startsWith('count_')) {
    const n = parseInt(key.replace('count_', ''));
    return COUNT_SOUND_SOURCES[n];
  }
  return (PHRASE_SOUND_SOURCES as any)[key];
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
  // 운동 중 화면 꺼짐/잠금 방지 (소리 재생이 포그라운드에서 안정적으로 동작)
  useKeepAwake?.();

  const profile = useStore((s: any) => s.profile);
  const completeToday = useStore((s: any) => s.completeToday);
  const addWorkoutLog = useStore((s: any) => s.addWorkoutLog);
  const lastSplit = useStore((s: any) => s.lastSplit);
  const splitPlans = useStore((s: any) => s.splitPlans);
  const exerciseWeights = useStore((s: any) => s.exerciseWeights);
  const blacklistedExercises = useStore((s: any) => s.blacklistedExercises);
  const setLastSplit = useStore((s: any) => s.setLastSplit);
  const setSplitPlanStore = useStore((s: any) => s.setSplitPlan);
  const updateExerciseWeights = useStore((s: any) => s.updateExerciseWeights);
  const toggleBlacklist = useStore((s: any) => s.toggleBlacklist);

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
  const [activeSplit, setActiveSplit] = useState<'A' | 'B' | 'C' | null>(null); // A/B/C 분할 루틴
  const [showAddExercise, setShowAddExercise] = useState(false); // 운동 추가 모달
  const [addSearchQuery, setAddSearchQuery] = useState(''); // 운동 추가 검색
  const voiceEnabled = false; // 음성 ON/OFF 제거 — 오디오 코칭으로 대체
  const [repCount, setRepCount] = useState(0); // Auto voice counting
  const [autoCountActive, setAutoCountActive] = useState(false); // Auto counting state
  const [countSpeed, setCountSpeed] = useState(3); // Seconds between counts
  const [setRemaining, setSetRemaining] = useState<number | null>(null); // timed set remaining seconds
  const [exerciseMedia, setExerciseMedia] = useState<{ imageUrl: string; videoUrl: string } | null>(null);
  const autoCountRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timedSetRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoCountStartedAtRef = useRef<number>(0);
  const autoCountBaseRepRef = useRef<number>(0);
  const autoCountTargetRef = useRef<number>(0);
  const silentSoundRef = useRef<any>(null);

  // Audio coaching state
  const [coachingActive, setCoachingActive] = useState(false);
  const [coachingPaused, setCoachingPaused] = useState(false);
  const [coachingTimeline, setCoachingTimeline] = useState<any>(null);
  const [coachingTimestamps, setCoachingTimestamps] = useState<number[]>([]);
  const [coachingEventIdx, setCoachingEventIdx] = useState(0);
  const [coachingElapsed, setCoachingElapsed] = useState(0);
  const coachingPlayingRef = useRef(false);
  const coachingAbortRef = useRef(false);
  const coachingEventIdxRef = useRef(0);
  const coachingElapsedRef = useRef(0);
  const coachingStartedAtRef = useRef(0);
  const coachingActiveSoundRef = useRef<any>(null);
  const coachingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const exerciseStartAtRef = useRef<number>(0); // wall clock: 운동 타이머 시작 시각
  const restEndAtRef = useRef<number>(0);       // wall clock: 휴식 종료 예정 시각
  const interstitialRef = useRef<any>(null);
  const adReadyRef = useRef(false);

  // 분할 정의 (목표별)
  const goalSplits = SPLIT_DEFS?.[profile?.goal || 'maintain'] || SPLIT_DEFS?.maintain || {};

  // 분할 선택 시 결정적 플랜 생성 (저장된 운동 + 무게 사용)
  const handleSelectSplit = (split: 'A' | 'B' | 'C') => {
    if (!profile || !generateSplitPlan) return;
    // 이미 선택된 분할이면 운동 목록 유지 (재생성 방지)
    if (activeSplit === split && plan) return;
    try {
      const goal = profile.goal || 'maintain';
      const experience = profile.experience || 'beginner';
      const savedIds = splitPlans?.[split];
      const newPlan = generateSplitPlan(goal, experience, split, {
        savedExerciseIds: savedIds,
        savedWeights: exerciseWeights,
        blacklist: blacklistedExercises,
      });
      if (newPlan && newPlan.exercises.length > 0) {
        setPlan(newPlan);
        setActiveSplit(split);
        // 운동 ID 목록 저장 (다음에도 같은 운동 사용)
        setSplitPlanStore(split, newPlan.exercises.map((e: any) => e.exercise.id));
      }
    } catch (e) {
      console.log('[ZenFit] Split plan error:', e);
    }
  };

  // 운동 추가 핸들러
  const handleAddExercise = (ex: any) => {
    if (!plan) return;
    const defaultWeight = ex.equipment === 'bodyweight' ? 0 : 20;
    const newItem = {
      exercise: ex,
      setDetails: Array.from({ length: ex.defaultSets }, () => ({ weight: defaultWeight, reps: ex.defaultReps })),
      restSeconds: ex.restSeconds,
    };
    setPlan({ ...plan, exercises: [...plan.exercises, newItem] });
    setShowAddExercise(false);
    setAddSearchQuery('');
  };

  // === Audio Coaching Engine ===
  const coachingWaitMs = (ms: number): Promise<void> => {
    return new Promise((resolve) => {
      if (ms <= 0 || coachingAbortRef.current) { resolve(); return; }
      const silentSound = silentSoundRef.current;
      if (!silentSound) {
        coachingTimeoutRef.current = setTimeout(resolve, ms);
        return;
      }
      let resolved = false;
      const deadline = Date.now() + ms;
      const check = () => {
        if (resolved) return;
        if (Date.now() >= deadline || coachingAbortRef.current) {
          resolved = true;
          silentSound.setOnPlaybackStatusUpdate(null);
          resolve();
        }
      };
      silentSound.setOnPlaybackStatusUpdate(check);
      coachingTimeoutRef.current = setTimeout(() => {
        if (!resolved) { resolved = true; silentSound.setOnPlaybackStatusUpdate(null); resolve(); }
      }, ms + 3000);
    });
  };

  const coachingPlaySound = async (source: any): Promise<void> => {
    if (!Audio?.Sound) return;
    try {
      if (coachingActiveSoundRef.current) {
        await coachingActiveSoundRef.current.stopAsync().catch(() => {});
        await coachingActiveSoundRef.current.unloadAsync().catch(() => {});
      }
      const { sound } = await Audio.Sound.createAsync(source, { volume: 1.0 });
      coachingActiveSoundRef.current = sound;
      await sound.playAsync();
      await new Promise<void>((resolve) => {
        sound.setOnPlaybackStatusUpdate((status: any) => {
          if (status?.didJustFinish) {
            sound.unloadAsync().catch(() => {});
            if (coachingActiveSoundRef.current === sound) coachingActiveSoundRef.current = null;
            resolve();
          }
        });
        setTimeout(resolve, 3000);
      });
    } catch {}
  };

  const coachingSpeakAsync = (text: string, durationMs: number): Promise<void> => {
    return new Promise<void>((resolve) => {
      try {
        Speech?.speak(text, { language: 'ko-KR', rate: 0.9, pitch: 1.0, onDone: resolve, onError: resolve });
      } catch { resolve(); }
      setTimeout(resolve, durationMs + 500);
    });
  };

  const coachingPlayFromIndex = async (timeline: any, timestamps: number[], startIdx: number) => {
    coachingAbortRef.current = false;
    coachingPlayingRef.current = true;
    setCoachingActive(true);

    // Start silent loop for background keepalive
    if (!silentSoundRef.current && Audio?.Sound) {
      try {
        const { sound } = await Audio.Sound.createAsync(
          COUNT_SOUND_SOURCES[1], { isLooping: true, volume: 0.001 }
        );
        await sound.setProgressUpdateIntervalAsync(200);
        silentSoundRef.current = sound;
        await sound.playAsync();
      } catch {}
    }

    for (let i = startIdx; i < timeline.events.length; i++) {
      if (coachingAbortRef.current || !coachingPlayingRef.current) break;

      coachingEventIdxRef.current = i;
      setCoachingEventIdx(i);
      coachingStartedAtRef.current = Date.now();

      const event = timeline.events[i];

      // Sync workout screen state from event metadata
      if (event.meta) {
        if (event.meta.exerciseIndex !== undefined) {
          setCurrentExIndex(event.meta.exerciseIndex);
        }
        if (event.meta.setIndex !== undefined) {
          setCurrentSet(event.meta.setIndex);
          setRepCount(0);
        }
        if (event.meta.phase === 'exercise') {
          exerciseStartAtRef.current = Date.now();
          setPhase('exercise');
        }
        if (event.meta.phase === 'rest') {
          setPhase('rest');
        }
      }

      // Play the event
      switch (event.type) {
        case 'sound': {
          const source = getSoundSource(event.payload);
          if (source) await coachingPlaySound(source);
          else await coachingWaitMs(event.durationMs);
          break;
        }
        case 'speech':
          await coachingSpeakAsync(event.payload, event.durationMs);
          break;
        case 'silence':
          await coachingWaitMs(event.durationMs);
          break;
      }

      coachingElapsedRef.current = timestamps[i] + event.durationMs;
      setCoachingElapsed(coachingElapsedRef.current);
    }

    // Playback complete
    if (!coachingAbortRef.current) {
      coachingPlayingRef.current = false;
      setCoachingActive(false);
      handleWorkoutComplete();
    }
  };

  const startCoaching = () => {
    if (!plan || !generateCoachingTimeline) return;
    const timeline = generateCoachingTimeline(plan, { countSpeedSec: countSpeed });
    const ts = getEventTimestamps(timeline.events);
    setCoachingTimeline(timeline);
    setCoachingTimestamps(ts);
    setCoachingElapsed(0);
    setCoachingEventIdx(0);
    setCoachingPaused(false);

    // Start workout
    exerciseStartAtRef.current = Date.now();
    restEndAtRef.current = 0;
    setPhase('exercise');
    setCurrentExIndex(0);
    setCurrentSet(0);
    setTimer(0);
    setRepCount(0);
    setIsTimerRunning(true);

    coachingPlayFromIndex(timeline, ts, 0);
  };

  const stopCoaching = () => {
    coachingPlayingRef.current = false;
    coachingAbortRef.current = true;
    setCoachingActive(false);
    setCoachingPaused(false);
    if (coachingTimeoutRef.current) { clearTimeout(coachingTimeoutRef.current); }
    if (coachingActiveSoundRef.current) {
      coachingActiveSoundRef.current.stopAsync().catch(() => {});
      coachingActiveSoundRef.current.unloadAsync().catch(() => {});
      coachingActiveSoundRef.current = null;
    }
    if (silentSoundRef.current) {
      silentSoundRef.current.setOnPlaybackStatusUpdate(null);
    }
    try { Speech?.stop(); } catch {}
  };

  const pauseCoaching = () => {
    coachingPlayingRef.current = false;
    coachingAbortRef.current = true;
    setCoachingActive(false);
    setCoachingPaused(true);
    if (coachingTimeoutRef.current) { clearTimeout(coachingTimeoutRef.current); }
    if (coachingActiveSoundRef.current) {
      coachingActiveSoundRef.current.stopAsync().catch(() => {});
      coachingActiveSoundRef.current.unloadAsync().catch(() => {});
      coachingActiveSoundRef.current = null;
    }
    if (silentSoundRef.current) {
      silentSoundRef.current.setOnPlaybackStatusUpdate(null);
    }
    try { Speech?.stop(); } catch {}
  };

  const resumeCoaching = () => {
    if (!plan || !generateCoachingTimeline) return;
    // 현재 plan 상태로 타임라인 재생성 (수동 편집 반영)
    const timeline = generateCoachingTimeline(plan, { countSpeedSec: countSpeed });
    const ts = getEventTimestamps(timeline.events);
    setCoachingTimeline(timeline);
    setCoachingTimestamps(ts);
    setCoachingPaused(false);

    // 현재 exerciseIndex + setIndex에 맞는 이벤트 찾기
    let resumeIdx = 0;
    for (let i = 0; i < timeline.events.length; i++) {
      const ev = timeline.events[i];
      if (ev.meta?.exerciseIndex === currentExIndex &&
          ev.meta?.setIndex === currentSet &&
          ev.meta?.phase === 'exercise') {
        resumeIdx = i;
        break;
      }
    }

    // 정확한 세트를 못 찾으면 해당 운동의 전환 이벤트 찾기
    if (resumeIdx === 0 && currentExIndex > 0) {
      for (let i = 0; i < timeline.events.length; i++) {
        const ev = timeline.events[i];
        if (ev.meta?.exerciseIndex === currentExIndex && ev.meta?.phase === 'transition') {
          resumeIdx = i;
          break;
        }
      }
    }

    setCoachingElapsed(ts[resumeIdx] || 0);
    setCoachingEventIdx(resumeIdx);
    coachingPlayFromIndex(timeline, ts, resumeIdx);
  };

  const coachingSkipForward = () => {
    if (!coachingTimeline) return;
    const startSearch = coachingEventIdxRef.current + 1;
    // 현재 이벤트의 세트/운동 인덱스 파악
    const currentEv = coachingTimeline.events[coachingEventIdxRef.current];
    const currentSetIdx = currentEv?.meta?.setIndex;
    const currentExIdx = currentEv?.meta?.exerciseIndex;

    for (let i = startSearch; i < coachingTimeline.events.length; i++) {
      const ev = coachingTimeline.events[i];
      // 다음 세트 시작 (같은 운동의 다음 세트 or 다음 운동 첫 세트)
      const isDifferentSet =
        ev.meta?.setIndex !== undefined &&
        (ev.meta?.setIndex !== currentSetIdx || ev.meta?.exerciseIndex !== currentExIdx);
      // 다음 운동 전환 이벤트 (모든 세트 완료 후)
      const isNextExerciseTransition = ev.meta?.phase === 'transition' && ev.meta?.exerciseName;

      if (isDifferentSet || isNextExerciseTransition) {
        stopCoaching();
        coachingElapsedRef.current = coachingTimestamps[i];
        setCoachingElapsed(coachingTimestamps[i]);
        setCoachingEventIdx(i);
        setTimeout(() => coachingPlayFromIndex(coachingTimeline, coachingTimestamps, i), 100);
        return;
      }
    }
  };

  const coachingSkipBackward = () => {
    if (!coachingTimeline) return;
    const searchFrom = coachingEventIdxRef.current - 1;
    for (let i = searchFrom; i >= 0; i--) {
      const ev = coachingTimeline.events[i];
      if (ev.meta?.phase === 'transition' && ev.meta?.exerciseName) {
        stopCoaching();
        coachingElapsedRef.current = coachingTimestamps[i];
        setCoachingElapsed(coachingTimestamps[i]);
        setCoachingEventIdx(i);
        setTimeout(() => coachingPlayFromIndex(coachingTimeline, coachingTimestamps, i), 100);
        return;
      }
    }
  };

  // 운동 중 종료 확인 다이얼로그
  const confirmExit = useCallback(() => {
    if (phase === 'exercise' || phase === 'rest') {
      Alert.alert(
        '운동을 종료하시겠어요?',
        '지금까지의 진행 상황이 저장되지 않습니다.',
        [
          { text: '계속하기', style: 'cancel' },
          {
            text: '종료',
            style: 'destructive',
            onPress: () => {
              stopCoaching();
              dismissWorkoutNotification();
              router.back();
            },
          },
        ]
      );
      return true; // BackHandler 이벤트 소비
    }
    return false;
  }, [phase]);

  // Android 하드웨어 뒤로가기 버튼 처리
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', confirmExit);
    return () => sub.remove();
  }, [confirmExit]);

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

  const parseTimedSeconds = (value: string): number | null => {
    const m = value.match(/(\d+)/);
    if (!m) return null;
    const n = parseInt(m[1], 10);
    if (Number.isNaN(n) || n <= 0) return null;
    if (value.includes('분')) return n * 60;
    if (value.includes('초')) return n;
    return null;
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
      if (timedSetRef.current) {
        clearInterval(timedSetRef.current);
        timedSetRef.current = null;
      }
      // Coaching cleanup
      coachingAbortRef.current = true;
      coachingPlayingRef.current = false;
      if (coachingTimeoutRef.current) clearTimeout(coachingTimeoutRef.current);
      if (coachingActiveSoundRef.current) {
        coachingActiveSoundRef.current.stopAsync().catch(() => {});
        coachingActiveSoundRef.current.unloadAsync().catch(() => {});
      }
      try { Speech?.stop(); } catch {}
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
          // Use a real (non-silent) audio source at near-zero volume.
          // Android drops truly silent streams, killing the JS thread.
          const { sound } = await Audio.Sound.createAsync(
            COUNT_SOUND_SOURCES[1],
            { isLooping: true, volume: 0.001 }
          );
          // Fast native callbacks keep JS thread alive in background
          await sound.setProgressUpdateIntervalAsync(200);
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

  // 운동 진입 시 자동 진행 모드 활성화:
  // - 횟수 세트: 자동 카운트 ON
  // - 시간 세트: 타이머 모드로 자동 완료
  // - 코칭 모드에서는 코칭 엔진이 진행을 제어하므로 비활성화
  useEffect(() => {
    if (coachingActive) return;
    if (!plan || phase !== 'exercise') return;
    const sd = plan.exercises[currentExIndex]?.setDetails[currentSet];
    if (!sd) return;
    const timedSeconds = parseTimedSeconds(sd.reps);
    if (timedSeconds !== null) {
      setAutoCountActive(false);
      setRepCount(0);
      return;
    }
    setSetRemaining(null);
    setAutoCountActive(true);
  }, [phase, currentExIndex, currentSet, plan, coachingActive]);

  // 시간 기반 세트(예: 30초, 1분)는 별도 자동 타이머로 완료
  // 코칭 모드에서는 코칭 엔진이 타이밍을 제어하므로 비활성화
  useEffect(() => {
    if (coachingActive) return;
    if (!plan || phase !== 'exercise') {
      setSetRemaining(null);
      if (timedSetRef.current) {
        clearInterval(timedSetRef.current);
        timedSetRef.current = null;
      }
      return;
    }

    const sd = plan.exercises[currentExIndex]?.setDetails[currentSet];
    if (!sd) return;
    const timedSeconds = parseTimedSeconds(sd.reps);
    if (timedSeconds === null) {
      setSetRemaining(null);
      return;
    }

    if (timedSetRef.current) {
      clearInterval(timedSetRef.current);
      timedSetRef.current = null;
    }

    setAutoCountActive(false);
    setRepCount(0);
    setSetRemaining(timedSeconds);
    const startedAt = Date.now();

    if (voiceEnabled) {
      playCountAudio(PHRASE_SOUND_SOURCES.start);
    }

    timedSetRef.current = setInterval(() => {
      const left = Math.max(0, timedSeconds - Math.floor((Date.now() - startedAt) / 1000));
      setSetRemaining(left);
      if (left <= 0) {
        if (timedSetRef.current) {
          clearInterval(timedSetRef.current);
          timedSetRef.current = null;
        }
        handleSetComplete();
      }
    }, 250);

    return () => {
      if (timedSetRef.current) {
        clearInterval(timedSetRef.current);
        timedSetRef.current = null;
      }
    };
  }, [phase, currentExIndex, currentSet, plan, coachingActive]);

  // Auto counting effect - counts reps automatically with voice
  // 코칭 모드에서는 비활성화 (코칭 엔진이 카운트 사운드 재생)
  useEffect(() => {
    const useNativeAutoCount =
      Platform.OS === 'android' &&
      voiceEnabled &&
      typeof AudioService?.startAutoCount === 'function' &&
      typeof AudioService?.stopAutoCount === 'function';

    let completed = false;

    if (coachingActive) return; // 코칭 모드에서는 자동 카운트 비활성화

    if (autoCountActive && phase === 'exercise') {
      const currentPlan = plan?.exercises[currentExIndex];
      if (!currentPlan) return;
      const repsValue = currentPlan.setDetails[currentSet]?.reps ?? '';
      if (parseTimedSeconds(repsValue) !== null) return;
      const targetReps = parseInt(repsValue) || 15;
      const intervalMs = countSpeed * 1000;

      autoCountStartedAtRef.current = Date.now();
      autoCountBaseRepRef.current = repCount;
      autoCountTargetRef.current = targetReps;

      if (useNativeAutoCount) {
        try {
          AudioService.startAutoCount(repCount, targetReps, intervalMs);
        } catch (e) {
          console.log('[ZenFit] startAutoCount failed:', e);
        }
      }

      autoCountRef.current = setInterval(() => {
        setRepCount((prev) => {
          const next = useNativeAutoCount
            ? Math.min(
                autoCountBaseRepRef.current +
                  Math.floor((Date.now() - autoCountStartedAtRef.current) / intervalMs),
                targetReps
              )
            : prev + 1;

          if (!useNativeAutoCount && next > prev && voiceEnabled) {
            speakCount(next);
            vibrate(50);
          }

          if (next >= targetReps && !completed) {
            completed = true;
            // Finished counting - stop auto count
            setTimeout(() => {
              setAutoCountActive(false);
              if (!useNativeAutoCount && voiceEnabled) {
                playCountAudio(PHRASE_SOUND_SOURCES.set_complete);
              }
            }, 300);
          }
          return next;
        });
      }, intervalMs);

      // Play "시작" sound when auto count begins
      if (repCount === 0 && voiceEnabled) {
        playCountAudio(PHRASE_SOUND_SOURCES.start);
      }
    }
    return () => {
      if (autoCountRef.current) {
        clearInterval(autoCountRef.current);
        autoCountRef.current = null;
      }
      if (useNativeAutoCount) {
        try {
          AudioService.stopAutoCount();
        } catch (e) {}
      }
    };
  }, [autoCountActive, phase, countSpeed, currentExIndex, currentSet]);

  // Fetch exercise media from ExerciseDB when exercise changes
  useEffect(() => {
    if (!plan || phase === 'preview' || phase === 'complete') return;
    const ex = plan.exercises[currentExIndex]?.exercise;
    if (!ex || !getExerciseMedia) return;
    setExerciseMedia(null);
    getExerciseMedia(ex.name, ex.bodyPart).then((media: any) => {
      setExerciseMedia({ imageUrl: media?.imageUrl || '', videoUrl: media?.videoUrl || '' });
    }).catch(() => {
      setExerciseMedia({ imageUrl: '', videoUrl: '' });
    });
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

  // Timer logic — wall clock 기반 (홈/잠금화면 복귀 후도 정확)
  useEffect(() => {
    if (!isTimerRunning) return;

    if (phase === 'rest') {
      // 휴식 카운트다운: restEndAt 기준 남은 시간
      if (restEndAtRef.current === 0) {
        restEndAtRef.current = Date.now() + restTime * 1000;
      }
      timerRef.current = setInterval(() => {
        const remaining = Math.ceil((restEndAtRef.current - Date.now()) / 1000);
        if (remaining <= 0) {
          restEndAtRef.current = 0;
          setRestTime(0);
          if (!coachingActive) vibrate(500);
          setPhase('exercise'); // isTimerRunning 유지 → exercise 타이머 자동 재시작
          if (voiceEnabled && !coachingActive) {
            playCountAudio(PHRASE_SOUND_SOURCES.go);
          }
        } else {
          setRestTime(remaining);
        }
      }, 500);
    } else if (phase === 'exercise') {
      // 운동 경과 타이머: exerciseStartAt 기준 경과 시간
      if (exerciseStartAtRef.current === 0) {
        exerciseStartAtRef.current = Date.now() - timer * 1000;
      }
      timerRef.current = setInterval(() => {
        setTimer(Math.floor((Date.now() - exerciseStartAtRef.current) / 1000));
      }, 500);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, phase]);

  // AppState 변경 감지: 앱 복귀 시 타이머 즉시 동기화
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && isTimerRunning) {
        if (phase === 'rest' && restEndAtRef.current > 0) {
          const remaining = Math.ceil((restEndAtRef.current - Date.now()) / 1000);
          if (remaining <= 0) {
            restEndAtRef.current = 0;
            setIsTimerRunning(false);
            setRestTime(0);
            setPhase('exercise');
            if (!coachingActive) vibrate(500);
            if (voiceEnabled && !coachingActive) {
              playCountAudio(PHRASE_SOUND_SOURCES.go);
            }
          } else {
            setRestTime(remaining);
          }
        } else if (phase === 'exercise' && exerciseStartAtRef.current > 0) {
          setTimer(Math.floor((Date.now() - exerciseStartAtRef.current) / 1000));
        }
      }
    });
    return () => sub.remove();
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
    exerciseStartAtRef.current = Date.now(); // 운동 시작 기준 시각
    restEndAtRef.current = 0;
    setPhase('exercise');
    setCurrentExIndex(0);
    setCurrentSet(0);
    setTimer(0);
    setRepCount(0);
    setSetRemaining(null);
    setAutoCountActive(true);
    setIsTimerRunning(true);
    if (voiceEnabled) {
      playCountAudio(PHRASE_SOUND_SOURCES.start);
    }
  };

  const handleSetComplete = () => {
    if (!coachingActive) vibrate(200);
    setAutoCountActive(false);
    setSetRemaining(null);

    // Mark current set as completed
    const updated = { ...plan };
    updated.exercises[currentExIndex].setDetails[currentSet].completed = true;
    setPlan({ ...updated });

    if (currentSet < currentPlanItem.setDetails.length - 1) {
      // More sets remaining - start rest
      const nextSet = currentSet + 1;
      restEndAtRef.current = 0; // 리셋 → phase 전환 후 새로 계산
      setCurrentSet(nextSet);
      setRepCount(0);
      setRestTime(currentPlanItem.restSeconds);
      setPhase('rest');
      setIsTimerRunning(true);
      if (voiceEnabled && !coachingActive) {
        playCountAudio(PHRASE_SOUND_SOURCES.set_complete);
        setTimeout(() => playCountAudio(PHRASE_SOUND_SOURCES.rest), 1200);
      }
    } else if (currentExIndex < totalExercises - 1) {
      // Next exercise
      const nextIdx = currentExIndex + 1;
      restEndAtRef.current = 0;
      setCurrentExIndex(nextIdx);
      setCurrentSet(0);
      setRepCount(0);
      setRestTime(currentPlanItem.restSeconds + EXERCISE_PREP_SECONDS);
      setPhase('rest');
      setIsTimerRunning(true);
      if (voiceEnabled && !coachingActive) {
        playCountAudio(PHRASE_SOUND_SOURCES.set_complete);
        setTimeout(() => playCountAudio(PHRASE_SOUND_SOURCES.rest), 1200);
      }
    } else {
      const sessionMinutes = Math.floor((Date.now() - startTime) / 60000);
      if (sessionMinutes < TARGET_SESSION_MINUTES) {
        const cyclePlan = {
          ...plan,
          exercises: plan.exercises.map((item) => ({
            ...item,
            setDetails: item.setDetails.map((sd) => ({ ...sd, completed: false })),
          })),
        };
        setPlan(cyclePlan);
        restEndAtRef.current = 0;
        setCurrentExIndex(0);
        setCurrentSet(0);
        setRepCount(0);
        setRestTime(EXERCISE_PREP_SECONDS);
        setPhase('rest');
        setIsTimerRunning(true);
        if (voiceEnabled && !coachingActive) {
          playCountAudio(PHRASE_SOUND_SOURCES.set_complete);
          setTimeout(() => speak('다음 사이클 시작합니다'), 1000);
        }
        return;
      }
      handleWorkoutComplete();
    }
  };

  const handleSkipRest = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    restEndAtRef.current = 0;
    setIsTimerRunning(false);
    setRestTime(0);
    setRepCount(0);
    setSetRemaining(null);
    setPhase('exercise');
    setIsTimerRunning(true);
    if (voiceEnabled) {
      playCountAudio(PHRASE_SOUND_SOURCES.go);
    }
  };

  const handleWorkoutComplete = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (timedSetRef.current) {
      clearInterval(timedSetRef.current);
      timedSetRef.current = null;
    }
    setAutoCountActive(false);
    setSetRemaining(null);
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

    if (voiceEnabled && !coachingActive) {
      playCountAudio(PHRASE_SOUND_SOURCES.set_complete);
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
  const handleSetWeightInput = (exIndex: number, setIndex: number, raw: string) => {
    if (!plan) return;
    const sanitized = raw.replace(/[^0-9.]/g, '');
    const updated = { ...plan };
    const sd = { ...updated.exercises[exIndex].setDetails[setIndex] };
    sd.weight = sanitized === '' ? 0 : parseFloat(sanitized) || 0;
    updated.exercises[exIndex] = {
      ...updated.exercises[exIndex],
      setDetails: updated.exercises[exIndex].setDetails.map((s, i) => i === setIndex ? sd : s),
    };
    setPlan({ ...updated });
  };

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

          {/* A/B/C 분할 루틴 선택 */}
          <View style={styles.splitSelectorRow}>
            <Text style={styles.splitSelectorLabel}>분할 루틴</Text>
            <View style={styles.splitChips}>
              {(['A', 'B', 'C'] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.splitChip, activeSplit === s && styles.splitChipActive]}
                  onPress={() => handleSelectSplit(s)}
                >
                  <Text style={styles.splitChipEmoji}>{goalSplits[s]?.emoji || '💪'}</Text>
                  <Text style={[styles.splitChipLabel, activeSplit === s && styles.splitChipLabelActive]}>
                    {goalSplits[s]?.label || s}
                  </Text>
                  <Text style={styles.splitChipDesc}>{goalSplits[s]?.desc || ''}</Text>
                </TouchableOpacity>
              ))}
              {activeSplit && (
                <TouchableOpacity
                  style={styles.splitChipReset}
                  onPress={() => setActiveSplit(null)}
                >
                  <Text style={styles.splitChipResetText}>초기화</Text>
                </TouchableOpacity>
              )}
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
                        {/* Weight - 직접 입력 */}
                        <View style={styles.setValueGroup}>
                          <TextInput
                            style={styles.repsInput}
                            value={String(sd.weight)}
                            onChangeText={(v) => handleSetWeightInput(exIdx, setIdx, v)}
                            keyboardType="numeric"
                            selectTextOnFocus
                          />
                          <Text style={styles.setValueUnit}>kg</Text>
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

          {/* + 운동 추가 버튼 */}
          <TouchableOpacity style={styles.addExerciseBtn} onPress={() => setShowAddExercise(true)}>
            <Text style={styles.addExerciseBtnText}>+ 운동 추가</Text>
          </TouchableOpacity>

          {/* 쿨다운 섹션 */}
          <View style={styles.cooldownSection}>
            <Text style={styles.cooldownTitle}>🧘 쿨다운 스트레칭</Text>
            <Text style={styles.cooldownSub}>운동 후 필수 · 약 5분</Text>
            {[
              { name: '폼롤러 흉추 마사지', time: '60초' },
              { name: '고관절 굴근 스트레칭', time: '30초 × 좌우' },
              { name: '어깨 후면 스트레칭', time: '30초 × 좌우' },
              { name: '햄스트링 스트레칭', time: '30초 × 좌우' },
            ].map((item, i) => (
              <View key={i} style={styles.cooldownItem}>
                <View style={styles.cooldownNum}><Text style={styles.cooldownNumText}>{i + 1}</Text></View>
                <Text style={styles.cooldownName}>{item.name}</Text>
                <Text style={styles.cooldownTime}>{item.time}</Text>
              </View>
            ))}
          </View>

          {/* 오디오 코칭 모드 */}
          <TouchableOpacity
            style={styles.coachingToggle}
            onPress={() => startCoaching()}
          >
            <Text style={styles.coachingToggleIcon}>🎧</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.coachingToggleTitle}>오디오 코칭으로 시작</Text>
              <Text style={styles.coachingToggleDesc}>
                종목·카운트·휴식을 자동 안내합니다. 잠금화면에서도 재생!
              </Text>
            </View>
            <Text style={{ color: Colors.primary, fontSize: FontSize.lg }}>▶</Text>
          </TouchableOpacity>

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

        {/* 운동 추가 모달 */}
        <Modal visible={showAddExercise} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>운동 추가</Text>
                <TouchableOpacity onPress={() => { setShowAddExercise(false); setAddSearchQuery(''); }}>
                  <Text style={styles.modalClose}>닫기</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.addSearchInput}
                placeholder="운동 이름 검색..."
                placeholderTextColor={Colors.textMuted}
                value={addSearchQuery}
                onChangeText={setAddSearchQuery}
              />
              {(() => {
                const currentIds = plan?.exercises.map((e) => e.exercise.id) ?? [];
                const filtered = (allExercises ?? []).filter((e: any) =>
                  !currentIds.includes(e.id) &&
                  (addSearchQuery === '' || e.name.toLowerCase().includes(addSearchQuery.toLowerCase()))
                );
                return filtered.length === 0 ? (
                  <Text style={styles.modalEmpty}>검색 결과가 없습니다</Text>
                ) : (
                  <FlatList
                    data={filtered}
                    keyExtractor={(item: any) => item.id}
                    renderItem={({ item }: { item: any }) => (
                      <TouchableOpacity style={styles.swapItem} onPress={() => handleAddExercise(item)}>
                        <Text style={styles.swapEmoji}>{BODY_PART_EMOJI[item.bodyPart as keyof typeof BODY_PART_EMOJI]}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.swapName}>{item.name}</Text>
                          <Text style={styles.swapDetail}>
                            {BODY_PART_LABELS[item.bodyPart as keyof typeof BODY_PART_LABELS]} | {item.equipment === 'bodyweight' ? '맨몸' : item.equipment} | {item.defaultSets}세트 x {item.defaultReps}
                          </Text>
                        </View>
                        <Text style={{ color: Colors.primary, fontSize: 20, fontWeight: '700' }}>+</Text>
                      </TouchableOpacity>
                    )}
                  />
                );
              })()}
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
      <SafeAreaView style={[styles.container, { position: 'relative' }]}>
        <View style={styles.exercisePhase}>
          {/* Top bar */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={confirmExit}>
              <Text style={styles.backButton}>←</Text>
            </TouchableOpacity>
            <Text style={styles.topBarProgress}>{currentExIndex + 1} / {totalExercises}</Text>
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

          {/* Coaching toggle + Guide */}
          <View style={styles.toggleRow}>
            {coachingActive ? (
              <View style={[styles.toggleBtn, styles.toggleBtnActive]}>
                <Text style={styles.toggleBtnText}>🎧 코칭 중</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.toggleBtn, coachingPaused && styles.toggleBtnActive]}
                onPress={resumeCoaching}
              >
                <Text style={styles.toggleBtnText}>{coachingPaused ? '🎧 코칭 재개' : '🎧 코칭 시작'}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.toggleBtn, showGuide && styles.toggleBtnActive]}
              onPress={() => setShowGuide(!showGuide)}
            >
              <Text style={styles.toggleBtnText}>📖 가이드</Text>
            </TouchableOpacity>
          </View>

          {/* Scrollable content: tip/guide, media, info, auto counter, set list */}
          <ScrollView style={[styles.setListScroll, { marginTop: 0 }]} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.sm }}>
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

            {/* Exercise Media (ExerciseDB video or image or placeholder) */}
            {exerciseMedia === null ? (
              <View style={[styles.exerciseMediaCard, styles.exerciseMediaPlaceholder]}>
                <ActivityIndicator color={Colors.primary} />
              </View>
            ) : exerciseMedia.videoUrl && Video ? (
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
            ) : exerciseMedia.imageUrl ? (
              <View style={styles.exerciseMediaCard}>
                <Image
                  source={{ uri: exerciseMedia.imageUrl }}
                  style={styles.exerciseMediaImage}
                  resizeMode="cover"
                />
              </View>
            ) : (
              <View style={[styles.exerciseMediaCard, styles.exerciseMediaPlaceholder]}>
                <Text style={{ fontSize: 52 }}>{BODY_PART_EMOJI[ex.bodyPart]}</Text>
              </View>
            )}

            {/* Exercise Info */}
            <Text style={styles.exPhaseTitle}>{ex.name}</Text>
            <Text style={styles.exPhaseSubtitle}>
              {BODY_PART_EMOJI[ex.bodyPart]} {BODY_PART_LABELS[ex.bodyPart]}
              {ex.secondaryParts?.map((p) => ` + ${BODY_PART_LABELS[p]}`).join('')}
            </Text>

            {/* Timed Set (automatic) — 코칭 중에는 숨김 */}
            {!coachingActive && setRemaining !== null && (
              <View style={styles.autoCounterContainer}>
                <View style={styles.repCounterBtn}>
                  <Text style={styles.repCounterNumber}>{setRemaining}</Text>
                  <Text style={styles.repCounterLabel}>초 남음</Text>
                </View>
                <View style={styles.autoCountControls}>
                  <Text style={styles.autoCountStartText}>시간 세트 자동 진행 중</Text>
                </View>
              </View>
            )}

            {/* Auto Counter — 코칭 중에는 숨김 (코칭 엔진이 카운트 재생) */}
            {!coachingActive && parseTimedSeconds(sd.reps) === null && (
              <View style={styles.autoCounterContainer}>
                {/* Count display */}
                <View style={styles.repCounterBtn}>
                  <Text style={styles.repCounterNumber}>{repCount}</Text>
                  <Text style={styles.repCounterLabel}>/ {sd.reps}회</Text>
                </View>

                {/* Control buttons */}
                <View style={styles.autoCountControls}>
                  {autoCountActive ? (
                    <TouchableOpacity
                      style={styles.autoCountStopBtn}
                      onPress={() => setAutoCountActive(false)}
                    >
                      <Text style={styles.autoCountStopText}>일시정지</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.autoCountStartBtn}
                      onPress={() => setAutoCountActive(true)}
                    >
                      <Text style={styles.autoCountStartText}>자동 진행 재개</Text>
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
            <View style={{ marginTop: Spacing.lg }}>
              {currentPlanItem.setDetails.map((s, idx) => {
                const isCurrent = idx === currentSet;
                const isDone = s.completed;
                const isEditable = !isDone;
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
                        <TextInput
                          style={[styles.exSetNumInput, isEditable && styles.exSetNumInputActive]}
                          value={String(s.weight)}
                          onChangeText={(v) => isEditable && handleSetWeightInput(currentExIndex, idx, v)}
                          keyboardType="numeric"
                          selectTextOnFocus
                          editable={isEditable}
                        />
                        <Text style={styles.exSetUnit}>kg</Text>
                        <Text style={styles.exSetDivider}>/</Text>
                      </>
                    )}

                    <TextInput
                      style={[styles.exSetNumInput, isEditable && styles.exSetNumInputActive, isCurrent && isEditable && styles.exSetNumInputCurrent]}
                      value={s.reps}
                      onChangeText={(v) => isEditable && handleUpdateSetReps(currentExIndex, idx, v)}
                      keyboardType="numeric"
                      selectTextOnFocus
                      editable={isEditable}
                    />
                    <Text style={styles.exSetUnit}>{s.reps.includes('초') ? '초' : '회'}</Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>

          {/* 다음 운동 미리보기 카드 */}
          {currentExIndex < totalExercises - 1 && (
            <View style={styles.nextExCard}>
              <View style={styles.nextExCardInner}>
                <Text style={styles.nextExLabel}>다음 운동</Text>
                <Text style={styles.nextExName}>{plan.exercises[currentExIndex + 1].exercise.name}</Text>
              </View>
              <Text style={styles.nextExEmoji}>
                {BODY_PART_EMOJI[plan.exercises[currentExIndex + 1].exercise.bodyPart]}
              </Text>
            </View>
          )}

          {/* Bottom: 수동 넘김(자동 진행 보조) + 하단 네비게이션 */}
          {!coachingActive && (
            <View style={styles.bottomBtns}>
              {/* 이전 운동으로 */}
              <TouchableOpacity
                style={styles.navBtn}
                onPress={() => {
                  if (currentExIndex > 0) {
                    restEndAtRef.current = 0;
                    exerciseStartAtRef.current = Date.now();
                    setCurrentExIndex(currentExIndex - 1);
                    setCurrentSet(0);
                    setTimer(0);
                    setRepCount(0);
                  }
                }}
              >
                <Text style={styles.navBtnText}>⏮</Text>
              </TouchableOpacity>

              {/* 즉시 다음 단계로 수동 진행 */}
              <TouchableOpacity style={styles.setCompleteBtn} onPress={handleSetComplete}>
                <Text style={styles.setCompleteBtnText}>
                  {currentSet < currentPlanItem.setDetails.length - 1
                    ? '즉시 다음 세트'
                    : currentExIndex < totalExercises - 1
                      ? '즉시 다음 운동 →'
                      : '운동 완료! 🎉'}
                </Text>
              </TouchableOpacity>

              {/* 다음 운동으로 건너뛰기 */}
              <TouchableOpacity
                style={styles.navBtn}
                onPress={() => {
                  if (currentExIndex < totalExercises - 1) {
                    restEndAtRef.current = 0;
                    exerciseStartAtRef.current = Date.now();
                    setCurrentExIndex(currentExIndex + 1);
                    setCurrentSet(0);
                    setTimer(0);
                    setRepCount(0);
                  } else {
                    handleWorkoutComplete();
                  }
                }}
              >
                <Text style={styles.navBtnText}>⏭</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Coaching control bar */}
          {coachingActive && (
            <View style={styles.coachingBar}>
              <TouchableOpacity onPress={coachingSkipBackward}>
                <Text style={styles.coachingBarBtn}>⏮</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={pauseCoaching}>
                <Text style={styles.coachingBarBtn}>⏸</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={coachingSkipForward}>
                <Text style={styles.coachingBarBtn}>⏭</Text>
              </TouchableOpacity>
              <View style={styles.coachingBarProgress}>
                <View style={[styles.coachingBarFill, {
                  width: `${coachingTimeline ? (coachingElapsed / coachingTimeline.totalDurationMs * 100) : 0}%`
                }]} />
              </View>
              <Text style={styles.coachingBarTime}>
                {Math.floor(coachingElapsed / 60000)}:{String(Math.floor((coachingElapsed % 60000) / 1000)).padStart(2, '0')}
              </Text>
            </View>
          )}
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
      <SafeAreaView style={[styles.container, { position: 'relative' }]}>
        <View style={styles.restContainer}>
          <TouchableOpacity onPress={confirmExit} style={{ position: 'absolute', top: 0, left: Spacing.lg }}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.restLabel}>휴식 시간</Text>
          <Text style={styles.restTimer}>{formatTime(restTime)}</Text>
          <Text style={styles.restHint}>다음: {nextEx?.exercise.name}</Text>

          <View style={styles.restMotivation}>
            <Text style={styles.restMotivationText}>
              {restTime > 30 ? '호흡을 가다듬으세요 😮‍💨' : '거의 다 쉬었어요! 준비하세요 💪'}
            </Text>
          </View>

          {!coachingActive && (
            <TouchableOpacity style={styles.skipRestBtn} onPress={handleSkipRest}>
              <Text style={styles.skipRestBtnText}>휴식 건너뛰기 →</Text>
            </TouchableOpacity>
          )}

          {/* 코칭 재개 버튼 (일시정지 상태일 때) */}
          {!coachingActive && coachingPaused && (
            <TouchableOpacity
              style={[styles.skipRestBtn, { backgroundColor: Colors.primary + '20', borderColor: Colors.primary, borderWidth: 1, marginTop: Spacing.sm }]}
              onPress={resumeCoaching}
            >
              <Text style={[styles.skipRestBtnText, { color: Colors.primary }]}>🎧 오디오 코칭 재개</Text>
            </TouchableOpacity>
          )}

          {/* Ad placeholder */}
          {!coachingActive && (
            <View style={styles.adPlaceholder}>
              <Text style={styles.adText}>📢 광고 영역 (구독 시 제거)</Text>
            </View>
          )}

          {/* Coaching control bar */}
          {coachingActive && (
            <View style={[styles.coachingBar, { position: 'relative', marginTop: Spacing.lg, width: '100%' }]}>
              <TouchableOpacity onPress={coachingSkipBackward}>
                <Text style={styles.coachingBarBtn}>⏮</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={pauseCoaching}>
                <Text style={styles.coachingBarBtn}>⏸</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={coachingSkipForward}>
                <Text style={styles.coachingBarBtn}>⏭</Text>
              </TouchableOpacity>
              <View style={styles.coachingBarProgress}>
                <View style={[styles.coachingBarFill, {
                  width: `${coachingTimeline ? (coachingElapsed / coachingTimeline.totalDurationMs * 100) : 0}%`
                }]} />
              </View>
              <Text style={styles.coachingBarTime}>
                {Math.floor(coachingElapsed / 60000)}:{String(Math.floor((coachingElapsed % 60000) / 1000)).padStart(2, '0')}
              </Text>
            </View>
          )}
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

  // A/B/C 분할 루틴 선택
  splitSelectorRow: {
    marginHorizontal: Spacing.lg, marginTop: Spacing.md,
  },
  splitSelectorLabel: {
    color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm,
  },
  splitChips: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  splitChip: {
    flex: 1, minWidth: 80, backgroundColor: Colors.card,
    borderRadius: BorderRadius.md, padding: Spacing.sm,
    borderWidth: 1, borderColor: Colors.cardBorder,
    alignItems: 'center',
  },
  splitChipActive: { borderColor: Colors.primary, backgroundColor: 'rgba(78,238,176,0.1)' },
  splitChipEmoji: { fontSize: 20, marginBottom: 2 },
  splitChipLabel: { color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: '700' },
  splitChipLabelActive: { color: Colors.primary },
  splitChipDesc: { color: Colors.textMuted, fontSize: 10, marginTop: 1 },
  splitChipReset: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
    alignSelf: 'center',
  },
  splitChipResetText: { color: Colors.textMuted, fontSize: FontSize.xs },

  // + 운동 추가 버튼
  addExerciseBtn: {
    marginHorizontal: Spacing.lg, marginTop: Spacing.md,
    borderWidth: 1, borderColor: Colors.primary, borderStyle: 'dashed',
    borderRadius: BorderRadius.md, paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  addExerciseBtnText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '700' },

  // 쿨다운 섹션
  cooldownSection: {
    marginHorizontal: Spacing.lg, marginTop: Spacing.lg,
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  cooldownTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: '700' },
  cooldownSub: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2, marginBottom: Spacing.sm },
  cooldownItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  cooldownNum: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  cooldownNumText: { color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: '700' },
  cooldownName: { flex: 1, color: Colors.text, fontSize: FontSize.sm },
  cooldownTime: { color: Colors.textMuted, fontSize: FontSize.xs },

  // 운동 추가 검색 입력
  addSearchInput: {
    backgroundColor: Colors.surface, color: Colors.text,
    borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm, fontSize: FontSize.sm,
    marginBottom: Spacing.sm,
  },

  startBtn: {
    marginHorizontal: Spacing.lg, marginTop: Spacing.lg,
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md, alignItems: 'center',
  },
  startBtnText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.background },

  // ===== Exercise Phase =====
  exercisePhase: { flex: 1, padding: Spacing.lg },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  topBarProgress: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '600', flex: 1 },
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
  exerciseMediaPlaceholder: {
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.cardBorder,
  },

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
  exSetNumInput: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.textMuted,
    minWidth: 48,
    textAlign: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  exSetNumInputActive: {
    color: Colors.text,
  },
  exSetNumInputCurrent: {
    backgroundColor: 'rgba(78, 238, 176, 0.15)',
    color: Colors.primary,
  },

  // 다음 운동 미리보기 카드
  nextExCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: BorderRadius.md,
    padding: Spacing.sm, marginTop: Spacing.sm,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  nextExCardInner: { flex: 1 },
  nextExLabel: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '600' },
  nextExName: { color: Colors.text, fontSize: FontSize.sm, fontWeight: '700', marginTop: 2 },
  nextExEmoji: { fontSize: 28, marginLeft: Spacing.sm },

  // Bottom buttons
  bottomBtns: {
    flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm, alignItems: 'center',
  },
  navBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  navBtnText: { fontSize: 20 },
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

  // Coaching toggle (preview)
  coachingToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A2A1A',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#2A3A2A',
    gap: Spacing.sm,
  },
  coachingToggleIcon: { fontSize: 28 },
  coachingToggleTitle: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '700' },
  coachingToggleDesc: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },

  // Coaching bar (exercise/rest bottom)
  coachingBar: {
    backgroundColor: '#1A1A1A',
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  coachingBarBtn: { fontSize: 20, color: Colors.text, padding: Spacing.xs },
  coachingBarProgress: { flex: 1, height: 3, backgroundColor: '#2A2A2A', borderRadius: 2 },
  coachingBarFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
  coachingBarTime: { color: Colors.textMuted, fontSize: FontSize.xs, fontVariant: ['tabular-nums'] },
});
