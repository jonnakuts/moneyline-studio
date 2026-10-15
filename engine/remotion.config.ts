/**
 * Remotion settings for the whole engine (passed with --config engine/remotion.config.ts by our npm scripts).
 * Imports use NodeNext-style ".js" extensions (shared with tools/), so webpack maps ".js" to ".ts"/".tsx".
 */
import { Config } from "@remotion/cli/config";

Config.setConcurrency(2); // laptop: i3, 8 GB (CLAUDE.md rule 7)
Config.setVideoImageFormat("jpeg");
Config.setPixelFormat("yuv420p");
Config.overrideWebpackConfig((config) => ({
  ...config,
  resolve: {
    ...config.resolve,
    extensionAlias: { ".js": [".ts", ".tsx", ".js"] },
  },
}));
