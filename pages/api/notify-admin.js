import nodemailer from 'nodemailer'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { firstName, middleInitial, lastName, suffix, email, contactNo, region, province, city, barangay } = req.body

  if (!firstName || !lastName || !email) {
    return res.status(400).json({ error: 'Missing required fields' })
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

    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || 'admin@example.com'
    const formatName = (first, middle, last, suffix) => {
      let parts = [];
      if (last) parts.push(last);
      let firstSuffix = [first, suffix].filter(Boolean).join(' ');
      if (firstSuffix) parts.push(firstSuffix);
      if (middle && middle !== 'N/A') parts.push(middle);
      return parts.join(', ');
    }
    const name = formatName(firstName, middleInitial, lastName, suffix)

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER || '"eRSBSA System" <noreply@ersbsa.gov.ph>',
      to: adminEmail,
      subject: `New RSBSA Request from ${name}`,
      text: `A new RSBSA request has been submitted.\n\nDetails:\nName: ${name}\nEmail: ${email}\nContact No.: ${contactNo || '-'}\nLocation: ${barangay}, ${city}, ${province}, ${region}\n\nPlease review this request in the admin dashboard here: https://e-rsbsa.vercel.app/admin\n\nThank you,\neRSBSA System`,
    }

    await transporter.sendMail(mailOptions)
    res.status(200).json({ success: true, message: 'Admin notified successfully.' })
  } catch (err) {
    console.error('Admin email sending error:', err)
    res.status(500).json({ error: 'Failed to notify admin.' })
  }
}
