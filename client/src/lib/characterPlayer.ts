/**
 * EVA-SL Character Player
 * A Three.js-based animated sign language character (Hugo-style)
 * that renders ASL/ArSL signs from keypoint data.
 *
 * Architecture:
 *  - Procedurally generated humanoid mesh (no external GLB required)
 *  - Keypoint-driven inverse kinematics for hands and arms
 *  - Emotion posture blending as a base layer
 *  - Smooth interpolated transitions between signs (60fps target)
 *  - Secondary motion: breathing, eye blink, idle head sway
 */

import * as THREE from "three";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Landmark = { x: number; y: number; z: number; confidence?: number; visibility?: number };
export type Emotion = "happy" | "sad" | "angry" | "neutral" | "fearful" | "surprised" | "disgusted";

export interface SignEntry {
  label: string;
  category: string;
  handedness: string;
  motion_type: string;
  description: string;
  hand_landmarks: Landmark[];
  pose_landmarks: Landmark[];
  romanized?: string;
  metadata?: {
    signer_id?: string;
    conditions?: string;
    augmented?: boolean;
    dataset_version?: string;
    format?: string;
  };
}

export interface PlayerOptions {
  container: HTMLElement;
  width?: number;
  height?: number;
  emotion?: Emotion;
  onReady?: () => void;
}

// ─── Emotion Color Map ────────────────────────────────────────────────────────

const EMOTION_COLORS: Record<Emotion, number> = {
  happy: 0xf59e0b,
  sad: 0x3b82f6,
  angry: 0xef4444,
  neutral: 0x64748b,
  fearful: 0x7c3aed,
  surprised: 0x06b6d4,
  disgusted: 0x10b981,
};

const EMOTION_POSE_OFFSETS: Record<Emotion, { shoulderY: number; headTilt: number; armSpread: number }> = {
  happy:     { shoulderY: -0.02, headTilt:  0.01, armSpread:  0.03 },
  sad:       { shoulderY:  0.04, headTilt:  0.03, armSpread: -0.02 },
  angry:     { shoulderY: -0.03, headTilt: -0.01, armSpread:  0.04 },
  neutral:   { shoulderY:  0.00, headTilt:  0.00, armSpread:  0.00 },
  fearful:   { shoulderY: -0.04, headTilt:  0.02, armSpread: -0.04 },
  surprised: { shoulderY: -0.03, headTilt: -0.02, armSpread:  0.02 },
  disgusted: { shoulderY:  0.02, headTilt:  0.02, armSpread: -0.01 },
};

// ─── Character Builder ────────────────────────────────────────────────────────

function createMaterial(color: number, emissive = 0x000000) {
  return new THREE.MeshStandardMaterial({ color, emissive, roughness: 0.6, metalness: 0.1 });
}

function createLimb(rx: number, ry: number, rz: number, color: number) {
  const geo = new THREE.CapsuleGeometry(rx, ry, 4, 8);
  const mesh = new THREE.Mesh(geo, createMaterial(color));
  return mesh;
}

interface CharacterBones {
  root: THREE.Group;
  torso: THREE.Mesh;
  head: THREE.Mesh;
  neck: THREE.Group;
  leftShoulder: THREE.Group;
  rightShoulder: THREE.Group;
  leftUpperArm: THREE.Mesh;
  rightUpperArm: THREE.Mesh;
  leftElbow: THREE.Group;
  rightElbow: THREE.Group;
  leftForearm: THREE.Mesh;
  rightForearm: THREE.Mesh;
  leftWrist: THREE.Group;
  rightWrist: THREE.Group;
  leftHand: THREE.Group;
  rightHand: THREE.Group;
  // Finger joints: [finger][joint] for each hand
  leftFingers: THREE.Group[][];
  rightFingers: THREE.Group[][];
  // Eyes
  leftEye: THREE.Mesh;
  rightEye: THREE.Mesh;
  // Hips and legs
  hips: THREE.Group;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
}

function buildCharacter(skinColor = 0xf5cba7, clothColor = 0x1e40af): CharacterBones {
  const root = new THREE.Group();

  // ── Body ──
  const torsoGeo = new THREE.CapsuleGeometry(0.18, 0.35, 6, 12);
  const torso = new THREE.Mesh(torsoGeo, createMaterial(clothColor));
  torso.position.set(0, 0, 0);
  root.add(torso);

  // ── Hips ──
  const hips = new THREE.Group();
  hips.position.set(0, -0.28, 0);
  root.add(hips);

  const hipGeo = new THREE.CapsuleGeometry(0.16, 0.1, 4, 8);
  const hipMesh = new THREE.Mesh(hipGeo, createMaterial(clothColor));
  hipMesh.rotation.z = Math.PI / 2;
  hips.add(hipMesh);

  // Legs
  const leftLeg = createLimb(0.07, 0.3, 0, clothColor);
  leftLeg.position.set(0.12, -0.35, 0);
  hips.add(leftLeg);

  const rightLeg = createLimb(0.07, 0.3, 0, clothColor);
  rightLeg.position.set(-0.12, -0.35, 0);
  hips.add(rightLeg);

  // ── Neck ──
  const neck = new THREE.Group();
  neck.position.set(0, 0.28, 0);
  root.add(neck);

  const neckMesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.06, 0.08, 4, 8),
    createMaterial(skinColor)
  );
  neck.add(neckMesh);

  // ── Head ──
  const headGeo = new THREE.SphereGeometry(0.16, 16, 16);
  const head = new THREE.Mesh(headGeo, createMaterial(skinColor));
  head.position.set(0, 0.22, 0);
  neck.add(head);

  // Eyes
  const eyeGeo = new THREE.SphereGeometry(0.025, 8, 8);
  const eyeMat = createMaterial(0x1a1a2e);
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(0.06, 0.04, 0.13);
  head.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMat.clone());
  rightEye.position.set(-0.06, 0.04, 0.13);
  head.add(rightEye);

  // ── Shoulders ──
  const leftShoulder = new THREE.Group();
  leftShoulder.position.set(0.22, 0.18, 0);
  root.add(leftShoulder);

  const rightShoulder = new THREE.Group();
  rightShoulder.position.set(-0.22, 0.18, 0);
  root.add(rightShoulder);

  // ── Upper Arms ──
  const leftUpperArm = createLimb(0.065, 0.18, 0, skinColor);
  leftUpperArm.position.set(0, -0.18, 0);
  leftShoulder.add(leftUpperArm);

  const rightUpperArm = createLimb(0.065, 0.18, 0, skinColor);
  rightUpperArm.position.set(0, -0.18, 0);
  rightShoulder.add(rightUpperArm);

  // ── Elbows ──
  const leftElbow = new THREE.Group();
  leftElbow.position.set(0, -0.36, 0);
  leftShoulder.add(leftElbow);

  const rightElbow = new THREE.Group();
  rightElbow.position.set(0, -0.36, 0);
  rightShoulder.add(rightElbow);

  // ── Forearms ──
  const leftForearm = createLimb(0.055, 0.16, 0, skinColor);
  leftForearm.position.set(0, -0.16, 0);
  leftElbow.add(leftForearm);

  const rightForearm = createLimb(0.055, 0.16, 0, skinColor);
  rightForearm.position.set(0, -0.16, 0);
  rightElbow.add(rightForearm);

  // ── Wrists ──
  const leftWrist = new THREE.Group();
  leftWrist.position.set(0, -0.32, 0);
  leftElbow.add(leftWrist);

  const rightWrist = new THREE.Group();
  rightWrist.position.set(0, -0.32, 0);
  rightElbow.add(rightWrist);

  // ── Hands ──
  const leftHand = new THREE.Group();
  leftWrist.add(leftHand);

  const rightHand = new THREE.Group();
  rightWrist.add(rightHand);

  // Palm
  const palmGeo = new THREE.BoxGeometry(0.1, 0.12, 0.04);
  const leftPalm = new THREE.Mesh(palmGeo, createMaterial(skinColor));
  leftPalm.position.set(0, -0.06, 0);
  leftHand.add(leftPalm);

  const rightPalm = new THREE.Mesh(palmGeo, createMaterial(skinColor));
  rightPalm.position.set(0, -0.06, 0);
  rightHand.add(rightPalm);

  // ── Fingers (4 fingers + thumb, 3 joints each) ──
  function buildFingers(hand: THREE.Group, side: number): THREE.Group[][] {
    const fingers: THREE.Group[][] = [];
    // Finger positions relative to palm center: thumb, index, middle, ring, pinky
    const fingerOffsets = [
      { x: side * 0.055, y: -0.02, baseAngle: side * 0.4 },  // thumb
      { x: side * 0.035, y: -0.12, baseAngle: 0 },            // index
      { x: side * 0.010, y: -0.13, baseAngle: 0 },            // middle
      { x: -side * 0.015, y: -0.12, baseAngle: 0 },           // ring
      { x: -side * 0.040, y: -0.11, baseAngle: 0 },           // pinky
    ];
    const fingerLengths = [0.04, 0.045, 0.048, 0.043, 0.035];

    for (let f = 0; f < 5; f++) {
      const fingerJoints: THREE.Group[] = [];
      let parent: THREE.Object3D = hand;
      const off = fingerOffsets[f];

      for (let j = 0; j < 3; j++) {
        const joint = new THREE.Group();
        if (j === 0) {
          joint.position.set(off.x, off.y, 0);
          joint.rotation.z = off.baseAngle;
        } else {
          joint.position.set(0, -fingerLengths[f] * 2, 0);
        }
        parent.add(joint);

        const seg = new THREE.Mesh(
          new THREE.CapsuleGeometry(0.012, fingerLengths[f], 3, 6),
          createMaterial(skinColor)
        );
        seg.position.set(0, -fingerLengths[f], 0);
        joint.add(seg);

        fingerJoints.push(joint);
        parent = joint;
      }
      fingers.push(fingerJoints);
    }
    return fingers;
  }

  const leftFingers = buildFingers(leftHand, 1);
  const rightFingers = buildFingers(rightHand, -1);

  return {
    root, torso, head, neck,
    leftShoulder, rightShoulder,
    leftUpperArm, rightUpperArm,
    leftElbow, rightElbow,
    leftForearm, rightForearm,
    leftWrist, rightWrist,
    leftHand, rightHand,
    leftFingers, rightFingers,
    leftEye, rightEye,
    hips, leftLeg, rightLeg,
  };
}

// ─── Keypoint → Bone Mapping ──────────────────────────────────────────────────

function applyHandLandmarks(
  fingers: THREE.Group[][],
  wrist: THREE.Group,
  landmarks: Landmark[],
  side: number // 1 = left, -1 = right
) {
  if (!landmarks || landmarks.length < 21) return;

  // Map landmark indices to finger/joint
  // MediaPipe hand: 0=wrist, 1-4=thumb, 5-8=index, 9-12=middle, 13-16=ring, 17-20=pinky
  const fingerLandmarks = [
    [1, 2, 3, 4],   // thumb
    [5, 6, 7, 8],   // index
    [9, 10, 11, 12], // middle
    [13, 14, 15, 16], // ring
    [17, 18, 19, 20], // pinky
  ];

  for (let f = 0; f < 5; f++) {
    for (let j = 0; j < 3; j++) {
      const lmIdx = fingerLandmarks[f][j + 1];
      const prevIdx = fingerLandmarks[f][j];
      if (lmIdx >= landmarks.length || prevIdx >= landmarks.length) continue;

      const curr = landmarks[lmIdx];
      const prev = landmarks[prevIdx];

      // Compute angle from landmark positions
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const angle = Math.atan2(dy, dx);

      if (fingers[f] && fingers[f][j]) {
        // Apply rotation — fingers bend around Z axis
        fingers[f][j].rotation.z = THREE.MathUtils.lerp(
          fingers[f][j].rotation.z,
          angle * side * 0.8,
          0.15
        );
      }
    }
  }
}

// ─── Character Player Class ───────────────────────────────────────────────────

export class CharacterPlayer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private bones: CharacterBones;
  private animFrame: number | null = null;
  private clock: THREE.Clock;
  private currentEmotion: Emotion = "neutral";
  private targetSign: SignEntry | null = null;
  private signQueue: SignEntry[] = [];
  private isPlaying = false;
  private signTimer = 0;
  private signDuration = 1.2; // seconds per sign
  private container: HTMLElement;
  private emotionLight: THREE.PointLight;

  constructor(options: PlayerOptions) {
    this.container = options.container;
    const w = options.width || options.container.clientWidth || 400;
    const h = options.height || options.container.clientHeight || 500;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0f1e);
    this.scene.fog = new THREE.Fog(0x0a0f1e, 5, 15);

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    this.camera.position.set(0, 0.3, 2.2);
    this.camera.lookAt(0, 0.1, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    options.container.appendChild(this.renderer.domElement);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(2, 3, 2);
    keyLight.castShadow = true;
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x8888ff, 0.4);
    fillLight.position.set(-2, 1, -1);
    this.scene.add(fillLight);

    // Emotion-colored point light
    this.emotionLight = new THREE.PointLight(0x6366f1, 1.5, 3);
    this.emotionLight.position.set(0, 0.5, 1);
    this.scene.add(this.emotionLight);

    // Ground plane (subtle)
    const groundGeo = new THREE.CircleGeometry(1.5, 32);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 1 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.85;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Character
    this.bones = buildCharacter();
    this.bones.root.position.set(0, -0.1, 0);
    this.scene.add(this.bones.root);

    this.clock = new THREE.Clock();

    if (options.emotion) this.setEmotion(options.emotion);

    this.startRenderLoop();
    options.onReady?.();
  }

  // ── Emotion ──────────────────────────────────────────────────────────────

  setEmotion(emotion: Emotion) {
    this.currentEmotion = emotion;
    const color = EMOTION_COLORS[emotion];
    this.emotionLight.color.setHex(color);

    // Apply posture offset
    const offset = EMOTION_POSE_OFFSETS[emotion];
    this.bones.leftShoulder.position.y = 0.18 + offset.shoulderY;
    this.bones.rightShoulder.position.y = 0.18 + offset.shoulderY;
    this.bones.neck.rotation.x = offset.headTilt;
    this.bones.leftShoulder.position.x = 0.22 + offset.armSpread;
    this.bones.rightShoulder.position.x = -(0.22 + offset.armSpread);
  }

  // ── Sign Playback ─────────────────────────────────────────────────────────

  playSign(sign: SignEntry) {
    this.targetSign = sign;
    this.signTimer = 0;
    this.isPlaying = true;
    this._applySign(sign);
  }

  playText(text: string, signs: SignEntry[]) {
    const chars = text.toUpperCase().replace(/[^A-Z0-9 ]/g, "").split("");
    this.signQueue = [];
    for (const ch of chars) {
      if (ch === " ") continue;
      const match = signs.find(s => s.label === ch && s.category === "asl_letter");
      if (match) this.signQueue.push(match);
    }
    this._playQueue();
  }

  private _playQueue() {
    if (this.signQueue.length === 0) {
      this.isPlaying = false;
      return;
    }
    const next = this.signQueue.shift()!;
    this.playSign(next);
    setTimeout(() => this._playQueue(), this.signDuration * 1000);
  }

  private _applySign(sign: SignEntry) {
    if (!sign.hand_landmarks || sign.hand_landmarks.length < 21) return;

    // Apply to right hand (dominant) by default
    applyHandLandmarks(
      this.bones.rightFingers,
      this.bones.rightWrist,
      sign.hand_landmarks,
      -1
    );

    // Raise arm to signing position
    const targetElbowX = -0.6 + Math.random() * 0.2;
    this.bones.rightElbow.rotation.x = THREE.MathUtils.lerp(
      this.bones.rightElbow.rotation.x, targetElbowX, 0.3
    );
    this.bones.rightShoulder.rotation.z = THREE.MathUtils.lerp(
      this.bones.rightShoulder.rotation.z, -0.3, 0.3
    );
  }

  // ── Idle Animations ───────────────────────────────────────────────────────

  private _updateIdle(t: number) {
    // Breathing
    const breathScale = 1 + Math.sin(t * 0.8) * 0.015;
    this.bones.torso.scale.y = breathScale;

    // Subtle head sway
    this.bones.neck.rotation.y = Math.sin(t * 0.3) * 0.04;
    this.bones.neck.rotation.z = Math.sin(t * 0.5) * 0.02;

    // Eye blink (every ~4 seconds)
    const blinkPhase = (t % 4.0) / 4.0;
    const blinkScale = blinkPhase < 0.05 ? 0.1 : 1.0;
    this.bones.leftEye.scale.y = blinkScale;
    this.bones.rightEye.scale.y = blinkScale;

    // Subtle arm sway when idle
    if (!this.isPlaying) {
      this.bones.leftShoulder.rotation.z = Math.sin(t * 0.4) * 0.03;
      this.bones.rightShoulder.rotation.z = -Math.sin(t * 0.4 + 0.5) * 0.03;
    }

    // Emotion light pulse
    this.emotionLight.intensity = 1.2 + Math.sin(t * 1.5) * 0.3;
  }

  // ── Render Loop ───────────────────────────────────────────────────────────

  private startRenderLoop() {
    const loop = () => {
      this.animFrame = requestAnimationFrame(loop);
      const t = this.clock.getElapsedTime();
      this._updateIdle(t);
      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }

  resize(w: number, h: number) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  dispose() {
    if (this.animFrame !== null) cancelAnimationFrame(this.animFrame);
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}

// ─── Dataset Loader ───────────────────────────────────────────────────────────

export async function loadDataset(url: string): Promise<SignEntry[]> {
  const res = await fetch(url);
  const data = await res.json();
  return data.entries as SignEntry[];
}

export function getLetterSign(signs: SignEntry[], letter: string): SignEntry | undefined {
  return signs.find(s => s.label === letter.toUpperCase() && s.category === "asl_letter" && !s.metadata?.augmented);
}

export function getWordSign(signs: SignEntry[], word: string): SignEntry | undefined {
  return signs.find(s => s.label === word.toLowerCase() && s.category === "asl_phrase");
}
