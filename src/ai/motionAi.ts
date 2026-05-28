/**
 * AI-assisted keyframes via Gemini (optional VITE_GEMINI_API_KEY).
 */
import { GoogleGenAI } from '@google/genai';
import type { TimelineKeyframe, TimelineTrackId } from '../types';
import { TIMELINE_TRACK_IDS } from '../components/TimelineLogic';

const TRACK_LIST = TIMELINE_TRACK_IDS.join(', ');

function createKeyframeId(): string {
  return `ai_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function getClient(): GoogleGenAI | null {
  const key = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (!key?.trim()) return null;
  return new GoogleGenAI({ apiKey: key });
}

export function hasMotionAi(): boolean {
  return Boolean(import.meta.env.VITE_GEMINI_API_KEY);
}

const SYSTEM = `You output ONLY valid JSON arrays for MMD-style timeline keyframes.
Each item: { "frame": number, "track": one of [${TRACK_LIST}], "value": number }
Morph tracks: 0-1. Bone tracks: degrees roughly -90 to 90.
No markdown, no explanation.`;

export async function generateKeyframesFromPrompt(
  prompt: string,
  maxFrames: number
): Promise<TimelineKeyframe[]> {
  const ai = getClient();
  if (!ai) {
    throw new Error('Set VITE_GEMINI_API_KEY in .env for AI motion');
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `${SYSTEM}\n\nMax frame: ${maxFrames}. Motion request: ${prompt}\n\nGenerate 8-40 keyframes.`,
          },
        ],
      },
    ],
  });

  const text = response.text?.trim() ?? '[]';
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text) as Array<{
    frame: number;
    track: TimelineTrackId;
    value: number;
  }>;

  return parsed
    .filter((k) => TIMELINE_TRACK_IDS.includes(k.track) && k.frame >= 0 && k.frame <= maxFrames)
    .map((k) => ({
      id: createKeyframeId(),
      frame: Math.round(k.frame),
      track: k.track,
      value: Number(k.value),
      interpolation: 'bezier' as const,
      easeOut: 0.35,
    }));
}

export async function infillKeyframes(
  existing: TimelineKeyframe[],
  startFrame: number,
  endFrame: number,
  hint: string
): Promise<TimelineKeyframe[]> {
  const ai = getClient();
  if (!ai) throw new Error('VITE_GEMINI_API_KEY is not set');

  const context = existing
    .filter((k) => k.frame >= startFrame - 5 && k.frame <= endFrame + 5)
    .slice(0, 40);

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `${SYSTEM}\n\nExisting keys: ${JSON.stringify(context)}\nFill frames ${startFrame}-${endFrame}. ${hint}`,
          },
        ],
      },
    ],
  });

  const text = response.text?.trim() ?? '[]';
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text) as Array<{
    frame: number;
    track: TimelineTrackId;
    value: number;
  }>;

  return parsed.map((k) => ({
    id: createKeyframeId(),
    frame: Math.round(k.frame),
    track: k.track,
    value: Number(k.value),
    interpolation: 'bezier' as const,
  }));
}

/** Retarget: scale arm/head motion from source keys to target intensity. */
export function retargetKeyframes(
  source: TimelineKeyframe[],
  intensity = 1
): TimelineKeyframe[] {
  return source.map((k) => ({
    ...k,
    id: createKeyframeId(),
    value: k.value * intensity,
  }));
}
