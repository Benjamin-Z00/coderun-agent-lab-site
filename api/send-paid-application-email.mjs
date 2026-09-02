import {
  PAID_FORM_URL,
  PROGRAM_URL,
  escapeHtml,
  getRecipientName,
  json,
  parseEmailRequest,
  sendResendEmail
} from "./_email-common.mjs";

const MODULE_LABELS = {
  full: "4 周完整自学版",
  week1: "Week 1 LLM Gateway",
  week2: "Week 2 Tool Runtime",
  week3: "Week 3 RAG Agent",
  week4: "Week 4 FDE PoC Pack"
};

function normalizePlan(value) {
  if (typeof value !== "string") {
    return "full";
  }

  const text = value.trim().toLowerCase();
  if (!text) {
    return "full";
  }

  if (text.includes("week 1") || text.includes("week1") || text.includes("llm gateway")) {
    return "week1";
  }

  if (text.includes("week 2") || text.includes("week2") || text.includes("tool runtime")) {
    return "week2";
  }

  if (text.includes("week 3") || text.includes("week3") || text.includes("rag")) {
    return "week3";
  }

  if (text.includes("week 4") || text.includes("week4") || text.includes("fde") || text.includes("poc")) {
    return "week4";
  }

  return "full";
}

function getPlanValue(parsed) {
  const fields = parsed.extra || {};
  return fields.plan || fields.version || fields.course || fields.module || fields.interest || "";
}

function buildEmail({ name, plan }) {
  const rawName = getRecipientName(name);
  const displayName = escapeHtml(rawName);
  const normalizedPlan = normalizePlan(plan);
  const planLabel = MODULE_LABELS[normalizedPlan];
  const isFullPlan = normalizedPlan === "full";
  const subject = isFullPlan
    ? "CodeRun Agent Lab 完整自学版报名已收到"
    : `CodeRun Agent Lab ${planLabel} 单周模块申请已收到`;
  const planIntro = isFullPlan
    ? "你当前申请的是 4 周完整自学版。它更适合想从 LLM Gateway 一路做到 FDE PoC Pack，并沉淀一套完整作品集的人。"
    : `你当前申请的是 ${planLabel} 单周模块。它更适合已经有一定基础、只想按需补齐这一块能力的人；后续如果决定做完整作品集，也可以再补差进入 4 周完整路线。`;
  const deliveryItems = isFullPlan
    ? [
        "首批自学版的完整交付说明。",
        "4 周项目路线和每周产出要求。",
        "早鸟名额、价格和后续 AI 陪练版升级说明。",
        "适合的进入方式和后续开通安排。"
      ]
    : [
        `${planLabel} 的单周交付说明。`,
        "本周项目任务、参考实现和验收样例。",
        "单周价格、付款方式和资料开通安排。",
        "后续补差升级完整路线的规则说明。"
      ];

  return {
    subject,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #17211b; line-height: 1.7; max-width: 640px;">
        <p style="margin: 0 0 12px;">${displayName}，你好：</p>
        <p>感谢你申请 CodeRun Agent Lab 首批自学内测。我们已经收到你的报名信息，接下来会根据你填写的基础背景、学习目标和报名版本，人工确认适合的进入方式。</p>
        <p>${planIntro}</p>
        <p>CodeRun Agent Lab 当前主打的是项目制自学：通过 LLM Gateway、Tool Runtime、RAG Agent 和 FDE PoC Pack，帮助你沉淀一套可以展示和复盘的 AI Agent 工程作品。</p>
        <div style="margin: 22px 0; padding: 18px; border: 1px solid #d8ded6; border-radius: 10px; background: #f7f8f5;">
          <h2 style="font-size: 18px; margin: 0 0 10px;">后续你会收到什么</h2>
          <ol style="margin: 0; padding-left: 20px;">
            ${deliveryItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ol>
        </div>
        <p>Week 0 Starter 不是报名门槛。如果你还没有完成，也可以直接继续申请完整自学版；如果你愿意先体验，Starter 能帮助你提前熟悉 Week 1 LLM Gateway 的工程标准。</p>
        <p>
          <a href="${PROGRAM_URL}" style="display: inline-block; padding: 12px 18px; background: #17211b; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 700;">查看完整自学路线</a>
        </p>
        <p style="color: #657168; font-size: 13px; margin-top: 28px;">你收到这封邮件，是因为你在 CodeRun Agent Lab 首批自学内测报名表中提交了邮箱。报名表链接：<a href="${PAID_FORM_URL}">${PAID_FORM_URL}</a></p>
      </div>
    `,
    text: `${rawName}，你好：\n\n感谢你申请 CodeRun Agent Lab 首批自学内测。我们已经收到你的报名信息，接下来会根据你填写的基础背景、学习目标和报名版本，人工确认适合的进入方式。\n\n${planIntro}\n\n后续你会收到：\n${deliveryItems.map((item, index) => `${index + 1}. ${item}`).join("\n")}\n\nWeek 0 Starter 不是报名门槛。如果你还没有完成，也可以直接继续申请完整自学版；如果你愿意先体验，Starter 能帮助你提前熟悉 Week 1 LLM Gateway 的工程标准。\n\n完整自学路线：${PROGRAM_URL}\n报名表链接：${PAID_FORM_URL}`
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

      const message = buildEmail({ name: parsed.name, plan: getPlanValue(parsed) });
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
