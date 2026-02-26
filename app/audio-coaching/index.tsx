import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform, ActivityIndicator, BackHandler, AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

// === Dynamic imports ===
let Colors: any, Spacing: any, FontSize: any, BorderRadius: any;
try {
  const theme = require('../../constants/theme');
  Colors = theme.Colors; Spacing = theme.Spacing;
  FontSize = theme.FontSize; BorderRadius = theme.BorderRadius;
} catch {
  Colors = { background: '#0D0D0D', card: '#1A1A1A', cardBorder: '#2A2A2A', surface: '#242424', primary: '#4EEEB0', primaryDark: '#3BC494', accent: '#FF6B6B', warning: '#FFB84D', text: '#FFFFFF', textSecondary: '#9CA3AF', textMuted: '#6B7280', success: '#4EEEB0', danger: '#FF4757' };
  Spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
  FontSize = { xs: 12, sm: 14, md: 16, lg: 18, xl: 24, xxl: 32, hero: 48 };
  BorderRadius = { sm: 8, md: 12, lg: 16, xl: 24, full: 9999 };
}

let useStore: any;
try { useStore = require('../../store/useStore').useStore; } catch {}

let generateWorkoutPlan: any, getRecommendedParts: any;
let BODY_PART_LABELS: any, BODY_PART_EMOJI: any;
try {
  const data = require('../../data/exercises');
  generateWorkoutPlan = data.generateWorkoutPlan;
  getRecommendedParts = data.getRecommendedParts;
  BODY_PART_LABELS = data.BODY_PART_LABELS;
  BODY_PART_EMOJI = data.BODY_PART_EMOJI;
} catch {}

let Audio: any = null;
try { Audio = require('expo-av').Audio; } catch {}

let Speech: any = null;
try { Speech = require('expo-speech'); } catch {}

import {
  generateCoachingTimeline,
  getEventTimestamps,
  findEventAtTime,
  type CoachingTimeline,
  type AudioEvent,
} from '../../services/audioCoaching';

// Sound source mappings (same as workout screen)
// Metro bundler requires static require() calls — no dynamic template strings
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
const PHRASE_SOUND_SOURCES: Record<string, any> = {
  phrase_start: require('../../assets/sounds/start.mp3'),
  phrase_set_complete: require('../../assets/sounds/set_complete.mp3'),
  phrase_go: require('../../assets/sounds/go.mp3'),
  phrase_rest: require('../../assets/sounds/rest.mp3'),
};

const getSoundSource = (key: string): any => {
  if (key.startsWith('count_')) {
    const n = parseInt(key.replace('count_', ''));
    return COUNT_SOUND_SOURCES[n];
  }
  return PHRASE_SOUND_SOURCES[key];
};

// === Audio Coaching Player ===

export default function AudioCoachingScreen() {
  const profile = useStore?.((s: any) => s.profile);
  const completeToday = useStore?.((s: any) => s.completeToday);
  const addWorkoutLog = useStore?.((s: any) => s.addWorkoutLog);

  const [timeline, setTimeline] = useState<CoachingTimeline | null>(null);
  const [timestamps, setTimestamps] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPreparing, setIsPreparing] = useState(true);
  const [currentEventIdx, setCurrentEventIdx] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [countSpeed, setCountSpeed] = useState(3);

  // Refs for playback engine
  const playingRef = useRef(false);
  const eventIdxRef = useRef(0);
  const elapsedRef = useRef(0);
  const startedAtRef = useRef(0);
  const activeSoundRef = useRef<any>(null);
  const silentSoundRef = useRef<any>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef(false);

  // Generate timeline on mount
  useEffect(() => {
    if (!profile) {
      setError('프로필이 없습니다. 온보딩을 다시 진행해주세요.');
      setIsPreparing(false);
      return;
    }
    try {
      const dayOfWeek = new Date().getDay();
      const goal = profile.goal || 'maintain';
      const experience = profile.experience || 'beginner';
      const parts = getRecommendedParts(dayOfWeek, goal);
      const plan = generateWorkoutPlan(goal, experience, parts);
      if (!plan || plan.exercises.length === 0) {
        setError('운동 플랜이 비어있습니다.');
        setIsPreparing(false);
        return;
      }
      const tl = generateCoachingTimeline(plan, { countSpeedSec: countSpeed });
      const ts = getEventTimestamps(tl.events);
      setTimeline(tl);
      setTimestamps(ts);
      setIsPreparing(false);
    } catch (e: any) {
      setError(`타임라인 생성 오류: ${e?.message}`);
      setIsPreparing(false);
    }
  }, [profile, countSpeed]);

  // Setup background audio mode
  useEffect(() => {
    (async () => {
      try {
        if (Audio?.setAudioModeAsync) {
          await Audio.setAudioModeAsync({
            staysActiveInBackground: true,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: false,
          });
        }
      } catch {}
    })();
    return () => {
      abortRef.current = true;
      stopPlayback();
    };
  }, []);

  // Back handler
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isPlaying) {
        stopPlayback();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [isPlaying]);

  // UI tick for elapsed time display
  useEffect(() => {
    if (isPlaying) {
      tickRef.current = setInterval(() => {
        if (playingRef.current && startedAtRef.current > 0) {
          const now = Date.now();
          const newElapsed = elapsedRef.current + (now - startedAtRef.current);
          setElapsedMs(newElapsed);

          // Update current event display
          if (timeline) {
            const found = findEventAtTime(timeline.events, timestamps, newElapsed);
            if (found) setCurrentEventIdx(found.eventIndex);
          }
        }
      }, 250);
    }
    return () => {
      if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    };
  }, [isPlaying, timeline, timestamps]);

  // === Playback Engine ===

  const playSoundAsync = async (source: any): Promise<void> => {
    if (!Audio?.Sound) return;
    try {
      if (activeSoundRef.current) {
        await activeSoundRef.current.stopAsync().catch(() => {});
        await activeSoundRef.current.unloadAsync().catch(() => {});
        activeSoundRef.current = null;
      }
      const { sound } = await Audio.Sound.createAsync(source, { volume: 1.0 });
      activeSoundRef.current = sound;
      await sound.playAsync();
      // Wait for sound to finish
      await new Promise<void>((resolve) => {
        sound.setOnPlaybackStatusUpdate((status: any) => {
          if (status?.didJustFinish) {
            sound.unloadAsync().catch(() => {});
            if (activeSoundRef.current === sound) activeSoundRef.current = null;
            resolve();
          }
        });
        // Timeout fallback
        setTimeout(resolve, 3000);
      });
    } catch {
      // Sound playback failed, continue
    }
  };

  const speakAsync = async (text: string, durationMs: number): Promise<void> => {
    return new Promise<void>((resolve) => {
      try {
        Speech?.speak(text, {
          language: 'ko-KR',
          rate: 0.9,
          pitch: 1.0,
          onDone: resolve,
          onError: resolve,
        });
      } catch {
        resolve();
      }
      // Timeout fallback
      setTimeout(resolve, durationMs + 500);
    });
  };

  const waitMs = (ms: number): Promise<void> => {
    return new Promise((resolve) => {
      timeoutRef.current = setTimeout(resolve, ms);
    });
  };

  const startSilentLoop = async () => {
    try {
      if (!Audio?.Sound || silentSoundRef.current) return;
      // Play a real audio at near-zero volume to keep Android foreground service alive
      const { sound } = await Audio.Sound.createAsync(
        COUNT_SOUND_SOURCES[1],
        { isLooping: true, volume: 0.001 }
      );
      silentSoundRef.current = sound;
      await sound.playAsync();
      console.log('[AudioCoaching] Background silent loop started');
    } catch (e) {
      console.log('[AudioCoaching] Background loop error:', e);
    }
  };

  const stopSilentLoop = async () => {
    try {
      if (silentSoundRef.current) {
        await silentSoundRef.current.stopAsync();
        await silentSoundRef.current.unloadAsync();
        silentSoundRef.current = null;
        console.log('[AudioCoaching] Background silent loop stopped');
      }
    } catch {}
  };

  const playFromIndex = async (startIdx: number) => {
    if (!timeline) return;
    abortRef.current = false;
    playingRef.current = true;
    setIsPlaying(true);

    // Start background silent loop to keep audio session alive
    await startSilentLoop();

    for (let i = startIdx; i < timeline.events.length; i++) {
      if (abortRef.current || !playingRef.current) break;

      eventIdxRef.current = i;
      setCurrentEventIdx(i);
      startedAtRef.current = Date.now();

      const event = timeline.events[i];

      switch (event.type) {
        case 'sound': {
          const source = getSoundSource(event.payload);
          if (source) {
            await playSoundAsync(source);
          } else {
            await waitMs(event.durationMs);
          }
          break;
        }
        case 'speech': {
          await speakAsync(event.payload, event.durationMs);
          break;
        }
        case 'silence': {
          await waitMs(event.durationMs);
          break;
        }
      }

      // Update elapsed tracking
      elapsedRef.current = timestamps[i] + event.durationMs;
    }

    // Playback complete
    await stopSilentLoop();
    if (!abortRef.current) {
      playingRef.current = false;
      setIsPlaying(false);
      // Log workout completion
      if (timeline && completeToday && addWorkoutLog) {
        completeToday();
        addWorkoutLog({
          date: new Date().toISOString().split('T')[0],
          completed: true,
          exercises: timeline.exerciseCount,
          duration: Math.round(timeline.totalDurationMs / 60000),
          calories: 0, // Will be calculated properly when plan is passed
        });
      }
    }
  };

  const startPlayback = () => {
    playFromIndex(0);
  };

  const resumePlayback = () => {
    // Find the event closest to current elapsed position
    if (!timeline) return;
    const found = findEventAtTime(timeline.events, timestamps, elapsedRef.current);
    const idx = found ? found.eventIndex : 0;
    playFromIndex(idx);
  };

  const stopPlayback = () => {
    playingRef.current = false;
    abortRef.current = true;
    setIsPlaying(false);
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    if (activeSoundRef.current) {
      activeSoundRef.current.stopAsync().catch(() => {});
      activeSoundRef.current.unloadAsync().catch(() => {});
      activeSoundRef.current = null;
    }
    stopSilentLoop();
    try { Speech?.stop(); } catch {}
  };

  const skipForward = () => {
    if (!timeline) return;
    // Find next exercise transition or rest period
    const startSearch = eventIdxRef.current + 1;
    for (let i = startSearch; i < timeline.events.length; i++) {
      const ev = timeline.events[i];
      if (ev.meta?.phase === 'transition' && ev.meta?.exerciseName) {
        stopPlayback();
        elapsedRef.current = timestamps[i];
        setElapsedMs(timestamps[i]);
        setCurrentEventIdx(i);
        setTimeout(() => playFromIndex(i), 100);
        return;
      }
    }
  };

  const skipBackward = () => {
    if (!timeline) return;
    // Find previous exercise transition
    const startSearch = Math.max(0, eventIdxRef.current - 1);
    for (let i = startSearch; i >= 0; i--) {
      const ev = timeline.events[i];
      if (ev.meta?.phase === 'transition' && ev.meta?.exerciseName) {
        stopPlayback();
        elapsedRef.current = timestamps[i];
        setElapsedMs(timestamps[i]);
        setCurrentEventIdx(i);
        setTimeout(() => playFromIndex(i), 100);
        return;
      }
    }
    // Go to beginning
    stopPlayback();
    elapsedRef.current = 0;
    setElapsedMs(0);
    setCurrentEventIdx(0);
  };

  // === Formatting helpers ===

  const formatDuration = (ms: number): string => {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${String(sec).padStart(2, '0')}`;
  };

  const formatDurationLong = (ms: number): string => {
    const totalMin = Math.round(ms / 60000);
    if (totalMin >= 60) {
      const h = Math.floor(totalMin / 60);
      const m = totalMin % 60;
      return `${h}시간 ${m}분`;
    }
    return `${totalMin}분`;
  };

  // Get current event info for display
  const currentEvent = timeline?.events[currentEventIdx];
  const currentMeta = currentEvent?.meta;
  const progress = timeline ? Math.min(100, (elapsedMs / timeline.totalDurationMs) * 100) : 0;

  // Get exercise list from timeline for track listing
  const exerciseList: { name: string; index: number; eventIdx: number }[] = [];
  if (timeline) {
    timeline.events.forEach((ev, idx) => {
      if (ev.meta?.phase === 'transition' && ev.meta?.exerciseName && ev.meta?.exerciseIndex !== undefined) {
        if (!exerciseList.some(e => e.index === ev.meta!.exerciseIndex)) {
          exerciseList.push({
            name: ev.meta.exerciseName,
            index: ev.meta.exerciseIndex!,
            eventIdx: idx,
          });
        }
      }
    });
  }

  // === Render ===

  if (isPreparing) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.centerContent}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={s.loadingText}>오디오 코칭 준비 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.centerContent}>
          <Text style={{ fontSize: 48 }}>{'⚠️'}</Text>
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Text style={s.backBtnText}>돌아가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => { stopPlayback(); router.back(); }}>
            <Text style={s.headerBack}>{'<-'} 뒤로</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>오디오 코칭</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Now Playing Card */}
        <View style={s.nowPlayingCard}>
          <View style={s.albumArt}>
            <Text style={s.albumEmoji}>
              {currentMeta?.exerciseName && currentMeta.exerciseIndex !== undefined
                ? (BODY_PART_EMOJI?.[(timeline?.events.find(e =>
                    e.meta?.exerciseIndex === currentMeta.exerciseIndex && e.meta?.phase === 'transition'
                  ) as any)?.meta?.exerciseName] || '🏋️')
                : currentMeta?.phase === 'rest' ? '😮‍💨' : currentMeta?.phase === 'outro' ? '🎉' : '🏋️'}
            </Text>
          </View>

          <Text style={s.nowPlayingTitle}>
            {currentMeta?.exerciseName || timeline?.planName || '운동 코칭'}
          </Text>
          <Text style={s.nowPlayingSubtitle}>
            {currentMeta?.label || phaseLabel(currentMeta?.phase)}
          </Text>

          {/* Progress Bar */}
          <View style={s.progressContainer}>
            <View style={s.progressBar}>
              <View style={[s.progressFill, { width: `${progress}%` }]} />
            </View>
            <View style={s.progressTimes}>
              <Text style={s.progressTime}>{formatDuration(elapsedMs)}</Text>
              <Text style={s.progressTime}>{timeline ? formatDuration(timeline.totalDurationMs) : '0:00'}</Text>
            </View>
          </View>

          {/* Controls */}
          <View style={s.controls}>
            <TouchableOpacity style={s.controlBtn} onPress={skipBackward}>
              <Text style={s.controlIcon}>{'⏮'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.playBtn}
              onPress={() => {
                if (isPlaying) {
                  stopPlayback();
                } else if (elapsedMs > 0) {
                  resumePlayback();
                } else {
                  startPlayback();
                }
              }}
            >
              <Text style={s.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.controlBtn} onPress={skipForward}>
              <Text style={s.controlIcon}>{'⏭'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Card */}
        <View style={s.infoCard}>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>총 시간</Text>
            <Text style={s.infoValue}>{timeline ? formatDurationLong(timeline.totalDurationMs) : '-'}</Text>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>운동 수</Text>
            <Text style={s.infoValue}>{timeline?.exerciseCount ?? 0}개</Text>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>카운트 속도</Text>
            <View style={s.speedRow}>
              {[2, 3, 4, 5].map(spd => (
                <TouchableOpacity
                  key={spd}
                  style={[s.speedChip, countSpeed === spd && s.speedChipActive]}
                  onPress={() => {
                    if (!isPlaying) setCountSpeed(spd);
                  }}
                >
                  <Text style={[s.speedChipText, countSpeed === spd && s.speedChipTextActive]}>
                    {spd}초
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Background playback notice */}
        <View style={s.noticeCard}>
          <Text style={s.noticeIcon}>{'🔒'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.noticeTitle}>잠금화면에서도 재생됩니다</Text>
            <Text style={s.noticeDesc}>
              오디오 코칭은 화면이 꺼지거나 잠금 상태에서도 계속 재생됩니다. 이어폰을 착용하고 운동에 집중하세요.
            </Text>
          </View>
        </View>

        {/* Track List */}
        <View style={s.trackList}>
          <Text style={s.trackListTitle}>운동 목록</Text>
          {exerciseList.map((ex, i) => {
            const isCurrentEx = currentMeta?.exerciseIndex === ex.index && isPlaying;
            return (
              <TouchableOpacity
                key={ex.index}
                style={[s.trackItem, isCurrentEx && s.trackItemActive]}
                onPress={() => {
                  if (isPlaying) stopPlayback();
                  elapsedRef.current = timestamps[ex.eventIdx];
                  setElapsedMs(timestamps[ex.eventIdx]);
                  setCurrentEventIdx(ex.eventIdx);
                  setTimeout(() => playFromIndex(ex.eventIdx), 100);
                }}
              >
                <View style={[s.trackNumber, isCurrentEx && s.trackNumberActive]}>
                  <Text style={[s.trackNumberText, isCurrentEx && s.trackNumberTextActive]}>
                    {isCurrentEx ? '>' : ex.index + 1}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.trackName, isCurrentEx && s.trackNameActive]}>{ex.name}</Text>
                  <Text style={s.trackTime}>{formatDuration(timestamps[ex.eventIdx])}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: Spacing.xxl * 2 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function phaseLabel(phase?: string): string {
  switch (phase) {
    case 'intro': return '준비 중';
    case 'exercise': return '운동 중';
    case 'rest': return '휴식';
    case 'transition': return '다음 운동 준비';
    case 'outro': return '운동 완료';
    default: return '대기 중';
  }
}

// === Styles ===

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 16,
    marginTop: 16,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  backBtn: {
    marginTop: 24,
    backgroundColor: '#4EEEB0',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  backBtnText: {
    color: '#0D0D0D',
    fontWeight: '700',
    fontSize: 16,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  headerBack: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  // Now Playing
  nowPlayingCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  albumArt: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#242424',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  albumEmoji: {
    fontSize: 52,
  },
  nowPlayingTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  nowPlayingSubtitle: {
    color: '#4EEEB0',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
  },

  // Progress
  progressContainer: {
    width: '100%',
    marginTop: 24,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#2A2A2A',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4EEEB0',
    borderRadius: 2,
  },
  progressTimes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressTime: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
  },

  // Controls
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 28,
  },
  controlBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#242424',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlIcon: {
    fontSize: 22,
    color: '#FFFFFF',
  },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#4EEEB0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 28,
    color: '#0D0D0D',
  },

  // Info Card
  infoCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  speedRow: {
    flexDirection: 'row',
    gap: 8,
  },
  speedChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#242424',
  },
  speedChipActive: {
    backgroundColor: '#4EEEB0',
  },
  speedChipText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  speedChipTextActive: {
    color: '#0D0D0D',
  },

  // Notice Card
  noticeCard: {
    backgroundColor: '#1A2A1A',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#2A3A2A',
  },
  noticeIcon: {
    fontSize: 28,
  },
  noticeTitle: {
    color: '#4EEEB0',
    fontSize: 14,
    fontWeight: '700',
  },
  noticeDesc: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },

  // Track List
  trackList: {
    marginTop: 24,
  },
  trackListTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  trackItemActive: {
    backgroundColor: 'rgba(78, 238, 176, 0.08)',
  },
  trackNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#242424',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  trackNumberActive: {
    backgroundColor: '#4EEEB0',
  },
  trackNumberText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '700',
  },
  trackNumberTextActive: {
    color: '#0D0D0D',
  },
  trackName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  trackNameActive: {
    color: '#4EEEB0',
  },
  trackTime: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 2,
  },
});
