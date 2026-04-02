import nodemailer from 'nodemailer'

function createTransport() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST ?? 'smtp.ethereal.email',
    port:   parseInt(process.env.SMTP_PORT ?? '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
}

interface SendInviteEmailOptions {
  to: string
  inviteToken: string
  invitedByName: string
  role: string
  appUrl: string
}

export async function sendInviteEmail({ to, inviteToken, invitedByName, role, appUrl }: SendInviteEmailOptions) {
  const transport = createTransport()
  const signInUrl = `${appUrl}/login?invite=${inviteToken}`
  await transport.sendMail({
    from: `"Pi-Chat · Team 1676" <${process.env.SMTP_USER ?? 'noreply@team1676.org'}>`,
    to,
    subject: `${invitedByName} invited you to Pi-Chat — Team 1676`,
    text: `You've been invited to join Pi-Chat as a ${role}.\n\nSign in: ${signInUrl}`,
    html: `<div style="font-family:sans-serif;max-width:480px"><h2 style="color:#f5c518">You're invited to Pi-Chat</h2><p><strong>${invitedByName}</strong> invited you as <strong>${role}</strong>.</p><p><a href="${signInUrl}" style="display:inline-block;background:#f5c518;color:#0c0c0e;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:700">Sign In</a></p></div>`,
  })
}
