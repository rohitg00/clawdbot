import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

import { Type } from "@sinclair/typebox";

import type { ClawdbotPluginApi, ClawdbotPluginToolContext } from "../../../src/plugins/types.js";

type PluginConfig = {
  defaultAgent?: string;
  autoSync?: boolean;
  skillsDir?: string;
};

type SkillkitResult = {
  ok: boolean;
  data?: unknown;
  error?: string;
};

async function runSkillkitCommand(
  args: string[],
  options: {
    cwd?: string;
    timeoutMs?: number;
  } = {},
): Promise<SkillkitResult> {
  const { cwd = process.cwd(), timeoutMs = 30_000 } = options;

  return await new Promise((resolve) => {
    const child = spawn("npx", ["skillkit", ...args, "--json"], {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env },
      shell: process.platform === "win32",
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.setEncoding("utf8");
    child.stderr?.setEncoding("utf8");

    child.stdout?.on("data", (chunk) => {
      stdout += String(chunk);
    });

    child.stderr?.on("data", (chunk) => {
      stderr += String(chunk);
    });

    const timer = setTimeout(() => {
      try {
        child.kill("SIGKILL");
      } catch {

      }
      resolve({ ok: false, error: "skillkit command timed out" });
    }, timeoutMs);

    child.once("error", (err) => {
      clearTimeout(timer);
      resolve({ ok: false, error: `skillkit spawn error: ${err.message}` });
    });

    child.once("exit", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        resolve({
          ok: false,
          error: stderr.trim() || stdout.trim() || `skillkit exited with code ${code}`,
        });
        return;
      }

      try {
        const data = JSON.parse(stdout.trim());
        resolve({ ok: true, data });
      } catch {
        resolve({ ok: true, data: { raw: stdout.trim() } });
      }
    });
  });
}


function getDefaultSkillsDir(pluginConfig: PluginConfig): string {
  if (pluginConfig.skillsDir) {
    return pluginConfig.skillsDir;
  }
  return path.join(os.homedir(), ".clawdbot", "skills");
}

export function createSkillkitSearchTool(api: ClawdbotPluginApi) {
  return {
    name: "skillkit_search",
    description:
      "Search the SkillKit marketplace for skills. Returns matching skills with metadata including name, description, category, and tags.",
    parameters: Type.Object({
      query: Type.String({ description: "Search query for finding skills" }),
      category: Type.Optional(
        Type.String({ description: "Filter by category (e.g., development, testing, deployment)" }),
      ),
      tags: Type.Optional(
        Type.Array(Type.String(), { description: "Filter by tags" }),
      ),
      limit: Type.Optional(
        Type.Number({ description: "Maximum number of results to return (default: 10)" }),
      ),
    }),
    async execute(_id: string, params: Record<string, unknown>) {
      const query = String(params.query ?? "").trim();
      if (!query) throw new Error("query required");

      const args = ["search", query];

      if (typeof params.category === "string" && params.category.trim()) {
        args.push("--category", params.category.trim());
      }

      if (Array.isArray(params.tags) && params.tags.length > 0) {
        for (const tag of params.tags) {
          if (typeof tag === "string" && tag.trim()) {
            args.push("--tag", tag.trim());
          }
        }
      }

      if (typeof params.limit === "number" && params.limit > 0) {
        args.push("--limit", String(Math.floor(params.limit)));
      }

      const result = await runSkillkitCommand(args);

      if (!result.ok) {
        throw new Error(result.error ?? "Search failed");
      }

      return {
        content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
        details: result.data,
      };
    },
  };
}


export function createSkillkitInstallTool(api: ClawdbotPluginApi) {
  return {
    name: "skillkit_install",
    description:
      "Install a skill from the SkillKit marketplace or a GitHub repository. Supports installing to workspace or global skills directory.",
    parameters: Type.Object({
      source: Type.String({
        description: "Skill name from marketplace, GitHub repo URL (user/repo), or local path",
      }),
      agent: Type.Optional(
        Type.String({
          description: "Target agent format (default: clawdbot). Supported: clawdbot, claude-code, cursor, etc.",
        }),
      ),
      workspace: Type.Optional(
        Type.String({ description: "Workspace directory for workspace-local installation" }),
      ),
      global: Type.Optional(
        Type.Boolean({ description: "Install to global skills directory (default: true)" }),
      ),
    }),
    async execute(_id: string, params: Record<string, unknown>) {
      const source = String(params.source ?? "").trim();
      if (!source) throw new Error("source required");

      const pluginConfig = (api.pluginConfig ?? {}) as PluginConfig;
      const agent = String(params.agent ?? pluginConfig.defaultAgent ?? "clawdbot").trim();

      const args = ["install", source, "--agent", agent];

      const isGlobal = params.global !== false;
      if (isGlobal) {
        const skillsDir = getDefaultSkillsDir(pluginConfig);
        args.push("--dir", skillsDir);
      } else if (typeof params.workspace === "string" && params.workspace.trim()) {
        const workspaceSkillsDir = path.join(params.workspace.trim(), "skills");
        args.push("--dir", workspaceSkillsDir);
      }

      const result = await runSkillkitCommand(args, { timeoutMs: 60_000 });

      if (!result.ok) {
        throw new Error(result.error ?? "Install failed");
      }

      if (pluginConfig.autoSync) {
        const syncArgs = ["sync", "--agent", agent];
        await runSkillkitCommand(syncArgs);
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                installed: true,
                source,
                agent,
                ...(typeof result.data === "object" ? result.data : {}),
              },
              null,
              2,
            ),
          },
        ],
        details: { installed: true, source, agent, ...result.data },
      };
    },
  };
}

export function createSkillkitTranslateTool(api: ClawdbotPluginApi) {
  return {
    name: "skillkit_translate",
    description:
      "Translate a skill file between different agent formats. Supports Claude Code, Cursor, Clawdbot, and universal formats.",
    parameters: Type.Object({
      skillPath: Type.String({ description: "Path to the skill file to translate" }),
      from: Type.Optional(
        Type.String({ description: "Source agent format (auto-detected if not specified)" }),
      ),
      to: Type.Optional(
        Type.String({ description: "Target agent format (default: clawdbot)" }),
      ),
      output: Type.Optional(
        Type.String({ description: "Output path for translated skill (default: same directory)" }),
      ),
    }),
    async execute(_id: string, params: Record<string, unknown>) {
      const skillPath = String(params.skillPath ?? "").trim();
      if (!skillPath) throw new Error("skillPath required");

      const pluginConfig = (api.pluginConfig ?? {}) as PluginConfig;
      const to = String(params.to ?? pluginConfig.defaultAgent ?? "clawdbot").trim();

      const args = ["translate", skillPath, "--to", to];

      if (typeof params.from === "string" && params.from.trim()) {
        args.push("--from", params.from.trim());
      }

      if (typeof params.output === "string" && params.output.trim()) {
        args.push("--output", params.output.trim());
      }

      const result = await runSkillkitCommand(args);

      if (!result.ok) {
        throw new Error(result.error ?? "Translation failed");
      }

      return {
        content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
        details: result.data,
      };
    },
  };
}

export function createSkillkitSyncTool(api: ClawdbotPluginApi) {
  return {
    name: "skillkit_sync",
    description:
      "Synchronize installed skills to the agent configuration. Updates agent config files to reference installed skills.",
    parameters: Type.Object({
      agent: Type.Optional(
        Type.String({ description: "Target agent to sync skills for (default: clawdbot)" }),
      ),
      workspace: Type.Optional(
        Type.String({ description: "Workspace directory to sync (syncs global if not specified)" }),
      ),
      dryRun: Type.Optional(
        Type.Boolean({ description: "Show what would be synced without making changes" }),
      ),
    }),
    async execute(_id: string, params: Record<string, unknown>) {
      const pluginConfig = (api.pluginConfig ?? {}) as PluginConfig;
      const agent = String(params.agent ?? pluginConfig.defaultAgent ?? "clawdbot").trim();

      const args = ["sync", "--agent", agent];

      if (typeof params.workspace === "string" && params.workspace.trim()) {
        args.push("--workspace", params.workspace.trim());
      }

      if (params.dryRun === true) {
        args.push("--dry-run");
      }

      const result = await runSkillkitCommand(args);

      if (!result.ok) {
        throw new Error(result.error ?? "Sync failed");
      }

      return {
        content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
        details: result.data,
      };
    },
  };
}

export function createSkillkitRecommendTool(
  api: ClawdbotPluginApi,
  ctx: ClawdbotPluginToolContext,
) {
  return {
    name: "skillkit_recommend",
    description:
      "Get AI-powered skill recommendations based on project analysis. Analyzes project structure, dependencies, and patterns to suggest relevant skills.",
    parameters: Type.Object({
      projectPath: Type.Optional(
        Type.String({ description: "Path to project directory (defaults to current workspace)" }),
      ),
      minScore: Type.Optional(
        Type.Number({ description: "Minimum recommendation score (0-1, default: 0.5)" }),
      ),
      category: Type.Optional(
        Type.String({ description: "Filter recommendations by category" }),
      ),
      limit: Type.Optional(
        Type.Number({ description: "Maximum number of recommendations (default: 5)" }),
      ),
    }),
    async execute(_id: string, params: Record<string, unknown>) {
      const projectPath =
        (typeof params.projectPath === "string" && params.projectPath.trim()) ||
        ctx.workspaceDir ||
        process.cwd();

      const args = ["recommend", "--path", projectPath];

      if (typeof params.minScore === "number") {
        args.push("--min-score", String(params.minScore));
      }

      if (typeof params.category === "string" && params.category.trim()) {
        args.push("--category", params.category.trim());
      }

      if (typeof params.limit === "number" && params.limit > 0) {
        args.push("--limit", String(Math.floor(params.limit)));
      }

      const result = await runSkillkitCommand(args, {
        cwd: projectPath,
        timeoutMs: 45_000,
      });

      if (!result.ok) {
        throw new Error(result.error ?? "Recommendation failed");
      }

      return {
        content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
        details: result.data,
      };
    },
  };
}
