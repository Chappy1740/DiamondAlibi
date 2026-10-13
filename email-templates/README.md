# Diamond Alibi account emails

Prepared for Supabase Authentication email templates. Copy each subject from subjects.json and the matching HTML file into its corresponding dashboard template. Save and inspect Preview one at a time, starting with Reset password. Preserve the original template for rollback before replacing it. These local files do not change hosted templates automatically.

| Supabase template | File |
| --- | --- |
| Reset password | reset-password.html |
| Confirm sign up | confirm-signup.html |
| Magic link | magic-link.html |
| Invite user | invite-user.html |
| Change email address | change-email.html |
| Reauthentication | reauthentication.html |

ConfirmationURL remains unchanged for link templates. Reauthentication uses Token. Never paste a real code or reset URL into these files. The reset copy states the existing same-browser requirement. Invitation wording describes an account invitation, not team membership.

Email-safe presentation tables, inline colors, readable type, large action buttons and visible backup links. No remote images, trackers, fonts or scripts. The locked logo is not redesigned: the header uses the product name as live text because current app artwork is protected by Access. Browser previews are local layout checks, not proof of Outlook rendering or inbox placement.

These are Supabase account emails. Cloudflare Access code emails use a separate service and are not changed by this package. No notification settings, sender settings or authentication behavior are changed by installing these templates. Security-notification templates are outside this package; enabling notifications requires separate review.

Reference: https://supabase.com/docs/guides/auth/auth-email-templates

Regenerate with node scripts/prepare-email-templates.cjs. Preview-reset.html contains only a synthetic link and is not an installable template.
