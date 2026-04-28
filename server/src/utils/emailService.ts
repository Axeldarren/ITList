import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL || 'IT List <onboarding@resend.dev>';

// ─── HTML email template ───────────────────────────────────
function buildEmailHtml(title: string, body: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
            <tr><td align="center">
                <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
                    <!-- Header -->
                    <tr><td style="background:linear-gradient(135deg,#3b82f6,#6366f1);padding:24px 32px;">
                        <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">IT List</h1>
                    </td></tr>
                    <!-- Body -->
                    <tr><td style="padding:28px 32px;">
                        <h2 style="margin:0 0 12px;color:#18181b;font-size:16px;font-weight:600;">${title}</h2>
                        <p style="margin:0;color:#52525b;font-size:14px;line-height:1.6;">${body}</p>
                    </td></tr>
                    <!-- Footer -->
                    <tr><td style="padding:16px 32px;background:#fafafa;border-top:1px solid #e4e4e7;">
                        <p style="margin:0;color:#a1a1aa;font-size:11px;">You received this because email notifications are enabled. You can turn them off in your profile settings.</p>
                    </td></tr>
                </table>
            </td></tr>
        </table>
    </body>
    </html>`;
}

// ─── Send email (fire-and-forget) ──────────────────────────
export async function sendNotificationEmail(
    to: string,
    title: string,
    message: string
): Promise<void> {
    // Temporarily disable email notifications for production
    return;

    if (!process.env.RESEND_API_KEY) {
        // Silently skip if Resend is not configured (dev environment)
        return;
    }

    try {
        await resend.emails.send({
            from: FROM_ADDRESS,
            to,
            subject: `IT List — ${title}`,
            html: buildEmailHtml(title, message),
        });
    } catch (error) {
        console.error('[Email] Failed to send:', error);
    }
}
