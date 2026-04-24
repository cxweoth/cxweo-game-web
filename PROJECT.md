# 專案：Mini Games Hub

建立一個前端小遊戲集合網站，部署目標為 Vercel。這是一個**長期專案**，未來會每天新增一個遊戲，所以架構要設計得容易擴充。

## Git / Repo 設定
- **遠端 repo**：`git@github.com:cxweoth/cxweo-game-web.git`
- 專案初始化時請執行：
```bash
  git init
  git remote add origin git@github.com:cxweoth/cxweo-game-web.git
  git branch -M main
```
- 建立 `.gitignore`（Next.js 標準：`node_modules`、`.next`、`.env*.local`、`.vercel` 等）
- **Commit 規範**：使用 Conventional Commits
  - `feat: add minesweeper game`
  - `fix: resolve tetris rotation bug`
  - `chore: update CLAUDE.md`
  - `refactor: extract shared game state hook`
- **分支策略**：
  - `main` 為正式分支，Vercel 會自動部署
  - 每個新遊戲開一個 feature 分支，例如 `feat/minesweeper`，我審核通過後再合併回 main
- **每次變更後**：先 commit，但**不要自動 push**，等我確認後再 push

## 技術規格
- **框架**：Next.js 15（App Router）+ TypeScript
- **樣式**：Tailwind CSS
- **狀態管理**：React hooks（useState / useReducer），不需要 Redux/Zustand
- **遊戲渲染**：HTML5 Canvas 或純 DOM/React 元件（依遊戲類型擇優）
- **儲存**：localStorage 儲存最高分、設定（不要用後端）
- **套件**：盡量用原生實作，僅在必要時引入輕量 library
- **不使用**：任何需要後端 API、資料庫、伺服器運算的功能

## 專案結構
```
/app
  /layout.tsx              # 共用 layout（導覽列、footer）
  /page.tsx                # 首頁（遊戲列表卡片）
  /games
    /<slug>/page.tsx       # 每個遊戲獨立路由
/components
  /ui                      # Button、Card、Modal 等共用元件
  /games                   # 每個遊戲的核心元件
  /layout                  # Header、Footer
/lib
  /storage.ts              # localStorage 封裝
  /games-registry.ts       # 遊戲註冊表（首頁列表從這讀）
  /utils.ts
/types
  /game.ts                 # 共用型別
CLAUDE.md                  # 專案指引（見下方）
README.md                  # 基本說明 + 本地開發指令
```

## 首波要實作的遊戲
1. **下樓梯**：角色踩台階下降，避免頂到天花板或踩到刺
2. **接球**：左右移動接住掉落的球，計分
3. **泡泡龍**：射擊相同顏色泡泡消除
4. **俄羅斯方塊**：經典規則，支援旋轉、加速下落
5. **踩地雷**：可選難度（初級 9x9/中級 16x16/高級 16x30）
6. **五子棋**：雙人對戰 + 簡易 AI

## 共用需求
- **首頁**：卡片式遊戲列表，從 `games-registry.ts` 自動生成
- **每個遊戲頁**：標題、操作說明、遊戲區域、計分板、重新開始、返回首頁
- **RWD**：桌機/平板/手機都要能玩（手機用觸控或虛擬按鍵）
- **鍵盤操作**：桌機版全部支援鍵盤
- **暗色模式**：Tailwind 的 dark: 樣式
- **無障礙**：基本的 aria-label、鍵盤焦點處理

## 品質要求
- TypeScript strict mode 開啟
- 每個遊戲主邏輯拆成獨立 hook（例如 `useTetris`），元件只負責渲染
- 遊戲迴圈用 `requestAnimationFrame`，不要用 `setInterval` 做動畫
- 單一檔案不超過 300 行
- 共用遊戲狀態（playing / paused / gameOver）做成統一 type

---

## 長期協作規範（重要）

這個專案**未來會每天新增一個遊戲**，由我提出主題、你負責實作，做完我審核。
請在專案根目錄建立 `CLAUDE.md`，並在每次新增遊戲/修改架構後持續更新。

### `CLAUDE.md` 必含內容

1. **專案總覽**
   - 專案目標、技術棧、部署方式（Vercel）
   - Repo：`git@github.com:cxweoth/cxweo-game-web.git`
   - 硬規則：不做後端、不做需要伺服器運算的遊戲

2. **目錄結構說明**
   - 每個資料夾用途
   - 新增遊戲時檔案應放哪裡

3. **共用元件與工具清單**
   - 現有 UI 元件（Button、Card、Modal…）、各自 props
   - 現有 hook、lib 函式
   - **原則：優先複用既有元件，不要重複造輪子**

4. **新增遊戲 SOP**（要很具體）
   - [ ] 從 main 切出新分支 `feat/<slug>`
   - [ ] 在 `/app/games/<slug>/page.tsx` 建立遊戲頁
   - [ ] 在 `/components/games/<Name>/` 建立遊戲元件
   - [ ] 在 `/lib/games-registry.ts` 註冊遊戲（名稱、slug、描述、難度、縮圖）
   - [ ] 實作獨立 hook 處理遊戲邏輯
   - [ ] 支援 RWD 與鍵盤/觸控操作
   - [ ] 整合 localStorage 最高分
   - [ ] 撰寫操作說明（顯示在遊戲頁）
   - [ ] 確認 `next build` 通過
   - [ ] Commit（conventional commits 格式）
   - [ ] 列變更檔案清單給使用者審核
   - [ ] 審核通過後更新 `CLAUDE.md` 的「已完成遊戲」清單
   - [ ] 合併回 main（由使用者執行或確認後執行）

5. **已完成遊戲清單**
   - 每個遊戲：名稱、slug、完成日期、渲染方式（Canvas/DOM）、特殊邏輯備註

6. **程式碼慣例**
   - hook 用 `useXxx`、元件用 PascalCase、slug 用 kebab-case
   - 檔案長度上限 300 行
   - 遊戲狀態 type 的統一寫法
   - 註解語言（建議繁體中文）

7. **Git 工作流程**
   - 分支命名：`feat/<slug>`、`fix/<desc>`、`chore/<desc>`
   - Commit 訊息：Conventional Commits
   - 不自動 push，等使用者確認

8. **審核流程**
   - 新增遊戲後先跑 `next build`
   - 列本次新增/修改檔案清單給使用者
   - 等確認後才更新 `CLAUDE.md` 已完成清單與合併 main

9. **禁止事項**
   - 不引入需要後端的功能
   - 不安裝大型套件（> 100KB gzipped）除非說明理由
   - 不修改既有已審核通過的遊戲邏輯（除非明確要求）

### 每日新增遊戲的互動模式
每天我會說「今天做 XXX」，你要：
1. 先讀 `CLAUDE.md` 了解現況
2. 從 main 切 `feat/<slug>` 分支
3. 提出實作計畫（玩法規則、技術方案、會用哪些既有元件）讓我確認
4. 我確認後才開始寫
5. 完成後列變更檔案清單給我審核
6. 審核通過後更新 `CLAUDE.md`、commit、等我確認後合併/推送

---

## 部署（Vercel）
- 確保 `next build` 通過
- README 寫清楚：本地開發指令、如何連接 Vercel（Import GitHub repo → 自動偵測 Next.js → Deploy）
- 提醒：main 分支推送後 Vercel 會自動部署

## 執行順序（首次建置）
一次做一個，每做完一個先讓我確認再繼續：
1. 專案初始化 + Git 設定 + 首頁 + 共用元件 + **建立 `CLAUDE.md`** + 第一次 commit（不要 push，等我確認）
2. 踩地雷（最單純、先驗證架構）
3. 五子棋
4. 接球
5. 俄羅斯方塊
6. 下樓梯
7. 泡泡龍（最複雜，最後做）

**開始前請先列出**：
- 實作計畫
- `CLAUDE.md` 的大綱
- 首次 commit 前的檔案結構預覽

讓我確認後再動工。