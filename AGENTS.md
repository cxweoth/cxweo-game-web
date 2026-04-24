<!-- 提供給非 Claude Code 的 AI agent 工具（Cursor、Copilot CLI 等）讀取。
     專案規則的單一事實來源是 CLAUDE.md。 -->

@CLAUDE.md

## Next.js 16 注意事項

本專案使用 Next.js 16 + React 19 + Tailwind CSS 4，與訓練資料中常見的 Next.js 13/14
慣例可能不同。若不確定 API 用法，查 `node_modules/next/dist/docs/` 內的 md 檔。

常見差異：
- Tailwind 4 CSS-first：`tailwind.config.ts` 已移除，自訂主題寫在 `app/globals.css` 的
  `@theme` / `@custom-variant` 中。
- Dynamic route 的 `params` 為 `Promise`，要 `await`。
- Turbopack 為預設。
