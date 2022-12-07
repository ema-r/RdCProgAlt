const dotenv = require("dotenv");
const nodemailer = require("nodemailer");

dotenv.config();

module.exports = {
  sendWelcomeMail: (email) => {
    /* send registration email */
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        type: "OAuth2",
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Conferma registrazione",
      html: `<h1> Registrazione a Socialify completata. Per iniziare a condividere <a href="https://localhost:443/">clicca qui</a>. </h1>`,
      auth: {
        type: "Bearer",
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_SECRET,
      },
    };

    transporter
      .sendMail(mailOptions)
      .catch((err) => console.error(err.message));
  },
};
