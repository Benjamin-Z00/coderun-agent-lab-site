import {
  COMPLETION_FORM_URL,
  PROGRAM_URL,
  REPO_URL,
  STARTER_URL,
  escapeHtml,
  getRecipientName,
  json,
  parseEmailRequest,
  sendResendEmail
} from "./_email-common.mjs";

function buildEmail({ name }) {
  const rawName = getRecipientName(name);
  const displayName = escapeHtml(rawName);

  return {
    subject: "CodeRun Agent Lab Week 0 体验项目领取链接",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #17211b; line-height: 1.7; max-width: 640px;">
        <p style="margin: 0 0 12px;">${displayName}，你好：</p>
        <p>感谢你关注 CodeRun Agent Lab。我们已经收到你的 Week 0 体验项目领取申请，下面是 LLM Gateway Starter 的交付入口和启动建议。</p>
        <p>Starter 是完整自学版的 Week 0：它不是独立赠品，也不是报名门槛，而是 Week 1 LLM Gateway 的最小可运行版本。</p>
        <p>
          <a href="${STARTER_URL}" style="display: inline-block; padding: 12px 18px; background: #1f7a4d; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 700;">打开 Week 0 交付页</a>
        </p>
        <p>GitHub 仓库：<a href="${REPO_URL}">${REPO_URL}</a></p>
        <h2 style="font-size: 18px; margin-top: 24px;">Week 0 建议完成</h2>
        <ol>
          <li>Clone 项目并完成本地启动。</li>
          <li>访问 <code>/health</code> 确认服务正常。</li>
          <li>运行 <code>pytest</code> 看测试结果。</li>
          <li>阅读 <code>tasks/01-run-the-service.md</code>，写下 100 字复盘。</li>
        </ol>
        <p>完成后可以提交 GitHub 仓库链接、测试结果和复盘，我们会根据提交内容判断是否需要进一步跟进。你也可以不等完成 Week 0，直接查看并申请完整自学版。</p>
        <p>
          <a href="${COMPLETION_FORM_URL}" style="display: inline-block; padding: 10px 16px; background: #1f7a4d; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 700;">提交 Week 0 成果</a>
        </p>
        <div style="margin-top: 28px; padding: 18px; border: 1px solid #d8ded6; border-radius: 10px; background: #f7f8f5;">
          <h2 style="font-size: 18px; margin: 0 0 8px;">Week 0 后继续做什么？</h2>
          <p style="margin: 0 0 14px;">如果你希望在 Starter 的基础上继续完成真实 Provider、Tool Runtime、RAG Agent、Codebase Agent 和 FDE PoC 交付包，可以直接查看完整自学路线，并申请首批自学内测。</p>
          <a href="${PROGRAM_URL}" style="display: inline-block; padding: 10px 16px; background: #17211b; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 700;">查看并申请完整路线</a>
        </div>
        <p style="color: #657168; font-size: 13px; margin-top: 28px;">你收到这封邮件，是因为你在 CodeRun Agent Lab 表单中填写了领取 Week 0 体验项目。</p>
      </div>
    `,
    text: `${rawName}，你好：\n\n感谢你关注 CodeRun Agent Lab。我们已经收到你的 Week 0 体验项目领取申请，下面是 LLM Gateway Starter 的交付入口和启动建议。Starter 是完整自学版的 Week 0，不是独立赠品，也不是报名门槛，而是 Week 1 LLM Gateway 的最小可运行版本。\n\n交付页：${STARTER_URL}\nGitHub：${REPO_URL}\n\nWeek 0 建议完成：\n1. Clone 项目并完成本地启动。\n2. 访问 /health 确认服务正常。\n3. 运行 pytest 看测试结果。\n4. 阅读 tasks/01-run-the-service.md，写下 100 字复盘。\n\n完成后可以提交 GitHub 仓库链接、测试结果和复盘：${COMPLETION_FORM_URL}\n\n如果你希望在 Starter 的基础上继续完成真实 Provider、Tool Runtime、RAG Agent、Codebase Agent 和 FDE PoC 交付包，也可以直接查看并申请完整自学路线：${PROGRAM_URL}`
  };
}

export default {
  async fetch(request) {
    if (request.method !== "POST") {
      return json(
        { ok: false, error: "Method not allowed" },
        { status: 405, headers: { Allow: "POST" } }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.STARTER_EMAIL_FROM;
    const secret = process.env.DELIVERY_WEBHOOK_SECRET;

    if (!apiKey || !from || !secret) {
      return json({ ok: false, error: "Email service is not configured" }, { status: 500 });
    }

    if (request.headers.get("x-delivery-secret") !== secret) {
      return json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
      const parsed = await parseEmailRequest(request);
      if (parsed.error) {
        return parsed.error;
      }

      const message = buildEmail({ name: parsed.name });
      const sent = await sendResendEmail({ apiKey, from, to: parsed.email, message });
      if (!sent.ok) {
        return sent.response;
      }

      return json({ ok: true, provider: "resend", id: sent.id });
    } catch (error) {
      return json({ ok: false, error: error.message || "Failed to send email" }, { status: 400 });
    }
  }
};
