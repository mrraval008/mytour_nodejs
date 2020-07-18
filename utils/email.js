// https://mailsac.com/inbox/milan@mailsac.com for fake mail

const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const fs = require('fs');

sgMail.setApiKey(process.env.SENDGRID_APIKEY)

class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(" ")[0];
    this.url = url;
    this.from = process.env.EMAIL_FROM;
  }

  newTransport() {
    
    if (process.env.NODE_ENV.trim() === 'production') {
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD
        },
        tls: {
          rejectUnauthorized: false
        }
      })
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      },
      tls: {
              rejectUnauthorized: false
            }
    })
  }

  async send(template,subject){
    //send an actual mail

    //1 render HTMl bsed on template
    let html = fs.readFileSync(`${__dirname}/../templates/email/${template}.html`,
    'utf-8')

    html = html.replace("#name",this.firstName).replace("#url",this.url);

    //2 Define Emial options
    const mailOptions = {
      from: this.from,
      to:this.to,
      subject: subject,
      html
    };

    //3 create a transport and send email
    await this.newTransport().sendMail(mailOptions,function(err, info){
      if (err ){
        console.log(error);
      }
      else {
        console.log('Message sent: ' + info.response);
      }
    });
    // sgMail.send(mailOptions)

  }

  async sendWelcome(){
    await this.send('welcome',"Welcome to MyTours family")
  }

  async sendPasswordReset(){
    await this.send('passwordReset','MyTours - Your Password Reset Token {Valid for only 10 minutes}')
  }

}


  // const sendEmail = async options => {
  //   // 1) Create a transporter
  //   const transporter = nodemailer.createTransport({
  //     host: process.env.EMAIL_HOST,
  //     port: process.env.EMAIL_PORT,
  //     auth: {
  //       user: process.env.EMAIL_USERNAME,
  //       pass: process.env.EMAIL_PASSWORD
  //     },
  //     tls: {
  //       rejectUnauthorized: false
  //     }
  //   });

  //   // 2) Define the email options
  //   const mailOptions = {
  //     from: 'Milan Raval <milanraval008@gmail.com>',
  //     to: options.email,
  //     subject: options.subject,
  //     text: options.message
  //     // html:
  //   };

  //   // 3) Actually send the email
  //   await transporter.sendMail(mailOptions);
  // };

module.exports = Email;
