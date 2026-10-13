const fs = require('node:fs');
const path = require('node:path');

const templates = [
  ['reset-password', 'Reset your Diamond Alibi password', 'Back to the clubhouse.', 'We received a request to reset your Diamond Alibi password. Choose a new password to get back to your clubhouse.', 'Reset password', 'If you didn’t request this, you can ignore this email. Your password stays the same.'],
  ['confirm-signup', 'Confirm your Diamond Alibi account', 'Welcome to the clubhouse.', 'Confirm your email to finish creating your Diamond Alibi player account. Then you’re ready to join your team and keep the stats honest.', 'Confirm email', 'If you didn’t create an account, you can ignore this email.'],
  ['magic-link', 'Your Diamond Alibi sign-in link', 'Your clubhouse is ready.', 'Use the button below to sign in to your Diamond Alibi account. This link can only be used once.', 'Sign in', 'If you didn’t request this link, you can ignore this email.'],
  ['invite-user', 'You’re invited to Diamond Alibi', 'There’s room in the clubhouse.', 'You’ve been invited to create a Diamond Alibi account. Use the button below to accept your account invitation.', 'Accept invitation', 'If you weren’t expecting this invitation, you can ignore this email.'],
  ['change-email', 'Confirm your Diamond Alibi email change', 'Keep your account in reach.', 'We received a request to change your Diamond Alibi sign-in email. Use the button below to confirm this email address.', 'Confirm email change', 'If you didn’t request this change, don’t confirm it. Sign in to your account and review your account security.'],
  ['reauthentication', 'Your Diamond Alibi verification code', 'One quick account check.', 'Enter this code in Diamond Alibi to verify your identity. Keep it private.', null, 'If you didn’t request this code, don’t share it or enter it.'],
];
const output = path.resolve('email-templates');
fs.mkdirSync(output, { recursive: true });
function render([name, subject, heading, copy, button, safety]) {
  const action = button
    ? `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td bgcolor="#78BE20" style="border-radius:8px;"><a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:16px 24px;color:#071A2B;font:700 16px Arial,sans-serif;text-decoration:none;border:1px solid #78BE20;border-radius:8px;">${button}</a></td></tr></table><p style="margin:24px 0 8px;color:#C4D2DF;font-size:14px;line-height:22px;">Button not working? Copy this link into your browser:</p><p style="margin:0;word-break:break-all;overflow-wrap:anywhere;font-size:14px;line-height:22px;"><a href="{{ .ConfirmationURL }}" style="color:#20B8C7;">{{ .ConfirmationURL }}</a></p>`
    : `<p style="margin:0;padding:18px;background-color:#071A2B;border:1px solid #20B8C7;border-radius:8px;text-align:center;color:#FFFFFF;font:700 28px monospace;letter-spacing:4px;">{{ .Token }}</p>`;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${subject}</title></head>
<body style="margin:0;padding:0;background-color:#071A2B;color:#FFFFFF;font-family:Arial,Helvetica,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${subject}. ${heading}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#071A2B"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;"><tr><td style="padding:0 12px 20px;">
<p style="margin:0;color:#FFFFFF;font-size:26px;font-weight:700;line-height:34px;">Diamond Alibi</p>
<p style="margin:6px 0 0;color:#20B8C7;font-size:14px;line-height:22px;">The stats don’t lie. Your teammates might.</p>
</td></tr><tr><td bgcolor="#0B2F4A" style="padding:28px 24px;border-top:4px solid #20B8C7;border-radius:10px;">
<h1 style="margin:0 0 16px;color:#FFFFFF;font-size:26px;line-height:34px;">${heading}</h1>
<p style="margin:0 0 24px;color:#E0E9F1;font-size:16px;line-height:26px;">${copy}</p>
${action}
${name === 'reset-password' ? '<p style="margin:20px 0 0;color:#C4D2DF;font-size:14px;line-height:22px;">Open this link in the same browser where you requested the reset.</p>' : ''}
<p style="margin:24px 0 0;padding-top:20px;border-top:1px solid #426079;color:#C4D2DF;font-size:14px;line-height:22px;">${safety}</p>
</td></tr><tr><td style="padding:20px 12px;color:#C4D2DF;font-size:12px;line-height:20px;">Diamond Alibi · Account security<br>Keep your sign-in links and codes private.</td></tr></table>
</td></tr></table></body></html>\n`;
}
const subjects = {};
for (const template of templates) {
  fs.writeFileSync(path.join(output, template[0] + '.html'), render(template));
  subjects[template[0]] = template[1];
}
fs.writeFileSync(path.join(output, 'subjects.json'), JSON.stringify(subjects, null, 2) + '\n');
// This static preview never contains a real account link or sends an email.
fs.writeFileSync(path.join(output, 'preview-reset.html'), render(templates[0]).replaceAll('{{ .ConfirmationURL }}', 'https://example.invalid/reset').replaceAll('{{ .Token }}', '123456'));
console.log('Prepared six account templates, subjects and a synthetic reset preview.');
