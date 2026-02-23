/**
 * ExerciseDB API Service (EDB With Videos And Images by AscendAPI)
 * - RapidAPI: https://edb-with-videos-and-images-by-ascendapi.p.rapidapi.com
 * - Provides imageUrl + videoUrl for exercises
 * - Caches results in AsyncStorage to minimize API calls
 */

const RAPIDAPI_KEY = 'DvSxMYDT_7bnOPmm16pyEWQ0U9KSUNzThjKpgm4D';
const RAPIDAPI_HOST = 'edb-with-videos-and-images-by-ascendapi.p.rapidapi.com';
const BASE_URL = `https://${RAPIDAPI_HOST}/api/v1`;

let AsyncStorage: any = null;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (e) {}

export interface ExerciseMedia {
  exerciseId: string;
  name: string;
  imageUrl: string;
  videoUrl: string;
}

// ─── Pre-mapped: Korean exercise name → EDB exercise ID ───────────────────────
// Based on the 25 exercises available in the free tier
const KR_TO_EDB_ID: Record<string, string> = {
  '딥스':             'exr_41n2hadQgEEX8wDN',  // Triceps Dip
  '트라이셉스 딥스':   'exr_41n2hadQgEEX8wDN',
  '점프 스쿼트':      'exr_41n2hbdZww1thMKz',  // Jump Squat
  '마운틴 클라이머':  'exr_41n2ha5iPFpN3hEJ',  // Bridge - Mountain Climber
  '런지':             'exr_41n2haAabPyN5t8y',  // Side Lunge
  '사이드 런지':      'exr_41n2haAabPyN5t8y',
  '크로스 런지':      'exr_41n2haAabPyN5t8y',
  '덤벨 런지':        'exr_41n2haAabPyN5t8y',
  '스쿼트':           'exr_41n2hd78zujKUEWK',  // Single Leg Squat
  '덤벨 스쿼트':      'exr_41n2hd78zujKUEWK',
  '불가리안 스플릿 스쿼트': 'exr_41n2hd78zujKUEWK',
  '덤벨 데드리프트':  'exr_41n2hcw2FN534HcA',  // Dumbbell Stiff Leg Deadlift
  '카프 레이즈':      'exr_41n2hdWu3oaCGdWT',  // Standing Calf Raise
  '풀업 (턱걸이)':    'exr_41n2hd6SThQhAdnZ',  // Chin-ups
  '풀업':             'exr_41n2hd6SThQhAdnZ',
  '턱걸이':           'exr_41n2hd6SThQhAdnZ',
  '덤벨 로우':        'exr_41n2hdkBpqwoDmVq',  // Suspended Row
  '인버티드 로우':    'exr_41n2hdkBpqwoDmVq',
  '밴드 랫풀다운':    'exr_41n2hadPLLFRGvFk',  // Sliding Floor Pulldown
  '다이아몬드 푸시업': 'exr_41n2hdCBvmbCPaVE', // Diamond Press
  '덤벨 숄더프레스':  'exr_41n2haNJ3NA8yCE2',  // Dumbbell Incline Press
  '아놀드 프레스':    'exr_41n2haNJ3NA8yCE2',
  '덤벨 벤치프레스':  'exr_41n2haNJ3NA8yCE2',
  '덤벨 컬':          'exr_41n2hc2VrB8ofxrW',  // Lying Biceps Curl
  '해머 컬':          'exr_41n2hc2VrB8ofxrW',
  '바비 컬':          'exr_41n2hc2VrB8ofxrW',
};

// ─── Fallback: bodypart → bodypart image from EDB CDN ─────────────────────────
const BODYPART_IMAGE: Record<string, string> = {
  chest:    'https://cdn.exercisedb.dev/bodyparts/chest.webp',
  back:     'https://cdn.exercisedb.dev/bodyparts/back.webp',
  shoulder: 'https://cdn.exercisedb.dev/bodyparts/shoulders.webp',
  arms:     'https://cdn.exercisedb.dev/bodyparts/upper%20arms.webp',
  legs:     'https://cdn.exercisedb.dev/bodyparts/upper%20legs.webp',
  core:     'https://cdn.exercisedb.dev/bodyparts/waist.webp',
  cardio:   'https://cdn.exercisedb.dev/bodyparts/waist.webp',
};

const CACHE_PREFIX = 'edb_exercise_';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

async function fetchFromAPI(exerciseId: string): Promise<ExerciseMedia | null> {
  try {
    const res = await fetch(`${BASE_URL}/exercises/${exerciseId}`, {
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
      },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const d = json.data;
    return {
      exerciseId: d.exerciseId,
      name: d.name,
      imageUrl: d.imageUrl || '',
      videoUrl: d.videoUrl || '',
    };
  } catch (e) {
    return null;
  }
}

async function getCached(exerciseId: string): Promise<ExerciseMedia | null> {
  try {
    if (!AsyncStorage) return null;
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + exerciseId);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) return null;
    return data;
  } catch (e) {
    return null;
  }
}

async function setCached(exerciseId: string, data: ExerciseMedia) {
  try {
    if (!AsyncStorage) return;
    await AsyncStorage.setItem(
      CACHE_PREFIX + exerciseId,
      JSON.stringify({ data, ts: Date.now() })
    );
  } catch (e) {}
}

/**
 * Get exercise media (image + video) by Korean exercise name and bodypart.
 * Returns null if no match.
 */
export async function getExerciseMedia(
  koreanName: string,
  bodyPart: string
): Promise<{ imageUrl: string; videoUrl: string; matched: boolean }> {
  const fallbackImage = BODYPART_IMAGE[bodyPart] || BODYPART_IMAGE['core'];

  const exerciseId = KR_TO_EDB_ID[koreanName];
  if (!exerciseId) {
    return { imageUrl: fallbackImage, videoUrl: '', matched: false };
  }

  // Check cache
  const cached = await getCached(exerciseId);
  if (cached) {
    return { imageUrl: cached.imageUrl, videoUrl: cached.videoUrl, matched: true };
  }

  // Fetch from API
  const media = await fetchFromAPI(exerciseId);
  if (media) {
    await setCached(exerciseId, media);
    return { imageUrl: media.imageUrl, videoUrl: media.videoUrl, matched: true };
  }

  return { imageUrl: fallbackImage, videoUrl: '', matched: false };
}
