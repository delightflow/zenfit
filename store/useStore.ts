import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  name: string;
  gender: 'male' | 'female';
  age: number;
  height: number;
  weight: number;
  targetWeight: number;
  goal: 'lose' | 'gain' | 'maintain';
  experience: 'beginner' | 'intermediate' | 'advanced';
  workoutDays: number[]; // 0=Sun, 1=Mon, ...
  estimatedOneRM?: { bench: number; squat: number; deadlift: number };
  focusAreas?: string[];
  planWeeks?: number; // 플랜 기간 (주)
}

export interface WorkoutLog {
  date: string; // YYYY-MM-DD
  completed: boolean;
  exercises: number;
  duration: number; // minutes
  calories: number;
}

export interface BodyPhoto {
  id: string;
  date: string; // YYYY-MM-DD
  uri: string;
  weight?: number;
  note?: string;
  aiAnalysis?: string;
}

interface AppState {
  // Onboarding
  onboarded: boolean;
  setOnboarded: (val: boolean) => void;

  // Profile
  profile: UserProfile | null;
  setProfile: (profile: UserProfile) => void;

  // Streak (Duolingo-style)
  streak: number;
  bestStreak: number;
  lastWorkoutDate: string | null; // YYYY-MM-DD
  todayCompleted: boolean;

  // Workout logs
  workoutLogs: WorkoutLog[];
  addWorkoutLog: (log: WorkoutLog) => void;

  // Body photos
  bodyPhotos: BodyPhoto[];
  addBodyPhoto: (photo: BodyPhoto) => void;
  updateBodyPhoto: (id: string, updates: Partial<BodyPhoto>) => void;
  removeBodyPhoto: (id: string) => void;

  // Split routine tracking (A/B/C 분할 루틴)
  lastSplit: string | null; // 마지막 완료한 분할 ('A' | 'B' | 'C')
  lastSplitDate: string | null; // 마지막 분할 완료 날짜
  splitPlans: Record<string, string[]>; // split -> exerciseId[] (분할별 고정 운동 목록)
  exerciseWeights: Record<string, number>; // exerciseId -> 마지막 사용 무게(kg)
  blacklistedExercises: string[]; // 추천하지 않기 운동 ID 목록

  setLastSplit: (split: string) => void;
  setSplitPlan: (split: string, exerciseIds: string[]) => void;
  updateExerciseWeights: (weights: Record<string, number>) => void;
  toggleBlacklist: (exerciseId: string) => void;

  // Actions
  completeToday: () => void;
  checkStreak: () => void;

  // Persistence
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => Promise<void>;
}

const STORAGE_KEY = 'zenfit_state';

const getToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getYesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const useStore = create<AppState>((set, get) => ({
  onboarded: false,
  setOnboarded: (val) => {
    set({ onboarded: val });
    get().saveToStorage();
  },

  profile: null,
  setProfile: (profile) => {
    set({ profile });
    get().saveToStorage();
  },

  streak: 0,
  bestStreak: 0,
  lastWorkoutDate: null,
  todayCompleted: false,
  workoutLogs: [],
  bodyPhotos: [],
  lastSplit: null,
  lastSplitDate: null,
  splitPlans: {},
  exerciseWeights: {},
  blacklistedExercises: [],

  addWorkoutLog: (log) => {
    set((state) => ({
      workoutLogs: [...state.workoutLogs, log],
    }));
    get().saveToStorage();
  },

  addBodyPhoto: (photo) => {
    set((state) => ({
      bodyPhotos: [...state.bodyPhotos, photo],
    }));
    get().saveToStorage();
  },

  updateBodyPhoto: (id, updates) => {
    set((state) => ({
      bodyPhotos: state.bodyPhotos.map((p) => p.id === id ? { ...p, ...updates } : p),
    }));
    get().saveToStorage();
  },

  removeBodyPhoto: (id) => {
    set((state) => ({
      bodyPhotos: state.bodyPhotos.filter((p) => p.id !== id),
    }));
    get().saveToStorage();
  },

  setLastSplit: (split) => {
    set({ lastSplit: split, lastSplitDate: getToday() });
    get().saveToStorage();
  },

  setSplitPlan: (split, exerciseIds) => {
    set((state) => ({
      splitPlans: { ...state.splitPlans, [split]: exerciseIds },
    }));
    get().saveToStorage();
  },

  updateExerciseWeights: (weights) => {
    set((state) => ({
      exerciseWeights: { ...state.exerciseWeights, ...weights },
    }));
    get().saveToStorage();
  },

  toggleBlacklist: (exerciseId) => {
    set((state) => {
      const list = state.blacklistedExercises;
      const idx = list.indexOf(exerciseId);
      return {
        blacklistedExercises: idx >= 0
          ? list.filter((id) => id !== exerciseId)
          : [...list, exerciseId],
      };
    });
    get().saveToStorage();
  },

  completeToday: () => {
    const today = getToday();
    const state = get();

    if (state.lastWorkoutDate === today) return; // Already done

    const yesterday = getYesterday();
    const newStreak = state.lastWorkoutDate === yesterday ? state.streak + 1 : 1;
    const newBest = Math.max(newStreak, state.bestStreak);

    set({
      streak: newStreak,
      bestStreak: newBest,
      lastWorkoutDate: today,
      todayCompleted: true,
    });
    get().saveToStorage();
  },

  checkStreak: () => {
    const today = getToday();
    const yesterday = getYesterday();
    const state = get();

    const todayDone = state.lastWorkoutDate === today;
    const streakAlive = state.lastWorkoutDate === today || state.lastWorkoutDate === yesterday;

    set({
      todayCompleted: todayDone,
      streak: streakAlive ? state.streak : 0,
    });
  },

  loadFromStorage: async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        set({
          onboarded: parsed.onboarded ?? false,
          profile: parsed.profile ?? null,
          streak: parsed.streak ?? 0,
          bestStreak: parsed.bestStreak ?? 0,
          lastWorkoutDate: parsed.lastWorkoutDate ?? null,
          workoutLogs: parsed.workoutLogs ?? [],
          bodyPhotos: parsed.bodyPhotos ?? [],
          lastSplit: parsed.lastSplit ?? null,
          lastSplitDate: parsed.lastSplitDate ?? null,
          splitPlans: parsed.splitPlans ?? {},
          exerciseWeights: parsed.exerciseWeights ?? {},
          blacklistedExercises: parsed.blacklistedExercises ?? [],
        });
        get().checkStreak();
      }
    } catch (e) {
      console.error('Failed to load state:', e);
    }
  },

  saveToStorage: async () => {
    try {
      const state = get();
      const data = JSON.stringify({
        onboarded: state.onboarded,
        profile: state.profile,
        streak: state.streak,
        bestStreak: state.bestStreak,
        lastWorkoutDate: state.lastWorkoutDate,
        workoutLogs: state.workoutLogs,
        bodyPhotos: state.bodyPhotos,
        lastSplit: state.lastSplit,
        lastSplitDate: state.lastSplitDate,
        splitPlans: state.splitPlans,
        exerciseWeights: state.exerciseWeights,
        blacklistedExercises: state.blacklistedExercises,
      });
      await AsyncStorage.setItem(STORAGE_KEY, data);
    } catch (e) {
      console.error('Failed to save state:', e);
    }
  },
}));
