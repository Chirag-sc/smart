// Alternative SMS implementations for 2FA
// Choose one of these based on your needs

// Option 1: Email-based SMS (Free)
const nodemailer = require('nodemailer');

const sendEmailSMS = async (phoneNumber, code) => {
  // Create transporter (Gmail example)
  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS // Use App Password for Gmail
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: `${phoneNumber}@txt.att.net`, // AT&T SMS gateway
    subject: 'Smart SIT 2FA Code',
    text: `Your Smart SIT verification code is: ${code}. This code expires in 5 minutes.`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('SMS sent via email gateway');
  } catch (error) {
    console.error('Email SMS failed:', error);
  }
};

// Option 2: Free SMS APIs
const sendFreeSMS = async (phoneNumber, code) => {
  // Using TextBelt (free tier: 1 SMS per day)
  const response = await fetch('https://textbelt.com/text', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phone: phoneNumber,
      message: `Your Smart SIT verification code is: ${code}`,
      key: 'textbelt', // Free key
    }),
  });

  const result = await response.json();
  console.log('Free SMS result:', result);
};

// Option 3: WhatsApp Business API (Free for small volume)
const sendWhatsAppSMS = async (phoneNumber, code) => {
  // Using WhatsApp Business API
  const response = await fetch(`https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'text',
      text: {
        body: `Your Smart SIT verification code is: ${code}`
      }
    }),
  });

  const result = await response.json();
  console.log('WhatsApp SMS result:', result);
};

// Option 4: Telegram Bot (Free)
const sendTelegramSMS = async (phoneNumber, code) => {
  // Using Telegram Bot API
  const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: phoneNumber, // User's Telegram chat ID
      text: `Your Smart SIT verification code is: ${code}`
    }),
  });

  const result = await response.json();
  console.log('Telegram SMS result:', result);
};

module.exports = {
  sendEmailSMS,
  sendFreeSMS,
  sendWhatsAppSMS,
  sendTelegramSMS
};
