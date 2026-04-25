# CLAUDE.md — cxweo-game-web

> 給 AI agent 協作者（含 Claude Code）閱讀的專案規則。請在每次動工前先讀本檔，並在
> 新增遊戲 / 修改架構後更新它。原始需求以 `PROJECT.md` 為準，衝突時以 `PROJECT.md`
> 為主、本檔為輔。

## 0. Next.js 版本注意事項（重要）

本專案使用 **Next.js 16 + React 19 + Tailwind CSS 4**，與大部分模型訓練資料中的
Next.js 13/14 慣例有差：

- **Tailwind CSS 4 採 CSS-first 設定**，不再使用 `tailwind.config.ts`。自訂主題請用
  `@theme` / `@custom-variant` 寫在 `app/globals.css`。
- **class 版暗色模式**需在 `globals.css` 用 `@custom-variant dark (&:where(.dark, .dark *))` 啟用。
- **Dynamic route params 是 Promise**：`params: Promise<{ slug: string }>`，要 `await`。
- **Turbopack 為預設**（`next dev`、`next build` 皆走 Turbopack）。
- **Route props helpers**：可用全域 `PageProps<'/games/[slug]'>` / `LayoutProps<'/...'>`，
  由 `next dev`/`next build`/`next typegen` 產生。
- 若不確定某 API 在 16 的寫法，查 `node_modules/next/dist/docs/` 內的 md 檔。

## 1. 專案總覽

- **目標**：前端小遊戲合集網站，每天新增一款遊戲，長期累積。
- **技術棧**：Next.js 16 (App Router) + React 19 + TypeScript (strict) + Tailwind CSS 4 + pnpm。
- **部署**：Vercel（連接 GitHub repo，推送 main 自動部署）。
- **Repo**：`git@github.com:cxweoth/cxweo-game-web.git`
- **硬規則**：
  - 純前端，**不做**需要伺服器 / DB / 後端 API 的功能。
  - 不實作需要伺服器運算的遊戲（例如即時多人連線對戰）。
  - 儲存只能用 localStorage。
  - 禁止引入 > 100KB gzipped 的套件，除非有明確理由並獲得審核同意。

## 2. 目錄結構

```
/app
  layout.tsx                   全域 layout（Header / Footer / 主題啟動 script）
  page.tsx                     首頁：從 games-registry 生成卡片
  globals.css                  Tailwind 4 主題與 custom-variant
  /games/<slug>/page.tsx       各遊戲獨立路由（新增遊戲時建）
/components
  /ui                          通用 UI：Button、Card、Modal、ScoreBoard
  /layout                      Header、Footer、GameShell（遊戲頁外框）
  /theme                       ThemeToggle（暗色模式切換）
  /games/<Name>/               各遊戲專屬元件（PascalCase 資料夾）
/lib
  utils.ts                     cn、clamp、range、randomInt
  storage.ts                   localStorage 封裝（最高分、設定）
  games-registry.ts            遊戲註冊表；首頁讀這個
/types
  game.ts                      GameStatus / GameDifficulty / GameMeta
/public                        靜態資源（暫未使用，遊戲縮圖現用 emoji）
CLAUDE.md                      本檔
AGENTS.md                      指向 CLAUDE.md
PROJECT.md                     原始需求（唯讀）
README.md                      本地開發 + Vercel 說明
```

**新增遊戲時檔案放哪裡**

| 要放的東西 | 路徑 |
|---|---|
| 遊戲頁路由 | `app/games/<slug>/page.tsx` |
| 遊戲核心元件 | `components/games/<PascalName>/<Name>.tsx` |
| 遊戲邏輯 hook | `components/games/<PascalName>/use<Name>.ts` |
| 遊戲專屬型別 | 同資料夾內 `types.ts` |
| 在註冊表登記 | 改 `lib/games-registry.ts` 對應項的 `implemented: true` |

## 3. 共用元件與工具

### UI 元件（`components/ui`）

- `<Button variant size>`：`variant = primary | secondary | ghost | danger`；`size = sm | md | lg`。
  已處理 focus ring 與 disabled 樣式。
- `<Card>` + `<CardHeader> / <CardTitle> / <CardDescription> / <CardContent> / <CardFooter>`：
  通用卡片組合。
- `<Modal open onClose title closeOnBackdrop>`：以原生 `<dialog>` 為底，ESC 關閉、
  backdrop 點擊可選。
- `<ScoreBoard score best extras>`：遊戲頁統一分數板；`aria-live="polite"` 已設。

### Layout（`components/layout`）

- `<Header>`：sticky、含 Logo 連首頁 + ThemeToggle。
- `<Footer>`：版權 + GitHub 連結。
- `<GameShell title instructions controls>`：**每個遊戲頁都要用這個外框**，別自己刻
  標題/返回鍵/說明區塊。

### 主題（`components/theme`）

- `<ThemeToggle>`：light → dark → system 循環；寫入 localStorage。
  `layout.tsx` 另有 inline script 在 hydrate 前套用，避免首屏閃爍。

### Lib

- `cn(...)`（`lib/utils.ts`）：`clsx + tailwind-merge`，所有 className 合併都走這個。
- `clamp(v, min, max)` / `range(n)` / `randomInt(lo, hi)`：基本純函式。
- `getHighScore(slug)` / `setHighScore(slug, score)`（`lib/storage.ts`）：最高分存取；
  `setHighScore` 只在新分數更高時寫入，回傳是否更新。
- `getBestTime(key)` / `setBestTime(key, seconds)`（`lib/storage.ts`）：**越低越好**的紀錄
  （計時制遊戲用）；`setBestTime` 只在新時間更短時寫入。key 建議 `game:variant`（如
  `minesweeper:easy`）。
- `readJSON<T>(key)` / `writeJSON<T>(key, value)`（`lib/storage.ts`）：通用 JSON 結構存取，
  用於戰績、偏好等任意結構化資料；自動加上專案 prefix，避免污染。
- `getSettings()` / `setSettings(partial)`：讀寫全域設定（目前只有 `theme`）。
- `GAMES`（`lib/games-registry.ts`）：遊戲列表；`getGameBySlug(slug)`。

### 型別

- `GameStatus = 'idle' | 'playing' | 'paused' | 'gameOver'`（**所有遊戲共用**）
- `GameDifficulty = 'easy' | 'medium' | 'hard'`
- `GameMeta`：slug、name、description、emoji、tags、difficulty、implemented。

### 原則

- **優先複用既有元件，不要重複造輪子。** 若需要新的共用元件（例如「虛擬方向鍵」），
  先討論，獲確認後放進 `components/ui/` 或 `components/layout/`，並回寫本檔。

## 4. 新增遊戲 SOP

```
[ ] 確認已讀過 CLAUDE.md、PROJECT.md 最新版
[ ] 從 main 切分支：git checkout -b feat/<slug>
[ ] 提出實作計畫（玩法規則、技術方案、會複用哪些既有元件）→ 等使用者確認
[ ] 建立遊戲頁：app/games/<slug>/page.tsx，用 <GameShell> 包裝
[ ] 建立遊戲元件：components/games/<PascalName>/
[ ] 實作獨立 hook（use<PascalName>），元件只負責渲染
[ ] 動畫用 requestAnimationFrame；禁止用 setInterval 做主迴圈
[ ] 狀態 type 沿用 GameStatus；不要自定義 'over' / 'end' / 'start' 之類
[ ] 支援 RWD、鍵盤操作；手機用觸控或虛擬按鍵
[ ] 整合 localStorage 最高分（getHighScore / setHighScore）
[ ] 在遊戲頁內用 <GameShell instructions=...> 寫操作說明
[ ] 在 lib/games-registry.ts 把對應項 implemented 改為 true
[ ] 執行 pnpm build,確認通過
[ ] 列本次新增 / 修改的檔案清單給使用者審核
[ ] 審核通過後更新 CLAUDE.md 的「已完成遊戲」表格
[ ] git commit(Conventional Commits),不自動 push
[ ] 等使用者確認後合併回 main
```

## 5. 已完成遊戲清單

| 名稱 | slug | 完成日期 | 渲染方式 | 備註 |
|---|---|---|---|---|
| 踩地雷 | `minesweeper` | 2026-04-24 | DOM grid（`<button>`） | 三難度（9×9/16×16/16×30）、首擊 + 8 鄰保護、BFS flood fill、結算以橫幅顯示（非 Modal）、最佳時間用 `getBestTime/setBestTime` 存每難度。timer 用 `setInterval(250ms)` 更新 UI，不是動畫主迴圈。 |
| 五子棋 | `gomoku` | 2026-04-25 | SVG（無 Canvas） | 15×15、無禁手、PvP + 簡易 AI（單層啟發式打分，防守權重 1.1）、AI 模式悔棋一次 2 步、結算以橫幅顯示。戰績與偏好（模式 / 執色）用 `readJSON/writeJSON` 存（key：`gomoku:stats` / `gomoku:prefs`）。tabIndex 放在 wrapper `<div>` 而非 SVG 上：避免 Chromium 在 SVG 上畫 focus ring，並用 `select-none caret-transparent` + 全域 `.no-focus-ring` 抑制 caret 與 outline。 |

## 6. 程式碼慣例

- **命名**
  - Hook：`useXxx`，檔名 `useXxx.ts`（同資料夾）。
  - 元件：PascalCase，檔名與元件同名。
  - Slug：kebab-case（`bubble-shooter`）；資料夾用 PascalCase（`BubbleShooter`）。
- **檔案長度**：單一檔案 ≤ 300 行。超過時拆成多檔（例如 hook、純函式、子元件）。
- **註解語言**：繁體中文。註解寫 _why_，不寫 _what_。
- **遊戲迴圈**：`requestAnimationFrame`，含 `deltaTime` 計算，暫停時取消 rAF。
- **狀態機**：沿用 `GameStatus`。重玩時應回到 `'idle'` 或直接 `'playing'`，不要自訂
  `'reset'` 之類中間狀態。
- **TS**：`strict` + `noUncheckedIndexedAccess` 都已開；陣列索引要先判空。
- **不使用 `any`**；必要時用 `unknown` 並在範圍內收窄。
- **'use client'**：只有真的需要 hook / 事件處理的元件才加。遊戲主元件通常要加；
  純渲染元件留給 Server Component。

## 7. Git 工作流程

- **分支命名**：`feat/<slug>`、`fix/<desc>`、`chore/<desc>`、`refactor/<desc>`、`docs/<desc>`。
- **Commit 訊息**：Conventional Commits。
  - `feat: add minesweeper game`
  - `fix: resolve tetris rotation bug`
  - `refactor: extract shared game state hook`
  - `chore: update CLAUDE.md`
- **不自動 push**。commit 後列檔案清單、等使用者確認再 push / 合併。
- **主分支**：`main`。Vercel 監聽 main 自動部署。

## 8. 審核流程

每次做完新功能或遊戲，依序：

1. 執行 `pnpm build`，確保無 TS / build 錯誤。
2. 列出本次新增 / 修改 / 刪除的檔案清單給使用者。
3. 等使用者確認後再：
   - 更新 CLAUDE.md 的「已完成遊戲」表格。
   - 視需要更新「共用元件與工具」章節（若新增共用元件）。
4. 使用者確認合併後才做 merge / push。

### 注意事項：focusable SVG 的「白色 caret」陷阱

當 wrapper `<div>` 帶 `tabIndex={0}` 並包含 SVG `<text>` 子元素時，Chromium 會在
clicked 位置放一個 **blinking text caret**（一閃一閃的白色細線）。即使 `outline: none`
也擋不住，因為它不是 outline 而是 caret。

**對策**：包板的 div 一律加 `select-none caret-transparent`（或 inline
`caretColor: 'transparent'`）。本專案已在 `globals.css` 提供 `.no-focus-ring` 全域樣式
連同 outline / box-shadow 一併蓋掉。

## 9. 禁止事項

- ❌ 引入需要後端 / DB / Serverless Function 的功能。
- ❌ 安裝 > 100KB gzipped 的套件（例如完整遊戲引擎）除非獲批。
- ❌ 修改既有已審核通過的遊戲邏輯，除非使用者明確要求。
- ❌ 用 `setInterval` 做遊戲主迴圈（精度差、頁面切背景時易壞）。
- ❌ 把遊戲邏輯寫死在元件裡，應抽到 hook。
- ❌ 直接操作 `document` 的 class 名做全域切換（主題切換例外且已封裝）。

## 10. 每日協作模式

每天使用者會說「今天做 XXX」，你要：

1. 讀 `CLAUDE.md` 了解現況（特別是「已完成遊戲清單」與「共用元件」）。
2. 從 main 切 `feat/<slug>` 分支。
3. 提出實作計畫（玩法、技術方案、複用元件）給使用者確認。
4. 確認後開始寫程式。
5. 完成後 `pnpm build` 驗證 → 列檔案清單 → 等審核。
6. 審核通過：更新本檔、commit、等確認後合併 / 推送。

---

**變更紀錄精神**：本檔是協作契約，請在每次架構調整 / 新增遊戲後保持最新。對本檔的修改
也要走 commit（`chore: update CLAUDE.md`）。
