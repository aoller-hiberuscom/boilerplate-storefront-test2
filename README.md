# Edge Delivery Services + Adobe Commerce Boilerplate

This project boilerplate is for Edge Delivery Services projects that integrate with Adobe Commerce.

## Documentation

Before using the boilerplate, we recommend you to go through the documentation on <https://experienceleague.adobe.com/developer/commerce/storefront/> and more specifically:

1. [Storefront Developer Tutorial](https://experienceleague.adobe.com/developer/commerce/storefront/get-started/)
1. [AEM Docs](https://www.aem.live/docs/)
1. [AEM Developer Tutorial](https://www.aem.live/developer/tutorial)
1. [The Anatomy of an AEM Project](https://www.aem.live/developer/anatomy-of-a-project)
1. [Web Performance](https://www.aem.live/developer/keeping-it-100)
1. [Markup, Sections, Blocks, and Auto Blocking](https://www.aem.live/developer/markup-sections-blocks)

## Getting Started

Use the [Site Creator Tool](https://da.live/app/adobe-commerce/storefront-tools/tools/site-creator/site-creator) to quickly spin up your own copy of code and content.

Alternatively, you can follow our [Guide](https://experienceleague.adobe.com/developer/commerce/storefront/get-started/) for a more detailed walkthrough.

## Jira and Confluence access from Claude Code (MCP)

`.mcp.json` declares an `mcp-atlassian` server that gives Claude Code access to
the Sports Emotion Jira and Confluence. The configuration is versioned and
identical for everyone; **each developer supplies their own credentials** through
environment variables.

> We do not use Atlassian's official MCP server: it is not supported on Free
> plans and returns `The app is not installed on this instance` against the
> Sports Emotion instance. `mcp-atlassian` authenticates with an API token, which
> needs neither an app installed on the instance nor administrator approval.

### Why individual tokens

An Atlassian API token is personal: it carries your account and your
permissions. Sharing one would attribute every action in the client's audit log
to a single person, grant everyone the same access level, and force a
simultaneous rotation for the whole team if it leaked. **Never write a token into
`.mcp.json` or any other versioned file** — see the "Never commit secrets" rule
in `AGENTS.md`.

### Prerequisites

1. Your Hiberus account must have access to <https://sportsemotion.atlassian.net>.
   Verify it in a browser first: the token grants no access your user lacks.
2. `uv` installed, which provides `uvx`:

   ```bash
   # macOS / Linux
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

   ```powershell
   # Windows
   powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
   ```

### Setup

**1. Create an API token** at <https://id.atlassian.com/manage/api-tokens>. It is
shown only once.

**2. Define the environment variables.** The same token serves Jira and
Confluence:

| Variable | Value | Required |
|---|---|---|
| `ATLASSIAN_EMAIL` | Your Hiberus email | Yes |
| `ATLASSIAN_API_TOKEN` | The token from step 1 | Yes |
| `ATLASSIAN_READ_ONLY` | `true` (default) or `false` to allow writes | No |

macOS / Linux (zsh; use `~/.bashrc` for bash) — keeps the token out of shell
history:

```bash
read -rs "TOKEN?Paste the token and press Enter: " && \
  printf '\n# Atlassian Sports Emotion (MCP)\nexport ATLASSIAN_EMAIL="%s"\nexport ATLASSIAN_API_TOKEN="%s"\n' \
  "your.email@hiberus.com" "$TOKEN" >> ~/.zshrc && unset TOKEN && source ~/.zshrc
```

Windows (PowerShell), persistent user variables:

```powershell
$t = Read-Host -AsSecureString "Paste the token"
$p = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
  [Runtime.InteropServices.Marshal]::SecureStringToBSTR($t))
[Environment]::SetEnvironmentVariable("ATLASSIAN_EMAIL", "your.email@hiberus.com", "User")
[Environment]::SetEnvironmentVariable("ATLASSIAN_API_TOKEN", $p, "User")
Remove-Variable p, t
```

**3. Restart Claude Code from a new terminal** — otherwise it does not inherit
the variables. Then check:

```bash
claude mcp list
```

### Read-only by default

The server starts in read-only mode: **58 tools** (38 Jira + 20 Confluence).
Tools that create, update or delete are not loaded at all. To write
deliberately, set `ATLASSIAN_READ_ONLY=false` in your environment. With writes
enabled the server exposes 98 tools.

To narrow the tool surface, add `ENABLED_TOOLS` to your environment with a
comma-separated allowlist, for example:

```bash
export ENABLED_TOOLS="jira_search,jira_get_issue,jira_get_project_issues,confluence_search,confluence_get_page,confluence_get_space_page_tree"
```

You can also scope by project or space with `JIRA_PROJECTS_FILTER=PROJ,OPS` and
`CONFLUENCE_SPACES_FILTER=DOC,DEV`. Both filters combine with read-only mode: a
filter can never re-enable a write tool.

### Troubleshooting

| Symptom | Cause |
|---|---|
| `The app is not installed on this instance` | You are using the official Atlassian MCP, not `mcp-atlassian` |
| `401 Unauthorized` | Wrong email or token, or the token was revoked |
| `403 Forbidden` | Your account lacks permission on that project, space or page |
| Server missing from `claude mcp list` | `uvx` not installed, or Claude Code not restarted from a new terminal |

Verify the variable is visible without printing it:

```bash
python3 -c "import os; t=os.environ.get('ATLASSIAN_API_TOKEN',''); print('token visible:', bool(t), '| length:', len(t))"
```

## Figma access from Claude Code and opencode (MCP)

`.mcp.json` and `.opencode/opencode.json` declare a single Figma server,
`figma` — [figma-developer-mcp](https://github.com/GLips/Figma-Context-MCP)
(Framelink), pinned to a version and run straight from npm, so there is nothing
to install or maintain locally:

```jsonc
"command": "npx",
"args": ["-y", "figma-developer-mcp@0.13.2", "--stdio"]
```

**Read-only, and free on any Figma plan.** It authenticates with a Personal
Access Token over the `X-Figma-Token` header against the public REST API, and
only ever issues GETs — `/files/{key}`, `/files/{key}/nodes`,
`/files/{key}/images` and `/images/{key}`. No developer account, no paid seat, no
Dev Mode. It never touches `/v1/variables/local` (the Enterprise-only Variables
endpoint), so nothing here can push us onto a higher plan. Design is owned by the
design team; we only read.

We deliberately do **not** declare Figma's official Dev Mode MCP
(`https://mcp.figma.com/mcp`), which needs a paid seat plus OAuth per developer.

### Tools

- `get_figma_data` — the whole design context for a file or a single node:
  auto-layout (flex **and** grid, with spans), fills including gradients and
  image fills, strokes with per-side weights and dashes, effects, typography, and
  rich text with per-character overrides. Takes `fileKey`, an optional `nodeId`
  (from the `node-id=` URL parameter — always pass it when you have it) and an
  optional `depth`. **Leave `depth` alone**: omitting it traverses every layer,
  which is what you want.
- `download_figma_images` — downloads rendered nodes and image fills as PNG or
  SVG, for block assets and icons.

Repeated styles are deduplicated into a `globalVars.styles` dictionary that keeps
the **design team's own style names**. That dictionary is the natural input for
the "SPORTS EMOTION — THEME OVERRIDES" block in `styles/styles.css` — map their
names onto our tokens instead of inventing new ones. Output format is
configurable with `OUTPUT_FORMAT` (`tree`, the default, is the most compact;
`json` and `yaml` also available).

Telemetry is disabled in both configs via `FRAMELINK_TELEMETRY=off`. Upstream it
defaults to on and reports anonymous metrics only (durations, node counts, error
categories — never file keys, node IDs or design content), but client work stays
off by default.

As with `mcp-atlassian`, the configuration is versioned and identical for
everyone, and **each developer supplies their own token** through an environment
variable. **Never write a token into `.mcp.json`, `.opencode/opencode.json` or
any other versioned file.**

### Setup

**1. Create a Personal Access Token** at <https://www.figma.com/developers/api#access-tokens>
(Figma → Settings → Security → Personal access tokens). Give it **read-only**
file access — we never write to Figma. It is shown only once.

**2. Export the token.** The configs read `FIGMA_TOKEN` from your environment and
pass it to the server as `FIGMA_API_KEY`. macOS / Linux (zsh; use `~/.bashrc` for
bash), keeping the token out of shell history:

```bash
read -rs "TOKEN?Paste the Figma token: " && \
  printf '\n# Figma MCP (figma-developer-mcp)\nexport FIGMA_TOKEN="%s"\n' "$TOKEN" >> ~/.zshrc && \
  unset TOKEN && source ~/.zshrc
```

Windows (PowerShell), persistent user variable:

```powershell
$t = Read-Host -AsSecureString "Paste the token"
$p = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
  [Runtime.InteropServices.Marshal]::SecureStringToBSTR($t))
[Environment]::SetEnvironmentVariable("FIGMA_TOKEN", $p, "User")
Remove-Variable p, t
```

**3. Restart your agent from a new terminal** — otherwise it does not inherit the
variable. Then check:

```bash
claude mcp list      # Claude Code — approve the project server on first run
opencode mcp list    # opencode — should report figma as connected
```

There is no step to install anything: `npx` fetches the pinned version on first
run and caches it.

### Upgrading

The version is pinned on purpose — an unpinned `npx -y` would run whatever is
newest on npm at every start. To move to a new release, bump the version in both
`.mcp.json` and `.opencode/opencode.json` in the same commit.

### Troubleshooting

| Symptom | Cause |
|---|---|
| `Figma API authentication is required` | `FIGMA_TOKEN` not exported, or the agent was started from a terminal that predates it |
| `403 Forbidden` | Token revoked or wrong scope, or the file belongs to a team your account cannot read |
| `404 Not Found` | Wrong `fileKey` — take it from the URL, `figma.com/(file\|design)/<fileKey>/…` |
| `429` / rate limited | Figma throttles per token; narrow the request with `nodeId` instead of fetching whole files |
| Huge response, agent runs out of context | Pass the `nodeId` of the frame you care about rather than the whole file |
| npx fails offline | First run needs network to fetch the pinned package; afterwards it is cached |

Verify the variable is visible without printing it:

```bash
python3 -c "import os; t=os.environ.get('FIGMA_TOKEN',''); print('token visible:', bool(t), '| length:', len(t))"
```

## Staying Up to Date

Once you fork or clone this repo, the code is yours — you are not subscribed to updates.

### What a suite release is (and is not)

A suite release — for example "[b2c-march-2026](https://github.com/hlxsites/aem-boilerplate-commerce/tree/b2c-march-2026)" — is a tagged snapshot of this boilerplate at a point in time when a specific combination of drop-in package versions and boilerplate code was tested together and verified to work. That tag is useful as a **starting point** for developers who are setting up a new project. You can find the release notes for each suite release in the [releases](https://experienceleague.adobe.com/developer/commerce/storefront/releases/) page.

If you have already forked or cloned this repo, a new suite release is not an upgrade you need to apply. There is no mechanism that pushes boilerplate code changes into your fork, and nothing will break in your project because a new release tag was created upstream. Treat suite releases the same way you would treat a new major version of a project template: relevant only if you are starting fresh.

### Updating your drop-in dependencies

The only things you need to actively track after forking are your **npm dependencies** — specifically the `@dropins/*` and `@adobe/*` packages (including `@adobe/magento-storefront-event-collector` and `@adobe/magento-storefront-events-sdk`) listed in your `package.json`. Before applying any update, check the release notes for breaking changes and ensure the `postinstall` script runs so that the dependencies in your `scripts/__dropins__` directory are updated to the latest build.

These packages follow semantic versioning. Minor and patch releases are non-breaking by contract, so routine updates should be safe to apply.

To see which packages have newer versions available:

```bash
npm outdated
```

To install a specific version:

```bash
npm install @dropins/storefront-cart@2.0.0  # updates the package in node_modules/
npm run postinstall                         # copies scripts from node_modules into scripts/__dropins__/
```

To update a drop-in to its latest stable release:

```bash
npm install @dropins/storefront-cart@latest
npm run postinstall
```

Always run `postinstall` after any drop-in update — it copies the built assets from `node_modules` into `scripts/__dropins__`, which is what Edge Delivery Services serves. Note that `npm` does not run `postinstall` automatically when you install a specific package, so this step must always be done manually.

### Automated dependency PRs

This repo includes a GitHub Actions workflow that runs every Monday and opens a pull request when newer stable versions of `@adobe/*` or `@dropins/*` packages are available within the ranges declared in your `package.json` ([semver](https://semver.org/)). The PR includes updated `package.json`, `package-lock.json`, and regenerated dropin assets under `scripts/__dropins__/`. Pre-release packages are held without changes and surfaced in the workflow output. This works similarly to Dependabot or Renovate; once you fork the repo, the workflow runs in your fork so you can review and merge updates at your own pace.

You can also trigger the workflow manually from the **Actions** tab in GitHub.

### Pulling boilerplate code changes into your fork (optional)

If you want to incorporate code changes made to this upstream boilerplate after you forked — for example, a new block or a bug fix in `scripts/` — you can do so by adding this repo as a git remote and merging selectively. This is entirely optional. Upstream changes may conflict with modifications you have made to your fork, so expect to resolve conflicts manually. There is no guarantee of a clean merge, and nothing in your project depends on staying in sync with the upstream boilerplate code.

## Changelog

Major changes to this boilerplate are described and documented as part of pull requests and tracked via the `changelog` tag. This log documents changes to the canonical starting point — not upgrades that forked implementations must apply. Review it if you are considering pulling specific upstream changes into your fork:

<https://github.com/hlxsites/aem-boilerplate-commerce/issues?q=label%3Achangelog+is%3Aclosed>
