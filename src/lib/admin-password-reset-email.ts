function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character];
  });
}

export function adminPasswordResetEmail(input: { resetUrl: string; supportUrl: string; year?: number }) {
  const resetUrl = escapeHtml(input.resetUrl);
  const supportUrl = escapeHtml(input.supportUrl);
  const year = input.year ?? new Date().getFullYear();
  return {
    subject: 'Agora Admin — Password Reset',
    text: [
      'Agora Admin',
      '',
      'Reset your administrator password',
      '',
      'A password reset was requested for your Agora Super Admin account.',
      `Use this one-time link to reset it: ${input.resetUrl}`,
      '',
      'After the reset, sign in again and complete TOTP verification.',
      '',
      'If you did not request this reset, ignore this message. Your password will remain unchanged.',
      `Support: ${input.supportUrl}`,
      '',
      `© ${year} Agora Ghana`,
    ].join('\n'),
    html: `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>Agora Admin — Password Reset</title></head>
  <body style="margin:0;background:#f3f5f2;font-family:Arial,Helvetica,sans-serif;color:#17251d;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">A secure password reset was requested for your Agora Admin account.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 12px;background:#f3f5f2;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border:1px solid #e3e9e3;border-radius:16px;">
          <tr><td style="padding:30px 32px 12px;"><strong style="font-size:20px;letter-spacing:1.8px;color:#173b2b;">AGORA</strong><div style="margin-top:7px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#738077;">Administrator security</div></td></tr>
          <tr><td style="padding:18px 32px 30px;">
            <h1 style="margin:0 0 16px;font-size:25px;line-height:1.3;">Reset your administrator password</h1>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.65;color:#56635a;">A password reset was requested for your Agora Super Admin account. Use the one-time link below to choose a new password. You will need to sign in again and complete TOTP verification.</p>
            <table role="presentation" cellspacing="0" cellpadding="0"><tr><td style="border-radius:8px;background:#173b2b;"><a href="${resetUrl}" style="display:inline-block;padding:14px 22px;color:#fff;font-weight:700;text-decoration:none;">Reset Admin Password</a></td></tr></table>
            <p style="margin:22px 0 0;font-size:13px;line-height:1.6;color:#66736a;">This link can only be used once. If you did not request it, ignore this email; your password will remain unchanged.</p>
            <p style="margin:18px 0 0;font-size:13px;color:#66736a;">Need help? <a href="${supportUrl}" style="color:#173b2b;">Contact Agora Support</a>.</p>
          </td></tr>
          <tr><td style="border-top:1px solid #e8ece7;padding:18px 32px;text-align:center;font-size:12px;color:#879188;">© ${year} Agora Ghana · Admin security</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`,
  };
}
