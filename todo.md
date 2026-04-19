# EVA-SL Project TODO

## Phase 1: Foundation
- [x] Design system tokens (dark theme, color palette, typography)
- [x] Generate ASL hand sign images A–Z (26 images — A–M AI-generated, N–Z SVG)
- [x] Upload ASL images to static assets
- [x] Database schema: users, translations, aslSigns, arabicSpeechSamples

## Phase 2: Backend
- [x] DB schema push (translations, asl_signs, arabic_samples tables)
- [x] tRPC router: speech transcription via Whisper API
- [x] tRPC router: emotion detection via LLM (7 emotions)
- [x] tRPC router: save/retrieve translation history per user
- [x] tRPC router: ASL dataset CRUD (getAllSigns, getSign)
- [x] tRPC router: Arabic speech dataset builder (record, label, store)
- [x] tRPC router: research stats (totals, emotion distribution, dataset size)
- [x] tRPC router: audio upload to S3 storage

## Phase 3: Core Frontend
- [x] Global dark theme CSS variables and typography (OKLCH color system)
- [x] Landing page (hero, features overview, pipeline diagram, CTA)
- [x] Top navigation with auth state (Navbar.tsx)
- [x] Translation page: microphone recording + file upload
- [x] Translation page: Whisper transcription display
- [x] Translation page: emotion detection result with label + confidence
- [x] Emotion-adaptive background (7 color/animation themes)
- [x] ASL character-by-character rendering from text
- [x] Translation history page per user (History.tsx)

## Phase 4: Dataset & Research Pages
- [x] ASL dataset gallery page (A–Z hand signs with metadata) — ASLGallery.tsx
- [x] Arabic emotional speech dataset builder page — DatasetBuilder.tsx
- [x] Audio recording UI with emotion labeling
- [x] Dataset storage and retrieval
- [x] Research dashboard: total translations counter
- [x] Research dashboard: emotion distribution pie/bar chart
- [x] Research dashboard: dataset size metrics
- [x] Research dashboard: accuracy metrics display

## Phase 5: Research Paper & Polish
- [x] ISEF research paper page (full methodology, novelty, results) — Research.tsx
- [x] Comparison table (EVA-SL vs existing systems)
- [x] Smooth page transitions and micro-animations
- [x] Mobile-responsive layout
- [x] Vitest tests for core backend procedures (13 tests, all passing)
- [x] 404 page updated to EVA-SL dark theme
- [x] Final checkpoint and delivery

## User Requested Changes
- [x] Replace audio recording/upload input on Translate page with plain text input
- [x] Add new tRPC procedure to process text directly (skip Whisper transcription)

## Objective Execution (4-Part Build)

### Objective 1: ASL + Fingerspelling Dataset (JSON Keypoints)
- [x] Generate ASL keypoint JSON for all 26 letters (A–Z) in MediaPipe Holistic format
- [x] Generate keypoint JSON for numbers 0–9
- [x] Generate keypoint JSON for 100 high-frequency ASL phrases/words
- [x] Each entry: hand landmarks (21), body pose landmarks (33), label, handedness, confidence

### Objective 2: 3D Character + player.js
- [x] Create rigged humanoid GLB character compatible with Three.js
- [x] Build player.js module: accepts string → plays sign animation sequence
- [x] Smooth interpolated transitions between signs
- [x] Integrate character viewer into Translate page

### Objective 3: ArSL + Emotional Blending
- [x] Add ArSL fingerspelling for 28 Arabic letters in same keypoint format
- [x] Define 7 emotional body postures (happy/sad/angry/neutral/fearful/surprised/disgusted)
- [x] Blend emotional posture as base layer while character signs

### Objective 4: Dataset Augmentation + ISEF Metrics
- [x] 5 augmented variations per keypoint entry (rotation, scale, noise)
- [x] Confidence scores per landmark (0.0–1.0)
- [x] Secondary motion: finger curl, breathing, eye blink, head movement
- [x] ISEF metrics table: per-sign accuracy, DTW transition score, comprehension

### Objective 5: PWA Conversion
- [x] Add service worker (Workbox) for offline support
- [x] Add Web App Manifest (manifest.json)
- [x] iOS + Android installable (Add to Home Screen / Chrome install prompt)
- [x] Cache ASL dataset and character model locally
- [x] App icon 1024×1024, splash screen
