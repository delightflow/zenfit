/**
 * Audio Coaching Service
 *
 * Generates a full workout audio coaching timeline and plays it using expo-av.
 * Unlike expo-speech (TTS), expo-av with staysActiveInBackground: true
 * continues playing even when the screen is locked or app is backgrounded.
 *
 * Timeline structure:
 *   [Intro] → [Exercise 1: Set 1 counting → rest → Set 2 counting → rest → ...] → [Exercise 2: ...] → [Outro]
 *
 * Each segment is a queued audio event (pre-recorded mp3 or silence gap).
 */

import type { WorkoutPlan, WorkoutPlanItem } from '../data/exercises';

// === Types ===

export type AudioEventType = 'sound' | 'silence' | 'speech';

export interface AudioEvent {
  type: AudioEventType;
  /** For 'sound': key into sound sources. For 'speech': text to speak. For 'silence': ignored. */
  payload: string;
  /** Duration in milliseconds */
  durationMs: number;
  /** Metadata for UI display */
  meta?: {
    exerciseIndex?: number;
    exerciseName?: string;
    setIndex?: number;
    phase?: 'intro' | 'exercise' | 'rest' | 'transition' | 'outro';
    label?: string;
  };
}

export interface CoachingTimeline {
  events: AudioEvent[];
  totalDurationMs: number;
  exerciseCount: number;
  planName: string;
}

// === Sound key mapping ===
// These keys map to the pre-recorded mp3 files in assets/sounds/
export const SOUND_KEYS = {
  counts: Array.from({ length: 30 }, (_, i) => `count_${i + 1}`),
  start: 'phrase_start',
  set_complete: 'phrase_set_complete',
  go: 'phrase_go',
  rest: 'phrase_rest',
} as const;

// Estimated duration (ms) per pre-recorded sound
const SOUND_DURATION_MS: Record<string, number> = {};
// Count sounds: ~0.8s each
for (let i = 1; i <= 30; i++) {
  SOUND_DURATION_MS[`count_${i}`] = 800;
}
// Phrase sounds: ~1.2s each
SOUND_DURATION_MS['phrase_start'] = 1200;
SOUND_DURATION_MS['phrase_set_complete'] = 1500;
SOUND_DURATION_MS['phrase_go'] = 1000;
SOUND_DURATION_MS['phrase_rest'] = 1200;

// TTS speech duration estimate (Korean: ~4 chars/sec)
const estimateSpeechDurationMs = (text: string): number => {
  return Math.max(1500, text.length * 250);
};

// === Timeline Generator ===

export function generateCoachingTimeline(
  plan: WorkoutPlan,
  options?: {
    countSpeedSec?: number; // seconds between counts (default 3)
    restAnnounceSec?: number; // announce remaining rest at these intervals
  }
): CoachingTimeline {
  const countSpeed = (options?.countSpeedSec ?? 3) * 1000;
  const events: AudioEvent[] = [];

  // --- Intro (placeholder — payload updated after total duration is known) ---
  const introIdx = events.length;
  events.push({
    type: 'speech',
    payload: '', // filled in below
    durationMs: 4000,
    meta: { phase: 'intro', label: '운동 시작 안내' },
  });

  events.push({ type: 'silence', payload: '', durationMs: 2000, meta: { phase: 'intro' } });

  // --- Each exercise ---
  plan.exercises.forEach((item, exIdx) => {
    const ex = item.exercise;
    const sets = item.setDetails;
    const isTimeBased = sets[0]?.reps?.includes('초');

    // Exercise transition announcement
    events.push({
      type: 'speech',
      payload: `${exIdx + 1}번째 운동, ${ex.name}. ${sets.length}세트${isTimeBased ? '' : `, ${sets[0].reps}회`} 진행합니다.`,
      durationMs: estimateSpeechDurationMs(`${exIdx + 1}번째 운동, ${ex.name}. ${sets.length}세트, ${sets[0].reps}회 진행합니다.`),
      meta: {
        exerciseIndex: exIdx,
        exerciseName: ex.name,
        phase: 'transition',
        label: `${ex.name} 소개`,
      },
    });

    // Brief coaching tip
    if (ex.voiceCoaching && ex.voiceCoaching.length > 0) {
      events.push({
        type: 'speech',
        payload: ex.tips[0] || ex.voiceCoaching[0],
        durationMs: estimateSpeechDurationMs(ex.tips[0] || ex.voiceCoaching[0]),
        meta: {
          exerciseIndex: exIdx,
          exerciseName: ex.name,
          phase: 'transition',
          label: '코칭 팁',
        },
      });
    }

    events.push({ type: 'silence', payload: '', durationMs: 2000, meta: { phase: 'transition' } });

    // --- Each set ---
    sets.forEach((sd, setIdx) => {
      // Set announcement with weight info
      const weightInfo = sd.weight > 0 ? ` ${sd.weight}킬로그램,` : '';
      const repsInfo = isTimeBased ? ` ${sd.reps}` : ` ${sd.reps}회`;
      const setAnnounce = `${setIdx + 1}세트,${weightInfo}${repsInfo} 시작합니다.`;
      events.push({
        type: 'speech',
        payload: setAnnounce,
        durationMs: estimateSpeechDurationMs(setAnnounce),
        meta: {
          exerciseIndex: exIdx,
          exerciseName: ex.name,
          setIndex: setIdx,
          phase: 'exercise',
          label: `${setIdx + 1}세트${sd.weight > 0 ? ` ${sd.weight}kg` : ''} 시작`,
        },
      });

      // "Start" sound
      events.push({
        type: 'sound',
        payload: 'phrase_start',
        durationMs: SOUND_DURATION_MS['phrase_start'],
        meta: {
          exerciseIndex: exIdx,
          exerciseName: ex.name,
          setIndex: setIdx,
          phase: 'exercise',
        },
      });

      events.push({ type: 'silence', payload: '', durationMs: 1000, meta: { phase: 'exercise' } });

      if (isTimeBased) {
        // Time-based exercise: count down the seconds
        const seconds = parseInt(sd.reps) || 30;
        // Count at 5-second intervals, then last 5 seconds one by one
        for (let t = seconds; t > 0; t--) {
          if (t <= 5 || t === seconds || t % 10 === 0) {
            if (t <= 30) {
              events.push({
                type: 'sound',
                payload: `count_${t}`,
                durationMs: SOUND_DURATION_MS[`count_${t}`] || 800,
                meta: {
                  exerciseIndex: exIdx,
                  exerciseName: ex.name,
                  setIndex: setIdx,
                  phase: 'exercise',
                  label: `${t}초`,
                },
              });
            } else {
              events.push({
                type: 'speech',
                payload: `${t}초`,
                durationMs: 1000,
                meta: {
                  exerciseIndex: exIdx,
                  exerciseName: ex.name,
                  setIndex: setIdx,
                  phase: 'exercise',
                  label: `${t}초`,
                },
              });
            }
            // Gap to next count announcement
            const nextAnnounce = t <= 5 ? 1 : (t % 10 === 0 ? 10 : t - 5);
            const gapMs = Math.max(0, nextAnnounce * 1000 - 800);
            if (gapMs > 0 && t > 1) {
              events.push({ type: 'silence', payload: '', durationMs: gapMs, meta: { phase: 'exercise' } });
            }
          }
        }
      } else {
        // Rep-based exercise: count up with coaching pace
        const reps = parseInt(sd.reps) || 12;
        for (let r = 1; r <= reps; r++) {
          if (r <= 30) {
            events.push({
              type: 'sound',
              payload: `count_${r}`,
              durationMs: SOUND_DURATION_MS[`count_${r}`] || 800,
              meta: {
                exerciseIndex: exIdx,
                exerciseName: ex.name,
                setIndex: setIdx,
                phase: 'exercise',
                label: `${r}회`,
              },
            });
          } else {
            events.push({
              type: 'speech',
              payload: `${r}`,
              durationMs: 800,
              meta: {
                exerciseIndex: exIdx,
                exerciseName: ex.name,
                setIndex: setIdx,
                phase: 'exercise',
                label: `${r}회`,
              },
            });
          }

          // Gap between counts (countSpeed - sound duration)
          const gap = Math.max(500, countSpeed - 800);
          if (r < reps) {
            events.push({ type: 'silence', payload: '', durationMs: gap, meta: { phase: 'exercise' } });
          }

          // Midway coaching phrase
          if (r === Math.ceil(reps / 2) && ex.voiceCoaching.length > 1) {
            events.push({
              type: 'speech',
              payload: ex.voiceCoaching[Math.floor(Math.random() * ex.voiceCoaching.length)],
              durationMs: 1200,
              meta: {
                exerciseIndex: exIdx,
                exerciseName: ex.name,
                setIndex: setIdx,
                phase: 'exercise',
                label: '코칭',
              },
            });
          }
        }
      }

      // Set complete sound
      events.push({
        type: 'sound',
        payload: 'phrase_set_complete',
        durationMs: SOUND_DURATION_MS['phrase_set_complete'],
        meta: {
          exerciseIndex: exIdx,
          exerciseName: ex.name,
          setIndex: setIdx,
          phase: 'exercise',
          label: '세트 완료',
        },
      });

      // --- Rest period (except last set of last exercise) ---
      const isLastSetOfLastExercise = exIdx === plan.exercises.length - 1 && setIdx === sets.length - 1;
      if (!isLastSetOfLastExercise) {
        const isLastSetOfExercise = setIdx === sets.length - 1;
        const restSec = isLastSetOfExercise ? item.restSeconds + 15 : item.restSeconds;

        events.push({
          type: 'sound',
          payload: 'phrase_rest',
          durationMs: SOUND_DURATION_MS['phrase_rest'],
          meta: {
            exerciseIndex: exIdx,
            exerciseName: ex.name,
            setIndex: setIdx,
            phase: 'rest',
            label: '휴식 시작',
          },
        });

        events.push({
          type: 'speech',
          payload: `${restSec}초 휴식합니다.`,
          durationMs: 1500,
          meta: { phase: 'rest', label: `${restSec}초 휴식` },
        });

        // Rest period: announce at 10s intervals, then countdown from 5
        const silentRestMs = Math.max(0, (restSec - 10) * 1000);
        if (silentRestMs > 0) {
          events.push({ type: 'silence', payload: '', durationMs: silentRestMs, meta: { phase: 'rest', label: '휴식 중...' } });
        }

        // Last 10 seconds announcement
        if (restSec >= 10) {
          events.push({
            type: 'sound',
            payload: 'count_10',
            durationMs: 800,
            meta: { phase: 'rest', label: '10초 남음' },
          });
          events.push({ type: 'silence', payload: '', durationMs: 4200, meta: { phase: 'rest' } });
        }

        // Countdown 5, 4, 3, 2, 1
        for (let c = 5; c >= 1; c--) {
          events.push({
            type: 'sound',
            payload: `count_${c}`,
            durationMs: SOUND_DURATION_MS[`count_${c}`] || 800,
            meta: { phase: 'rest', label: `${c}초` },
          });
          if (c > 1) {
            events.push({ type: 'silence', payload: '', durationMs: 200, meta: { phase: 'rest' } });
          }
        }

        // "Go!" sound
        events.push({
          type: 'sound',
          payload: 'phrase_go',
          durationMs: SOUND_DURATION_MS['phrase_go'],
          meta: { phase: 'rest', label: '시작!' },
        });

        events.push({ type: 'silence', payload: '', durationMs: 500, meta: { phase: 'rest' } });

        // If transitioning to next exercise, announce it
        if (isLastSetOfExercise && exIdx < plan.exercises.length - 1) {
          const nextEx = plan.exercises[exIdx + 1].exercise;
          events.push({
            type: 'speech',
            payload: `다음 운동: ${nextEx.name}`,
            durationMs: estimateSpeechDurationMs(`다음 운동: ${nextEx.name}`),
            meta: {
              phase: 'transition',
              label: `다음: ${nextEx.name}`,
              exerciseIndex: exIdx + 1,
              exerciseName: nextEx.name,
            },
          });
          events.push({ type: 'silence', payload: '', durationMs: 1000, meta: { phase: 'transition' } });
        }
      }
    });
  });

  // --- Outro ---
  events.push({ type: 'silence', payload: '', durationMs: 1000, meta: { phase: 'outro' } });
  events.push({
    type: 'speech',
    payload: `수고하셨습니다! ${plan.name} 완료! 총 ${plan.exercises.length}개 운동을 마쳤습니다. 쿨다운 스트레칭을 잊지 마세요.`,
    durationMs: 5000,
    meta: { phase: 'outro', label: '운동 완료!' },
  });
  events.push({
    type: 'sound',
    payload: 'phrase_set_complete',
    durationMs: SOUND_DURATION_MS['phrase_set_complete'],
    meta: { phase: 'outro', label: '완료 사운드' },
  });

  // Calculate total duration and patch intro with accurate time
  const totalDurationMs = events.reduce((sum, e) => sum + e.durationMs, 0);
  const totalMinutes = Math.round(totalDurationMs / 60000);
  const introPayload = `${plan.name}을 시작합니다. 총 ${plan.exercises.length}개 운동, 약 ${totalMinutes}분 소요됩니다. 준비되셨으면 시작하겠습니다.`;
  events[introIdx].payload = introPayload;
  events[introIdx].durationMs = estimateSpeechDurationMs(introPayload);

  // Recalculate after patching intro
  const finalDurationMs = events.reduce((sum, e) => sum + e.durationMs, 0);

  return {
    events,
    totalDurationMs: finalDurationMs,
    exerciseCount: plan.exercises.length,
    planName: plan.name,
  };
}

// === Cumulative timestamp calculator ===
export function getEventTimestamps(events: AudioEvent[]): number[] {
  const timestamps: number[] = [];
  let t = 0;
  for (const event of events) {
    timestamps.push(t);
    t += event.durationMs;
  }
  return timestamps;
}

// === Find current event at a given playback position ===
export function findEventAtTime(
  events: AudioEvent[],
  timestamps: number[],
  positionMs: number
): { eventIndex: number; event: AudioEvent } | null {
  for (let i = timestamps.length - 1; i >= 0; i--) {
    if (positionMs >= timestamps[i]) {
      return { eventIndex: i, event: events[i] };
    }
  }
  return null;
}
