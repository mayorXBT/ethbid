## gstack

This project uses [gstack](https://github.com/garrytan/gstack) for AI-assisted work. It is required.

This workspace is Grok Build. Skills are wired at `~/.grok/skills/gstack*` (junctions to the global gstack install). Runtime binaries live at `~/.codex/skills/gstack` and `~/.gstack/repos/gstack`.

```bash
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.gstack/repos/gstack
cd ~/.gstack/repos/gstack && ./setup --host auto --team
```

Use `/browse` for all web browsing. Never use `mcp__claude-in-chrome__*` tools.

When a gstack skill names a Claude/Codex tool, map it to Grok Build:

- Bash / exec / terminal → `run_terminal_command`
- Read → `read_file`
- Write → `write`
- Edit / patch → `search_replace`
- Grep → `grep`
- Glob → `list_dir`
- Agent / sessions_spawn → `spawn_subagent`
- AskUserQuestion → `ask_user_question`

Available skills: `/office-hours`, `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`, `/design-consultation`, `/design-shotgun`, `/design-html`, `/review`, `/ship`, `/land-and-deploy`, `/canary`, `/benchmark`, `/browse`, `/connect-chrome`, `/qa`, `/qa-only`, `/design-review`, `/setup-browser-cookies`, `/setup-deploy`, `/setup-gbrain`, `/retro`, `/investigate`, `/document-release`, `/document-generate`, `/codex`, `/cso`, `/autoplan`, `/plan-devex-review`, `/devex-review`, `/careful`, `/freeze`, `/guard`, `/unfreeze`, `/gstack-upgrade`, `/learn`.

## Skill routing

When the user's request matches an available skill, invoke it. When in doubt, invoke the skill.

- Product ideas / brainstorming → `/office-hours`
- Strategy / scope → `/plan-ceo-review`
- Architecture → `/plan-eng-review`
- Design system / plan review → `/design-consultation` or `/plan-design-review`
- Full review pipeline → `/autoplan`
- Bugs / errors → `/investigate`
- QA / testing site behavior → `/qa` or `/qa-only`
- Code review / diff check → `/review`
- Visual polish → `/design-review`
- Ship / deploy / PR → `/ship` or `/land-and-deploy`
- Save progress → `/context-save`
- Resume context → `/context-restore`
- Author a backlog-ready spec / issue → `/spec`
