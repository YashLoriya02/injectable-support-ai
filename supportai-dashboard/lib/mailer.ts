import nodemailer from "nodemailer";

type MailOptions = {
  from: string;
  to: string;
  subject: string;
  html: string;
  attachments?: [];
};


const mailer = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendMail({
  to,
  subject,
  html,
  attachments
}: {
  to: string;
  subject: string;
  html: string;
  attachments?: [];
}) {
  const options: MailOptions = {
    from: `"Support AI" <${process.env.EMAIL_FROM!}>`,
    to,
    subject,
    html,
  };

  if (attachments && attachments.length > 0) {
    options.attachments = attachments;
  }

  await mailer.sendMail(options);
}

export async function sendVerificationEmail(params: {
  to: string;
  name?: string;
  verifyUrl: string;
}) {
  const subject = "Verify your SupportAI account";
  const html = `
  <!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">

<table cellpadding="0" cellspacing="0" style="width:500px; padding:20px 30px; margin: auto; border-radius: 20px">
  <tr>
    <td align="center">
      
      <table width="100%" max-width="520" cellpadding="0" cellspacing="0" 
        style="border-radius:16px; padding:10px;">
       
        <tr>
          <td align="center" style="padding-bottom:8px;">
            <h1 style="margin:0;color:#000000;font-size:22px;font-weight:700;">
              Verify your email address
            </h1>
          </td>
        </tr>

        <tr>
          <td align="center" style="padding-bottom:4px;">
            <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">
              ${params.name
      ? `Hi ${params.name},`
      : "Welcome,"
    } <br/>
              Thanks for signing up for <strong>Support AI</strong>.  
              Please confirm your email to activate your account and start using the AI support widget.
            </p>
          </td>
        </tr>

        <tr>
          <td align="center" style="padding:16px 0 16px 0;">
            <a href="${params.verifyUrl}" 
              style="
                display:inline-block;
                background:linear-gradient(135deg,#7C3AED,#9333EA);
                color:#FFFFFF;
                text-decoration:none;
                padding:14px 28px;
                border-radius:12px;
                font-weight:600;
                font-size:15px;
                box-shadow:0 8px 24px rgba(124,58,237,0.35);
              ">
              Verify Email
            </a>
          </td>
        </tr>

        <tr>
          <td style="padding-bottom:20px;">
            <p style="margin:0;color:#6B7280;font-size:12px;line-height:1.6;text-align:center;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="word-break:break-all;margin:8px 0 0 0;text-align:center;">
              <a href="${params.verifyUrl}" 
                 style="color:#7C3AED;font-size:12px;text-decoration:none;">
                ${params.verifyUrl}
              </a>
            </p>
          </td>
        </tr>

        <tr>
          <td style="border-top:1px solid rgba(0,0,0,0.08);padding-top:10px;">
            <p style="margin:0;color:#6B7280;font-size:12px;line-height:1.5;text-align:center;">
              This verification link will expire in 24 hours for security reasons.
              <br/><br/>
              If you did not create this account, you can safely ignore this email.
            </p>
          </td>
        </tr>

      </table>

      <table width="100%" max-width="520" cellpadding="0" cellspacing="0" style="margin-top:10px;">
        <tr>
          <td align="center">
            <p style="margin:0;color:#9CA3AF;font-size:12px;">
              © ${new Date().getFullYear()} Support AI. All rights reserved.
            </p>
          </td>
        </tr>
      </table>

    </td>
  </tr>
</table>
</body>
</html>
  `

  await sendMail({
    to: params.to,
    subject,
    html
  });
}
