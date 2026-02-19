import { NextResponse } from 'next/server'

const DEFAULT_INQUIRY_TO = 'mhakmala7@gmail.com'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      fullName,
      email,
      phone,
      subject,
      message,
      userId,
      createdAt,
    } = body || {}

    if (!fullName || !email || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    const resendApiKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.RESEND_FROM_EMAIL
    const toEmail = process.env.INQUIRY_NOTIFICATION_TO || DEFAULT_INQUIRY_TO

    if (!resendApiKey || !fromEmail) {
      return NextResponse.json(
        {
          error: 'Email provider is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL.',
        },
        { status: 500 }
      )
    }

    const submittedAt = createdAt ? new Date(createdAt).toLocaleString() : new Date().toLocaleString()

    const text = [
      'New inquiry submitted',
      '',
      `Subject: ${subject}`,
      `Name: ${fullName}`,
      `Email: ${email}`,
      `Phone: ${phone || 'Not provided'}`,
      `User ID: ${userId || 'Unknown'}`,
      `Submitted: ${submittedAt}`,
      '',
      'Message:',
      message,
    ].join('\n')

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a">
        <h2 style="margin:0 0 12px">New Inquiry Received</h2>
        <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
        <p><strong>Name:</strong> ${escapeHtml(fullName)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone || 'Not provided')}</p>
        <p><strong>User ID:</strong> ${escapeHtml(userId || 'Unknown')}</p>
        <p><strong>Submitted:</strong> ${escapeHtml(submittedAt)}</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0" />
        <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
      </div>
    `

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: `[Inquiry] ${subject}`,
        text,
        html,
      }),
    })

    const payload = await response.json()
    if (!response.ok) {
      return NextResponse.json(
        { error: payload?.message || 'Failed to send inquiry email.' },
        { status: 502 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Unexpected error while sending inquiry email.' },
      { status: 500 }
    )
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
