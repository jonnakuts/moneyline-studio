/**
 * Gate C sync test: plain background, the current phrase, the active word in green, debug line.
 * No design and no effects on purpose (see .claude/skills/voice-and-timing).
 */
import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { color } from "../theme/tokens.js";
import { mmss, phraseAt, wordAt, type PhraseT, type WordT } from "../timing/narration.js";

export interface SyncTestProps {
  [key: string]: unknown;
  title: string;
  duration: number;
  audio: string;
  phrases: PhraseT[];
  words: WordT[];
}

export const SyncTest: React.FC<SyncTestProps> = ({ title, phrases, words, audio }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const phrase = phraseAt(phrases, t);
  const word = wordAt(words, t);
  const spoken = (i: number) => words[i]!.end <= t;

  return (
    <AbsoluteFill style={{ backgroundColor: color.ledger, fontFamily: "Arial, Helvetica, sans-serif" }}>
      <Audio src={staticFile(audio)} />
      <div style={{ position: "absolute", top: 28, left: 40, color: color.muted, fontSize: 22 }}>
        {title} · sync test · section: {phrase?.section ?? "-"}
      </div>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 110px" }}>
        <div style={{ fontSize: 46, lineHeight: 1.35, textAlign: "center", color: color.ink }}>
          {phrase?.words.map((wi) => {
            const active = word?.i === wi;
            return (
              <span
                key={wi}
                style={{
                  color: active ? color.money : spoken(wi) ? color.ink : color.muted,
                  fontWeight: active ? 700 : 400,
                }}
              >
                {words[wi]!.word}{" "}
              </span>
            );
          })}
        </div>
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          bottom: 26,
          left: 40,
          right: 40,
          color: color.muted,
          fontSize: 22,
          fontFamily: "Courier New, monospace",
          whiteSpace: "pre",
        }}
      >
        {`${mmss(t)}   phrase ${phrase ? phrase.i + 1 : "-"}/${phrases.length}   word: ${word ? word.word : "·"}   ${
          word ? `${word.start.toFixed(3)} → ${word.end.toFixed(3)}  conf ${word.conf.toFixed(2)}` : ""
        }`}
      </div>
    </AbsoluteFill>
  );
};
