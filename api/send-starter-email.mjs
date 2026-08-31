const RESEND_ENDPOINT = "https://api.resend.com/emails";
const STARTER_URL = "https://www.syxpanda.com/starter.html";
const REPO_URL = "https://github.com/Benjamin-Z00/llm-gateway-starter";

function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status || 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...(init.headers || {})
    }
  });
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isEmail(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function buildEmail({ name }) {
  const rawName = typeof name === "string" && name.trim() ? name.trim() : "同学";
  const displayName = escapeHtml(rawName);

  return {
    subject: "CodeRun Agent Lab 免费项目包领取链接",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #17211b; line-height: 1.7; max-width: 640px;">
        <h1 style="font-size: 24px; margin: 0 0 16px;">${displayName}，这是你的 LLM Gateway Starter 项目包</h1>
        <p>你可以先按交付页完成第一天任务，验证这套自学方式是否适合自己。</p>
        <p>
          <a href="${STARTER_URL}" style="display: inline-block; padding: 12px 18px; background: #1f7a4d; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 700;">打开项目包交付页</a>
        </p>
        <p>GitHub 仓库：<a href="${REPO_URL}">${REPO_URL}</a></p>
        <h2 style="font-size: 18px; margin-top: 24px;">第一天建议完成</h2>
        <ol>
          <li>Clone 项目并完成本地启动。</li>
          <li>访问 <code>/health</code> 确认服务正常。</li>
          <li>运行 <code>pytest</code> 看测试结果。</li>
          <li>阅读 <code>tasks/01-run-locally.md</code>，写下 100 字复盘。</li>
        </ol>
        <p style="color: #657168; font-size: 13px; margin-top: 28px;">你收到这封邮件，是因为你在 CodeRun Agent Lab 表单中填写了领取项目包。</p>
      </div>
    `,
    text: `${rawName}，这是你的 LLM Gateway Starter 项目包。\n\n交付页：${STARTER_URL}\nGitHub：${REPO_URL}\n\n第一天建议完成：\n1. Clone 项目并完成本地启动。\n2. 访问 /health 确认服务正常。\n3. 运行 pytest 看测试结果。\n4. 阅读 tasks/01-run-locally.md，写下 100 字复盘。`
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
      const rawBody = await request.text();

      if (rawBody.length > 32_000) {
        return json({ ok: false, error: "Request body is too large" }, { status: 413 });
      }

      const body = rawBody ? JSON.parse(rawBody) : {};
      const email = typeof body.email === "string" ? body.email.trim() : "";
      const name = typeof body.name === "string" ? body.name.trim() : "";

      if (!isEmail(email)) {
        return json({ ok: false, error: "A valid email is required" }, { status: 400 });
      }

      const message = buildEmail({ name });
      const resendResponse = await fetch(RESEND_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "User-Agent": "coderun-agent-lab-site/1.0"
        },
        body: JSON.stringify({
          from,
          to: email,
          subject: message.subject,
          html: message.html,
          text: message.text
        })
      });

      const data = await resendResponse.json().catch(() => ({}));

      if (!resendResponse.ok) {
        return json(
          { ok: false, error: "Email provider rejected the request", details: data },
          { status: 502 }
        );
      }

      return json({ ok: true, provider: "resend", id: data.id || null });
    } catch (error) {
      return json({ ok: false, error: error.message || "Failed to send email" }, { status: 400 });
    }
  }
};
