/* eslint-disable no-console */
const nodemailer = require('nodemailer');
const createEmailTemplate = require('../helpers/createEmailTemplate');

/**
 * Send Email notifications.
 * @param {Array<String>} emails - The recipients' emails.
 * @param {String} type - The type of email, which determines the template.
 * @param {Object} data - The data needed for the email.
 */
const sendEmail = (emails, type, data) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const { subject, text, html } = createEmailTemplate(type, data);

  const mailOptions = {
    from: `"Juardi Admin" <${process.env.EMAIL_USER}>`,
    to: emails,
    subject,
    text,
    html,
  };

  return transporter.sendMail(mailOptions);
};

module.exports.sendEmail = sendEmail;
