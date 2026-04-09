import type { Transporter } from 'nodemailer'

// Configuração do SMTP do Brevo
const SMTP_HOST = process.env.SMTP_HOST || 'smtp-relay.brevo.com'
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587')
const SMTP_USER = process.env.SMTP_USER || ''
const SMTP_PASS = process.env.SMTP_PASS || ''
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@nexiachat.com.br'
const FROM_NAME = process.env.FROM_NAME || 'NexIA Chat'

// Lazy initialization do transporter
let transporter: Transporter | null = null

async function getTransporter(): Promise<Transporter> {
  if (transporter) {
    return transporter
  }

  // Importação dinâmica do nodemailer para evitar problemas no build
  const nodemailer = await import('nodemailer')
  
  transporter = nodemailer.default.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true para 465, false para outras portas
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    tls: {
      // Não falhar em certificados inválidos (útil para desenvolvimento)
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  })

  return transporter
}

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<void> {
  // Se não houver configuração de SMTP, apenas loga (modo desenvolvimento)
  if (!SMTP_USER || !SMTP_PASS) {
    console.log('==========================================')
    console.log('[Email] Modo de desenvolvimento - Email não enviado')
    console.log(`Para: ${to}`)
    console.log(`Assunto: ${subject}`)
    console.log('==========================================')
    return
  }

  try {
    const transport = await getTransporter()
    const info = await transport.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''), // Fallback: remove tags HTML
      html,
    })

    console.log(`[Email] Enviado com sucesso: ${info.messageId}`)
  } catch (error: any) {
    console.error('[Email] Erro ao enviar:', error)
    throw new Error(`Falha ao enviar email: ${error.message}`)
  }
}

// Template de email para recuperação de senha
export function getPasswordResetTemplate(resetLink: string, userName?: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperação de Senha - NexIA Chat</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #8B7DB8 0%, #46347F 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #8B7DB8 0%, #46347F 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #6c757d;
    }
    .link-fallback {
      word-break: break-all;
      color: #8B7DB8;
      font-size: 12px;
      margin-top: 16px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Recuperação de Senha</h1>
    </div>
    <div class="content">
      <p>Olá${userName ? `, ${userName}` : ''}!</p>
      <p>Recebemos uma solicitação para redefinir a senha da sua conta no <strong>NexIA Chat</strong>.</p>
      <p>Clique no botão abaixo para criar uma nova senha:</p>
      <center>
        <a href="${resetLink}" class="button">Redefinir Minha Senha</a>
      </center>
      <p>Ou copie e cole o link abaixo no seu navegador:</p>
      <p class="link-fallback">${resetLink}</p>
      <p><strong>Importante:</strong> Este link é válido por <strong>1 hora</strong> e só pode ser usado uma vez.</p>
      <p>Se você não solicitou a recuperação de senha, ignore este email. Sua senha atual continuará segura.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} NexIA Chat. Todos os direitos reservados.</p>
      <p>Este é um email automático, por favor não responda.</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}
