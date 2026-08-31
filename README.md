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

## 邮件自动交付

项目内置了 Vercel Serverless API：

```text
POST /api/send-starter-email
```

用途：飞书表单新增记录后，调用该接口，把免费项目包交付页发到用户填写的邮箱。

### Vercel 环境变量

在 Vercel 项目的 Settings -> Environment Variables 中配置：

```text
RESEND_API_KEY=你的 Resend API Key
STARTER_EMAIL_FROM=CodeRun Agent Lab <no-reply@syxpanda.com>
DELIVERY_WEBHOOK_SECRET=一段你自己生成的随机密钥
```

`DELIVERY_WEBHOOK_SECRET` 不要公开。飞书自动化调用接口时，需要把同一个值放到请求头：

```text
X-Delivery-Secret: 你的随机密钥
```

### 飞书自动化 HTTP 请求

当表单新增记录时，添加一个 HTTP 请求动作：

```text
Method: POST
URL: https://www.syxpanda.com/api/send-starter-email
Header:
  Content-Type: application/json
  X-Delivery-Secret: 你的随机密钥
Body:
{
  "email": "引用表单里的邮箱字段",
  "name": "引用表单里的姓名或者称呼字段"
}
```

### Resend 域名配置

在 Resend 里添加并验证 `syxpanda.com`，按 Resend 给出的 DNS 记录到域名服务商配置。验证成功后再使用 `no-reply@syxpanda.com` 发信。
