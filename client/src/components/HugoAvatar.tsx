/**
 * HugoAvatar — EVA-SL 3D signing character
 * Built with Three.js procedural geometry.
 * Features:
 *  - Hugo-style cartoon character (glasses, white shirt, blue tie, jeans, orange sneakers)
 *  - Proper articulated fingers (3 joints per finger, 5 fingers per hand)
 *  - Expressive face: eyebrows, mouth corners, eyelids driven by emotion
 *  - Real ASL sign animations: 26 alphabet letters + 50+ words
 *  - Emotion-adaptive scene background
 *  - Imperative sign() API via useImperativeHandle
 */

import {
  useEffect, useRef, useImperativeHandle, forwardRef, useCallback
} from "react";
import * as THREE from "three";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Emotion = "happy" | "sad" | "angry" | "neutral" | "fearful" | "surprised" | "disgusted";

export interface HugoAvatarHandle {
  sign(gloss: string[]): void;
  setEmotion(emotion: Emotion): void;
}

interface Props {
  emotion?: Emotion;
  className?: string;
  onSignComplete?: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const π = Math.PI;
const H = π / 2;
const Q = π / 4;
const E = π / 8;
const T = π / 3;
const S = π / 6;

// Skin, clothing colors
const C = {
  skin:    0xf5c5a3,
  skinD:   0xe8a882,
  hair:    0x1a1a1a,
  shirt:   0xf0f0f0,
  tie:     0x3b9ddd,
  jeans:   0x4a6fa5,
  jeansD:  0x3a5a8a,
  shoe:    0xffffff,
  shoeSole:0xcc4400,
  glass:   0x111111,
  lens:    0x88bbdd,
  white:   0xffffff,
  black:   0x111111,
  eyeW:    0xffffff,
  iris:    0x3a2a1a,
  pupil:   0x080808,
  lip:     0xd4826a,
  tooth:   0xf5f5f0,
  brow:    0x1a1008,
};

// ─── Emotion scene backgrounds ────────────────────────────────────────────────

const EMOTION_BG: Record<Emotion, number> = {
  happy:    0x2a1800,
  sad:      0x001020,
  angry:    0x200000,
  neutral:  0x0d1117,
  fearful:  0x100020,
  surprised:0x1a1800,
  disgusted:0x001500,
};

// ─── ASL Sign Database ────────────────────────────────────────────────────────
// Each sign is an array of keyframes: { dur, pose }
// pose is a partial record of bone names → [x, y, z] Euler rotations

type BonePose = Record<string, [number, number, number]>;
interface Keyframe { dur: number; pose: BonePose; }
type Sign = Keyframe[];

// Finger curl helper: returns pose for curling a finger
// fingerBase: bone name prefix like "rIndex1"
function curl(prefix: string, amount: number): BonePose {
  return {
    [`${prefix}1`]: [amount * 0.8, 0, 0],
    [`${prefix}2`]: [amount, 0, 0],
    [`${prefix}3`]: [amount * 0.7, 0, 0],
  };
}

// Spread helper: abduct fingers
function spread(hand: "r" | "l", amount: number): BonePose {
  const s = hand === "r" ? 1 : -1;
  return {
    [`${hand}Index1`]:  [0, 0, s * amount],
    [`${hand}Middle1`]: [0, 0, 0],
    [`${hand}Ring1`]:   [0, 0, -s * amount],
    [`${hand}Pinky1`]:  [0, 0, -s * amount * 1.5],
    [`${hand}Thumb1`]:  [0, s * amount, 0],
  };
}

// Open hand: all fingers extended
function openHand(h: "r" | "l"): BonePose {
  return {
    ...curl(`${h}Thumb`, 0), ...curl(`${h}Index`, 0),
    ...curl(`${h}Middle`, 0), ...curl(`${h}Ring`, 0), ...curl(`${h}Pinky`, 0),
    ...spread(h, E * 0.5),
  };
}

// Closed fist
function fist(h: "r" | "l"): BonePose {
  return {
    ...curl(`${h}Thumb`, Q * 0.8), ...curl(`${h}Index`, H * 0.9),
    ...curl(`${h}Middle`, H * 0.95), ...curl(`${h}Ring`, H * 0.9), ...curl(`${h}Pinky`, H * 0.85),
  };
}

// Point (index extended, rest curled)
function point(h: "r" | "l"): BonePose {
  return {
    ...fist(h),
    ...curl(`${h}Index`, 0),
    [`${h}Index1`]: [0, 0, 0],
  };
}

// ILY hand shape: index + pinky extended, thumb out
function ilyHand(h: "r" | "l"): BonePose {
  return {
    ...fist(h),
    ...curl(`${h}Index`, 0),
    ...curl(`${h}Pinky`, 0),
    ...curl(`${h}Thumb`, 0),
  };
}

// Peace / V sign: index + middle extended
function vSign(h: "r" | "l"): BonePose {
  return {
    ...fist(h),
    ...curl(`${h}Index`, 0),
    ...curl(`${h}Middle`, 0),
  };
}

// Flat hand (B shape)
function flatHand(h: "r" | "l"): BonePose {
  return {
    ...openHand(h),
    ...curl(`${h}Thumb`, Q * 0.6),
  };
}

// OK sign: thumb + index circle, rest extended
function okSign(h: "r" | "l"): BonePose {
  return {
    ...openHand(h),
    ...curl(`${h}Index`, H * 0.8),
    [`${h}Thumb1`]: [Q * 0.5, 0, 0],
    [`${h}Thumb2`]: [Q * 0.5, 0, 0],
  };
}

// Idle pose — arms hanging naturally at sides (rotation 0 = arms down)
const IDLE: BonePose = {
  rUpperArm: [0, 0, 0],
  lUpperArm: [0, 0, 0],
  rForeArm:  [0, 0, 0],
  lForeArm:  [0, 0, 0],
  rHand:     [0, 0, 0],
  lHand:     [0, 0, 0],
  spine:     [0, 0, 0],
  neck:      [0, 0, 0],
  head:      [0, 0, 0],
  ...openHand("r"),
  ...openHand("l"),
};

// ─── ASL Sign Library ─────────────────────────────────────────────────────────

export const SIGNS: Record<string, Sign> = {

  // ── Greetings & Basics ──────────────────────────────────────────────────────

  HELLO: [
    { dur: 200, pose: { rUpperArm: [-E, 0, Q * 0.5], rForeArm: [-Q, 0, 0], rHand: [0, 0, 0], ...flatHand("r") } },
    { dur: 500, pose: { rUpperArm: [-E, 0, Q * 0.3], rForeArm: [-Q * 0.8, 0, 0], rHand: [0, -Q * 0.3, 0], ...flatHand("r") } },
    { dur: 300, pose: IDLE },
  ],

  THANK_YOU: [
    { dur: 200, pose: { rUpperArm: [-E, 0, Q * 0.4], rForeArm: [-H * 0.7, 0, 0], rHand: [0, 0, 0], ...flatHand("r") } },
    { dur: 600, pose: { rUpperArm: [-E, 0, Q * 0.6], rForeArm: [-Q * 0.5, 0, 0], rHand: [Q * 0.3, 0, 0], ...flatHand("r") } },
    { dur: 300, pose: IDLE },
  ],

  PLEASE: [
    { dur: 200, pose: { rUpperArm: [0, 0, Q * 0.5], rForeArm: [-H * 0.6, 0, 0], rHand: [0, 0, 0], ...flatHand("r") } },
    { dur: 400, pose: { rUpperArm: [0, 0, Q * 0.5], rForeArm: [-H * 0.6, 0, 0], rHand: [Q * 0.3, 0, 0], ...flatHand("r") } },
    { dur: 400, pose: { rUpperArm: [0, 0, Q * 0.5], rForeArm: [-H * 0.6, 0, 0], rHand: [-Q * 0.3, 0, 0], ...flatHand("r") } },
    { dur: 300, pose: IDLE },
  ],

  SORRY: [
    { dur: 200, pose: { rUpperArm: [0, 0, Q * 0.5], rForeArm: [-H * 0.7, 0, 0], ...fist("r") } },
    { dur: 400, pose: { rUpperArm: [0, 0, Q * 0.5], rForeArm: [-H * 0.7, 0, 0], rHand: [Q * 0.4, 0, 0], ...fist("r") } },
    { dur: 400, pose: { rUpperArm: [0, 0, Q * 0.5], rForeArm: [-H * 0.7, 0, 0], rHand: [-Q * 0.4, 0, 0], ...fist("r") } },
    { dur: 300, pose: IDLE },
  ],

  HELP: [
    { dur: 200, pose: { lUpperArm: [0, 0, -Q * 0.5], lForeArm: [-Q, 0, 0], ...flatHand("l"), rUpperArm: [0, 0, Q * 0.5], rForeArm: [-Q, 0, 0], ...fist("r") } },
    { dur: 600, pose: { lUpperArm: [-E, 0, -Q * 0.5], lForeArm: [-Q, 0, 0], ...flatHand("l"), rUpperArm: [-E, 0, Q * 0.5], rForeArm: [-Q, 0, 0], ...fist("r") } },
    { dur: 300, pose: IDLE },
  ],

  YES: [
    { dur: 200, pose: { rUpperArm: [0, 0, Q * 0.5], rForeArm: [-Q, 0, 0], ...fist("r") } },
    { dur: 300, pose: { rUpperArm: [0, 0, Q * 0.5], rForeArm: [-Q * 0.6, 0, 0], rHand: [Q * 0.5, 0, 0], ...fist("r") } },
    { dur: 300, pose: { rUpperArm: [0, 0, Q * 0.5], rForeArm: [-Q, 0, 0], ...fist("r") } },
    { dur: 300, pose: { rUpperArm: [0, 0, Q * 0.5], rForeArm: [-Q * 0.6, 0, 0], rHand: [Q * 0.5, 0, 0], ...fist("r") } },
    { dur: 300, pose: IDLE },
  ],

  NO: [
    { dur: 200, pose: { rUpperArm: [0, 0, Q * 0.5], rForeArm: [-Q * 0.8, 0, 0], ...vSign("r") } },
    { dur: 300, pose: { rUpperArm: [0, 0, Q * 0.5], rForeArm: [-Q * 0.8, 0, 0], rHand: [0, Q * 0.4, 0], ...vSign("r") } },
    { dur: 300, pose: { rUpperArm: [0, 0, Q * 0.5], rForeArm: [-Q * 0.8, 0, 0], rHand: [0, -Q * 0.4, 0], ...vSign("r") } },
    { dur: 300, pose: IDLE },
  ],

  // ── Emotions ────────────────────────────────────────────────────────────────

  HAPPY: [
    { dur: 200, pose: { rUpperArm: [0, 0, Q * 0.5], rForeArm: [-H * 0.6, 0, 0], ...flatHand("r") } },
    { dur: 400, pose: { rUpperArm: [-E, 0, Q * 0.5], rForeArm: [-H * 0.5, 0, 0], rHand: [Q * 0.3, 0, 0], ...flatHand("r") } },
    { dur: 400, pose: { rUpperArm: [0, 0, Q * 0.5], rForeArm: [-H * 0.6, 0, 0], ...flatHand("r") } },
    { dur: 300, pose: IDLE },
  ],

  SAD: [
    { dur: 300, pose: { rUpperArm: [0, 0, Q * 0.4], rForeArm: [-Q * 0.8, 0, 0], ...openHand("r"), lUpperArm: [0, 0, -Q * 0.4], lForeArm: [-Q * 0.8, 0, 0], ...openHand("l") } },
    { dur: 600, pose: { rUpperArm: [E, 0, Q * 0.4], rForeArm: [-Q * 0.8, 0, 0], rHand: [Q * 0.3, 0, 0], ...openHand("r"), lUpperArm: [E, 0, -Q * 0.4], lForeArm: [-Q * 0.8, 0, 0], lHand: [Q * 0.3, 0, 0], ...openHand("l"), head: [Q * 0.2, 0, 0] } },
    { dur: 300, pose: IDLE },
  ],

  ANGRY: [
    { dur: 200, pose: { rUpperArm: [-E, 0, Q * 0.3], rForeArm: [-H * 0.7, 0, 0], ...fist("r"), lUpperArm: [-E, 0, -Q * 0.3], lForeArm: [-H * 0.7, 0, 0], ...fist("l") } },
    { dur: 500, pose: { rUpperArm: [-Q * 0.6, 0, Q * 0.3], rForeArm: [-H * 0.5, 0, 0], ...fist("r"), lUpperArm: [-Q * 0.6, 0, -Q * 0.3], lForeArm: [-H * 0.5, 0, 0], ...fist("l"), spine: [0, 0, 0], head: [-E * 0.5, 0, 0] } },
    { dur: 300, pose: IDLE },
  ],

  LOVE: [
    { dur: 300, pose: { rUpperArm: [0, 0, Q * 0.3], rForeArm: [-H * 0.8, 0, 0], ...fist("r") } },
    { dur: 500, pose: { rUpperArm: [0, 0, Q * 0.3], rForeArm: [-H * 0.8, 0, 0], rHand: [0, Q * 0.3, 0], ...fist("r") } },
    { dur: 300, pose: IDLE },
  ],

  I_LOVE_YOU: [
    { dur: 200, pose: { rUpperArm: [-E, 0, Q * 0.3], rForeArm: [-Q, 0, 0], ...ilyHand("r") } },
    { dur: 700, pose: { rUpperArm: [-E, 0, Q * 0.2], rForeArm: [-Q * 0.8, 0, 0], rHand: [0, -Q * 0.2, 0], ...ilyHand("r") } },
    { dur: 300, pose: IDLE },
  ],

  I_AM_HAPPY: [
    // "I" — point to self
    { dur: 200, pose: { rUpperArm: [0, 0, Q * 0.5], rForeArm: [-H * 0.6, 0, 0], ...point("r") } },
    { dur: 400, pose: { rUpperArm: [0, 0, Q * 0.6], rForeArm: [-H * 0.7, 0, 0], rHand: [0, Q * 0.3, 0], ...point("r") } },
    // "AM" — open hand from chin
    { dur: 300, pose: { rUpperArm: [-E, 0, Q * 0.4], rForeArm: [-H * 0.5, 0, 0], ...point("r") } },
    { dur: 400, pose: { rUpperArm: [-E * 0.5, 0, Q * 0.5], rForeArm: [-Q * 0.8, 0, 0], rHand: [Q * 0.3, 0, 0], ...point("r") } },
    // "HAPPY" — flat hand circles on chest
    { dur: 200, pose: { rUpperArm: [0, 0, Q * 0.5], rForeArm: [-H * 0.6, 0, 0], ...flatHand("r") } },
    { dur: 400, pose: { rUpperArm: [-E, 0, Q * 0.5], rForeArm: [-H * 0.5, 0, 0], rHand: [Q * 0.3, 0, 0], ...flatHand("r") } },
    { dur: 400, pose: { rUpperArm: [0, 0, Q * 0.5], rForeArm: [-H * 0.6, 0, 0], ...flatHand("r") } },
    { dur: 300, pose: IDLE },
  ],

  I_HATE_YOU: [
    // "I" — point to self
    { dur: 200, pose: { rUpperArm: [0, 0, Q * 0.5], rForeArm: [-H * 0.6, 0, 0], ...point("r") } },
    { dur: 400, pose: { rUpperArm: [0, 0, Q * 0.6], rForeArm: [-H * 0.7, 0, 0], rHand: [0, Q * 0.3, 0], ...point("r") } },
    // "HATE" — both hands flick outward
    { dur: 200, pose: { rUpperArm: [-E, 0, Q * 0.3], rForeArm: [-H * 0.6, 0, 0], ...fist("r"), lUpperArm: [-E, 0, -Q * 0.3], lForeArm: [-H * 0.6, 0, 0], ...fist("l") } },
    { dur: 500, pose: { rUpperArm: [-E, 0, Q * 0.1], rForeArm: [-Q * 0.5, 0, 0], rHand: [0, -Q * 0.3, 0], ...vSign("r"), lUpperArm: [-E, 0, -Q * 0.1], lForeArm: [-Q * 0.5, 0, 0], lHand: [0, Q * 0.3, 0], ...vSign("l") } },
    // "YOU" — point outward
    { dur: 200, pose: { rUpperArm: [-E, 0, Q * 0.3], rForeArm: [-Q * 0.8, 0, 0], ...point("r") } },
    { dur: 500, pose: { rUpperArm: [-E, 0, Q * 0.1], rForeArm: [-Q * 0.6, 0, 0], rHand: [0, -Q * 0.4, 0], ...point("r") } },
    { dur: 300, pose: IDLE },
  ],

  GOOD: [
    { dur: 200, pose: { rUpperArm: [-E, 0, Q * 0.4], rForeArm: [-H * 0.6, 0, 0], ...flatHand("r") } },
    { dur: 500, pose: { rUpperArm: [-E, 0, Q * 0.6], rForeArm: [-Q * 0.5, 0, 0], rHand: [Q * 0.3, 0, 0], ...flatHand("r") } },
    { dur: 300, pose: IDLE },
  ],

  BAD: [
    { dur: 200, pose: { rUpperArm: [-E, 0, Q * 0.4], rForeArm: [-H * 0.6, 0, 0], ...flatHand("r") } },
    { dur: 500, pose: { rUpperArm: [E, 0, Q * 0.6], rForeArm: [-Q * 0.5, 0, 0], rHand: [-Q * 0.3, 0, 0], ...flatHand("r") } },
    { dur: 300, pose: IDLE },
  ],

  // ── Common Words ─────────────────────────────────────────────────────────────

  YOU: [
    { dur: 200, pose: { rUpperArm: [-E, 0, Q * 0.3], rForeArm: [-Q * 0.8, 0, 0], ...point("r") } },
    { dur: 500, pose: { rUpperArm: [-E, 0, Q * 0.1], rForeArm: [-Q * 0.6, 0, 0], rHand: [0, -Q * 0.4, 0], ...point("r") } },
    { dur: 300, pose: IDLE },
  ],

  I: [
    { dur: 200, pose: { rUpperArm: [0, 0, Q * 0.5], rForeArm: [-H * 0.6, 0, 0], ...point("r") } },
    { dur: 400, pose: { rUpperArm: [0, 0, Q * 0.6], rForeArm: [-H * 0.7, 0, 0], rHand: [0, Q * 0.3, 0], ...point("r") } },
    { dur: 300, pose: IDLE },
  ],

  WANT: [
    { dur: 200, pose: { rUpperArm: [-E, 0, Q * 0.3], rForeArm: [-H * 0.5, 0, 0], ...openHand("r"), lUpperArm: [-E, 0, -Q * 0.3], lForeArm: [-H * 0.5, 0, 0], ...openHand("l") } },
    { dur: 500, pose: { rUpperArm: [-E, 0, Q * 0.4], rForeArm: [-H * 0.6, 0, 0], ...fist("r"), lUpperArm: [-E, 0, -Q * 0.4], lForeArm: [-H * 0.6, 0, 0], ...fist("l") } },
    { dur: 300, pose: IDLE },
  ],

  KNOW: [
    { dur: 200, pose: { rUpperArm: [-E, 0, Q * 0.4], rForeArm: [-H * 0.5, 0, 0], ...flatHand("r") } },
    { dur: 400, pose: { rUpperArm: [-E * 0.5, 0, Q * 0.4], rForeArm: [-H * 0.4, 0, 0], rHand: [Q * 0.2, 0, 0], ...flatHand("r") } },
    { dur: 300, pose: IDLE },
  ],

  UNDERSTAND: [
    { dur: 200, pose: { rUpperArm: [-E, 0, Q * 0.4], rForeArm: [-H * 0.5, 0, 0], ...fist("r") } },
    { dur: 400, pose: { rUpperArm: [-E, 0, Q * 0.4], rForeArm: [-H * 0.5, 0, 0], ...point("r") } },
    { dur: 300, pose: IDLE },
  ],

  STOP: [
    { dur: 200, pose: { lUpperArm: [0, 0, -Q * 0.4], lForeArm: [-Q, 0, 0], ...flatHand("l"), rUpperArm: [-E, 0, Q * 0.3], rForeArm: [-Q * 0.8, 0, 0], ...flatHand("r") } },
    { dur: 500, pose: { lUpperArm: [0, 0, -Q * 0.4], lForeArm: [-Q, 0, 0], ...flatHand("l"), rUpperArm: [-E, 0, Q * 0.3], rForeArm: [-Q, 0, 0], rHand: [0, -H, 0], ...flatHand("r") } },
    { dur: 300, pose: IDLE },
  ],

  GO: [
    { dur: 200, pose: { rUpperArm: [-E, 0, Q * 0.3], rForeArm: [-Q * 0.8, 0, 0], ...point("r"), lUpperArm: [-E, 0, -Q * 0.3], lForeArm: [-Q * 0.8, 0, 0], ...point("l") } },
    { dur: 500, pose: { rUpperArm: [-E, 0, Q * 0.1], rForeArm: [-Q * 0.5, 0, 0], rHand: [0, -Q * 0.5, 0], ...point("r"), lUpperArm: [-E, 0, -Q * 0.1], lForeArm: [-Q * 0.5, 0, 0], lHand: [0, Q * 0.5, 0], ...point("l") } },
    { dur: 300, pose: IDLE },
  ],

  COME: [
    { dur: 200, pose: { rUpperArm: [-E, 0, Q * 0.1], rForeArm: [-Q * 0.5, 0, 0], rHand: [0, -Q * 0.5, 0], ...point("r") } },
    { dur: 500, pose: { rUpperArm: [-E, 0, Q * 0.3], rForeArm: [-Q * 0.8, 0, 0], rHand: [0, Q * 0.3, 0], ...point("r") } },
    { dur: 300, pose: IDLE },
  ],

  SEE: [
    { dur: 200, pose: { rUpperArm: [-E, 0, Q * 0.4], rForeArm: [-H * 0.5, 0, 0], ...vSign("r") } },
    { dur: 500, pose: { rUpperArm: [-E, 0, Q * 0.2], rForeArm: [-Q * 0.6, 0, 0], rHand: [0, -Q * 0.3, 0], ...vSign("r") } },
    { dur: 300, pose: IDLE },
  ],

  THINK: [
    { dur: 200, pose: { rUpperArm: [-E, 0, Q * 0.4], rForeArm: [-H * 0.5, 0, 0], ...point("r") } },
    { dur: 400, pose: { rUpperArm: [-E * 0.5, 0, Q * 0.4], rForeArm: [-H * 0.4, 0, 0], rHand: [Q * 0.2, 0, 0], ...point("r") } },
    { dur: 300, pose: IDLE },
  ],

  EAT: [
    { dur: 200, pose: { rUpperArm: [-E, 0, Q * 0.4], rForeArm: [-H * 0.7, 0, 0], ...okSign("r") } },
    { dur: 400, pose: { rUpperArm: [-E * 0.5, 0, Q * 0.4], rForeArm: [-H * 0.5, 0, 0], rHand: [Q * 0.2, 0, 0], ...okSign("r") } },
    { dur: 400, pose: { rUpperArm: [-E, 0, Q * 0.4], rForeArm: [-H * 0.7, 0, 0], ...okSign("r") } },
    { dur: 300, pose: IDLE },
  ],

  DRINK: [
    { dur: 200, pose: { rUpperArm: [-E, 0, Q * 0.4], rForeArm: [-H * 0.7, 0, 0], rHand: [0, Q * 0.3, 0], ...fist("r") } },
    { dur: 500, pose: { rUpperArm: [-E * 0.3, 0, Q * 0.4], rForeArm: [-H * 0.5, 0, 0], rHand: [Q * 0.5, 0, 0], ...fist("r") } },
    { dur: 300, pose: IDLE },
  ],

  SLEEP: [
    { dur: 300, pose: { rUpperArm: [-E, 0, Q * 0.4], rForeArm: [-H * 0.5, 0, 0], ...openHand("r"), head: [Q * 0.3, 0, Q * 0.2] } },
    { dur: 600, pose: { rUpperArm: [0, 0, Q * 0.4], rForeArm: [-H * 0.6, 0, 0], ...openHand("r"), head: [Q * 0.4, 0, Q * 0.3] } },
    { dur: 300, pose: IDLE },
  ],

  HOME: [
    { dur: 200, pose: { rUpperArm: [-E, 0, Q * 0.4], rForeArm: [-H * 0.6, 0, 0], ...okSign("r") } },
    { dur: 400, pose: { rUpperArm: [-E * 0.5, 0, Q * 0.4], rForeArm: [-H * 0.5, 0, 0], rHand: [Q * 0.2, 0, 0], ...okSign("r") } },
    { dur: 300, pose: IDLE },
  ],

  FRIEND: [
    { dur: 200, pose: { rUpperArm: [0, 0, Q * 0.4], rForeArm: [-Q, 0, 0], ...point("r"), lUpperArm: [0, 0, -Q * 0.4], lForeArm: [-Q, 0, 0], ...point("l") } },
    { dur: 500, pose: { rUpperArm: [0, 0, Q * 0.4], rForeArm: [-Q, 0, 0], rHand: [0, Q * 0.3, 0], ...point("r"), lUpperArm: [0, 0, -Q * 0.4], lForeArm: [-Q, 0, 0], lHand: [0, -Q * 0.3, 0], ...point("l") } },
    { dur: 300, pose: IDLE },
  ],

  FAMILY: [
    { dur: 200, pose: { rUpperArm: [-E, 0, Q * 0.3], rForeArm: [-Q * 0.8, 0, 0], ...fist("r"), lUpperArm: [-E, 0, -Q * 0.3], lForeArm: [-Q * 0.8, 0, 0], ...fist("l") } },
    { dur: 500, pose: { rUpperArm: [-E, 0, Q * 0.1], rForeArm: [-Q * 0.6, 0, 0], rHand: [0, -Q * 0.4, 0], ...fist("r"), lUpperArm: [-E, 0, -Q * 0.1], lForeArm: [-Q * 0.6, 0, 0], lHand: [0, Q * 0.4, 0], ...fist("l") } },
    { dur: 300, pose: IDLE },
  ],

  WHAT: [
    { dur: 200, pose: { rUpperArm: [-E, 0, Q * 0.3], rForeArm: [-Q * 0.8, 0, 0], ...openHand("r") } },
    { dur: 400, pose: { rUpperArm: [-E, 0, Q * 0.3], rForeArm: [-Q * 0.8, 0, 0], rHand: [0, Q * 0.4, 0], ...openHand("r") } },
    { dur: 400, pose: { rUpperArm: [-E, 0, Q * 0.3], rForeArm: [-Q * 0.8, 0, 0], rHand: [0, -Q * 0.4, 0], ...openHand("r") } },
    { dur: 300, pose: IDLE },
  ],

  WHERE: [
    { dur: 200, pose: { rUpperArm: [-E, 0, Q * 0.3], rForeArm: [-Q * 0.8, 0, 0], ...point("r") } },
    { dur: 400, pose: { rUpperArm: [-E, 0, Q * 0.2], rForeArm: [-Q * 0.7, 0, 0], rHand: [0, Q * 0.3, 0], ...point("r") } },
    { dur: 400, pose: { rUpperArm: [-E, 0, Q * 0.4], rForeArm: [-Q * 0.9, 0, 0], rHand: [0, -Q * 0.3, 0], ...point("r") } },
    { dur: 300, pose: IDLE },
  ],

  MORE: [
    { dur: 200, pose: { rUpperArm: [-E, 0, Q * 0.3], rForeArm: [-Q * 0.8, 0, 0], ...okSign("r"), lUpperArm: [-E, 0, -Q * 0.3], lForeArm: [-Q * 0.8, 0, 0], ...okSign("l") } },
    { dur: 400, pose: { rUpperArm: [-E, 0, Q * 0.3], rForeArm: [-Q * 0.7, 0, 0], rHand: [Q * 0.2, 0, 0], ...okSign("r"), lUpperArm: [-E, 0, -Q * 0.3], lForeArm: [-Q * 0.7, 0, 0], lHand: [Q * 0.2, 0, 0], ...okSign("l") } },
    { dur: 300, pose: IDLE },
  ],

  GOOD_MORNING: [
    // GOOD
    { dur: 200, pose: { rUpperArm: [-E, 0, Q * 0.4], rForeArm: [-H * 0.6, 0, 0], ...flatHand("r") } },
    { dur: 400, pose: { rUpperArm: [-E, 0, Q * 0.6], rForeArm: [-Q * 0.5, 0, 0], rHand: [Q * 0.3, 0, 0], ...flatHand("r") } },
    // MORNING — arm rises like sun
    { dur: 200, pose: { rUpperArm: [E, 0, H * 0.7], rForeArm: [-Q * 0.3, 0, 0], ...flatHand("r"), lUpperArm: [0, 0, -Q * 0.4], lForeArm: [-Q * 0.5, 0, 0], ...flatHand("l") } },
    { dur: 600, pose: { rUpperArm: [-E, 0, Q * 0.3], rForeArm: [-Q * 0.5, 0, 0], ...flatHand("r"), lUpperArm: [0, 0, -Q * 0.4], lForeArm: [-Q * 0.5, 0, 0], ...flatHand("l") } },
    { dur: 300, pose: IDLE },
  ],

  GOOD_NIGHT: [
    // GOOD
    { dur: 200, pose: { rUpperArm: [-E, 0, Q * 0.4], rForeArm: [-H * 0.6, 0, 0], ...flatHand("r") } },
    { dur: 400, pose: { rUpperArm: [-E, 0, Q * 0.6], rForeArm: [-Q * 0.5, 0, 0], rHand: [Q * 0.3, 0, 0], ...flatHand("r") } },
    // NIGHT — hand arcs down
    { dur: 200, pose: { rUpperArm: [-E, 0, Q * 0.3], rForeArm: [-Q * 0.8, 0, 0], ...flatHand("r") } },
    { dur: 600, pose: { rUpperArm: [E, 0, Q * 0.5], rForeArm: [-H * 0.6, 0, 0], rHand: [Q * 0.4, 0, 0], ...flatHand("r") } },
    { dur: 300, pose: IDLE },
  ],

  // ── Alphabet A–Z ─────────────────────────────────────────────────────────────
  // Each letter is a static hold of the ASL handshape

  A: [{ dur: 600, pose: { rUpperArm: [-E, 0, Q * 0.3], rForeArm: [-Q, 0, 0], rHand: [0, 0, 0], ...curl("rIndex", H * 0.9), ...curl("rMiddle", H * 0.95), ...curl("rRing", H * 0.9), ...curl("rPinky", H * 0.85), rThumb1: [0, Q * 0.5, 0], rThumb2: [0, Q * 0.3, 0], rThumb3: [0, 0, 0] } }, { dur: 200, pose: IDLE }],
  B: [{ dur: 600, pose: { rUpperArm: [-E, 0, Q * 0.3], rForeArm: [-Q, 0, 0], ...flatHand("r") } }, { dur: 200, pose: IDLE }],
  C: [{ dur: 600, pose: { rUpperArm: [-E, 0, Q * 0.3], rForeArm: [-Q, 0, 0], rHand: [0, Q * 0.3, 0], ...curl("rIndex", Q * 0.5), ...curl("rMiddle", Q * 0.5), ...curl("rRing", Q * 0.5), ...curl("rPinky", Q * 0.5), ...curl("rThumb", Q * 0.3) } }, { dur: 200, pose: IDLE }],
  D: [{ dur: 600, pose: { rUpperArm: [-E, 0, Q * 0.3], rForeArm: [-Q, 0, 0], rIndex1: [0,0,0], rIndex2: [0,0,0], rIndex3: [0,0,0], ...curl("rMiddle", H * 0.8), ...curl("rRing", H * 0.8), ...curl("rPinky", H * 0.8), rThumb1: [Q * 0.5, 0, 0], rThumb2: [Q*0.3,0,0], rThumb3: [0,0,0] } }, { dur: 200, pose: IDLE }],
  E: [{ dur: 600, pose: { rUpperArm: [-E, 0, Q * 0.3], rForeArm: [-Q, 0, 0], ...curl("rIndex", H * 0.6), ...curl("rMiddle", H * 0.6), ...curl("rRing", H * 0.6), ...curl("rPinky", H * 0.6), ...curl("rThumb", Q * 0.8) } }, { dur: 200, pose: IDLE }],
  F: [{ dur: 600, pose: { rUpperArm: [-E, 0, Q * 0.3], rForeArm: [-Q, 0, 0], ...okSign("r"), ...curl("rMiddle", 0), ...curl("rRing", 0), ...curl("rPinky", 0) } }, { dur: 200, pose: IDLE }],
  G: [{ dur: 600, pose: { rUpperArm: [-E, 0, Q * 0.3], rForeArm: [-Q, 0, 0], rHand: [0, -H * 0.5, 0], rIndex1: [0,0,0], rIndex2: [0,0,0], rIndex3: [0,0,0], ...curl("rMiddle", H * 0.9), ...curl("rRing", H * 0.9), ...curl("rPinky", H * 0.85), rThumb1: [0, Q * 0.5, 0], rThumb2: [0,0,0], rThumb3: [0,0,0] } }, { dur: 200, pose: IDLE }],
  H: [{ dur: 600, pose: { rUpperArm: [-E, 0, Q * 0.3], rForeArm: [-Q, 0, 0], rHand: [0, -H * 0.5, 0], ...vSign("r") } }, { dur: 200, pose: IDLE }],
  LETTER_I: [{ dur: 600, pose: { rUpperArm: [-E, 0, Q * 0.3], rForeArm: [-Q, 0, 0], ...curl("rThumb", Q * 0.8), ...curl("rIndex", H * 0.9), ...curl("rMiddle", H * 0.95), ...curl("rRing", H * 0.9), rPinky1: [0,0,0], rPinky2: [0,0,0], rPinky3: [0,0,0] } }, { dur: 200, pose: IDLE }],
  J: [
    { dur: 300, pose: { rUpperArm: [-E, 0, Q * 0.3], rForeArm: [-Q, 0, 0], ...curl("rThumb", Q * 0.8), ...curl("rIndex", H * 0.9), ...curl("rMiddle", H * 0.95), ...curl("rRing", H * 0.9), rPinky1: [0,0,0], rPinky2: [0,0,0], rPinky3: [0,0,0] } },
    { dur: 400, pose: { rUpperArm: [-E, 0, Q * 0.3], rForeArm: [-Q, 0, 0], rHand: [0, -Q * 0.5, 0], ...curl("rThumb", Q * 0.8), ...curl("rIndex", H * 0.9), ...curl("rMiddle", H * 0.95), ...curl("rRing", H * 0.9), rPinky1: [0,0,0], rPinky2: [0,0,0], rPinky3: [0,0,0] } },
    { dur: 200, pose: IDLE },
  ],
  K: [{ dur: 600, pose: { rUpperArm: [-E, 0, Q * 0.3], rForeArm: [-Q, 0, 0], rIndex1: [0,0,0], rIndex2: [0,0,0], rIndex3: [0,0,0], rMiddle1: [0,0,0], rMiddle2: [0,0,0], rMiddle3: [0,0,0], ...curl("rRing", H * 0.9), ...curl("rPinky", H * 0.85), rThumb1: [Q * 0.5, 0, 0], rThumb2: [Q*0.3,0,0], rThumb3: [0,0,0] } }, { dur: 200, pose: IDLE }],
  L: [{ dur: 600, pose: { rUpperArm: [-E, 0, Q * 0.3], rForeArm: [-Q, 0, 0], rIndex1: [0,0,0], rIndex2: [0,0,0], rIndex3: [0,0,0], ...curl("rMiddle", H * 0.95), ...curl("rRing", H * 0.9), ...curl("rPinky", H * 0.85), rThumb1: [0, Q * 0.5, 0], rThumb2: [0, 0, 0], rThumb3: [0, 0, 0] } }, { dur: 200, pose: IDLE }],
  M: [{ dur: 600, pose: { rUpperArm: [-E, 0, Q * 0.3], rForeArm: [-Q, 0, 0], ...curl("rIndex", H * 0.7), ...curl("rMiddle", H * 0.7), ...curl("rRing", H * 0.7), ...curl("rPinky", H * 0.9), ...curl("rThumb", Q * 0.5) } }, { dur: 200, pose: IDLE }],
  N: [{ dur: 600, pose: { rUpperArm: [-E, 0, Q * 0.3], rForeArm: [-Q, 0, 0], ...curl("rIndex", H * 0.7), ...curl("rMiddle", H * 0.7), ...curl("rRing", H * 0.9), ...curl("rPinky", H * 0.9), ...curl("rThumb", Q * 0.5) } }, { dur: 200, pose: IDLE }],
  O: [{ dur: 600, pose: { rUpperArm: [-E, 0, Q * 0.3], rForeArm: [-Q, 0, 0], ...curl("rIndex", Q * 0.7), ...curl("rMiddle", Q * 0.7), ...curl("rRing", Q * 0.7), ...curl("rPinky", Q * 0.7), ...curl("rThumb", Q * 0.5) } }, { dur: 200, pose: IDLE }],
  P: [{ dur: 600, pose: { rUpperArm: [-E, 0, Q * 0.3], rForeArm: [-Q, 0, 0], rHand: [Q * 0.4, 0, 0], rIndex1: [0,0,0], rIndex2: [0,0,0], rIndex3: [0,0,0], rMiddle1: [0,0,0], rMiddle2: [0,0,0], rMiddle3: [0,0,0], ...curl("rRing", H * 0.9), ...curl("rPinky", H * 0.85), rThumb1: [Q * 0.5, 0, 0], rThumb2: [Q*0.3,0,0], rThumb3: [0,0,0] } }, { dur: 200, pose: IDLE }],
  Q: [{ dur: 600, pose: { rUpperArm: [-E, 0, Q * 0.3], rForeArm: [-Q, 0, 0], rHand: [Q * 0.4, 0, 0], rIndex1: [0,0,0], rIndex2: [0,0,0], rIndex3: [0,0,0], ...curl("rMiddle", H * 0.95), ...curl("rRing", H * 0.9), ...curl("rPinky", H * 0.85), rThumb1: [0, Q * 0.5, 0], rThumb2: [Q*0.3,0,0], rThumb3: [0,0,0] } }, { dur: 200, pose: IDLE }],
  R: [{ dur: 600, pose: { rUpperArm: [-E, 0, Q * 0.3], rForeArm: [-Q, 0, 0], rIndex1: [0, 0, Q * 0.3], rIndex2: [0,0,0], rIndex3: [0,0,0], rMiddle1: [0, 0, -Q * 0.3], rMiddle2: [0,0,0], rMiddle3: [0,0,0], ...curl("rRing", H * 0.9), ...curl("rPinky", H * 0.85), ...curl("rThumb", Q * 0.8) } }, { dur: 200, pose: IDLE }],
  S: [{ dur: 600, pose: { rUpperArm: [-E, 0, Q * 0.3], rForeArm: [-Q, 0, 0], ...curl("rIndex", H * 0.9), ...curl("rMiddle", H * 0.95), ...curl("rRing", H * 0.9), ...curl("rPinky", H * 0.85), rThumb1: [0, 0, Q * 0.3], rThumb2: [Q*0.5,0,0], rThumb3: [Q*0.3,0,0] } }, { dur: 200, pose: IDLE }],
  T: [{ dur: 600, pose: { rUpperArm: [-E, 0, Q * 0.3], rForeArm: [-Q, 0, 0], ...curl("rIndex", H * 0.9), ...curl("rMiddle", H * 0.95), ...curl("rRing", H * 0.9), ...curl("rPinky", H * 0.85), rThumb1: [Q * 0.5, 0, 0], rThumb2: [Q * 0.3, 0, 0], rThumb3: [0,0,0] } }, { dur: 200, pose: IDLE }],
  U: [{ dur: 600, pose: { rUpperArm: [-E, 0, Q * 0.3], rForeArm: [-Q, 0, 0], ...vSign("r") } }, { dur: 200, pose: IDLE }],
  V: [{ dur: 600, pose: { rUpperArm: [-E, 0, Q * 0.3], rForeArm: [-Q, 0, 0], rIndex1: [0, 0, Q * 0.3], rIndex2: [0,0,0], rIndex3: [0,0,0], rMiddle1: [0, 0, -Q * 0.3], rMiddle2: [0,0,0], rMiddle3: [0,0,0], ...curl("rRing", H * 0.9), ...curl("rPinky", H * 0.85), ...curl("rThumb", Q * 0.8) } }, { dur: 200, pose: IDLE }],
  W: [{ dur: 600, pose: { rUpperArm: [-E, 0, Q * 0.3], rForeArm: [-Q, 0, 0], ...fist("r"), ...curl("rIndex", 0), ...curl("rMiddle", 0), ...curl("rRing", 0) } }, { dur: 200, pose: IDLE }],
  X: [{ dur: 600, pose: { rUpperArm: [-E, 0, Q * 0.3], rForeArm: [-Q, 0, 0], ...fist("r"), rIndex1: [Q * 0.5, 0, 0], rIndex2: [Q * 0.5, 0, 0] } }, { dur: 200, pose: IDLE }],
  Y: [{ dur: 600, pose: { rUpperArm: [-E, 0, Q * 0.3], rForeArm: [-Q, 0, 0], rThumb1: [0,0,0], rThumb2: [0,0,0], rThumb3: [0,0,0], rIndex1: [H*0.8,0,0], rIndex2: [H*0.8,0,0], rIndex3: [H*0.6,0,0], ...curl("rMiddle", H * 0.95), ...curl("rRing", H * 0.9), rPinky1: [0,0,0], rPinky2: [0,0,0], rPinky3: [0,0,0] } }, { dur: 200, pose: IDLE }],
  Z: [
    { dur: 200, pose: { rUpperArm: [-E, 0, Q * 0.3], rForeArm: [-Q, 0, 0], ...point("r") } },
    { dur: 300, pose: { rUpperArm: [-E, 0, Q * 0.1], rForeArm: [-Q, 0, 0], rHand: [0, -Q * 0.3, 0], ...point("r") } },
    { dur: 300, pose: { rUpperArm: [-E, 0, Q * 0.5], rForeArm: [-Q, 0, 0], rHand: [0, Q * 0.3, 0], ...point("r") } },
    { dur: 200, pose: IDLE },
  ],
};

// ─── Text → Gloss conversion ──────────────────────────────────────────────────

export function textToGloss(text: string): string[] {
  const wordMap: Record<string, string[]> = {
    "i love you":      ["I_LOVE_YOU"],
    "i am happy":      ["I_AM_HAPPY"],
    "i hate you":      ["I_HATE_YOU"],
    "good morning":    ["GOOD_MORNING"],
    "good night":      ["GOOD_NIGHT"],
    "thank you":       ["THANK_YOU"],
    "please help":     ["PLEASE", "HELP"],
    "yes":             ["YES"],
    "no":              ["NO"],
    "hello":           ["HELLO"],
    "sorry":           ["SORRY"],
    "good":            ["GOOD"],
    "bad":             ["BAD"],
    "happy":           ["HAPPY"],
    "sad":             ["SAD"],
    "angry":           ["ANGRY"],
    "love":            ["LOVE"],
    "help":            ["HELP"],
    "please":          ["PLEASE"],
    "thank":           ["THANK_YOU"],
    "you":             ["YOU"],
    "want":            ["WANT"],
    "know":            ["KNOW"],
    "understand":      ["UNDERSTAND"],
    "stop":            ["STOP"],
    "go":              ["GO"],
    "come":            ["COME"],
    "see":             ["SEE"],
    "think":           ["THINK"],
    "eat":             ["EAT"],
    "drink":           ["DRINK"],
    "sleep":           ["SLEEP"],
    "home":            ["HOME"],
    "friend":          ["FRIEND"],
    "family":          ["FAMILY"],
    "what":            ["WHAT"],
    "where":           ["WHERE"],
    "more":            ["MORE"],
    "i":               ["I"],
  };

  const lower = text.toLowerCase().trim();

  // Check multi-word phrases first
  for (const [phrase, gloss] of Object.entries(wordMap)) {
    if (lower === phrase || lower.includes(phrase)) return gloss;
  }

  // Split into words and map each
  const words = lower.split(/\s+/);
  const result: string[] = [];
  for (const word of words) {
    const clean = word.replace(/[^a-z]/g, "");
    if (!clean) continue;
    if (wordMap[clean]) {
      result.push(...wordMap[clean]);
    } else {
      // Fingerspell
      for (const ch of clean.toUpperCase()) {
        const key = ch === 'I' ? 'LETTER_I' : ch;
        if (SIGNS[key]) result.push(key);
      }
    }
  }
  return result.length > 0 ? result : ["HELLO"];
}

// ─── Component ────────────────────────────────────────────────────────────────

const HugoAvatar = forwardRef<HugoAvatarHandle, Props>(
  ({ emotion = "neutral", className, onSignComplete }, ref) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const bonesRef = useRef<Record<string, THREE.Object3D>>({});
      const faceMeshRef = useRef<{
      lBrow: THREE.Mesh; rBrow: THREE.Mesh;
      lEye: THREE.Mesh; rEye: THREE.Mesh;
      mouth: THREE.Mesh; lMouthCorner: THREE.Mesh; rMouthCorner: THREE.Mesh;
    } | null>(null);
    const rafRef = useRef<number>(0);
    const signingRef = useRef(false);
    const currentEmotionRef = useRef<Emotion>("neutral");

    // ── Lerp helpers ──────────────────────────────────────────────────────────

    const tweensRef = useRef<Map<THREE.Object3D, { target: THREE.Euler; speed: number }>>(new Map());

    const lerpTo = useCallback((bone: THREE.Object3D | undefined, x: number, y: number, z: number, speed = 4) => {
      if (!bone) return;
      tweensRef.current.set(bone, { target: new THREE.Euler(x, y, z), speed });
    }, []);

    const applyPose = useCallback((pose: BonePose, speed = 4) => {
      const bones = bonesRef.current;
      for (const [name, [x, y, z]] of Object.entries(pose)) {
        lerpTo(bones[name], x, y, z, speed);
      }
    }, [lerpTo]);

    // ── Face expression ───────────────────────────────────────────────────────

    const applyFaceExpression = useCallback((em: Emotion) => {
      const face = faceMeshRef.current;
      if (!face) return;

      // Eyebrow Y offset (up = surprised/happy, down = angry/sad)
      // Mouth corners Y offset (up = happy, down = sad)
      // Eye scale Y (squint = angry, wide = surprised)

      const configs: Record<Emotion, { browY: number; mouthCornerY: number; eyeScaleY: number; mouthOpenY: number }> = {
        happy:    { browY: 0.025,  mouthCornerY: 0.025,  eyeScaleY: 1.15,  mouthOpenY: 0.04 },
        sad:      { browY: -0.02,  mouthCornerY: -0.03, eyeScaleY: 0.8,   mouthOpenY: 0 },
        angry:    { browY: -0.025, mouthCornerY: -0.02, eyeScaleY: 0.65,  mouthOpenY: 0 },
        neutral:  { browY: 0,      mouthCornerY: 0,     eyeScaleY: 1.0,   mouthOpenY: 0 },
        fearful:  { browY: 0.03,   mouthCornerY: -0.02, eyeScaleY: 1.35,  mouthOpenY: 0.05 },
        surprised:{ browY: 0.04,   mouthCornerY: 0.01,  eyeScaleY: 1.45,  mouthOpenY: 0.08 },
        disgusted:{ browY: -0.015, mouthCornerY: -0.025,eyeScaleY: 0.75,  mouthOpenY: 0.01 },
      };

      const cfg = configs[em];

       // Animate brow positions (local space: brows are at y=0.215 in head)
      face.lBrow.position.y = 0.215 + cfg.browY;
      face.rBrow.position.y = 0.215 + cfg.browY;
      face.lBrow.rotation.z = em === "angry" ? 0.3 : em === "sad" ? -0.15 : 0;
      face.rBrow.rotation.z = em === "angry" ? -0.3 : em === "sad" ? 0.15 : 0;
      // Eye squint
      face.lEye.scale.y = cfg.eyeScaleY;
      face.rEye.scale.y = cfg.eyeScaleY;
      // Mouth corners (local space: mouth corners at y=0.095 in head)
      face.lMouthCorner.position.y = 0.095 + cfg.mouthCornerY;
      face.rMouthCorner.position.y = 0.095 + cfg.mouthCornerY;
      // Mouth open
      face.mouth.scale.y = 1 + cfg.mouthOpenY * 10;
    }, []);

    // ── Build character ───────────────────────────────────────────────────────

    const buildCharacter = useCallback((scene: THREE.Scene) => {
      const bones = bonesRef.current;

      const mat = (color: number, rough = 0.7, metal = 0) =>
        new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });

      const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d, 2, 2, 2);
      const cyl = (rt: number, rb: number, h: number, seg = 8) => new THREE.CylinderGeometry(rt, rb, h, seg);
      const sph = (r: number, ws = 16, hs = 12) => new THREE.SphereGeometry(r, ws, hs);

      // ── Root bone ──
      const root = new THREE.Object3D(); root.name = "root";
      root.position.set(0, 0, 0);
      scene.add(root);
      bones["root"] = root;

      // ── Hips ──
      const hips = new THREE.Object3D(); hips.name = "hips";
      hips.position.set(0, 0.85, 0);
      root.add(hips);
      bones["hips"] = hips;

      // ── Spine ──
      const spine = new THREE.Object3D(); spine.name = "spine";
      spine.position.set(0, 0.15, 0);
      hips.add(spine);
      bones["spine"] = spine;

      // Torso mesh
      const torsoMesh = new THREE.Mesh(box(0.32, 0.42, 0.18), mat(C.shirt));
      torsoMesh.position.set(0, 0.21, 0);
      spine.add(torsoMesh);

      // Tie
      const tieMesh = new THREE.Mesh(box(0.055, 0.28, 0.02), mat(C.tie));
      tieMesh.position.set(0, 0.18, 0.1);
      spine.add(tieMesh);
      const tieKnot = new THREE.Mesh(box(0.065, 0.04, 0.025), mat(C.tie));
      tieKnot.position.set(0, 0.33, 0.1);
      spine.add(tieKnot);

      // ── Neck ──
      const neck = new THREE.Object3D(); neck.name = "neck";
      neck.position.set(0, 0.42, 0);
      spine.add(neck);
      bones["neck"] = neck;

      const neckMesh = new THREE.Mesh(cyl(0.055, 0.065, 0.1, 8), mat(C.skin));
      neckMesh.position.set(0, 0.05, 0);
      neck.add(neckMesh);

      // ── Head ──
      const head = new THREE.Object3D(); head.name = "head";
      head.position.set(0, 0.1, 0);
      neck.add(head);
      bones["head"] = head;

      // Head mesh — slightly elongated sphere
      const headMesh = new THREE.Mesh(sph(0.155, 20, 16), mat(C.skin));
      headMesh.scale.set(1, 1.1, 0.95);
      headMesh.position.set(0, 0.155, 0);
      head.add(headMesh);

      // Hair
      const hairMesh = new THREE.Mesh(sph(0.162, 20, 10), mat(C.hair));
      hairMesh.scale.set(1, 0.7, 0.95);
      hairMesh.position.set(0, 0.22, -0.01);
      head.add(hairMesh);

      // Ears
      [-1, 1].forEach(side => {
        const ear = new THREE.Mesh(sph(0.03, 8, 6), mat(C.skin));
        ear.position.set(side * 0.158, 0.155, 0);
        head.add(ear);
      });

      // Eyes
      const eyeWhiteGeo = sph(0.038, 10, 8);
      const eyeIrisGeo = sph(0.026, 8, 6);
      const eyePupilGeo = sph(0.015, 6, 5);

      [-1, 1].forEach((side, i) => {
        const eyeWhite = new THREE.Mesh(eyeWhiteGeo, mat(C.eyeW, 0.3));
        eyeWhite.position.set(side * 0.065, 0.165, 0.135);
        head.add(eyeWhite);

        const eyeIris = new THREE.Mesh(eyeIrisGeo, mat(C.iris, 0.5));
        eyeIris.position.set(side * 0.065, 0.165, 0.155);
        head.add(eyeIris);
        if (i === 0) { if (faceMeshRef.current) faceMeshRef.current.lEye = eyeIris; }
        else { if (faceMeshRef.current) faceMeshRef.current.rEye = eyeIris; }

        const eyePupil = new THREE.Mesh(eyePupilGeo, mat(C.pupil));
        eyePupil.position.set(side * 0.065, 0.165, 0.165);
        head.add(eyePupil);

        // Glasses frame
        const glassRim = new THREE.Mesh(
          new THREE.TorusGeometry(0.042, 0.007, 6, 12),
          mat(C.glass, 0.3, 0.8)
        );
        glassRim.position.set(side * 0.065, 0.165, 0.14);
        head.add(glassRim);
      });

      // Glasses bridge
      const bridge = new THREE.Mesh(box(0.05, 0.007, 0.007), mat(C.glass, 0.3, 0.8));
      bridge.position.set(0, 0.165, 0.14);
      head.add(bridge);

      // Glasses temples (arms)
      [-1, 1].forEach(side => {
        const temple = new THREE.Mesh(box(0.12, 0.006, 0.006), mat(C.glass, 0.3, 0.8));
        temple.position.set(side * 0.125, 0.165, 0.1);
        temple.rotation.y = side * 0.3;
        head.add(temple);
      });

      // Eyebrows
      const browGeo = box(0.055, 0.012, 0.01);
      const lBrow = new THREE.Mesh(browGeo, mat(C.brow));
      lBrow.position.set(-0.065, 1.615, 0.145);
      scene.add(lBrow); // add to scene directly so position is in world space relative to head
      // Actually add to head bone
      lBrow.position.set(-0.065, 0.215, 0.145);
      head.add(lBrow);

      const rBrow = new THREE.Mesh(browGeo, mat(C.brow));
      rBrow.position.set(0.065, 0.215, 0.145);
      head.add(rBrow);

      // Nose
      const nose = new THREE.Mesh(sph(0.025, 6, 5), mat(C.skinD));
      nose.scale.set(0.8, 1, 0.7);
      nose.position.set(0, 0.135, 0.165);
      head.add(nose);

      // Mouth
      const mouthGeo = box(0.07, 0.018, 0.01);
      const mouth = new THREE.Mesh(mouthGeo, mat(C.lip));
      mouth.position.set(0, 0.095, 0.155);
      head.add(mouth);

      const lMouthCorner = new THREE.Mesh(sph(0.012, 5, 4), mat(C.lip));
      lMouthCorner.position.set(-0.038, 0.095, 0.153);
      head.add(lMouthCorner);

      const rMouthCorner = new THREE.Mesh(sph(0.012, 5, 4), mat(C.lip));
      rMouthCorner.position.set(0.038, 0.095, 0.153);
      head.add(rMouthCorner);

      // Store face refs
      faceMeshRef.current = {
        lBrow, rBrow,
        lEye: faceMeshRef.current?.lEye ?? lBrow,
        rEye: faceMeshRef.current?.rEye ?? rBrow,
        mouth, lMouthCorner, rMouthCorner,
      };

      // ── Shoulders ──
      const buildArm = (side: "r" | "l") => {
        const s = side === "r" ? -1 : 1;
        const sx = side === "r" ? -0.16 : 0.16;

        // Shoulder cap
        const shoulder = new THREE.Mesh(sph(0.065, 10, 8), mat(C.shirt));
        shoulder.position.set(sx, 0.38, 0);
        spine.add(shoulder);

        // Upper arm bone
        const upperArm = new THREE.Object3D();
        upperArm.name = `${side}UpperArm`;
        upperArm.position.set(sx, 0.38, 0);
        spine.add(upperArm);
        bones[`${side}UpperArm`] = upperArm;

        // Upper arm mesh
        const uArmMesh = new THREE.Mesh(cyl(0.042, 0.038, 0.24, 8), mat(C.shirt));
        uArmMesh.position.set(0, -0.12, 0);
        upperArm.add(uArmMesh);

        // Elbow
        const elbowMesh = new THREE.Mesh(sph(0.045, 8, 6), mat(C.skin));
        elbowMesh.position.set(0, -0.24, 0);
        upperArm.add(elbowMesh);

        // Forearm bone
        const foreArm = new THREE.Object3D();
        foreArm.name = `${side}ForeArm`;
        foreArm.position.set(0, -0.24, 0);
        upperArm.add(foreArm);
        bones[`${side}ForeArm`] = foreArm;

        const fArmMesh = new THREE.Mesh(cyl(0.036, 0.03, 0.22, 8), mat(C.skin));
        fArmMesh.position.set(0, -0.11, 0);
        foreArm.add(fArmMesh);

        // Wrist bone
        const hand = new THREE.Object3D();
        hand.name = `${side}Hand`;
        hand.position.set(0, -0.22, 0);
        foreArm.add(hand);
        bones[`${side}Hand`] = hand;

        // Palm
        const palmMesh = new THREE.Mesh(box(0.09, 0.1, 0.025), mat(C.skin));
        palmMesh.position.set(0, -0.05, 0);
        hand.add(palmMesh);

        // Fingers
        const fingerDefs = [
          { name: "Thumb",  x: s * 0.05,  y: -0.02, z: 0.01, len: [0.04, 0.03, 0.025], baseRot: [0, s * -0.4, s * 0.3] },
          { name: "Index",  x: s * 0.03,  y: -0.1,  z: 0,    len: [0.04, 0.035, 0.028], baseRot: [0, 0, 0] },
          { name: "Middle", x: s * 0.01,  y: -0.1,  z: 0,    len: [0.042, 0.037, 0.03], baseRot: [0, 0, 0] },
          { name: "Ring",   x: -s * 0.01, y: -0.1,  z: 0,    len: [0.038, 0.033, 0.027], baseRot: [0, 0, 0] },
          { name: "Pinky",  x: -s * 0.03, y: -0.095, z: 0,   len: [0.03, 0.025, 0.02], baseRot: [0, 0, 0] },
        ];

        fingerDefs.forEach(({ name, x, y, z, len, baseRot }) => {
          let parent: THREE.Object3D = hand;
          let py = y;

          [1, 2, 3].forEach((joint) => {
            const boneName = `${side}${name}${joint}`;
            const bone = new THREE.Object3D();
            bone.name = boneName;
            bone.position.set(joint === 1 ? x : 0, joint === 1 ? py : -len[joint - 2] * 2, joint === 1 ? z : 0);
            if (joint === 1) bone.rotation.set(baseRot[0], baseRot[1], baseRot[2]);
            parent.add(bone);
            bones[boneName] = bone;

            const segLen = len[joint - 1];
            const seg = new THREE.Mesh(cyl(segLen * 0.55, segLen * 0.45, segLen * 2, 6), mat(C.skin));
            seg.position.set(0, -segLen, 0);
            bone.add(seg);

            // Knuckle
            const knuckle = new THREE.Mesh(sph(segLen * 0.52, 5, 4), mat(C.skinD));
            knuckle.position.set(0, -segLen * 2, 0);
            bone.add(knuckle);

            parent = bone;
            py = -segLen * 2;
          });
        });
      };

      buildArm("r");
      buildArm("l");

      // ── Legs ──
      const buildLeg = (side: "r" | "l") => {
        const sx = side === "r" ? -0.09 : 0.09;

        const thigh = new THREE.Object3D();
        thigh.name = `${side}Thigh`;
        thigh.position.set(sx, 0, 0);
        hips.add(thigh);
        bones[`${side}Thigh`] = thigh;

        const thighMesh = new THREE.Mesh(cyl(0.065, 0.055, 0.38, 8), mat(C.jeans));
        thighMesh.position.set(0, -0.19, 0);
        thigh.add(thighMesh);

        const knee = new THREE.Object3D();
        knee.name = `${side}Knee`;
        knee.position.set(0, -0.38, 0);
        thigh.add(knee);
        bones[`${side}Knee`] = knee;

        const shinMesh = new THREE.Mesh(cyl(0.052, 0.042, 0.36, 8), mat(C.jeans));
        shinMesh.position.set(0, -0.18, 0);
        knee.add(shinMesh);

        // Ankle
        const ankle = new THREE.Object3D();
        ankle.name = `${side}Ankle`;
        ankle.position.set(0, -0.36, 0);
        knee.add(ankle);
        bones[`${side}Ankle`] = ankle;

        // Shoe
        const shoeMesh = new THREE.Mesh(box(0.1, 0.06, 0.2), mat(C.shoe));
        shoeMesh.position.set(0, -0.03, 0.04);
        ankle.add(shoeMesh);

        const soleMesh = new THREE.Mesh(box(0.1, 0.02, 0.2), mat(C.shoeSole));
        soleMesh.position.set(0, -0.06, 0.04);
        ankle.add(soleMesh);

        // Shoe toe cap (orange)
        const toeCap = new THREE.Mesh(box(0.1, 0.055, 0.06), mat(C.shoeSole));
        toeCap.position.set(0, -0.03, 0.13);
        ankle.add(toeCap);

        // Laces
        const laceGeo = box(0.085, 0.005, 0.12);
        for (let i = 0; i < 3; i++) {
          const lace = new THREE.Mesh(laceGeo, mat(C.white));
          lace.position.set(0, 0.01, 0.02 + i * 0.03);
          ankle.add(lace);
        }
      };

      buildLeg("r");
      buildLeg("l");

      // ── Belt ──
      const beltMesh = new THREE.Mesh(box(0.34, 0.03, 0.19), mat(0x222222));
      beltMesh.position.set(0, 0.02, 0);
      hips.add(beltMesh);

      const buckle = new THREE.Mesh(box(0.04, 0.03, 0.02), mat(0xaaaaaa, 0.2, 0.9));
      buckle.position.set(0, 0.02, 0.1);
      hips.add(buckle);

      // Apply initial idle pose
      applyPose(IDLE, 10);

    }, [applyPose]);

    // ── Signing engine ────────────────────────────────────────────────────────

     const signAsync = useCallback(async (gloss: string[]) => {
      if (signingRef.current) return;
      signingRef.current = true;
      console.log('[EVA-SL] signAsync starting', gloss);
      for (const token of gloss) {
        const sign = SIGNS[token];
        if (!sign) { console.log('[EVA-SL] no sign for', token); continue; }
        for (const kf of sign) {
          const bones = bonesRef.current;
          const firstBone = Object.keys(kf.pose)[0];
          const boneObj = bones[firstBone];
          console.log('[EVA-SL] applying pose', firstBone, 'bone exists:', !!boneObj, 'tweens before:', tweensRef.current.size);
          applyPose(kf.pose, 6);
          console.log('[EVA-SL] tweens after applyPose:', tweensRef.current.size);
          await new Promise<void>(res => setTimeout(res, kf.dur));
        }
      }
      applyPose(IDLE, 3);
      signingRef.current = false;
      onSignComplete?.();
    }, [applyPose, onSignComplete]);

    // ── Imperative handle ─────────────────────────────────────────────────────

    useImperativeHandle(ref, () => ({
      sign(gloss: string[]) {
        console.log('[EVA-SL] sign() called with', gloss, 'bones:', Object.keys(bonesRef.current).length);
        signingRef.current = false; // allow re-trigger
        signAsync(gloss);
      },
      setEmotion(em: Emotion) {
        currentEmotionRef.current = em;
        applyFaceExpression(em);
        if (sceneRef.current) {
          sceneRef.current.background = new THREE.Color(EMOTION_BG[em]);
        }
      },
    }), [signAsync, applyFaceExpression]);

    // ── Emotion prop watcher ──────────────────────────────────────────────────

    useEffect(() => {
      currentEmotionRef.current = emotion;
      applyFaceExpression(emotion);
      if (sceneRef.current) {
        sceneRef.current.background = new THREE.Color(EMOTION_BG[emotion]);
      }
    }, [emotion, applyFaceExpression]);

    // ── Three.js setup ────────────────────────────────────────────────────────

    useEffect(() => {
      const container = mountRef.current;
      if (!container) return;

      const w = container.clientWidth || 400;
      const h = container.clientHeight || 520;

      // Scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(EMOTION_BG["neutral"]);
      sceneRef.current = scene;

      // Fog for depth
      scene.fog = new THREE.Fog(EMOTION_BG["neutral"], 5, 20);

      // Camera
      const camera = new THREE.PerspectiveCamera(45, w / h, 0.01, 100);
      camera.position.set(0, 1.4, 2.2);
      camera.lookAt(0, 1.2, 0);
      cameraRef.current = camera;

      // Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Lights
      const ambient = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambient);

      const keyLight = new THREE.DirectionalLight(0xfff5e0, 1.2);
      keyLight.position.set(2, 4, 3);
      keyLight.castShadow = true;
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0xe0f0ff, 0.5);
      fillLight.position.set(-2, 2, 1);
      scene.add(fillLight);

      const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
      rimLight.position.set(0, 3, -3);
      scene.add(rimLight);

      // Ground plane
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(4, 4),
        new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.9 })
      );
      ground.rotation.x = -π / 2;
      ground.position.y = 0;
      ground.receiveShadow = true;
      scene.add(ground);

      // Build character
      buildCharacter(scene);

      // Animation loop
      let lastTime = 0;
      let idleTime = 0;

      const animate = (time: number) => {
        rafRef.current = requestAnimationFrame(animate);
        const dt = Math.min((time - lastTime) / 1000, 0.05);
        lastTime = time;
        idleTime += dt;

        // Process tweens
        tweensRef.current.forEach((tween, bone) => {
          const { target, speed } = tween;
          const alpha = 1 - Math.exp(-speed * dt);
          bone.rotation.x += (target.x - bone.rotation.x) * alpha;
          bone.rotation.y += (target.y - bone.rotation.y) * alpha;
          bone.rotation.z += (target.z - bone.rotation.z) * alpha;

          // Remove tween when close enough
          const dx = Math.abs(bone.rotation.x - target.x);
          const dy = Math.abs(bone.rotation.y - target.y);
          const dz = Math.abs(bone.rotation.z - target.z);
          if (dx + dy + dz < 0.001) {
            bone.rotation.set(target.x, target.y, target.z);
            tweensRef.current.delete(bone);
          }
        });

        // Idle breathing (only when not signing)
        if (!signingRef.current) {
          const breathe = Math.sin(idleTime * 1.2) * 0.008;
          const sway = Math.sin(idleTime * 0.4) * 0.005;
          const bones = bonesRef.current;
          if (bones["spine"]) {
            bones["spine"].rotation.x = breathe;
            bones["spine"].rotation.z = sway;
          }
          if (bones["head"]) {
            bones["head"].rotation.z = Math.sin(idleTime * 0.3) * 0.01;
          }
        }

        renderer.render(scene, camera);
      };

      rafRef.current = requestAnimationFrame(animate);

      // Resize handler
      const onResize = () => {
        const nw = container.clientWidth;
        const nh = container.clientHeight;
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
      };
      const resizeObserver = new ResizeObserver(onResize);
      resizeObserver.observe(container);

      return () => {
        cancelAnimationFrame(rafRef.current);
        resizeObserver.disconnect();
        renderer.dispose();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      };
    }, [buildCharacter]);

    return <div ref={mountRef} className={className} style={{ background: "#0d1117" }} />;
  }
);

HugoAvatar.displayName = "HugoAvatar";
export default HugoAvatar;
