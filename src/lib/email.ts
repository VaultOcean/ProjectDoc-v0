import "server-only";

const BASE_URL = process.env.NEXT_PUBLIC_URL ?? "https://vaultocean.com";

export async function sendVerificationEmail(
  to: string,
  handle: string,
  token: string
): Promise<void> {
  const link = `${BASE_URL}/api/auth/verify?token=${token}`;
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // No key set — log to server console so you can verify locally
    console.log(`[email:verify] ${to} → ${link}`);
    return;
  }

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="background:#020810;color:#e2e8f0;font-family:monospace;padding:40px 20px;max-width:480px;margin:0 auto">
  <p style="color:#2ee6d6;font-size:11px;letter-spacing:.12em;text-transform:uppercase;margin:0 0 24px">Vault Ocean</p>
  <h1 style="font-size:22px;font-weight:600;margin:0 0 16px;color:#f8fafc">Confirm your email</h1>
  <p style="font-size:14px;line-height:1.7;color:#94a3b8;margin:0 0 32px">
    Hi <strong style="color:#f8fafc">@${handle}</strong> — click below to verify your address and activate your account.
  </p>
  <a href="${link}" style="display:inline-block;background:#2ee6d6;color:#020810;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:.02em">
    Verify email address
  </a>
  <p style="font-size:11px;color:#475569;margin:28px 0 0;line-height:1.6">
    This link expires in 24 hours.<br>
    If you didn&apos;t sign up for Vault Ocean, ignore this email.
  </p>
</body>
</html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: "Vault Ocean <noreply@vaultocean.com>",
      to: [to],
      subject: "Verify your Vault Ocean account",
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`[email:verify] Resend error ${res.status}: ${err}`);
  }
}
