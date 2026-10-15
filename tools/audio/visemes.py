"""
Host mouth shapes with Rhubarb Lip Sync, only for phrases marked [HOST] in script.md.

  python tools/audio/visemes.py <slug>

Runs Rhubarb on each host phrase clip, passing our known words as dialog (better accuracy), shifts the
cues onto the narration timeline, and writes 03-voice/visemes.json ({"mouthCues": [...]}). Outside host
phrases the mouth is closed ("X"). Needs RHUBARB_PATH in .env.
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import tempfile

from common import load_env, read_json, video_dir, write_json


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    a = ap.parse_args()
    load_env()
    rhubarb = os.environ.get("RHUBARB_PATH", "")
    if not rhubarb or not os.path.exists(rhubarb):
        sys.exit("RHUBARB_PATH is not set or the file doesn't exist. Set it in .env to rhubarb(.exe).")

    vd = video_dir(a.slug)
    voice = os.path.join(vd, "03-voice")
    plan = read_json(os.path.join(voice, "phrase-plan.json"))
    manifest = {p["i"]: p for p in read_json(os.path.join(voice, "tts-manifest.json"))["phrases"]}
    total = read_json(os.path.join(voice, "tts-manifest.json"))["duration"]

    cues: list[dict] = []
    host = [p for p in plan if p["host"]]
    for p in host:
        m = manifest[p["i"]]
        clip = os.path.join(voice, "audio", "phrases", m["clip"])
        with tempfile.TemporaryDirectory() as td:
            dialog = os.path.join(td, "dialog.txt")
            with open(dialog, "w", encoding="utf-8") as f:
                f.write(p["spoken"])
            r = subprocess.run(
                [rhubarb, "-f", "json", "--extendedShapes", "GHX", "-d", dialog, "-q", clip],
                capture_output=True, text=True,
            )
        if r.returncode != 0:
            sys.exit(f"Rhubarb failed on phrase {p['i']}: {r.stderr.strip()}")
        for c in json.loads(r.stdout)["mouthCues"]:
            cues.append({
                "start": round(m["start"] + c["start"], 3),
                "end": round(min(m["end"], m["start"] + c["end"]), 3),
                "value": c["value"],
            })
        print(f"  host phrase {p['i']}: {p['spoken']}")

    # Closed mouth everywhere else, so the timeline is fully covered.
    full: list[dict] = []
    t = 0.0
    for c in sorted(cues, key=lambda c: c["start"]):
        if c["start"] > t + 1e-3:
            full.append({"start": round(t, 3), "end": c["start"], "value": "X"})
        full.append(c)
        t = c["end"]
    if t < total:
        full.append({"start": round(t, 3), "end": round(total, 3), "value": "X"})
    write_json(os.path.join(voice, "visemes.json"), {"mouthCues": full})
    print(f"Wrote visemes.json: {len(host)} host phrases, {len(full)} cues")


if __name__ == "__main__":
    main()
