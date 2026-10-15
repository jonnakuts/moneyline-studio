import { z } from "zod";

/** Stages that freeze files at their gate, in pipeline order. */
export const STAGE_ORDER = ["B-script", "C-voice", "D-direction", "F-render", "G-package"] as const;
export const StageId = z.enum(STAGE_ORDER);
export type StageId = z.infer<typeof StageId>;

export const LockStage = z.object({
  approvedAt: z.string().min(10),
  files: z.record(z.string(), z.string().regex(/^sha256:[0-9a-f]{64}$/)),
});

export const LockFile = z.object({
  stages: z.partialRecord(StageId, LockStage),
});
export type LockFile = z.infer<typeof LockFile>;
