"""
Narration with Kokoro (ONNX build, CPU). One clip per phrase, joined with fixed pauses.

  python tools/audio/tts.py <slug>                      full narration from 03-voice/phrase-plan.json
  python tools/audio/tts.py --sample "text" --voice am_michael --out sample.wav   one-off voice sample

Outputs (full run):
  03-voice/audio/phrases/NNNN.wav   trimmed phrase clips (24 kHz) used by align.py and visemes.py
  03-voice/audio/narration.wav      48 kHz mono, 16-bit
  03-voice/tts-manifest.json        voice settings + each phrase's start/end on the narration timeline
"""
from __future__ import annotations

import argparse
import hashlib
import os
import sys
import time

import numpy as np

from common import MODELS, REPO, ffmpeg, read_json, video_dir, write_json, write_wav

MODEL_FILE = os.path.join(MODELS, "kokoro-v1.0.onnx")
VOICES_FILE = os.path.join(MODELS, "voices-v1.0.bin")
EDGE_MARGIN = 0.03  # seconds of silence kept at each end of a trimmed clip


def load_voice_config() -> dict:
    return read_json(os.path.join(REPO, "assets", "voice.json"))


def kokoro():
    if not (os.path.exists(MODEL_FILE) and os.path.exists(VOICES_FILE)):
        sys.exit("Kokoro model files missing. Run: npm run audio:setup")
    from kokoro_onnx import Kokoro

    return Kokoro(MODEL_FILE, VOICES_FILE)


def trim(samples: np.ndarray, sr: int, threshold: float = 0.004) -> np.ndarray:
    """Cut leading/trailing near-silence so pauses between phrases are exactly what we choose."""
    loud = np.flatnonzero(np.abs(samples) > threshold)
    if loud.size == 0:
        return samples
    m = int(EDGE_MARGIN * sr)
    return samples[max(0, loud[0] - m) : min(len(samples), loud[-1] + m + 1)]


def synth(k, text: str, cfg: dict) -> tuple[np.ndarray, int]:
    samples, sr = k.create(text, voice=cfg["voice"], speed=float(cfg["speed"]), lang=cfg.get("lang", "en-us"))
    return trim(np.asarray(samples, dtype=np.float32), sr), sr


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("slug", nargs="?")
    ap.add_argument("--sample")
    ap.add_argument("--voice")
    ap.add_argument("--speed", type=float)
    ap.add_argument("--out")
    a = ap.parse_args()

    cfg = load_voice_config()
    if a.voice:
        cfg["voice"] = a.voice
    if a.speed:
        cfg["speed"] = a.speed
    k = kokoro()

    if a.sample:
        s, sr = synth(k, a.sample, cfg)
        write_wav(a.out or "sample.wav", s, sr)
        print(f"Wrote {a.out or 'sample.wav'} ({len(s) / sr:.1f} s, voice {cfg['voice']})")
        return
    if not a.slug:
        sys.exit("Usage: tts.py <slug>  |  tts.py --sample TEXT --voice NAME --out FILE")

    vd = video_dir(a.slug)
    plan = read_json(os.path.join(vd, "03-voice", "phrase-plan.json"))
    audio_dir = os.path.join(vd, "03-voice", "audio")
    clip_dir = os.path.join(audio_dir, "phrases")
    os.makedirs(clip_dir, exist_ok=True)

    t0 = time.time()
    pieces: list[np.ndarray] = []
    phrases = []
    cursor = 0.0
    sr_all = None
    for p in plan:
        s, sr = synth(k, p["spoken"], cfg)
        sr_all = sr_all or sr
        write_wav(os.path.join(clip_dir, f"{p['i']:04d}.wav"), s, sr)
        dur = len(s) / sr
        phrases.append({"i": p["i"], "start": round(cursor, 4), "end": round(cursor + dur, 4), "clip": f"{p['i']:04d}.wav"})
        pieces.append(s)
        pause = np.zeros(int(round(p["pauseAfter"] * sr)), dtype=np.float32)
        pieces.append(pause)
        cursor += dur + len(pause) / sr
        print(f"  [{p['i'] + 1:>3}/{len(plan)}] {dur:5.2f}s  {p['spoken'][:60]}", flush=True)

    joined = np.concatenate(pieces)
    tmp = os.path.join(audio_dir, "narration-24k.wav")
    write_wav(tmp, joined, sr_all)
    out = os.path.join(audio_dir, "narration.wav")
    ffmpeg("-i", tmp, "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", out)
    os.remove(tmp)

    with open(os.path.join(vd, "02-script", "spoken.txt"), "rb") as f:
        spoken_hash = hashlib.sha256(f.read().replace(b"\r\n", b"\n")).hexdigest()
    write_json(
        os.path.join(vd, "03-voice", "tts-manifest.json"),
        {
            "engine": "kokoro-onnx",
            "model": os.path.basename(MODEL_FILE),
            "voice": cfg["voice"],
            "speed": cfg["speed"],
            "lang": cfg.get("lang", "en-us"),
            "clipSampleRate": sr_all,
            "spokenSha256": spoken_hash,
            "duration": round(cursor, 4),
            "phrases": phrases,
        },
    )
    print(f"Wrote {os.path.relpath(out, REPO)}: {cursor / 60:.1f} min of narration in {time.time() - t0:.0f} s")


if __name__ == "__main__":
    main()
