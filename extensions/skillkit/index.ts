import type { ClawdbotPluginApi } from "../../src/plugins/types.js";

import {
  createSkillkitSearchTool,
  createSkillkitInstallTool,
  createSkillkitTranslateTool,
  createSkillkitSyncTool,
  createSkillkitRecommendTool,
} from "./src/tools.js";

export default function register(api: ClawdbotPluginApi) {
  // Register all SkillKit tools as optional (won't fail if skillkit dep is missing)
  api.registerTool(
    (ctx) => {
      if (ctx.sandboxed) return null;
      return createSkillkitSearchTool(api);
    },
    { optional: true },
  );

  api.registerTool(
    (ctx) => {
      if (ctx.sandboxed) return null;
      return createSkillkitInstallTool(api);
    },
    { optional: true },
  );

  api.registerTool(
    (ctx) => {
      if (ctx.sandboxed) return null;
      return createSkillkitTranslateTool(api);
    },
    { optional: true },
  );

  api.registerTool(
    (ctx) => {
      if (ctx.sandboxed) return null;
      return createSkillkitSyncTool(api);
    },
    { optional: true },
  );

  api.registerTool(
    (ctx) => {
      if (ctx.sandboxed) return null;
      return createSkillkitRecommendTool(api, ctx);
    },
    { optional: true },
  );
}
