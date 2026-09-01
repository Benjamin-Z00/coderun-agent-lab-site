export const RESEND_ENDPOINT = "https://api.resend.com/emails";
export const STARTER_URL = "https://www.syxpanda.com/starter.html";
export const PROGRAM_URL = "https://www.syxpanda.com/#pricing";
export const REPO_URL = "https://github.com/Benjamin-Z00/llm-gateway-starter";

export function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status || 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...(init.headers || {})
    }
  });
}

export function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function isEmail(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export async function parseEmailRequest(request) {
  const rawBody = await request.text();

  if (rawBody.length > 32_000) {
    return { error: json({ ok: false, error: "Request body is too large" }, { status: 413 }) };
  }

  const body = rawBody ? JSON.parse(rawBody) : {};
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const template = typeof body.template === "string" ? body.template.trim() : "";

  if (!isEmail(email)) {
    return { error: json({ ok: false, error: "A valid email is required" }, { status: 400 }) };
  }

  return { email, name, template };
}

export async function sendResendEmail({ apiKey, from, to, message }) {
  const resendResponse = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "coderun-agent-lab-site/1.0"
    },
    body: JSON.stringify({
      from,
      to,
      subject: message.subject,
      html: message.html,
      text: message.text
    })
  });

  const data = await resendResponse.json().catch(() => ({}));

  if (!resendResponse.ok) {
    return {
      ok: false,
      response: json(
        { ok: false, error: "Email provider rejected the request", details: data },
        { status: 502 }
      )
    };
  }

  return { ok: true, id: data.id || null };
}

export function getRecipientName(name) {
  return typeof name === "string" && name.trim() ? name.trim() : "同学";
}
