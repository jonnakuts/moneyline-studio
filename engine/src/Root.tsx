import React from "react";
import { Composition } from "remotion";
import { SyncTest, type SyncTestProps } from "./compositions/SyncTest.js";

const FPS = 30;

export const Root: React.FC = () => (
  <>
    <Composition
      id="SyncTest"
      component={SyncTest}
      fps={FPS}
      width={1280}
      height={720}
      durationInFrames={FPS}
      defaultProps={{ title: "", duration: 1, audio: "audio/narration.wav", phrases: [], words: [] } as SyncTestProps}
      calculateMetadata={({ props }) => ({ durationInFrames: Math.max(1, Math.ceil(props.duration * FPS)) })}
    />
  </>
);
