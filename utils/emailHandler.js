const nodemailer = require('nodemailer');
const pug = require('pug');
const { convert } = require('html-to-text');

//creating an email handler class
module.exports = class EmailHandler {
  constructor(user, url) {
    this.to = user;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Nilakash Basu <${process.env.EMAIL_FROM}>`;
  }

  //Create transporter service
  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      return 1;
    }
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  async sendEmail(template, subject) {
    //Render HTML based on pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject
    });
    //email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: convert(html, {
        wordwrap: 300
      })
    };

    //Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.sendEmail('welcome', 'Welcome to the Natours Family');
  }

  async sendPasswordReset() {
    await this.sendEmail(
      'passwordReset',
      'Your password reset token: (valid for only 10 min)'
    );
  }
};
