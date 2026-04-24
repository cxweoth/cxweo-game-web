# cxweo-game-web · Mini Games Hub

純前端小遊戲合集，每天新增一款遊戲。使用 **Next.js 16 + React 19 + TypeScript +
Tailwind CSS 4**，部署於 **Vercel**。

> AI agent 協作規則請讀 [`CLAUDE.md`](./CLAUDE.md) 與 [`PROJECT.md`](./PROJECT.md)。

## 本地開發

需求：Node ≥ 20、pnpm ≥ 10。

```bash
pnpm install
pnpm dev
```

開啟 http://localhost:3000。

### 其他常用指令

```bash
pnpm build   # 產生 production build（也會跑 type check）
pnpm start   # 本地跑 production build
pnpm lint    # ESLint
```

## 專案結構（摘要）

```
app/            App Router 頁面（layout.tsx / page.tsx / games/<slug>/）
components/     共用 UI、layout、theme、各遊戲元件
lib/            utils、storage、games-registry
types/          共用型別（GameStatus, GameMeta）
```

完整結構與新增遊戲 SOP 見 `CLAUDE.md`。

## 部署（Vercel）

1. 在 Vercel 匯入 GitHub repo（`cxweoth/cxweo-game-web`）。
2. Vercel 會自動偵測 Next.js → 點 Deploy。
3. 往後推送 `main` 會自動部署；feature 分支可用 Preview Deployment 預覽。

## 規則速記

- 純前端；不引入後端 / DB / 伺服器運算。
- 遊戲最高分、主題偏好存 localStorage。
- 新遊戲一律從 `feat/<slug>` 分支開始，完成後審核再合併 main。
- Commit 採 Conventional Commits；不自動 push。
