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
- **正式站**：https://game.cxweo.com/
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

### 物理 / 機械類益智遊戲(Spin-Out / Nine Rings 之類)的額外注意事項

當「玩家可操作的 UI 範圍(滑桿能拉到哪、按鈕能按到哪)」與「puzzle 規則
(canRotate / 合法狀態轉移)」是兩套獨立系統時:

1. **先用最小規模 trace 驗證可解性,再動 UI**。把 n=2 或 n=3 的最優解
   一步一步寫出來,標出每步當下的 UI 狀態(滑桿位置、能按哪顆),確認
   每一步在你的 UI 模型下都做得到。Spin-Out 第一版「單一固定槽 + 滑桿
   被卡住 + 原始 maxX 公式」trace 到第二步就卡死(旋鈕 K 永遠到不了
   單一槽),這時要回頭調公式,而不是硬幹 UI。
2. **三項衝突時直接告訴使用者**。「單一槽 / 滑桿可被卡 / 原始 puzzle 規則」
   這類三選二的數學限制要明講,讓使用者選要犧牲哪一項。Spin-Out 後來加
   1 格 free play 把「單一槽」往左挪一格達成相容,就是其中一種解法。
3. **解釋滑桿位置給使用者時用「格 / unit」,不要直接給 px 數字**。
   px 數字(72、144...)使用者看不出意義,「拉 0 格 / 拉 1 格」直觀很多。

## 5. 已完成遊戲清單

| 名稱 | slug | 完成日期 | 渲染方式 | 備註 |
|---|---|---|---|---|
| 踩地雷 | `minesweeper` | 2026-04-24 | DOM grid（`<button>`） | 三難度（9×9/16×16/16×30）、首擊 + 8 鄰保護、BFS flood fill、結算以橫幅顯示（非 Modal）、最佳時間用 `getBestTime/setBestTime` 存每難度。timer 用 `setInterval(250ms)` 更新 UI，不是動畫主迴圈。 |
| 五子棋 | `gomoku` | 2026-04-25 | SVG（無 Canvas） | 15×15、無禁手、PvP + 簡易 AI（單層啟發式打分，防守權重 1.1）、AI 模式悔棋一次 2 步、結算以橫幅顯示。戰績與偏好（模式 / 執色）用 `readJSON/writeJSON` 存（key：`gomoku:stats` / `gomoku:prefs`）。tabIndex 放在 wrapper `<div>` 而非 SVG 上：避免 Chromium 在 SVG 上畫 focus ring，並用 `select-none caret-transparent` + 全域 `.no-focus-ring` 抑制 caret 與 outline。 |
| 射箭 | `archery` | 2026-04-25 | Canvas + rAF | **首款 Canvas 遊戲**，800×480 內部解析度（CSS aspect-ratio 縮放）。物理：重力 + 水平風力，蓄力決定初速、滑鼠/鍵盤調仰角、放開射出。每箭隨機風（30–180 px/s²，顯示在 HUD），蓄力時繪預瞄虛線（含風預測）。10 環 FITA 配色標靶；落地判定用 segment-crossing 找箭與標靶平面交點再內插。物理 / 渲染狀態都在 ref，每幀 imperative 繪圖，**不**透過 React state 觸發 re-render；只在「箭落下」事件 dispatch 給 hook。最佳分用 `setHighScore('archery', total)` 存。**屬於 PROJECT.md 規格外的第 7 款**。 |
| 弓手獵怪 | `monster-hunt` | 2026-04-25 | Canvas + rAF | **規格外第 8 款**。雙方對射：玩家 HP 10、怪物 HP 5；怪物會 AI 飄移並週期射火球。為了維持 60fps，所有每幀變動的東西在單一 `worldRef` 物件裡（見 `physics.ts`），React state 只管 HP 與結束狀態。死亡瞬間有完整演出：能量爆裂環、26 顆飛散粒子（含重力與摩擦）、螢幕震動 380ms、屍體灰化旋轉下沉、「擊敗！/ K.O.」浮字。檔案拆成 `types`/`fx`/`physics`/`render-bg`/`render-actors`/`render-hud`/`render`/`useMonsterHunt`/`MonsterHunt`/`MonsterHuntCanvas` 以維持單檔 ≤ 300 行。 |
| 接球 | `catch-ball` | 2026-04-25 | Canvas + rAF | PROJECT.md 規格內 Phase 5。底部籃子接從上掉的彩球，金球（8% 機率）+5、普通 +1；3 顆紅心，漏球 −1。難度依「累計接球數」漸增：球速最高 ×3、生成間隔從 1500ms → 500ms（30 球達峰）。架構同 monster-hunt（單一 `worldRef` + `physics.ts` + 純函式 `render.ts`），但因規模小未拆 render，整檔仍在 300 行內。最佳分用 `setHighScore('catch-ball', total)`。 |
| 俄羅斯方塊 | `tetris` | 2026-04-26 | Canvas（離散，用 setTimeout 不用 rAF） | PROJECT.md 規格內 Phase 6。10×20、7 種方塊、7-bag 隨機、鬼影預覽、消行記分、按等級加速、軟降/硬降、暫停。沒實作 SRS 踢牆（撞到就拒絕旋轉）。動畫以 React state + useEffect+setTimeout 驅動，因為 Tetris 的世界是格狀離散的，rAF 反而過頭。除了鍵盤外提供 5 顆觸控按鍵（←/↻/→/↓ 軟降/DROP）給手機。最佳分 `setHighScore('tetris')`。 |
| 小朋友下樓梯 | `stairs` | 2026-04-26 | Canvas + rAF（直式 480×740） | PROJECT.md 規格內 Phase 7，後續完整重寫成 NS-SHAFT 致敬版。**6 種階梯**（normal/spike/spring/conveyor/crumbling/flip）配 10 格固定 slot 重生制；spring 用阻尼餘弦 squash & release、character 同步 squash & stretch；spike 拆「base + tips」兩 pass 渲染（base 在角色之前、tips 在角色之後 → 視覺上刺穿身體）；flip 翻轉繞長軸顯示木板上面 / 機關底面 + 兩端鉸鏈軸。**角色 100% procedural**：複刻 NS-SHAFT 招牌的「黑髮 + 白頭巾紅日點 + 黃道服 + 白褲 + 棕短靴」chibi 小朋友;受傷時以 12Hz 切換 NORMAL ↔ HURT 色板（紅染 + X 眼 + O 嘴 + ! 標記）。Web Audio API procedural 音效（spring/spike/crumble/flip/ceiling）。檔案拆 `types/game/sound/render/render-bg/render-stairs/render-spike/render-flip/render-char/render-man/render-hud/render-utils` 維持單檔 ≤ 300 行。最佳分 `setHighScore('stairs')`。 |
| 小蜜蜂 | `galaxian` | 2026-04-27 | Canvas + rAF（直式 480×640） | 規格外第 9 款，致敬 FC 經典 Galaxian。5×6 蜜蜂方陣整體擺動 + 碰邊下沉，速度隨擊殺數加速；每 1.4–2.6s 隨機派蜜蜂俯衝，用三角函數朝玩家當前位置直線飛，衝出底部從上方歸隊；俯衝中蜜蜂會偶爾投紅色炸彈。**波次差異化**：每波多 1 隻紅色「隊長」(captain) 在頂列，分數 ×2 + 金色皇冠視覺；偶數波從左開始擺動；waveScale = 1 + (wave−1)·係數（封頂 ×2.5）同時放大 swarm speed / dive speed / bomb chance、縮短 dive interval、每 3 波多 1 隻同時俯衝，整體下移最多 60px。**抓不到最後一隻的 bug 修掉**：returning 蜜蜂每幀重算 vx/vy 跟著移動的隊形，超過 4s 沒歸位就強制 snap;子彈 despawn 延後到 y < −60，能打到歸隊途中的高位蜜蜂。玩家底部水平軌道 + 4 發子彈上限 + 0.18s cooldown，鍵盤（←→/AD + 空白/↑/W）或滑鼠按住連射；3 命，受傷後 1.5s 無敵 + 14Hz 閃爍。子彈 / 蜜蜂 / 炸彈全用 AABB 碰撞。三層滾動星空背景；蜜蜂、玩家飛機、子彈、炸彈全 procedural（蜜蜂黃黑條紋 + 紅複眼 + 拍動翅膀，俯衝時還會旋轉朝向）。整波清空 +500 進下一波。Web Audio procedural 音效（shoot/hit/explode/wave）。檔案拆 `types/game/swarm/sound/render*` 維持 ≤ 300 行。最佳分 `setHighScore('galaxian')`。 |
| 泡泡連消 | `bubble-shooter` | 2026-04-26 | Canvas + rAF（直式 480×720） | PROJECT.md 規格內 Phase 8（最終一款；slug 沿用 bubble-shooter，顯示名「泡泡連消」）。蜂巢座標 12 欄、奇偶列偏移半格；五色（紅/藍/綠/黃/紫）。砲管瞄準（mouse 跟隨 / 鍵盤 ←→ 微調）、射出後撞牆反彈、撞既有泡泡 → snap 到最近相鄰空格。落點 BFS 找同色 ≥3 連通即消，再執行「漂浮泡泡」掉落（從第 0 列 BFS,沒被連到的全掉）。連續 7 次未消整盤往下推一列;泡泡接觸 loseRow 紅色虛線 → 失敗;清空整盤 → 勝利。下一顆顏色只從畫面殘存的色挑（避免發出絕對沒用的色）。最佳分 `setHighScore('bubble-shooter')`。 |
| 2048 | `2048` | 2026-04-30 | DOM 絕對定位 + CSS transition | 規格外第 10 款。4×4 棋盤、方向鍵 / WASD / 觸控滑動（門檻 24px）；reducer 純函式驅動。**滑動動畫連續性**：被合併的兩顆源 tile 不立刻消失，保留在 `state.vanishing` 跟著滑到合併目的格，動畫尾（220ms）後 hook 排程 cleanup 清空；merged tile 用 `tile-merge` 脈衝、新 spawn 用 `tile-pop`（兩個 keyframes 寫在 `globals.css`，延遲 80ms 等滑動跑完再彈）。tiles 用 `position: absolute` + `top/left` 百分比 + `--gap` CSS 變數定位，滑動 transition 130ms。字體用 `cqi`（container query inline）依數字位數縮小（12 / 10 / 8 / 6 cqi）避免 4 位數爆框。達 2048 顯示勝利橫幅可選擇繼續玩；棋盤滿 + 無相鄰同值對 → game over。最佳分 `setHighScore('2048')`。 |
| 貪食蛇 | `snake` | 2026-05-01 | Canvas + rAF（480×480 / 20×20 grid） | 規格外第 11 款。經典 Snake：方向鍵 / WASD / 觸控滑動（門檻 28px），吃蘋果 +10、長 +1 節、step 間隔 −5ms（180 起、封底 75ms）；撞牆或撞自己即結束。**插值平滑移動**：world 同時維護 `cells` 與 `prevCells`，render 用 `(now − lastStepAt) / stepInterval` 算 progress 把每 segment 從 prev lerp 到 cur，即使 75ms/step 也不會跳格。**方向 buffer 雙格**：`queueDir` 比對 buffer 末端（不是當前 dir），允許一格內連按兩次轉向（right→up→left）；180° 反向與重複方向會被丟掉。**避免「再玩一次要點兩次」競態**：useSnake 的 `restart()` 在同一個 callback 裡 `setStatus('playing')` + `setRunId(r+1)`，React 把兩者 batch 進同一次 render — `Snake.tsx` 不再用 useEffect 監聽 status 才 bump resetKey（兩段式更新會在中間夾一幀 rAF 用舊 world 重死，立刻把 status 翻回 gameOver）。蛇頭白眼睛跟方向旋轉，吃到時金黃脈衝環、紅蘋果 sin 呼吸；死亡 320ms 螢幕震動。檔案拆 `types/game/render/useSnake/SnakeCanvas/Snake` 維持單檔 ≤ 300 行。最佳分 `setHighScore('snake')`。 |
| 打地鼠 | `whack-a-mole` | 2026-05-02 | DOM 3×3 grid + SVG mole | 規格外第 12 款。30 秒倒數，地鼠隨機從 9 個地洞冒頭，點擊打中 +10、打空地 −2（不到負分）；遊戲後段 spawn 間隔 800→320ms、停留時間 1000→500ms 線性遞減。**rAF 統一推進**：useWhackAMole 用一個 rAF 迴圈做「狀態轉換 + 自動下沉 + 計時 spawn + 倒數 + 結算」，setHoles/setTimeLeft 在沒變化時回傳 prev 參考讓 React 跳過 re-render（避免 60fps 都重畫）。Hole 用 absolute mole + transition translateY 做「冒頭」效果；mole 是純 SVG（黃肚 + 棕身 + 兩顆牙 + 笑嘴/打中時 X 眼 O 嘴）；洞口前緣畫一片半圓土遮住下半身。最佳分 `setHighScore('whack-a-mole')`。 |
| 記憶翻牌 | `memory` | 2026-05-02 | DOM grid + CSS 3D rotateY | 規格外第 13 款。三難度：初級 4×3（6 對）/ 中級 4×4（8 對）/ 高級 6×4（12 對）；reducer 純函式：flip 加入 flippedIds，第二張立即比對 — 配對成功 → matched，不同 → 保留兩張翻起，由 useEffect 排 setTimeout 700ms 後 dispatch unflip。卡片用 CSS 3D：外層 `perspective: 1000px`、內層 `transform-style: preserve-3d`，正反面各 `backfaceVisibility: hidden`，背面預設、正面 `rotateY(180deg)`，狀態為 up/matched 時整個 inner `rotateY(180deg)` 顯示正面。Symbol 池 12 個 emoji（水果），洗牌用 Fisher–Yates。**最佳時間用 `getBestTime/setBestTime`** 每難度獨立記錄（沿用 Minesweeper 模式，key=`memory:easy/medium/hard`）。HUD：PAIRS / MOVES / TIME / BEST。 |
| 打磚塊 | `breakout` | 2026-05-02 | Canvas + rAF（橫式 640×480） | 規格外第 14 款。經典 Breakout：5 排 ×10 顆磚塊（紫/藍/綠/黃/紅 50/40/30/20/10 分），3 命；滑鼠 / 觸控 / 鍵盤←→/AD 控板。**Sticky ball + 自動發球**：每次發球前球黏在板上 800ms 讓玩家定位，stickySince 在 tick 內首次寫入 nowMs；自動發球角度 −60°~−120° 隨機。**反彈角度依命中位置**：板子中心直上、邊緣 ±75°，offset = (ball.x − paddleX) / (paddleW/2)。**子步進防穿透**：每幀依當前球速切成 ≤ ball 半徑 80% 的子步，每子步只結算一塊磚塊避免方向錯亂。磚塊用 circle vs AABB；反彈用最近邊緣的法向量反射並把球推出磚塊外 0.5px。打到磚塊速度 +0.5%（封底 620 px/s）+ 80ms 螢幕震動 + 6 顆色塊粒子（含重力）。每升一關發球速度 +10%、板子 −6 px（封底 50）。runId 在 start / 升級時 bump（`setStatus + setRunId` 同 callback batch 進同一個 render，避免競態）。檔案拆 `types/physics/render/useBreakout/BreakoutCanvas/Breakout` 維持 ≤ 300 行。最佳分 `setHighScore('breakout')`。 |
| 跳跳鳥 | `flappy-bird` | 2026-05-03 | Canvas + rAF（直式 480×640） | 規格外第 15 款，致敬 Flappy Bird。空白鍵 / ↑ / W / 點擊 / 觸控都當「拍翅」。物理：重力 1500、跳躍 −440、最大下墜 720（避免越掉越快視覺崩壞）。水管成對生成（中心間距 220、gap 150、寬 70），離場後從尾巴補；分數每 10 分 −8 px/s 加速，封底 −260。**狀態機 idle → playing → dying → dead**：撞到天花板/水管/地面後切 `dying`，鳥繼續落地後才轉 `dead`，期間粒子（22 顆 360° 飛散 + 重力 600）、白光 flash、抖動 0.32s 一次播完。idle 階段鳥用 `sin` 飄動 ±10px，第一次拍翅才正式進 playing(同時呼叫 onStart 同步 React state)。鳥的傾角依 vy 算 [−0.5, 1.1] rad；翅膀 `wingPhase = clamp(−vy/400, −1, 1)` 拍動。檔案拆 `types/game/render/useFlappyBird/FlappyBirdCanvas/FlappyBird` 維持 ≤ 300 行。最佳分 `setHighScore('flappy-bird')`。 |
| 數字推盤 | `fifteen` | 2026-05-03 | DOM 絕對定位 + CSS transition | 規格外第 16 款，經典 15 Puzzle。**Tile id = 數字本身**作 React key 而不是位置 index：當磚塊在格子間移動時 React 會把同一個 DOM 留下、只改 left/top，CSS `transition-[left,top]` 150ms 帶出滑動感（用 pos 當 key 會導致兩塊 tile 互換內容、無法產生位移動畫）。Board 用長度 16 的陣列、value=0 為空格；操作支援 (a) 點擊與空格相鄰的磚塊、(b) 鍵盤 ←↑↓→ / WASD、(c) 觸控 swipe（28px 門檻）。dir 語意一致：`up` = 把空格下方磚塊往上拉。**洗牌走 240 步隨機合法移動**（避免立刻反向以免抵銷）後若剛好還是 solved 再多推一步，保證起點有挑戰性。已歸位的磚塊變綠（`bg-emerald-500`）即時回饋。計時用 `setInterval(250ms)` 推一個 setNow 觸發再 render；最佳時間用 `getBestTime/setBestTime` key=`fifteen`。 |
| 黑白棋 | `reversi` | 2026-05-03 | SVG（無 Canvas） | 規格外第 17 款，經典 Reversi/Othello。8×8 棋盤、起手中央 4 子；落子時 8 方向 `flipsInDir` 找夾子並翻片；雙方都無步即結束、子多者勝。**PvP + 對 AI 模式**，AI 模式可選執黑/執白。AI 用線性啟發式：(1) 經典位置權重表（角 +100、X 角 −50）算「我方棋子總和」、(2) 對手機動性 `−oppMoves×4`、(3) 翻片數、(4) 角落特權 +50；終盤（空格 ≤ 12）切換成 `(我子 − 對方子) × 4 + 角獎`。多步同分隨機選一個避免每盤都一樣，避免 minimax 防止瀏覽器卡頓。AI 動作以 `setTimeout 380ms` 模擬思考延遲，玩家能看清楚翻片。useEffect 依賴 `board` 不只 `turn`：若連續輪到 AI（玩家 pass）board 變動仍會 re-trigger AI。戰績只在 AI 模式累計（W/L/D），用 `readJSON/writeJSON` 存 `reversi:stats / reversi:prefs`。提示點只在當前要落子方為人類時顯示。檔案拆 `types/logic/ai/useReversi/Reversi` 維持 ≤ 300 行。 |
| 連線四子 | `connect-four` | 2026-05-04 | SVG 7×6（含上方 hover 預覽棋子） | 規格外第 18 款，Connect 4。**Minimax + alpha-beta 剪枝** 預設深度 5；終局使用 `WIN_SCORE − (10−depth)` 對提前獲勝/延遲輸局加減分，鼓勵 AI 早點贏、晚點輸。**搜尋順序從中央往兩側展開**（Connect 4 中央列威脅最多）以提升剪枝效率。**chooseAiColumn 入口先單步檢查必勝/必擋**：避免 minimax 在低深度看不到一步致命招（會擋你下一手就贏的那欄）。評估函數用「4 格滑動視窗」對所有方向打分（`me=3+empty=1` +100、`foe=3+empty=1` −120 略加權優先擋）+ 中央列加權。AI 動作以 `setTimeout 360ms` 模擬思考。SVG hover 在欄頂顯示半透明預覽棋子（`hoverCol`）；落子後 `lastDrop` 加一圈白邊提示、贏家連成的 4 子加 cyan ring。`prefs:{mode,playerSide,aiDepth}` 與 `stats:{W/L/D}` 用 `readJSON/writeJSON` 存。檔案拆 `types/logic/ai/useConnectFour/ConnectFour` 維持 ≤ 300 行。 |
| 跳躍王 | `doodle-jump` | 2026-05-04 | Canvas + rAF（直式 360×640） | 規格外第 19 款，致敬 Doodle Jump。物理：重力 1400、跳 −680、彈簧 −1100。**世界 y 越上越小**、`cameraY` 只能下降不會回升（單向跟隨）；玩家爬升越高 `bestY` 越小,score = `(540 − bestY) / 4`。**自上而下落地判定**:`tryLand` 只在 `vy>0` 且「上一幀腳 ≤ 平台 y、這幀腳 ≥ 平台 y」才成立,避免跳躍時穿過上方平台;碰到平台立刻把腳對齊 y。**4 種平台**：normal(綠)/moving(藍 vx 隨機 40-90,撞牆反彈)/breakable(棕,踩中即碎並噴 10 顆粒子)/spring(黃,大彈)。**難度動態**:randomKindAtHeight 依 `climbed` 線性提升 moving / breakable 機率封頂。**側邊環繞**：玩家 px 越界 → 從另一側出現。輸入：鍵盤 ←→/AD 同時按取 sum;觸控用 pointerType 判斷,按住畫面左半 / 右半持續移動,放開即停。檔案拆 `types/game/render/useDoodleJump/DoodleJumpCanvas/DoodleJump` 維持 ≤ 300 行。最佳分 `setHighScore('doodle-jump')`。 |
| 推箱子 | `sokoban` | 2026-05-04 | DOM grid（CSS Grid + emoji） | 規格外第 20 款,經典 Sokoban。**字串地圖格式**(同 XSokoban):`#`牆 / ` `floor / `.`goal / `$`box / `*`box-on-goal / `@`player / `+`player-on-goal,`parseLevel` 拆成 `static`(永遠不變的 wall/floor/goal cells)+ `dynamic`(player position + boxes Set)。**內建 6 關**由淺入深(一推到位 → 轉角 → 雙箱齊發 → 十字四箱 → 走廊倉庫 → 凹字陣);Set 用 "r,c" 字串 key 比對方便。**Undo 歷史**:每步 push 整個 `Dynamic` 快照進 historyRef,Ctrl+Z 彈出;為了不爆記憶體封頂 500 步。**進度與最佳步數**用 `readJSON/writeJSON` 存(`sokoban:progress` 紀錄已通關 index、`sokoban:best` 紀錄每關最少步數)。操作:鍵盤 ←↑↓→/WASD,手機 swipe(門檻 24px),`Ctrl+Z` 復原、`R` 重置本關。Cell 用 emoji 渲染避免畫圖負擔(📦/🧑/◎/▓)。 |
| 關燈 | `lights-out` | 2026-05-04 | DOM 5×5（Tailwind ring + emoji） | 規格外第 21 款,經典 Lights Out。點任一格翻轉該格 + 上下左右 4 鄰;目標全暗。**保證可解**:從全暗開始亂點 N 次生成題目(easy=6 / normal=12 / hard=18),極端情況下亂點剛好回全暗就強制再點中央一格。**最佳步數每難度獨立記錄**用 `setBestTime` 語意(越少越好,key=`lights-out:easy/normal/hard:moves`),通關後 settledRef 鎖住避免反覆觸發 effect。亮燈用 `bg-yellow-400 + ring-4 ring-yellow-200` 配 💡 emoji,暗燈深灰配 ⚫。 |
| 數獨 | `sudoku` | 2026-05-04 | DOM 9×9 grid（CSS gap 模擬粗線） | 規格外第 22 款,經典 9×9 Sudoku。**4 難度即時生成保證唯一解**:easy=40 / medium=32 / hard=27 / expert=24 線索。生成流程:(1) `canonicalSolved` 用數學公式 `(((r%3)*3 + r/3) + c) % 9 + 1` 建出基底滿盤(O(81),不需要 backtracking)、(2) 帶內換列 / 帶間換、堆內換欄 / 堆間換、隨機 1..9 重新標籤打散得到隨機合法解、(3) `carvePuzzle` 隨機順序逐對 180° 對稱挖洞,每挖一對用 solveCount(limit=2) 驗證仍唯一解,不唯一就還原。**solver 用 row/col/box 三組 Int32Array bitmask + MRV(候選最少格優先)** 大幅加速,生成困難題目仍 ≤ 200ms。**功能**:選格(點擊或方向鍵)、填數字(1–9 / 鍵盤)、清除(Del/Backspace/0)、筆記模式(N 鍵切換,bit mask 存於 notes[81])、Ctrl+Z 復原、即時衝突高亮(同列/欄/宮重複數字標紅)、同列 / 同欄 / 同宮 / 同數字三層 highlight。**生成中** UI 鎖住按鈕並顯「生成中…」,實際用 `setTimeout(0)` 把 carve 丟到下個 tick 讓畫面先更新。檔案拆 `types/solver/generator/useSudoku/Sudoku` 維持 ≤ 300 行。每難度最佳時間用 `setBestTime` 存(`sudoku:<diff>`)。 |
| 邏輯神尺 | `spin-out` | 2026-05-05 | DOM + CSS transform（黑塑膠框 + 木刻度尺 + 七彩旋鈕 + 紅球把手） | 規格外第 24 款,Binary Arts 經典 Spin-Out。**數學上與九連環同構**(都對應 Gray code,V≡ON、H≡OFF)但視覺與機械語言截然不同。**單一金色旋轉槽機制**:框體只在 slot N−1(旋鈕 1 起始位置)有金色凹槽 + 上方 ▼ ROTATE 箭頭,**任何旋鈕都必須先被滑到金色槽中**才能轉(再加 puzzle 規則 `canRotate`)。旋鈕 K 對齊金色槽 ⇔ 滑桿位移 `T = K−1` 格(K=1 在 T=0、K=2 在 T=1、K=K 在 T=K−1)。**滑桿可被卡住**:`maxX = (consecutiveH + 1) × unit`(consecutiveH 從右算起連續 H 數)。**為何 +1 free play 不是裝飾而是數學必需**:若 `maxX = consecutiveH × unit`(原始 Spin-Out 模型),旋鈕 K(K≥2)依規則可轉時 maxX = (K−2)·unit,但要對齊單一固定槽需 T = (K−1)·unit > maxX → 永遠到不了槽 → 不可解。加 1 格 free play 後 maxX = (K−1)·unit 剛好觸及槽,且這 1 格對應「旋鈕 1 永遠可轉」(全 V 時也可把 1 推出讓 2 進槽);n=3 仍 5 步、n=7 仍 85 步,最優解未被破壞。**框體右側開口**:`rounded-l-2xl` 只收左側兩個圓角、`boxShadow` 不投右邊、slot recess 延伸到框右邊緣、只放左上左下 2 顆螺絲,看起來像「黃尺出口」。框體寬度 = `woodWidth + 88 + unit`(額外 1 格給旋鈕 1 右推進去),依 N=3/5/7 變化。**3/5/7 鈕**(7 鈕標準解 85 步、5 鈕 21、3 鈕 5)。**雙模式**:`release` / `lock`,最佳步數 key=`spin-out:<n>:<goal>`。**互動**:pointer events 拖把手控制 `dragX`,放開後 snap 到最近 unit;拖曳期間旋鈕鎖死,旋鈕沒對齊金色槽 / puzzle 規則拒絕都不能轉。**七彩旋鈕**:`DIAL_COLORS` 7 色彩虹色階(rose/orange/amber/green/cyan/blue/violet),每顆有彩色塑膠盤 + 同色拍片(8×30 rectangular tab,V/H 透過 rotate 0deg/90deg 切換)+ 中央銀色鉚釘。**底下觸控按鈕**:容器寬度與黃尺一致、左 margin 對齊黃尺左緣,每顆放在 72px 格子裡,正好對到上方旋鈕。`logic.ts` 與 NineRings 解耦(獨立 `stateToStepsFromAllHoriz` / `hintTowardAll{Horiz,Vertical}`)。**⚠ 技術債:SpinOut.tsx 目前 773 行**,超過 CLAUDE.md 的 300 行限制 — 下次動到這個遊戲時請先拆 `Frame` / `Slider` / `DialKnob` / `Wells` / `TouchPad` 子元件。 |
| 六貫棋 | `hex` | 2026-05-05 | SVG（pointy-top hex + axial coords + 四邊染色） | 規格外第 25 款,經典 Hex 連通棋（Piet Hein / Nash）。N=7/9/11 三種規模,黑連通**上下兩邊**勝、白連通**左右兩邊**勝;數學保證一定有人贏、無平局。**鄰接 6 方向**(axial rhombus):`(r-1,c) / (r-1,c+1) / (r,c-1) / (r,c+1) / (r+1,c-1) / (r+1,c)`。**勝負偵測**:從源邊上自己色的格子 BFS,只走相同色鄰位,觸及目標邊即贏（N=11 121 格,單次 BFS 微秒級,不需 Union-Find）;`findWinningPath` 用 parent 陣列回溯一條路徑供 UI 高亮 ring。**Pie 規則**(預設開):黑下完第一手後白方可選 Swap（`applySwap` 把那手改白色,輪回黑下第二手）以平衡先手優勢;玩家用 controls 列 Swap 按鈕,AI 是白方時用 `shouldSwap`(中央 ≤ N/4 區域 → swap)自動判斷。**AI 觸發 Swap 時頂部顯示琥珀色通知橫幅**(swapNotice state),避免玩家以為「白棋直接蓋掉黑棋」的 bug — 第一版測試立刻被使用者發現混淆。**啟發式 AI**:(1) 開局空盤直接下中央;(2) 對所有空格做必勝/必擋單步檢查（`isWinFor` after 假設落子）;(3) 對每個空格估算 `score = oppDistIfOppPlays - selfDistIfIPlay`,「最短連線距離」用樸素 O(V²) Dijkstra 計算（自己色 cell-cost=0、空=1、對手=∞）— 該值代表「還差幾手就能連通」,同時兼顧進攻與防守。**SVG 外緣染色**:`edgeColor(r, c, edgeIdx, n)` 對每 hex 6 條邊判斷外緣方向(對應 6 個鄰位之一缺失),染對應陣營色;角落衝突取 row 邊優先(黑 > 白)。黑邊深色 `#0f172a`、白邊灰色 `#94a3b8`(白色在木板上看不清)。**SVG layout**:`makeLayout(n)` 動態產生 viewBox（N=7 用 R=36、9 用 28、11 用 22）讓三種規模都落在約 600 寬。檔案拆 `types/logic/ai/layout/HexBoard/useHex/Hex` 維持 ≤ 300 行(最大 useHex 232 行)。戰績 W/L 用 `readJSON/writeJSON` 存 `hex:stats`,只在 AI 模式累計;prefs(mode/playerSide/size/pieRule)存 `hex:prefs`。 |
| 迷宮吃豆 | `maze-eater` | 2026-05-08 | Canvas + rAF（19×21 迷宮 + 中央 hudH 56 → CANVAS 456×560,worldRef + physics.ts 模式) | 規格外第 28 款,致敬 Pac-Man。**3 張迷宮輪流**(`mazeForLevel(level) = ALL_MAZES[(level-1) % 3]`):MAZE_0 經典對稱、MAZE_1 上下對稱開放走廊版、MAZE_2 = MAZE_0 左右鏡像(`split('').reverse()`)。**4 隻鬼性格 AI**:blinky 直追玩家、pinky 伏擊玩家前 4 格、inky「以 blinky 為支點對映玩家前 2 格」(從反向夾擊)、clyde 距離 > 8 追玩家 / ≤ 8 跑左下角。**鬼狀態機** `home → chase → frightened → eaten → home`;在 tile center 重選方向,不准 180° 反向(死路才強制反向);frightened 隨機選方向。**tile-center 轉向機制**:玩家用 `desiredDir` 緩衝按鍵,在 tile center ±3.5px 容差且該方向可走時 snap+轉向(經典 Pac-Man pre-turn 操作感)。**碰撞**:`Math.floor((nx + dx * (cell/2-1)) / cell)` look-ahead 半格,撞牆時把座標限制到當前 tile center。**難度遞增**:每關鬼速 ×(1+0.05·(level-1))封頂 1.5×、大力丸時長 7s→2.5s 每關 −0.6s。**水果系統**:吃完 30% 豆子後鬼屋下方 (col 9, row 14) spawn 1 顆水果,TTL 10s,剩 3s 閃爍;水果類型依 level:🍒300/🍓500/🍊700/🍎1000/🍉1500(L5+ 一律西瓜)。**鬼屋邏輯**:HOME_DOOR_ROW=8、HOME_INSIDE_ROW=9、4 隻 home tile [9,9]/[8,9]/[10,9]/[9,10],pinky/inky/clyde 各延後 2/4/6 秒出獄;eaten 抵達門口 (9,8) 切 home,1.4s 後再出。**結算 UI 疊在 Canvas 上**(absolute overlay + backdrop-blur),idle/gameOver/levelClear 都用同一個 overlay 顯示。**渲染**:藍色雙線牆(看 4 邊鄰居決定亮邊框)、豆子金色小點、大力丸 sin 閃爍、Pacman 嘴開合(`Math.abs(sin(mouthPhase))`)+ 跟方向旋轉、4 色鬼底部鋸齒身體 + 白眼瞳孔朝 dir、frightened 藍鬼 + 紅嘴 + 結束前 2s 閃白、eaten 只剩眼睛、水果用 emoji 渲染。**TS literal type 陷阱**:CFG `as const` 後 `CFG.ghostSpeed: 5.4` 是 literal,`let speed = CFG.ghostSpeed` 推為 5.4 → 後續賦值會 TS error,要 `let speed: number = ...`;同理 useState/useRef 用 CFG 常數時要顯式 `<number>`。檔案拆 `types/maze/physics/ai/render-bg/render-actors/render-hud/render/useMazeEater/MazeEaterCanvas/MazeEater` 維持 ≤ 300 行(最大 physics.ts 與 MazeEaterCanvas.tsx 約 270 / 200 行)。最高分用 `readJSON/writeJSON` 存 `maze-eater:stats`。 |
| 節奏方塊 | `geo-dash` | 2026-05-07 | Canvas + rAF（橫式 800×460,worldRef + physics.ts 模式 + Web Audio 配樂) | 規格外第 27 款,致敬 Geometry Dash 第一關 Stereo Madness。**雙模式**:(1) 60 秒**手工關**(致敬 Stereo Madness,LEVEL_END_X = 21600px),(2) **無盡模式**靠 `endlessNextChunk` procedural 生成,難度依走的距離分 5 段(< 2000 暖身、< 6000 單刺、< 12000 雙刺+方塊、< 20000 三刺+高方塊、20000+ 極限段),每段固定間距與機率產生不同障礙組合。**物理參數**:scrollSpeed 360px/s、jumpV 760、gravity 2200 → 跳躍寬度 ~248px、高度 ~131px(差不多剛好可跳過 1 個方塊的距離)。**碰撞規則**(致敬 GD):spike 任一接觸 → 死;block 從上落到頂(`vy >= 0 && prevBottomH >= topH - 2`)→ 落地踩上去,從側面 / 下方撞 → 死。**cube 旋轉**:空中持續轉(每秒 1.3 圈),落地時 `Math.round(rotation / (PI/2)) * (PI/2)` snap 到最近 90°,有 GD 經典「卡卡轉」感。**Web Audio procedural 配樂**(因原版〈Stereo Madness〉by ForeverBound 有版權):4/4 BPM 145 EDM,**lookahead scheduler** 每 25ms 把未來 100ms 內的事件排進 audioContext(避免 setTimeout 抖動),5 個樂器:kick(每拍 1 顆 sine 120→42Hz)、snare(noise + highpass 1100Hz)、hi-hat(noise + highpass 6500Hz,每 16 分音符)、bass(triangle 8 分音符,A 小調根音)、lead(sawtooth + lowpass 2200Hz,每拍 1 顆 arpeggio)。autoplay 限制下,音樂只在「玩家首次按下跳鍵」時 `audioContext.resume()` 啟動。**結算 UI 疊在 Canvas 上**(absolute overlay + backdrop-blur),不在外面;遊戲畫面凍結在死亡瞬間,死亡爆裂粒子 32 顆繼續跑完。**retrowave 美術**:深紫→粉紫→橘紅→暗紅 5 色階漸層天空、太陽 radial gradient(無條紋,第一版加了 destination-out 切橫條結果露出底色變白條 → 改成 clip + 半透明深紫覆蓋條紋仍不夠好看 → 最後完全移除)、遠山剪影、地面下方滾動格網(垂直線跟著 cameraX 滾動)。檔案拆 `types/level/physics/audio/fx/render-bg/render-actors/render-fx/render-hud/render/useGeoDash/GeoDashCanvas/GeoDash` 維持單檔 ≤ 300 行(最大 GeoDashCanvas.tsx 207 行)。最佳成績用 `readJSON/writeJSON` 存 `geo-dash:stats`(`bestLevelMs` / `bestEndless` / `levelClears`)。 |
| 劍盾決鬥 | `sword-duel` | 2026-05-05 | Canvas + rAF（橫式 800×460,worldRef + physics.ts 模式) | 規格外第 26 款,玩家騎士 vs 盾劍哥布林的 2D 近身戰鬥。**怪物 AI 狀態機**:`approach → guard → swing → hurt → dead`;距離拉開 → 走過來,進交戰範圍隨機 60% guard / 40% swing,被打中 → hurt 硬直 280ms 後切 guard。**核心戰鬥規則**:(1) 怪物 guard 時從正面打 = 0 傷害(冒「BLOCK」火星 + 黃光),(2) 怪物 **swing 時 facing 鎖定** — 玩家可繞背造成 1.5× **致命傷害**(顯示「致命 X!」金字),(3) 玩家受擊 420ms 無敵閃爍。**跳躍機制**:↑/W/Z 起跳,jumpV 740 + gravity 1450 → 最高跳到 ~189px;**vault 機制**:`!grounded && player.y <= -bossH * 0.5` 時暫時關閉碰撞 → 跳到怪物腰部以上即可從上方躍過去落到背後。沒有 vault 時 collision 用 `prevSide` 記錄玩家上一幀在 boss 哪一側,移動後若 side 翻轉或進入 minGap 內 → 直接 clamp 回原側 minGap 外(避免「半推」造成的左右翻轉穿牆 bug)。**參數平衡(經使用者測試後調整)**:玩家 HP 100、傷害 14、reach 70、swing 0.26s、cooldown 0.08s;怪物 HP 130、傷害 11、reach 72、swing 0.6s、guard 600-1100ms。**所有角色 100% procedural**:騎士藍衣金髮 + 銀劍(idle 角度 -75°,劍尖朝上略前傾的守備姿態);哥布林綠身 + 紅眼 + 獠牙 + 鋸齒劍 + 木盾(guard 時舉到身前 -90° + 蓋住 0,0)。揮劍弧光雙層(外圈藍光暈 + 內圈白色細弧),角色腳下橢圓陰影(跳起時縮小淡化)。**背景**:傍晚紫橘漸層天空、4 朵不同顏色雲層漂移、3 層山(遠/中/近)、11 棵中景樹剪影、前景 11 處草叢 + 6 朵小花(風吹擺動)+ 3 顆石頭。檔案拆 `types/ai/physics/fx/render-bg/render-knight/render-goblin/render-fx/render-hud/render-utils/render/useSwordDuel/SwordDuelCanvas/SwordDuel` 維持單檔 ≤ 300 行(最大 physics.ts 281 行)。戰績 W/L 用 `readJSON/writeJSON` 存 `sword-duel:stats`。 |
| 九連環 | `nine-rings` | 2026-05-05 | DOM + SVG（每環一個 SVG button） | 規格外第 23 款,中國經典 Baguenaudier。**核心規則遞迴**:環 1 永遠可動;環 k(k≥2) 可切換 ⇔ 環 k−1 ON 且環 1..k−2 全 OFF。**Gray code 等價**:每個合法狀態 ↔ 唯一整數 N ∈ [0, 2^n−1],一次合法操作 = N±1。`stateToStepsFromAllOff` 把 state 視作 Gray code 後做 inverse-Gray (`n ^= n>>1; n ^= n>>2; ...`) 還原 N → 即為「離全 OFF 還剩 N 步」;**雙向 hint** `hintTowardAllOff/AllOn` 共用 `diffRing(curN, targetN)`,比較 `g(curN) ⊕ g(targetN)` 找出該動的環(必恰一個 bit 不同)。`allOnStepsFromAllOff(n)` 用 inverse-Gray 算出全 ON 對應的 N(9 環為 341),所以雙向最少步數對稱一致。**雙模式**:`take-off`(全 ON → 全 OFF)/ `put-back`(全 OFF → 全 ON);最佳步數 key=`nine-rings:<n>:<goal>` 各自記錄。最佳走法步數公式:奇數環 `(2^(n+1)−1)/3`、偶數環 `(2^(n+1)−2)/3` — 9 環 341 步。**4 種規模 × 2 模式 = 8 個獨立紀錄**。**鐵環視覺**:木紋背景(repeating-linear-gradient 斜紋)+ 圓柱鐵桿(5 段亮暗漸層 + inset highlight/shadow + 球狀釘頭) + 三層 SVG 鐵環(黑色描邊 ⇢ 主環金屬漸層 ⇢ 內側 radial 陰影做孔深度) + 上弧白色高光 + 下弧黑色暗影 + 中央銅牌寫編號;ON / OFF 兩套金屬色(亮鐵 vs 暗沉鐵)。**雙層 transform**:外層 div 處理「環掉下/抬起」的 translateY,內層 svg 處理 shake 的 translateX,避免抖動時 OFF 環瞬間跳回 ON 位置。提示開時下一步該動的環頂端冒出 ✨;非法點擊觸發 220ms `ring-shake` 抖動 + 紅 stroke 漸層。檔案拆 `types/logic/useNineRings/NineRings` 維持 ≤ 300 行。 |

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
- **本地測試 server（自動啟停）**：每次做完一個任務（新遊戲、修 bug、改架構）→
  跑完 `pnpm build` 通過後，**主動以 background task 啟動 `pnpm dev`**，把可測 URL
  列給使用者（首頁 + 本次新增/修改的遊戲頁）。當使用者表示測試完成（任何形式：
  「commit」「好」「沒問題」「停掉」「OK」「下一個」等）→ **立刻 `TaskStop`** 把
  dev server 停掉再 commit/合併。不要長時間掛著、不要忘記關。`pnpm build` 是
  type/build 驗證、跟 dev server 是兩件事。

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
