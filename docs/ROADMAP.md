# Roadmap

Check items off as they're done, and update `CLAUDE.md` § Current status at the end of each phase.

## Phase 0: Machine setup
- [ ] Toolchain installed (`docs/SETUP_WINDOWS.md` steps 1–3)
- [ ] Accounts and keys in `.env` (step 4–5)
- [ ] Outside skills installed at user level (step 6)
- [ ] `scripts/doctor.ps1` all OK
- [ ] Public GitHub repo created; first commit of these docs

## Phase 1: Brain (research + script)
- [ ] `tools/research/`: SEC EDGAR (companyfacts, submissions), FRED, World Bank fetchers with caching
      and polite rate limits
- [ ] `engine/src/schemas/`: zod schemas for facts, script tags, timestamps, screenplay, credits
- [ ] `tools/verify/`: verify-facts, verify-script, freeze, verify-lock (+ `npm run verify`, `npm run freeze`)
- [ ] NVIDIA LLM client (OpenAI-compatible, model from `.env`), used only for drafting help
- [ ] `/new-video` → Gate A → `/research-facts` → `/write-script` → Gate B working end to end on a test topic

## Phase 2: Voice and timing
- [ ] Kokoro (CPU) TTS per phrase, voice chosen and saved in `assets/voice.json` (owner picks from 3 samples)
- [ ] faster-whisper alignment to known words + confidence report
- [ ] Sync-test composition and render
- [ ] Rhubarb visemes

## Phase 3: Engine v1 + first hero proof
- [ ] Font test sheet approved
- [ ] Host character concepts → owner picks one → rig + model sheet
- [ ] Theme, timing, camera, Money Line system, CountUp/Odometer, BarGrow/LineDraw, SourceCaption,
      StampImpact, ReceiptPrint, grain/paper textures, HostOverlay
- [ ] First video through Gate D, then hero proof → Gate E

## Phase 4: Full render + output
- [ ] Section rendering, contact sheets, QA report
- [ ] FFmpeg concat + audio mix + loudness normalization
- [ ] GitHub Actions render workflow (manual trigger)
- [ ] Shorts composition (9:16, burned captions, safe zones)
- [ ] Satori thumbnail renderer (3 variants)
- [ ] Description/chapters/tags/pinned comment generator; SRT export
- [ ] First video through Gate G and uploaded

## Phase 5: Improve with each video
- [ ] After each upload, note what worked/failed in `docs/DECISIONS.md` (retention dips once data exists:
      `/yt-retention` on the exported CSV)
- [ ] Grow the primitive library; log scenes in `engine/SCENES_USED.md`
- [ ] Reduce hands-on time per video while keeping every gate

## Later (optional)
- [ ] Idea queue + approval dashboard on Cloudflare Pages (or Vercel) with Supabase for data only
      (no video storage); triggers the GitHub Actions render
- [ ] VibeVoice-Realtime via Google Colab as an optional "premium voice" A/B test
