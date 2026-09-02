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

const TEMPLATES = {
  day1: buildDay1Email,
  day3: buildDay3Email
};

function buildDay1Email({ name }) {
  const rawName = getRecipientName(name);
  const displayName = escapeHtml(rawName);

  return {
    subject: "CodeRun Agent Lab：今天建议跑通 Week 0 Starter",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #17211b; line-height: 1.7; max-width: 640px;">
        <p style="margin: 0 0 12px;">${displayName}，你好：</p>
        <p>昨天你领取了 CodeRun Agent Lab 的 Week 0 LLM Gateway Starter。今天建议先完成一个很小但关键的目标：把项目在本地跑起来，并确认测试通过。</p>
        <p>这一步的价值不在于代码量，而在于提前体验完整自学版的项目节奏：运行、测试、复盘，并为 Week 1 LLM Gateway 做铺垫。</p>
        <div style="margin: 22px 0; padding: 18px; border: 1px solid #d8ded6; border-radius: 10px; background: #f7f8f5;">
          <h2 style="font-size: 18px; margin: 0 0 10px;">Week 0 今天建议完成</h2>
          <ol style="margin: 0; padding-left: 20px;">
            <li>打开 Week 0 交付页，进入 GitHub 仓库。</li>
            <li>Clone 项目并执行 <code>pytest</code>。</li>
            <li>启动服务后访问 <code>/docs</code> 和 <code>/health</code>。</li>
            <li>在作品集模板里记录测试结果和 100 字复盘。</li>
          </ol>
        </div>
        <p>
          <a href="${STARTER_URL}" style="display: inline-block; padding: 12px 18px; background: #1f7a4d; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 700;">继续完成 Week 0</a>
        </p>
        <p>完成后可以提交成果：<a href="${COMPLETION_FORM_URL}">${COMPLETION_FORM_URL}</a></p>
        <p>如果你已经确定要系统完成 Week 1-4，也可以直接查看完整自学路线：<a href="${PROGRAM_URL}">${PROGRAM_URL}</a></p>
        <p>GitHub 仓库：<a href="${REPO_URL}">${REPO_URL}</a></p>
        <p style="color: #657168; font-size: 13px; margin-top: 28px;">如果你已经完成第一步，可以继续看 Week 0 里的自查清单和下一步路线。</p>
      </div>
    `,
    text: `${rawName}，你好：\n\n昨天你领取了 CodeRun Agent Lab 的 Week 0 LLM Gateway Starter。今天建议先完成一个很小但关键的目标：把项目在本地跑起来，并确认测试通过。\n\nWeek 0 今天建议完成：\n1. 打开 Week 0 交付页，进入 GitHub 仓库。\n2. Clone 项目并执行 pytest。\n3. 启动服务后访问 /docs 和 /health。\n4. 在作品集模板里记录测试结果和 100 字复盘。\n\nWeek 0 交付页：${STARTER_URL}\nGitHub：${REPO_URL}\n完成后可以提交成果：${COMPLETION_FORM_URL}\n完整自学路线：${PROGRAM_URL}`
  };
}

function buildDay3Email({ name }) {
  const rawName = getRecipientName(name);
  const displayName = escapeHtml(rawName);

  return {
    subject: "CodeRun Agent Lab：完成 Week 0 后，可以这样进入 Week 1-4",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #17211b; line-height: 1.7; max-width: 640px;">
        <p style="margin: 0 0 12px;">${displayName}，你好：</p>
        <p>你领取 Week 0 LLM Gateway Starter 已经有几天了。如果你已经跑通项目，接下来可以重点思考：这个 Gateway 为什么是 Agent 系统的底层入口。</p>
        <p>如果你还没有开始，也可以先只完成 Week 0 启动任务。不要追求一次做完，先把本地运行和接口调用跑通。</p>
        <div style="margin: 22px 0; padding: 18px; border: 1px solid #d8ded6; border-radius: 10px; background: #f7f8f5;">
          <h2 style="font-size: 18px; margin: 0 0 10px;">Week 0 完成后建议继续做</h2>
          <ol style="margin: 0; padding-left: 20px;">
            <li>补全作品集 README。</li>
            <li>说明结构化输出、重试和成本统计的业务价值。</li>
            <li>判断自己是否继续进入 Week 1-4，完成 Tool Runtime、RAG Agent 和 FDE PoC。</li>
          </ol>
        </div>
        <p>
          <a href="${PROGRAM_URL}" style="display: inline-block; padding: 12px 18px; background: #17211b; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 700;">查看完整自学路线</a>
        </p>
        <p>如果你已经完成 Week 0，可以提交 GitHub 仓库链接、测试结果和复盘，方便我们判断你的完成情况：<a href="${COMPLETION_FORM_URL}">${COMPLETION_FORM_URL}</a></p>
        <p>Week 0 不是报名门槛。如果你已经确定要系统学习，可以直接申请完整自学版。</p>
        <p>Week 0 交付页：<a href="${STARTER_URL}">${STARTER_URL}</a></p>
        <p style="color: #657168; font-size: 13px; margin-top: 28px;">如果你遇到环境、测试或接口理解上的卡点，可以先对照项目包中的 Troubleshooting 和 Self Check 文档排查。</p>
      </div>
    `,
    text: `${rawName}，你好：\n\n你领取 Week 0 LLM Gateway Starter 已经有几天了。如果你已经跑通项目，接下来可以重点思考：这个 Gateway 为什么是 Agent 系统的底层入口。\n\nWeek 0 完成后建议继续做：\n1. 补全作品集 README。\n2. 说明结构化输出、重试和成本统计的业务价值。\n3. 判断自己是否继续进入 Week 1-4，完成 Tool Runtime、RAG Agent 和 FDE PoC。\n\nWeek 0 不是报名门槛。如果你已经确定要系统学习，可以直接申请完整自学版。\n\n完整自学路线：${PROGRAM_URL}\nWeek 0 交付页：${STARTER_URL}\n完成后可以提交成果：${COMPLETION_FORM_URL}`
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

      const buildTemplate = TEMPLATES[parsed.template];
      if (!buildTemplate) {
        return json({ ok: false, error: "template must be day1 or day3" }, { status: 400 });
      }

      const message = buildTemplate({ name: parsed.name });
      const sent = await sendResendEmail({ apiKey, from, to: parsed.email, message });
      if (!sent.ok) {
        return sent.response;
      }

      return json({ ok: true, provider: "resend", template: parsed.template, id: sent.id });
    } catch (error) {
      return json({ ok: false, error: error.message || "Failed to send email" }, { status: 400 });
    }
  }
};
