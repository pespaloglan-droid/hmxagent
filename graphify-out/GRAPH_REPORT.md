# Graph Report - hmx-agent  (2026-10-11)

## Corpus Check
- 119 files · ~101,404 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 1, .css 1)

## Summary
- 1177 nodes · 2133 edges · 61 communities (54 shown, 7 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 92 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 60

## God Nodes (most connected - your core abstractions)
1. `startDashboard()` - 41 edges
2. `startDashboard()` - 28 edges
3. `AccountPool` - 24 edges
4. `T` - 20 edges
5. `runBrowserTask()` - 18 edges
6. `ensureDirs()` - 18 edges
7. `HmxAgent` - 17 edges
8. `BrowserSessionProvider` - 17 edges
9. `App()` - 16 edges
10. `loadProviderConfigs()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `StatusBar()` --calls--> `AccountPool`  [EXTRACTED]
  apps/tui/src/index.tsx → packages/providers/src/account-pool.ts
- `TuiApp()` --calls--> `HmxAgent`  [EXTRACTED]
  apps/tui/src/index.tsx → packages/agent-core/src/agent.ts
- `TuiApp()` --calls--> `loadProviderConfigs()`  [EXTRACTED]
  apps/tui/src/index.tsx → packages/providers/src/registry.ts
- `submit()` --calls--> `loadProviderConfigs()`  [EXTRACTED]
  apps/tui/src/index.tsx → packages/providers/src/registry.ts
- `TuiApp()` --calls--> `parsePromptRoute()`  [EXTRACTED]
  apps/tui/src/index.tsx → packages/router/src/route-parser.ts

## Import Cycles
- None detected.

## Communities (61 total, 7 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (44): quotaSnapshot(), startDashboard(), AccountPool, PooledAccount, quotaCooldownMs(), ApiMediaProvider, BrowserSessionProvider, ChromeProfile (+36 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (43): acc, catalogCmd, pool, program, prov, url(), port, AgentRegistry (+35 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (46): api, App(), NAV, AgentSelector(), AssetGrid(), ChatView(), TABS, CommandPalette() (+38 more)

### Community 3 - "Community 3"
Cohesion: 0.03
Nodes (6): emit(), #i(), next(), o(), return(), #s()

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (30): HmxAgent, ApprovalMode, classifyMessageRisk(), DESTRUCTIVE_MARKERS, RiskLevel, shouldRequireApproval(), TASK_MARKERS, actionSignature() (+22 more)

### Community 5 - "Community 5"
Cohesion: 0.04
Nodes (39): ambiguousRanges, ansiStyles, assembleStyles(), backgroundColorNames, CRASH_DIR, defaultIgnorableCodePointRegex, electron, ESCAPES (+31 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (28): Colored(), Line, PlanSteps(), StatusBar(), TuiApp(), submit(), matchProviderPrefix(), norm() (+20 more)

### Community 7 - "Community 7"
Cohesion: 0.05
Nodes (41): dependencies, @hmx/agent-core, @hmx/core, @hmx/dashboard-api, @hmx/media, @hmx/providers, @hmx/router, description (+33 more)

### Community 8 - "Community 8"
Cohesion: 0.10
Nodes (31): requireConsole(), addTemplateColors(), canUseStyles(), consoleTransportFactory(), transport(), formatStyles(), levelToStyle(), requireFile() (+23 more)

### Community 9 - "Community 9"
Cohesion: 0.09
Nodes (31): "../../node_modules/.pnpm/cross-spawn@7.0.6/node_modules/cross-spawn/index.js"(), spawn3(), spawnSync2(), "../../node_modules/.pnpm/cross-spawn@7.0.6/node_modules/cross-spawn/lib/enoent.js"(), hookChildProcess(), notFoundError(), verifyENOENT(), verifyENOENTSync() (+23 more)

### Community 10 - "Community 10"
Cohesion: 0.09
Nodes (32): buildProvider(), chat(), classifyMessageRisk(), composeProject(), defaultTier(), deleteProviderConfig(), ensureDirs(), generate() (+24 more)

### Community 11 - "Community 11"
Cohesion: 0.08
Nodes (24): dependencies, react, react-dom, zod, zustand, devDependencies, @types/react, @types/react-dom (+16 more)

### Community 12 - "Community 12"
Cohesion: 0.08
Nodes (24): bin, hmx, dependencies, commander, @hmx/agent-core, @hmx/core, @hmx/dashboard-api, @hmx/media (+16 more)

### Community 13 - "Community 13"
Cohesion: 0.08
Nodes (24): dependencies, @hmx/agent-core, @hmx/core, @hmx/providers, @hmx/router, ink, ink-text-input, react (+16 more)

### Community 14 - "Community 14"
Cohesion: 0.08
Nodes (23): dependencies, @hmx/agent-core, @hmx/core, @hmx/media, @hmx/providers, @hmx/router, hono, @hono/node-server (+15 more)

### Community 15 - "Community 15"
Cohesion: 0.12
Nodes (19): add(), buildAllMatchers(), #buildMatcher(), buildRegExp(), buildWildcardRegExp(), findMiddleware(), insert(), #insertPath() (+11 more)

### Community 16 - "Community 16"
Cohesion: 0.18
Nodes (13): CRASH_DIR, createWindow(), firstRun(), gotLock, recoverState(), showRecoveryWindow(), writeCrashLog(), findFreePort() (+5 more)

### Community 17 - "Community 17"
Cohesion: 0.12
Nodes (16): compilerOptions, baseUrl, composite, jsx, module, moduleResolution, noEmit, paths (+8 more)

### Community 18 - "Community 18"
Cohesion: 0.12
Nodes (15): compilerOptions, baseUrl, outDir, paths, rootDir, extends, include, ../../tsconfig.base.json (+7 more)

### Community 19 - "Community 19"
Cohesion: 0.12
Nodes (14): description, @hmx/agent-core, @hmx/core, @hmx/dashboard-api, @hmx/media, @hmx/providers, @hmx/router, playwright (+6 more)

### Community 20 - "Community 20"
Cohesion: 0.12
Nodes (15): dependencies, @hmx/agent-core, @hmx/core, @hmx/providers, exports, @hmx/agent-core, @hmx/core, @hmx/providers (+7 more)

### Community 21 - "Community 21"
Cohesion: 0.18
Nodes (6): _get(), _hmx_accounts(), _hmx_generate(), _hmx_reachable(), _post(), register()

### Community 22 - "Community 22"
Cohesion: 0.13
Nodes (14): compilerOptions, baseUrl, outDir, paths, rootDir, extends, include, ../../tsconfig.base.json (+6 more)

### Community 23 - "Community 23"
Cohesion: 0.14
Nodes (11): CancelError, download(), getFilenameFromMime(), incrementPath(), MaxTryError, MissingFilterError, MissingValueError, pathExistsSync() (+3 more)

### Community 24 - "Community 24"
Cohesion: 0.14
Nodes (13): dependencies, @hmx/core, @hmx/providers, exports, @hmx/core, @hmx/providers, main, name (+5 more)

### Community 25 - "Community 25"
Cohesion: 0.14
Nodes (13): dependencies, execa, @hmx/core, exports, execa, @hmx/core, main, name (+5 more)

### Community 26 - "Community 26"
Cohesion: 0.18
Nodes (10): requireCreateDefaultLogger(), createDefaultLogger(), requireElectronLogPreload(), requireErrorHandler(), requireEventLogger(), requireInitialize(), initializeSpyRendererConsole(), requireMain() (+2 more)

### Community 27 - "Community 27"
Cohesion: 0.19
Nodes (11): #addRoute(), basePath(), #clone(), constructor(), convertFormDataToBodyData(), get(), mount(), "../../node_modules/.pnpm/hono@4.13.13/node_modules/hono/dist/request.js"() (+3 more)

### Community 28 - "Community 28"
Cohesion: 0.15
Nodes (12): compilerOptions, baseUrl, outDir, paths, rootDir, extends, include, ../../tsconfig.base.json (+4 more)

### Community 29 - "Community 29"
Cohesion: 0.17
Nodes (11): compilerOptions, composite, jsx, module, moduleResolution, noEmit, outDir, rootDir (+3 more)

### Community 30 - "Community 30"
Cohesion: 0.17
Nodes (11): compilerOptions, baseUrl, outDir, paths, rootDir, extends, include, ../../tsconfig.base.json (+3 more)

### Community 31 - "Community 31"
Cohesion: 0.17
Nodes (11): dependencies, @hmx/core, exports, @hmx/core, main, name, private, scripts (+3 more)

### Community 32 - "Community 32"
Cohesion: 0.17
Nodes (11): compilerOptions, composite, declaration, esModuleInterop, module, moduleResolution, resolveJsonModule, skipLibCheck (+3 more)

### Community 33 - "Community 33"
Cohesion: 0.31
Nodes (11): pull(), query(), read(), register(), reverify(), write(), writeFromReadableStream(), writeFromReadableStreamDefaultReader() (+3 more)

### Community 34 - "Community 34"
Cohesion: 0.18
Nodes (10): compilerOptions, baseUrl, outDir, paths, rootDir, extends, include, ../../tsconfig.base.json (+2 more)

### Community 35 - "Community 35"
Cohesion: 0.18
Nodes (10): compilerOptions, baseUrl, outDir, paths, rootDir, extends, include, ../../tsconfig.base.json (+2 more)

### Community 36 - "Community 36"
Cohesion: 0.29
Nodes (8): requireElectronExternalApi(), requireNodeExternalApi(), requirePackageJson(), extractPathFromArgs(), findAndReadPackageJson(), findUp(), getMainModulePath(), tryReadJsonAt()

### Community 37 - "Community 37"
Cohesion: 0.20
Nodes (10): dependencies, electron-context-menu, electron-log, @hmx/agent-core, @hmx/core, @hmx/dashboard-api, @hmx/media, @hmx/providers (+2 more)

### Community 38 - "Community 38"
Cohesion: 0.22
Nodes (9): checkAnsi(), cliTruncate(), emojiRegex(), getIndexOfNearestSpace(), isFullwidthCodePoint(), sliceAnsi(), stringWidth(), stripAnsi() (+1 more)

### Community 39 - "Community 39"
Cohesion: 0.22
Nodes (8): exports, main, name, private, scripts, build, type, version

### Community 40 - "Community 40"
Cohesion: 0.29
Nodes (6): compilerOptions, outDir, rootDir, extends, include, ../../tsconfig.base.json

### Community 41 - "Community 41"
Cohesion: 0.40
Nodes (5): contextMenu(), create(), decorateMenuItem(), removeUnusedMenuItems(), webContents()

### Community 42 - "Community 42"
Cohesion: 0.33
Nodes (6): createWindow(), findFreePort(), firstRun(), spawnDashboardServer(), waitForServer(), writeCrashLog()

### Community 43 - "Community 43"
Cohesion: 0.47
Nodes (6): eastAsianWidth(), isAmbiguous(), isFullwidth(), isInRange(), isWide(), validate()

### Community 44 - "Community 44"
Cohesion: 0.33
Nodes (6): requireExtList(), requireExtName(), requireIsPlainObj(), requireMimeDb(), requireSortKeys(), requireSortKeysLength()

### Community 45 - "Community 45"
Cohesion: 0.53
Nodes (6): isDuplexStream(), isReadableStream(), isStream(), isWritableStream(), native(), nodeStream()

### Community 46 - "Community 46"
Cohesion: 0.33
Nodes (6): scripts, build, build:server, dev, package:win, package:win:portable

### Community 47 - "Community 47"
Cohesion: 0.40
Nodes (4): requireBuffering(), requireLogger(), requireScope(), scopeFactory()

### Community 48 - "Community 48"
Cohesion: 0.40
Nodes (5): findChromeExe(), launchRealChrome(), on(), readDevToolsPort(), waitForDebugger()

### Community 49 - "Community 49"
Cohesion: 0.40
Nodes (5): load(), onExit(), #processEmit(), #processReallyExit(), unload()

### Community 50 - "Community 50"
Cohesion: 0.40
Nodes (5): devDependencies, electron, electron-builder, electron-vite, esbuild

### Community 51 - "Community 51"
Cohesion: 0.67
Nodes (3): requireFile$1(), requireFileRegistry(), requireNullFile()

### Community 53 - "Community 53"
Cohesion: 0.50
Nodes (4): circuitSnapshot(), isOpen(), quotaSnapshot(), snapshot()

### Community 55 - "Community 55"
Cohesion: 0.67
Nodes (3): chromeUserDataDir(), ensureProfileCopy(), log()

## Knowledge Gaps
- **56 isolated node(s):** `@hmx/core`, `@hmx/agent-core`, `@hmx/providers`, `@hmx/router`, `@hmx/media` (+51 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 512 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `electron` connect `Community 52` to `Community 16`, `Community 19`, `Community 5`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Are the 16 inferred relationships involving `startDashboard()` (e.g. with `.chat()` and `.setModel()`) actually correct?**
  _`startDashboard()` has 16 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@hmx/core`, `@hmx/agent-core`, `@hmx/providers` to the rest of the system?**
  _56 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06030701754385965 - nodes in this community are weakly interconnected._
- **Why does `zod` connect `Community 2` to `Community 11`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05238095238095238 - nodes in this community are weakly interconnected._
- **Why does `AccountPool` connect `Community 0` to `Community 1`, `Community 6`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._