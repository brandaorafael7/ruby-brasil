import nodemailer from 'nodemailer';

export function getEmailTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, '');

  if (!user || !pass) {
    console.warn('[EMAIL] GMAIL_USER ou GMAIL_APP_PASSWORD não definidos no .env.');
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user,
      pass,
    },
  });
}

interface SendOtpParams {
  to: string;
  otpCode: string;
  expiresInMinutes?: number;
}

export async function sendOtpEmail({ to, otpCode, expiresInMinutes = 15 }: SendOtpParams) {
  const transporter = getEmailTransporter();
  const senderEmail = process.env.GMAIL_USER || 'contato@rubybr.com.br';

  const mailOptions = {
    from: `"RubyBR Segurança" <${senderEmail}>`,
    to,
    subject: `💎 Seu código de acesso ao Painel RubyBR: ${otpCode}`,
    html: `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Código de Acesso RubyBR</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; margin: 30px auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.6);">
            <tr>
              <td style="padding: 32px 32px 20px 32px; text-align: center; border-bottom: 1px solid #27272a; background: linear-gradient(180deg, rgba(225,29,72,0.15) 0%, rgba(24,24,27,0) 100%);">
                <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #e11d48, #9f1239); border-radius: 12px; line-height: 48px; font-size: 24px; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(225,29,72,0.4);">
                  💎
                </div>
                <h1 style="margin: 0; font-size: 22px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff;">
                  RUBY <span style="color: #fb7185;">BRASIL</span>
                </h1>
                <p style="margin: 4px 0 0 0; font-size: 11px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                  Autenticação Administrativa
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 32px;">
                <p style="margin: 0 0 14px 0; font-size: 15px; line-height: 24px; color: #e4e4e7;">
                  Olá, Administrador.
                </p>
                <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 22px; color: #a1a1aa;">
                  Uma solicitação de login seguro foi realizada para acessar o painel administrativo de <strong>rubybr.com.br</strong>. Utilize o código de 6 dígitos abaixo para concluir a autenticação:
                </p>
                <div style="background-color: #09090b; border: 1px solid #3f3f46; border-radius: 14px; padding: 24px; text-align: center; margin-bottom: 24px;">
                  <span style="font-size: 11px; text-transform: uppercase; font-weight: 800; letter-spacing: 1.5px; color: #fb7185; display: block; margin-bottom: 10px;">
                    Código de Acesso Único
                  </span>
                  <div style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #ffffff; text-shadow: 0 0 16px rgba(225,29,72,0.5);">
                    ${otpCode}
                  </div>
                  <span style="font-size: 12px; color: #71717a; display: block; margin-top: 10px;">
                    ⏱️ Este código expira em <strong>${expiresInMinutes} minutos</strong>
                  </span>
                </div>
                <div style="background-color: #27272a40; border-left: 3px solid #e11d48; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px;">
                  <p style="margin: 0; font-size: 12px; line-height: 18px; color: #d4d4d8;">
                    🛡️ <strong>Segurança:</strong> Se você não realizou esta solicitação, por favor ignore este e-mail. Nunca forneça este código a ninguém.
                  </p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px 32px; background-color: #09090b; border-top: 1px solid #27272a; text-align: center;">
                <p style="margin: 0; font-size: 11px; color: #52525b;">
                  © 2026 Ruby Brasil • Distribuição Direto de Fábrica • rubybr.com.br
                </p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  };

  return await transporter.sendMail(mailOptions);
}
