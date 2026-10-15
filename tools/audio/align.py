"""
Word timing for the narration. Our words (spoken.txt) are always kept; the audio only gives timing.

  python tools/audio/align.py <slug> [--model small.en|base.en]

For each phrase clip, faster-whisper (CPU, int8) transcribes with word timestamps. Its words are matched
to our known words by sequence alignment; words it heard differently (often numbers: "92.3%" vs
"ninety-two point three percent") get times spread across the matching gap by character length.

Outputs: 03-voice/word-timestamps.json, 03-voice/phrases.json, 03-voice/timing-report.md
"""
from __future__ import annotations

import argparse
import difflib
import os
import re
import time

from common import read_json, video_dir, write_json

INTERPOLATED_CONF = 0.0
NUMBER_WORDS = set("""zero oh one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen
sixteen seventeen eighteen nineteen twenty thirty forty fifty sixty seventy eighty ninety hundred thousand million
billion trillion point and a percent dollar dollars cent cents""".split())


def norm(w: str) -> str:
    return re.sub(r"[^a-z0-9']", "", w.lower().replace("’", "'"))


def spread(words: list[str], start: float, end: float) -> list[tuple[float, float]]:
    """Give each word a slice of [start, end] proportional to its length."""
    if end < start:
        end = start
    lens = [max(1, len(w)) for w in words]
    total = sum(lens)
    out, t = [], start
    for n in lens:
        d = (end - start) * n / total
        out.append((t, t + d))
        t += d
    return out


def align_phrase(ours: list[str], heard: list[dict], clip_dur: float) -> list[dict]:
    """Return one {start, end, conf, matched} per word in `ours` (times relative to the clip)."""
    a = [norm(w) for w in ours]
    b = [norm(h["word"]) for h in heard]
    result: list[dict | None] = [None] * len(ours)
    sm = difflib.SequenceMatcher(a=a, b=b, autojunk=False)
    for blk in sm.get_matching_blocks():
        for k in range(blk.size):
            h = heard[blk.b + k]
            result[blk.a + k] = {"start": h["start"], "end": h["end"], "conf": h["prob"], "matched": True}

    # Fill gaps between anchors.
    i = 0
    while i < len(ours):
        if result[i] is not None:
            i += 1
            continue
        j = i
        while j < len(ours) and result[j] is None:
            j += 1
        prev_end = result[i - 1]["end"] if i > 0 else 0.0
        next_start = result[j]["start"] if j < len(ours) else clip_dur
        # Whisper words that fall in this gap tell us where the sound actually is.
        inside = [h for h in heard if h["start"] >= prev_end - 0.01 and h["end"] <= next_start + 0.01]
        g0 = min((h["start"] for h in inside), default=prev_end)
        g1 = max((h["end"] for h in inside), default=next_start)
        if not inside:
            g0, g1 = prev_end, next_start
        for k, (s, e) in zip(range(i, j), spread(ours[i:j], g0, g1)):
            result[k] = {"start": s, "end": e, "conf": INTERPOLATED_CONF, "matched": False}
        i = j
    # Keep times monotonic and inside the clip.
    last = 0.0
    for r in result:
        r["start"] = min(max(r["start"], last), clip_dur)
        r["end"] = min(max(r["end"], r["start"]), clip_dur)
        last = r["start"]
    return result  # type: ignore[return-value]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--model", default="small.en")
    ap.add_argument("--reuse", action="store_true", help="reuse 03-voice/recognized.json instead of re-running the recognizer")
    a = ap.parse_args()

    vd = video_dir(a.slug)
    voice = os.path.join(vd, "03-voice")
    plan = read_json(os.path.join(voice, "phrase-plan.json"))
    manifest = read_json(os.path.join(voice, "tts-manifest.json"))
    by_i = {p["i"]: p for p in manifest["phrases"]}

    t0 = time.time()
    rec_path = os.path.join(voice, "recognized.json")
    recognized = read_json(rec_path) if a.reuse and os.path.exists(rec_path) else {}
    model = None
    if not recognized:
        from faster_whisper import WhisperModel

        model = WhisperModel(a.model, device="cpu", compute_type="int8", cpu_threads=2)
    words_out, phrases_out, report_rows = [], [], []
    for p in plan:
        m = by_i[p["i"]]
        clip = os.path.join(voice, "audio", "phrases", m["clip"])
        dur = m["end"] - m["start"]
        if model is not None:
            segs, _ = model.transcribe(
                clip, language="en", word_timestamps=True, beam_size=5, vad_filter=False,
                condition_on_previous_text=False,
            )  # no initial_prompt: we want what was actually heard, so mispronunciations show up
            recognized[str(p["i"])] = [
                {"word": w.word.strip(), "start": float(w.start), "end": float(w.end), "prob": float(w.probability)}
                for s in segs for w in (s.words or [])
            ]
        heard = recognized[str(p["i"])]
        ours = p["spoken"].split()
        aligned = align_phrase(ours, heard, dur)
        ids = []
        for w, r in zip(ours, aligned):
            idx = len(words_out)
            ids.append(idx)
            words_out.append({
                "i": idx,
                "word": w,
                "start": round(m["start"] + r["start"], 3),
                "end": round(m["start"] + r["end"], 3),
                "conf": round(max(0.0, min(1.0, r["conf"])), 3),
                "phrase": p["i"],
            })
        phrases_out.append({
            "i": p["i"], "text": p["spoken"], "start": round(m["start"], 3), "end": round(m["end"], 3),
            "words": ids, "factIds": p["factIds"], "section": p["section"],
        })
        interp = [w for w, r in zip(ours, aligned) if not r["matched"]]
        low = [w for w, r in zip(ours, aligned) if r["matched"] and r["conf"] < 0.4]
        heard_text = " ".join(h["word"] for h in heard)
        report_rows.append((p, m, interp, low, heard_text))
        print(f"  [{p['i'] + 1:>3}/{len(plan)}] {len(interp):>2} interpolated  {p['spoken'][:56]}", flush=True)

    if model is not None:
        write_json(rec_path, {"model": a.model, **recognized})
    write_json(os.path.join(voice, "word-timestamps.json"), words_out)
    write_json(os.path.join(voice, "phrases.json"), phrases_out)

    # Report: phrases worth a listen.
    def mmss(t: float) -> str:
        return f"{int(t // 60):02d}:{t % 60:06.3f}"

    # Interpolated words that are just numbers we spell out (the recognizer writes digits) are expected;
    # anything else interpolated, or matched with low confidence, is worth a listen.
    def unexpected(interp: list[str]) -> list[str]:
        return [w for w in interp if norm(w).strip("'") and not all(
            norm(part) in NUMBER_WORDS for part in re.split(r"[-\s]", w) if norm(part))]

    flagged = [r for r in report_rows if unexpected(r[2]) or r[3]]
    total_interp = sum(len(r[2]) for r in report_rows)
    lines = [
        "# Timing report",
        "",
        f"Model: faster-whisper `{recognized.get('model', a.model)}` (int8, CPU). Voice: Kokoro `{manifest['voice']}` at speed {manifest['speed']}.",
        f"Narration length: {mmss(manifest['duration'])}. Words: {len(words_out)}, of which {total_interp} got interpolated timing.",
        "",
        "Interpolated words are usually numbers: we say them in words, the recognizer writes digits. Their",
        "timing is spread across the matching stretch of audio, so they're close but worth a look.",
        "",
        "## Listen to these spots",
        "",
        "Check pronunciation (numbers especially) and whether highlighting runs early or late.",
        "",
        "| # | Time | Our words | Recognizer heard | Heard differently | Low confidence |",
        "|---|---|---|---|---|---|",
    ]
    for p, m, interp, low, heard_text in flagged:
        lines.append(
            f"| {p['i']} | {mmss(m['start'])} | {p['spoken']} | {heard_text} | {', '.join(unexpected(interp)) or '-'} | {', '.join(low) or '-'} |"
        )
    if not flagged:
        lines.append("| - | - | nothing flagged | | | |")
    with open(os.path.join(voice, "timing-report.md"), "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(lines) + "\n")
    print(f"Aligned {len(words_out)} words in {time.time() - t0:.0f} s; {len(flagged)} phrases flagged in timing-report.md")


if __name__ == "__main__":
    main()
