# Phase 0: Windows setup

For the owner's laptop (Windows, Intel i3-1215U, 8 GB RAM, Intel UHD graphics). Takes about an hour,
mostly downloads. Use **PowerShell** (the prompt starts with `PS C:\`).

> Run each block, then check the "expect" line before moving on. If something fails, copy the error into
> Claude Code and ask for help.

## 1. Install the toolchain

```powershell
winget install --id Git.Git -e
winget install --id OpenJS.NodeJS.LTS -e
winget install --id Python.Python.3.11 -e
winget install --id Gyan.FFmpeg -e
winget install --id Microsoft.VisualStudioCode -e
```

Close PowerShell and open a new window (so PATH updates), then:

```powershell
git --version; node --version; python --version; ffmpeg -version | Select-Object -First 1
```

Expect: Git 2.x, Node **v22 or newer**, Python 3.11.x, an ffmpeg version line.

Optional but recommended: enable long file paths (needs an Administrator PowerShell):

```powershell
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```

## 2. Install the AI coding agent

**Claude Code** (official installer):

```powershell
irm https://claude.ai/install.ps1 | iex
```

Open a new window and run `claude --version`. Then run `claude` in any folder and log in in the browser.

> **Cost note:** Claude Code needs a paid Claude plan (Pro or higher); the free claude.ai plan doesn't
> include it. If you want the build to stay at ₹0, use **GitHub Copilot** (free with the student pack) in
> VS Code agent mode instead: this repo's `AGENTS.md` and `.github/copilot-instructions.md` point Copilot
> at the same rules, and the skill files are plain Markdown it can read.

## 3. Install the extra tools

**Rhubarb Lip Sync** (host lip-sync): download the Windows zip from the
[rhubarb-lip-sync releases page](https://github.com/DanielSWolf/rhubarb-lip-sync/releases), unzip it to
`C:\tools\rhubarb\`, and later set `RHUBARB_PATH=C:\tools\rhubarb\rhubarb.exe` in `.env`.

**eSpeak NG**: not needed. The Kokoro ONNX build we use (`kokoro-onnx`) bundles its own copy.

**Audio tools (Phase 2)**: one command creates a Python 3.11 environment in `tools\audio\.venv`, installs
Kokoro (voice) and faster-whisper (word timing), and downloads the voice model (about 350 MB, once):

```powershell
npm run audio:setup
```

The speech-recognition model (`small.en`, about 500 MB) downloads itself the first time `npm run align` runs.

## 4. Create accounts and free keys

| What | Where | Goes in `.env` as |
|---|---|---|
| GitHub account + **public** repo | github.com | (none) |
| NVIDIA API key | build.nvidia.com → Settings → API Keys | `NVIDIA_API_KEY` |
| FRED API key | fred.stlouisfed.org (My Account → API Keys) | `FRED_API_KEY` |
| SEC contact string | No account; just your name and email | `SEC_USER_AGENT` |
| Pexels API key (optional: new keys paused since Oct 2026; leave blank) | pexels.com/api | `PEXELS_API_KEY` |
| Pixabay API key | pixabay.com/api/docs | `PIXABAY_API_KEY` |

None of these need a payment card. If any site asks for one, stop and don't enter it.

## 5. Get the project

```powershell
cd $HOME\Documents
git clone https://github.com/<your-username>/moneyline-studio.git
cd moneyline-studio
Copy-Item .env.example .env
code .env
```

Fill in your keys in `.env` and save. **Never commit `.env`** (it's already git-ignored).

Install the project's Node packages (one time, a few minutes):

```powershell
npm install
npm test
```

Expect: `Tests  26 passed` (or more, as tests are added).

## 6. Install the two outside skills (user level, not in the repo)

These go in your personal Claude skills folder so they don't get published in this public repo.

```powershell
$skills = "$HOME\.claude\skills"
New-Item -ItemType Directory -Force -Path $skills | Out-Null
$tmp = "$env:TEMP\skills-src"
New-Item -ItemType Directory -Force -Path $tmp | Out-Null

git clone https://github.com/Jakeschincariol/youtube-agent-skill.git "$tmp\youtube-agent-skill"
Copy-Item -Recurse -Force "$tmp\youtube-agent-skill\skills\yt-*" $skills

git clone https://github.com/aiwithremy/content-principles.git "$tmp\content-principles"
Copy-Item -Recurse -Force "$tmp\content-principles\content-principles" $skills
```

Then fill in `~/.claude/youtube/voice.md` (the youtube skill reads it); see that repo's
`templates/voice.md`. Describe the channel's narrator voice: calm, precise, curious, no hype.

## 7. Check everything

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\doctor.ps1
```

Expect every line to say `OK`. Anything `MISSING` tells you what to install.

Then check the keys actually work:

```powershell
npm run llm:ping
npm run research -- sec ticker NFLX
npm run research -- fred CPIAUCSL --from 2025-01-01
```

Expect: a short reply from the model, `NFLX: CIK 1065280 — NETFLIX INC`, and a list of CPI values.

## 8. First Claude Code session

```powershell
claude
```

Then say: *"Read CLAUDE.md and docs/ROADMAP.md, then start Phase 1."*

## Laptop tips

- Keep ~20 GB free disk (models, renders, node_modules).
- Plug in the charger during renders; set Windows power mode to "Best performance".
- Close Chrome tabs and Remotion Studio before final renders (8 GB RAM is tight).
- Optional: add the project folder to Windows Defender exclusions to speed up `npm install` (your choice;
  only do this for folders you trust).
