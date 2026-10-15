# Compliance: YouTube policy, rights, disclosures

Not legal advice. A practical checklist so the channel stays monetizable and honest. Re-check YouTube's
current policy pages before the first upload and whenever YouTube announces changes. Note the check in
`docs/DECISIONS.md`.

## 1. YouTube "inauthentic content" (the biggest risk for an automated channel)

YouTube's monetization policy excludes **mass-produced or repetitive content**: videos that look made from
a template with little variation, or that are easily replicable at scale. Enforcement looks at the
**channel as a whole**, so one pattern can affect every video.

How this pipeline protects the channel:
- Every video has its own **concept and screenplay** (Stage 4), not a reused template.
- **Variation rules** (`CREATIVE_BIBLE.md` §5): ≥3 new scene concepts per video, no scene type >2× per
  video, different openings between consecutive videos.
- **Original research:** every video is built on its own verified data, with sources listed.
- **Human direction:** the owner approves topic, script, direction, and quality at every gate.
- **Pace:** quality over volume. Don't upload faster than the process can genuinely direct each video.

Warning signs to avoid: same intro every video, same scene order, swapping only the topic, reading out
text we didn't write, AI "story farm" formats.

## 2. Reused content

- Real footage we use must be **transformed**: framed, annotated, explained, and part of our argument.
  Never long unaltered clips.
- Shorts cut from our own long-form videos are fine (it's our content).

## 3. AI disclosure

- YouTube asks creators to disclose **realistic** altered or synthetic content (content a viewer could
  mistake for real people, places, or events). Our visuals are clearly graphic and our host is a cartoon,
  so this usually won't apply. At upload, read YouTube's current question and answer it honestly.
- We **voluntarily** state in every description: "Narration uses a synthetic voice. All visuals are
  original motion graphics and licensed footage. Sources below."

## 4. Copyright and licenses

- Every external asset is logged in `credits.json` (see `SOURCES_AND_VERIFICATION.md`).
- **Music:** only YouTube Audio Library or properly licensed free tracks; copy required attribution text
  exactly. If a Content ID claim appears on licensed music, dispute it with the license link.
- **No NC/ND licenses**, no rips, no Google Images, no movie/TV clips.
- **Trademarks and logos:** company names in text are fine for factual discussion. Don't use company
  logos as decoration or in thumbnails; don't imply endorsement or partnership.
- **People:** don't use identifiable people's photos to imply they endorse or are involved in something.

## 5. Financial content

- Education, not advice. Never recommend buying/selling a specific security, crypto, or product.
- Add to every description: "For education only. Not financial advice."
- No guaranteed-returns language, no "get rich" framing, no affiliate links to financial products unless
  disclosed and the owner explicitly decides to add them later.
- Stick to sourced facts; don't attribute motives or wrongdoing to companies or people without a Tier-1
  source (e.g. a court ruling or regulator's order).

## 6. Accuracy and corrections

See `SOURCES_AND_VERIFICATION.md` § Corrections policy. Errors get a pinned correction and a description
note quickly.

## 7. Platform and tool terms

- **NVIDIA free API:** the free tier is described as meant for development and testing. Our usage is light
  and personal, but if NVIDIA restricts it, switch the LLM provider (the code uses an OpenAI-compatible
  client, so only the base URL, key, and model change).
- **Kokoro, faster-whisper, Rhubarb, Remotion, GSAP, Three.js, Satori:** check each license once and record
  it in `docs/DECISIONS.md` (Remotion is free for individuals; confirm current terms).
- **GitHub Actions:** renders run from our own public repo; keep artifacts small and download promptly.

## Upload checklist (copy into `08-package/upload-checklist.md`)

- [ ] verify (facts, script, lock) passes
- [ ] QA report has no open items
- [ ] Every asset in `credits.json` has a license; no NC/ND
- [ ] Description has: sources, credits, chapters, synthetic-voice note, "not financial advice"
- [ ] Captions file (SRT) uploaded
- [ ] AI/synthetic disclosure question answered honestly
- [ ] Thumbnail has no third-party logos and doesn't mislead
- [ ] Title delivers what the video delivers
