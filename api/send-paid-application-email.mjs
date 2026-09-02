import {
  PAID_FORM_URL,
  PROGRAM_URL,
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
    subject: "CodeRun Agent Lab 首批自学内测报名已收到",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #17211b; line-height: 1.7; max-width: 640px;">
        <p style="margin: 0 0 12px;">${displayName}，你好：</p>
        <p>感谢你申请 CodeRun Agent Lab 首批自学内测。我们已经收到你的报名信息，接下来会根据你填写的背景、免费项目包完成情况和报名版本，人工确认是否适合进入首批。</p>
        <p>CodeRun Agent Lab 当前主打的是项目制自学：通过 LLM Gateway、Tool Runtime、RAG Agent 和 FDE PoC Pack，帮助你沉淀一套可以展示和复盘的 AI Agent 工程作品。</p>
        <div style="margin: 22px 0; padding: 18px; border: 1px solid #d8ded6; border-radius: 10px; background: #f7f8f5;">
          <h2 style="font-size: 18px; margin: 0 0 10px;">后续你会收到什么</h2>
          <ol style="margin: 0; padding-left: 20px;">
            <li>首批自学版的完整交付说明。</li>
            <li>4 周项目路线和每周产出要求。</li>
            <li>早鸟名额、价格和后续 AI 陪练版升级说明。</li>
            <li>是否适合加入首批的人工确认结果。</li>
          </ol>
        </div>
        <p>如果你还没有完成免费项目包，建议先把 LLM Gateway Starter 跑通。完成免费包后再进入完整自学版，学习路径会更稳。</p>
        <p>
          <a href="${PROGRAM_URL}" style="display: inline-block; padding: 12px 18px; background: #17211b; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 700;">查看完整自学路线</a>
        </p>
        <p style="color: #657168; font-size: 13px; margin-top: 28px;">你收到这封邮件，是因为你在 CodeRun Agent Lab 首批自学内测报名表中提交了邮箱。报名表链接：<a href="${PAID_FORM_URL}">${PAID_FORM_URL}</a></p>
      </div>
    `,
    text: `${rawName}，你好：\n\n感谢你申请 CodeRun Agent Lab 首批自学内测。我们已经收到你的报名信息，接下来会根据你填写的背景、免费项目包完成情况和报名版本，人工确认是否适合进入首批。\n\n后续你会收到：\n1. 首批自学版的完整交付说明。\n2. 4 周项目路线和每周产出要求。\n3. 早鸟名额、价格和后续 AI 陪练版升级说明。\n4. 是否适合加入首批的人工确认结果。\n\n完整自学路线：${PROGRAM_URL}\n报名表链接：${PAID_FORM_URL}`
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

      return json({ ok: true, provider: "resend", template: "paid-application", id: sent.id });
    } catch (error) {
      return json({ ok: false, error: error.message || "Failed to send email" }, { status: 400 });
    }
  }
};
