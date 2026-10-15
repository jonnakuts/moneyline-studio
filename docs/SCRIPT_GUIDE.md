# Script guide

How we write narration that holds attention, stays accurate, and sounds good in a synthetic voice.

Two outside skills inform this guide. Install them at **user level** (in `~/.claude/skills/`, not in this
repo; see `SETUP_WINDOWS.md`):
- **content-principles** (aiwithremy): attention psychology for short-form and hooks. It has no license
  file, so we **don't copy it into this public repo**; we only summarize ideas in our own words below.
- **youtube-agent-skill** (Jakeschincariol, MIT): `/yt-script` (hooks + retention beats), `/yt-package`,
  `/yt-seo`, `/yt-chapters`, `/yt-shorts`, `/yt-retention`, `/yt-viral`.

Treat everything below as **priors, not a template**. A script that breaks a rule and is genuinely
gripping beats one that ticks every box. If you can name the "format" you used, or the script would still
work with a different topic swapped in, start again from the viewer.

---

## The one viewer

Write for one person, as if sending them this video:

> Mid-20s to mid-30s, earns a salary, curious, not a finance professional. Uses Netflix, a credit card, a
> phone on EMI. Has wondered "how do they make money from this?" but never looked it up. Smart, busy,
> allergic to fluff and to being sold to.

Put specificity in the **object** ("a ₹649 Netflix plan", "45 days of float"), not in naming the viewer
("if you're a 25-year-old…").

## Long-form shape (8–15 minutes)

Long-form is judged as a whole once someone commits, but the **first 30 seconds** are judged line by line,
like a Short. Hook rules apply there in full.

A typical shape (not a template):

1. **Cold open (0:00–0:30).** Open the first curiosity loop with a concrete, surprising fact or question.
   Deliver a first real piece of value by ~0:15. No "hey guys", no "in this video we'll…".
2. **The promise (~0:30).** What the viewer will understand by the end, sized so the time feels worth it.
3. **The chain.** Each section pays one loop and opens the next. Never let a loop close without a new one
   already open.
4. **Re-hook at ~60–70%.** After the main promise is mostly paid, open a fresh, bigger question
   ("but here's the part almost nobody talks about…"), and make sure it's real, then pay it.
5. **Payoff + callback.** Return to the cold open's image or number, now understood differently.
6. **Outro (≤15 s).** One line on what's next. No begging for likes.

Mark retention beats with `[BEAT: …]` comments so Stage 4 knows where the big visual moments belong.

## Line-level rules

- **Does line 1 sell line 2?** Read the script line by line and cut any line that doesn't make the next one
  necessary.
- **Open before you explain.** Create the question before giving the answer.
- **Specific beats vague.** Replace "a lot of money" with the number; "recently" with the date; "experts"
  with a named source. (All from `facts.json`.)
- **The 10-year-old test** for every important sentence: simplify the sentence, never the idea. Define a
  technical term in the same breath you use it.
- **Short sentences.** Aim for an average under ~12 words; vary rhythm. One idea per sentence.
- **Cut fluff:** anything interesting but not serving the promise, any "why I made this video", any
  throat-clearing.
- **Preempt the objection** the viewer is forming ("isn't this just ads?"), in one line, where it arises.
- **Never deflate a loop** (setting up something real, then revealing it was a joke). It breaks trust.
- **Numbers on a diet:** at most one new number per sentence; give every number a comparison the viewer
  can feel ("that's more than the GDP of…", only if sourced).

## Accuracy in the script

- Every number/date/claim carries `[F:id]` (see `SOURCES_AND_VERIFICATION.md`).
- Say estimates as estimates, attribute Tier-3 figures aloud, keep "about/nearly/over" honest.
- No investment advice, no "you should buy…". Explaining a business model is fine; recommending a stock
  is not.
- No defamation: describe what a company does and what filings/reports say, not motives we can't source.

### Script markup the verifier understands

| Markup | Meaning |
|---|---|
| `[F:id]` or `[F:id1,id2]` | Fact tags for this sentence (not spoken) |
| `[BEAT: …]` | Retention/visual beat (not spoken) |
| `[HOST]` | Host speaks this line on camera (not spoken) |
| `[[S&P 500]]` | Literal name containing digits; exempt from the number check, spoken as written |
| `<!-- … -->` | Notes (not spoken) |
| `# Heading` | Section name (not spoken; becomes the phrase's `section`) |

Any digit-based number in narration (`3`, `2025`, `$4.2 billion`, `16%`) must be in a sentence with a
matching fact tag. **Spell out small structural numbers** ("three reasons", "two things") so they aren't
treated as claims. Hedge words are checked honestly: "nearly/almost" means the real value is a bit
**lower**; "over/more than" means it's **higher**; "about/roughly/around" allows about ±5%.

## Writing for the voice (Kokoro)

- `spoken.txt` = `script.md` minus tags and markers, with numbers written the way they should be spoken
  when TTS might misread them: "$4.2B" → "four point two billion dollars"; "FY2025" → "twenty twenty-five";
  "₹649" → "six hundred forty-nine rupees".
- Avoid parentheses, slashes, and symbols in `spoken.txt`. Use commas and full stops to shape pauses.
- Pacing: ≈150 words per minute. 10 minutes ≈ 1,500 words.
- Read the hook aloud (or render it) before Gate B; if it sounds flat in the voice, rewrite the words.

## Shorts (≤60 s)

Shorts are judged line by line from the first word. Content-principles thinking applies in full:
- The value/time ratio is set in the first ~3 seconds; deliver real value by ~5–10 seconds.
- One centre of gravity: a single idea, a single payoff.
- Shorts reuse long-form segments where they stand alone; if a new first line is needed, it is written,
  verified, voiced, and aligned separately (never edit the frozen narration).

## Title and thumbnail come first

At Stage 0, draft the title + thumbnail pairing. The script must deliver exactly what that pairing
promises, early. Title and thumbnail text should complement each other, never repeat each other.

## Self-review before Gate B

- [ ] Hook delivers a concrete surprise or value by ~15 s
- [ ] At least one loop is always open until the payoff
- [ ] Re-hook present around 60–70%
- [ ] Every number tagged and verified (verify-report PASS)
- [ ] No sentence that is interesting but irrelevant
- [ ] No advice, no unsourced motives, estimates labelled
- [ ] Length fits the target (words ÷ 150 = minutes)
- [ ] Ending calls back to the opening
