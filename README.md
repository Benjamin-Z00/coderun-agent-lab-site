# CodeRun Agent Lab Site

CodeRun Agent Lab 是面向后端、脚本、运维和测试开发者的 AI Agent 自学实战平台落地页。

## 产品定位

不用等老师讲课。学习者按照项目路线写代码、跑测试、完成 Agent 工程任务，最终沉淀一套可展示的 AI Agent / FDE 作品集。

## 部署建议

第一版可以直接使用 GitHub + Vercel：

1. 把 `coderun-agent-lab-site` 作为独立项目提交到 GitHub。
2. 在 Vercel 导入该仓库。
3. Framework Preset 选择 `Other`。
4. Build Command 留空。
5. Output Directory 留空或设置为 `.`。

后续平台化时建议分层：

- Vercel：官网、课程 API、用户进度、AI 辅助 API。
- Supabase / Neon：用户、课程、提交记录和进度数据。
- Judge0 / Piston / 自建 Docker Worker：代码执行和判题。

Vercel 不适合作为任意用户代码执行沙箱。
