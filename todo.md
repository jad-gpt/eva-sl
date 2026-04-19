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
