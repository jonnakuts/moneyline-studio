"""Shared helpers for the audio tools (Python 3.11, CPU only). Paths always use os.path.join."""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import wave

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
MODELS = os.path.join(HERE, "models")


def video_dir(slug: str) -> str:
    root = os.environ.get("VIDEOS_DIR") or os.path.join(REPO, "videos")
    d = os.path.join(root, slug)
    if not os.path.isdir(d):
        sys.exit(f"No video folder: {d}")
    return d


def read_json(path: str):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def write_json(path: str, data) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")


def load_env() -> None:
    """Minimal .env reader (last occurrence wins, existing env vars are kept), like Node's loader."""
    path = os.path.join(REPO, ".env")
    if not os.path.exists(path):
        return
    vals = {}
    with open(path, encoding="utf-8") as f:
        for line in f:
            m = re.match(r"^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$", line)
            if m and not line.lstrip().startswith("#"):
                v = m.group(2)
                if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
                    v = v[1:-1]
                vals[m.group(1)] = v
    for k, v in vals.items():
        os.environ.setdefault(k, v)


def write_wav(path: str, samples: np.ndarray, sr: int) -> None:
    """Write mono float samples (-1..1) as 16-bit PCM WAV."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    pcm = np.clip(samples, -1.0, 1.0)
    pcm = (pcm * 32767.0).round().astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(pcm.tobytes())


def read_wav(path: str) -> tuple[np.ndarray, int]:
    with wave.open(path, "rb") as w:
        sr = w.getframerate()
        n = w.getnframes()
        data = np.frombuffer(w.readframes(n), dtype="<i2").astype(np.float32) / 32767.0
    return data, sr


def ffmpeg(*args: str) -> None:
    cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *args]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f"ffmpeg failed: {r.stderr.strip()}")
