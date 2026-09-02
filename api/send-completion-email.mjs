import {
  PROGRAM_URL,
  STARTER_URL,
  escapeHtml,
  getRecipientName,
  isEmail,
  json,
  sendResendEmail
} from "./_email-common.mjs";

async function parseCompletionRequest(request) {
  const rawBody = await request.text();

  if (rawBody.length > 32_000) {
    return { error: json({ ok: false, error: "Request body is too large" }, { status: 413 }) };
  }

  const body = rawBody ? JSON.parse(rawBody) : {};
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const intent = typeof body.intent === "string" ? body.intent.trim() : "";
  const pytestResult = typeof body.pytestResult === "string" ? body.pytestResult.trim() : "";
  const taskCount = typeof body.taskCount === "string" ? body.taskCount.trim() : "";
  const repoUrl = typeof body.repoUrl === "string" ? body.repoUrl.trim() : "";

  if (!isEmail(email)) {
    return { error: json({ ok: false, error: "A valid email is required" }, { status: 400 }) };
  }

  return { email, name, intent, pytestResult, taskCount, repoUrl };
}

function formatResultList({ pytestResult, taskCount, repoUrl }) {
  const items = [];

  if (repoUrl) {
    items.push(`GitHub 仓库：${repoUrl}`);
  }

  if (pytestResult) {
    items.push(`测试结果：${pytestResult}`);
  }

  if (taskCount) {
    items.push(`已完成任务数：${taskCount}`);
  }

  return items;
}

function buildEmail({ name, intent, pytestResult, taskCount, repoUrl }) {
  const rawName = getRecipientName(name);
  const displayName = escapeHtml(rawName);
  const resultItems = formatResultList({ pytestResult, taskCount, repoUrl });
  const escapedResultItems = resultItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const isHighIntent = intent === "愿意参加";

  const subject = isHighIntent
    ? "CodeRun Agent Lab：免费包成果已收到，下一步进入完整路线确认"
    : "CodeRun Agent Lab：免费包成果提交已收到";

  const nextStepHtml = isHighIntent
    ? `
        <p>你在表单中选择了愿意继续完整自学版。我们会结合你的仓库、测试结果和复盘内容，人工确认是否适合进入首批完整路线。</p>
        <p>在收到进一步说明前，你可以先查看完整路线页，确认 4 周项目节奏、交付方式和适合人群。</p>
        <p>
          <a href="${PROGRAM_URL}" style="display: inline-block; padding: 12px 18px; background: #17211b; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 700;">查看完整自学路线</a>
        </p>
      `
    : `
        <p>你已经完成了免费项目包的关键闭环。建议保留好仓库 README、pytest 结果和复盘内容，这些会成为你后续展示 AI Agent 工程能力的第一份材料。</p>
        <p>如果你准备继续系统完成 LLM Gateway、Tool Runtime、RAG Agent 和 FDE PoC Pack，可以先查看完整自学路线。</p>
        <p>
          <a href="${PROGRAM_URL}" style="display: inline-block; padding: 12px 18px; background: #17211b; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 700;">查看完整自学路线</a>
        </p>
      `;

  const resultHtml = escapedResultItems
    ? `
        <div style="margin: 22px 0; padding: 18px; border: 1px solid #d8ded6; border-radius: 10px; background: #f7f8f5;">
          <h2 style="font-size: 18px; margin: 0 0 10px;">本次提交记录</h2>
          <ul style="margin: 0; padding-left: 20px;">${escapedResultItems}</ul>
        </div>
      `
    : "";

  const resultText = resultItems.length ? `\n\n本次提交记录：\n${resultItems.map((item) => `- ${item}`).join("\n")}` : "";
  const nextStepText = isHighIntent
    ? `你在表单中选择了愿意继续完整自学版。我们会结合你的仓库、测试结果和复盘内容，人工确认是否适合进入首批完整路线。\n\n完整自学路线：${PROGRAM_URL}`
    : `你已经完成了免费项目包的关键闭环。建议保留好仓库 README、pytest 结果和复盘内容，这些会成为你后续展示 AI Agent 工程能力的第一份材料。\n\n完整自学路线：${PROGRAM_URL}`;

  return {
    subject,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #17211b; line-height: 1.7; max-width: 640px;">
        <p style="margin: 0 0 12px;">${displayName}，你好：</p>
        <p>我们已经收到你提交的 CodeRun Agent Lab 免费项目包成果。感谢你完成这次项目闭环，也感谢你把测试结果和复盘信息提交给我们。</p>
        ${resultHtml}
        ${nextStepHtml}
        <p style="color: #657168; font-size: 13px; margin-top: 28px;">你收到这封邮件，是因为你在 CodeRun Agent Lab 免费项目包成果提交表中填写了邮箱。免费项目包页面：<a href="${STARTER_URL}">${STARTER_URL}</a></p>
      </div>
    `,
    text: `${rawName}，你好：\n\n我们已经收到你提交的 CodeRun Agent Lab 免费项目包成果。感谢你完成这次项目闭环，也感谢你把测试结果和复盘信息提交给我们。${resultText}\n\n${nextStepText}\n\n免费项目包页面：${STARTER_URL}`
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
      const parsed = await parseCompletionRequest(request);
      if (parsed.error) {
        return parsed.error;
      }

      const message = buildEmail(parsed);
      const sent = await sendResendEmail({ apiKey, from, to: parsed.email, message });
      if (!sent.ok) {
        return sent.response;
      }

      return json({
        ok: true,
        provider: "resend",
        template: "completion",
        intent: parsed.intent || null,
        id: sent.id
      });
    } catch (error) {
      return json({ ok: false, error: error.message || "Failed to send email" }, { status: 400 });
    }
  }
};
