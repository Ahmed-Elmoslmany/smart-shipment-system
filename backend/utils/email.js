const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
    }
  });

  // Define email options
  const emailOptions = {
    from: "Triple S <triple-s@support.com>",
    to: options.email,
    subject: options.subject,
    text: options.message,

  }

  // send email
  await transporter.sendMail(emailOptions)
};


module.exports = sendEmail
