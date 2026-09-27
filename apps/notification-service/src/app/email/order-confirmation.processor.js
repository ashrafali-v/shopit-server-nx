const fs = require('node:fs/promises');
const path = require('node:path');
const handlebars = require('handlebars');
const nodemailer = require('nodemailer');

const templatePath = path.join(__dirname, 'templates', 'order-confirmation.hbs');
const smtpPort = Number.parseInt(process.env.SMTP_PORT || '1026', 10);
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: smtpPort,
  secure: false,
  ...(process.env.NODE_ENV === 'production'
    ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } }
    : {}),
});

handlebars.registerHelper('multiply', (left, right) => Number(left) * Number(right));

module.exports = async (job) => {
  const data = job.data;
  const source = await fs.readFile(templatePath, 'utf8');
  const render = handlebars.compile(source, { strict: true });
  const result = await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@shopit.com',
    to: data.email,
    subject: `Order Confirmation #${data.orderId}`,
    html: render({
      name: data.customerName,
      orderId: data.orderId,
      items: data.items,
      total: data.totalAmount,
    }),
  });

  return { messageId: result.messageId };
};