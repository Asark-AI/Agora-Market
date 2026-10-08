function escapeHtml(value: string): string {
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

export function passwordResetEmail(input: {
  resetUrl: string;
  supportUrl: string;
  year?: number;
}) {
  const resetUrl = escapeHtml(input.resetUrl);
  const supportUrl = escapeHtml(input.supportUrl);
  const year = input.year ?? new Date().getFullYear();

  return {
    subject: 'Reset your Agora password',
    text: [
      'Agora',
      '',
      'Reset your password',
      '',
      'We received a request to reset the password for your Agora account.',
      'Use the link below to choose a new password:',
      input.resetUrl,
      '',
      'This link is for your account and can only be used once.',
      'If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.',
      '',
      `Need help? Visit Agora Support: ${input.supportUrl}`,
      '',
      'Thanks,',
      'The Agora Ghana Team',
      `© ${year} Agora Ghana`,
    ].join('\n'),
    html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <title>Reset your Agora password</title>
  </head>
  <body style="margin:0;background:#f4f6f3;font-family:Arial,Helvetica,sans-serif;color:#17251d;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Use this secure link to reset your Agora account password.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6f3;padding:32px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e5eae4;border-radius:16px;">
          <tr><td style="padding:32px 32px 12px;">
            <div style="font-size:20px;font-weight:700;letter-spacing:2px;color:#173b2b;">AGORA</div>
            <div style="margin-top:8px;font-size:11px;letter-spacing:1.6px;text-transform:uppercase;color:#758178;">Agora Ghana</div>
          </td></tr>
          <tr><td style="padding:20px 32px 32px;">
            <h1 style="margin:0 0 16px;font-size:26px;line-height:1.25;color:#17251d;">Reset your password</h1>
            <p style="margin:0 0 14px;font-size:16px;line-height:1.6;color:#536057;">Hello,</p>
            <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#536057;">We received a request to reset the password for your Agora account. Select the button below to create a new password.</p>
            <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 24px;">
              <tr><td align="center" style="border-radius:9px;background:#173b2b;">
                <a href="${resetUrl}" style="display:inline-block;padding:14px 24px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;">Reset My Password</a>
              </td></tr>
            </table>
            <p style="margin:0 0 18px;font-size:13px;line-height:1.6;color:#66736a;">This secure link is for your account and can only be used once. If the button does not work, copy and paste this address into your browser:<br><a href="${resetUrl}" style="color:#173b2b;word-break:break-all;">${resetUrl}</a></p>
            <div style="border-top:1px solid #e8ece7;padding-top:18px;">
              <p style="margin:0 0 12px;font-size:13px;line-height:1.6;color:#66736a;">If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
              <p style="margin:0;font-size:13px;line-height:1.6;color:#66736a;">Need help? <a href="${supportUrl}" style="color:#173b2b;font-weight:600;">Contact Agora Support</a>.</p>
            </div>
            <p style="margin:24px 0 0;font-size:14px;line-height:1.7;color:#536057;">Thanks,<br><strong style="color:#173b2b;">The Agora Ghana Team</strong></p>
          </td></tr>
          <tr><td style="border-top:1px solid #e8ece7;padding:18px 32px;text-align:center;font-size:12px;color:#879188;">© ${year} Agora Ghana</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`,
  };
}
