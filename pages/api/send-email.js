import nodemailer from 'nodemailer'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized access.' })
  }

  const token = authHeader.split(' ')[1]
  const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-development-only-12345'

  try {
    const jwt = (await import('jsonwebtoken')).default
    jwt.verify(token, JWT_SECRET)
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' })
  }

  const { email, image, refNo } = req.body

  if (!email || !image) {
    return res.status(400).json({ error: 'Email and image data are required.' })
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    // Extract base64 data to attach it directly as a file Buffer
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "")
    const buffer = Buffer.from(base64Data, 'base64')

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER || '"eRSBSA Admin" <noreply@ersbsa.gov.ph>',
      to: email,
      subject: `RSBSA Stub`,
      text: `Good day,\n\nYour RSBSA Stub is now verified and ready for download. Please print it out.\n\nThank you,\nOffice for the City Agricultural Services`,
      attachments: [{ filename: `RSBSA_Stub.jpg`, content: buffer, contentType: 'image/jpeg' }]
    }

    await transporter.sendMail(mailOptions)
    res.status(200).json({ success: true, message: 'Email sent successfully.' })
  } catch (err) {
    console.error('Email sending error:', err)
    res.status(500).json({ error: 'Failed to send email. Please check SMTP configuration.' })
  }
}