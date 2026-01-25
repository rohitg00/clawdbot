---
summary: "SkillKit: cross-agent skill management CLI for 17 AI coding agents"
read_when:
  - Porting skills from other AI coding agents to Clawdbot
  - Managing skills across multiple AI agents
  - Looking for cross-agent skill portability
---

# SkillKit

SkillKit is a **universal CLI for managing AI agent skills** across 17 different coding agents. It provides cross-agent skill portability, team collaboration features, and smart project-aware recommendations. While ClawdHub is the Clawdbot-specific skill registry, SkillKit enables you to translate and sync skills from other AI agents like Cursor, Claude Code, Codex, and more.

Site: [github.com/rohitg00/skillkit](https://github.com/rohitg00/skillkit)

npm: [npmjs.com/package/skillkit](https://www.npmjs.com/package/skillkit)

## Why use SkillKit with Clawdbot

SkillKit complements Clawdbot and ClawdHub by solving cross-agent workflows:

- **Skill portability**: Translate skills from Cursor, Claude Code, Codex, or other agents into Clawdbot-compatible format.
- **Team collaboration**: Share skill configurations across your team with sync and import/export workflows.
- **Smart recommendations**: Get project-aware skill suggestions based on your codebase.
- **Multi-agent workflows**: Manage skills for multiple AI agents from a single CLI.

If you only use Clawdbot, ClawdHub is the primary registry. If you work with multiple AI coding agents, SkillKit bridges the gap.

## Install the CLI

```bash
npx install skillkit
```

```bash
npm install -g skillkit
```

```bash
pnpm add -g skillkit
```

## Quick start

1) Install a skill for Clawdbot:
   ```bash
   skillkit install <source> --agent clawdbot
   ```

2) Translate a skill from another agent:
   ```bash
   skillkit translate <skill> --to clawdbot
   ```

3) Sync all skills to Clawdbot:
   ```bash
   skillkit sync
   ```

4) Get project-aware recommendations:
   ```bash
   skillkit recommend
   ```

## Basic commands

### Install skills

Install a skill from the marketplace or a local path:

```bash
skillkit install my-skill --agent clawdbot
```

Options:
- `--agent <agent>`: Target agent (default: detects from environment).
- `--force`: Overwrite existing skill.

### Translate skills

Convert skills from one agent format to another:

```bash
skillkit translate ./claude --to clawdbot
```

This reads the source skill (in Cursor format) and outputs a Clawdbot-compatible `SKILL.md`.

Options:
- `--to <agent>`: Target agent format.
- `--from <agent>`: Source agent format (auto-detected if omitted).
- `--output <dir>`: Output directory.

### Sync skills

Sync your local skills to Clawdbot:

```bash
skillkit sync
```

This scans for skills and ensures they are properly configured for Clawdbot.

### Get recommendations

Get project-aware skill recommendations based on your codebase:

```bash
skillkit recommend
```

SkillKit analyzes your project (languages, frameworks, dependencies) and suggests relevant skills.

## How SkillKit complements ClawdHub

| Feature | ClawdHub | SkillKit |
|---------|----------|----------|
| **Focus** | Clawdbot-specific registry | Cross-agent skill management |
| **Skill format** | Clawdbot/AgentSkills | 17 agent formats |
| **Primary use** | Install/publish Clawdbot skills | Translate/port skills between agents |
| **Team features** | Stars, comments, versioning | Team sync, import/export, bundles |

Use **ClawdHub** when:
- You want to browse and install Clawdbot skills.
- You want to publish skills for the Clawdbot community.

Use **SkillKit** when:
- You have skills from Cursor, Claude Code, or other agents you want to use in Clawdbot.
- You manage skills across multiple AI agents.
- You need team collaboration features for skill sharing.

## Supported agents

SkillKit supports 17 AI coding agents:

| Agent | Status |
|-------|--------|
| Claude Code | Supported |
| Cursor | Supported |
| Codex | Supported |
| Gemini CLI | Supported |
| OpenCode | Supported |
| Antigravity | Supported |
| Amp | Supported |
| Clawdbot | Supported |
| Droid | Supported |
| GitHub Copilot | Supported |
| Goose | Supported |
| Kilo | Supported |
| Kiro CLI | Supported |
| Roo | Supported |
| Trae | Supported |
| Windsurf | Supported |
| Universal | Supported |

## Additional commands

### Browse marketplace

```bash
skillkit browse
```

### List installed skills

```bash
skillkit list
```

### Context analysis

Analyze your project context:

```bash
skillkit context
```

### Team collaboration

```bash
skillkit team init          # Initialize team config
skillkit team share         # Share skills with team
skillkit team import        # Import team skills
skillkit team sync          # Sync team skills
```

### Plugin management

```bash
skillkit plugin list        # List available plugins
skillkit plugin install     # Install a plugin
skillkit plugin enable      # Enable a plugin
```

### Interactive TUI

Launch the terminal UI for visual skill management:

```bash
skillkit ui
```

## Environment variables

- `SKILLKIT_AGENT`: Default target agent.
- `SKILLKIT_CONFIG_PATH`: Override config file location.

## Links

- **GitHub**: [github.com/rohitg00/skillkit](https://github.com/rohitg00/skillkit)
- **npm**: [npmjs.com/package/skillkit](https://www.npmjs.com/package/skillkit)
- **ClawdHub** (Clawdbot registry): [clawdhub.com](https://clawdhub.com)
- **Skills docs**: [Skills](/tools/skills)
