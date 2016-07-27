var mongoose = require("mongoose");
var Joi = require("joi");
var _ = require("lodash");
var uuid = require("uuid");
var parse = require("mongoose-parse");
var async = require("async");
var mode = process.env.MODE || 'dev';
var clientHost = JSON.parse(require('fs').readFileSync(__dirname + '/../../config/' + mode + '/main.json'))[0][1];
var appName = require(__dirname + '/../../config.json').appName;

var credential = {
  'key': 'key-8e9fdb5ab02c9f7ada8e460ea502a131',
  'domain' : 'domain',
  'address' : 'no-reply@domain',

}
var mailer = require(__dirname + '/mailer.js')(credential);

var emailModel = function() {
  var registered = false;
  var m;
  try {
    m = mongoose.model("FailedEmails");
    registered = true;
  } catch(e) {
  }
  if (registered) return m;
  var schema = {
    from : String,
    to : String,
    subject : String,
    html : String,
    err : {}
  }
  var s = new mongoose.Schema(schema);
  m = mongoose.model("FailedEmails", s);
  return m;
}

var Email = function(server, options, next) {
  this.server = server;
  this.options = options || {};
}


Email.prototype.sendActivationUrl = function(email, obj) {
  console.log("sending activation email...");
  var msg = {
    from : "AppName <support@appname.com>",
    to : email,
    subject : "[ AppName ] - Konfirmasi Pendaftaran",
    html : "<style>body{font-family: Roboto, 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.846; color: rgb(102, 102, 102); background-color: rgb(255, 255, 255);}a{text-decoration: none;}.btn{text-transform: uppercase; border-right: none; border-bottom: none; -webkit-box-shadow: rgba(0, 0, 0, 0.298039) 1px 1px 2px; box-shadow: rgba(0, 0, 0, 0.298039) 1px 1px 2px; transition: all 0.2s; -webkit-transition: all 0.2s;}.btn{display: inline-block; margin-bottom: 0px; font-weight: normal; text-align: center; vertical-align: middle; touch-action: manipulation; cursor: pointer; background-image: none; border: 1px solid transparent; border-image-source: initial; border-image-slice: initial; border-image-width: initial; border-image-outset: initial; border-image-repeat: initial; white-space: nowrap; padding: 6px 16px; font-size: 13px; line-height: 1.846; border-radius: 3px; -webkit-user-select: none;}.btn-primary{color: rgb(255, 255, 255); background-color: rgb(30, 169, 132); border-color: transparent;}.btn-primary:hover{color: rgb(255, 255, 255); background-color: rgb(33, 186, 145); border-color: rgba(0, 0, 0, 0);}</style><body><p>Halo, </p><p>Terima kasih sudah mendaftar. Sebelum Anda dapat menggunakan akun Anda, Anda perlu mengkonfirmasi pendaftaran ini dengan mengklik tombol di bawah ini :<br><br><a class='btn btn-primary' href='" + clientHost + "/#/confirm/" + obj.activationCode +"'>Konfirmasi</a><br><br>Jika Anda mengalami kesulitan dengan akun Anda, silakan hubungi kami di support@appname.com </p><p>Terima kasih</p></body>",
  }
  mailer.sendText(msg.from, msg.to, msg.subject, msg.html, function(err, info) {
    if (err) {
      console.log(err);
     msg.err = err;
     emailModel().create(msg); 
    };
    console.log(info);
  });
}

Email.prototype.sendPasswordRecovery = function(email, recoveryCode) {
  console.log("sending password recovery email...");
  var msg = {
    from : "AppName <support@appname.com>",
    to : email,
    subject : "[ AppName ] - Atur Ulang Kata Sandi",
    html : "<style>body{font-family: Roboto, 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.846; color: rgb(102, 102, 102); background-color: rgb(255, 255, 255);}a{text-decoration: none;}.btn{text-transform: uppercase; border-right: none; border-bottom: none; -webkit-box-shadow: rgba(0, 0, 0, 0.298039) 1px 1px 2px; box-shadow: rgba(0, 0, 0, 0.298039) 1px 1px 2px; transition: all 0.2s; -webkit-transition: all 0.2s;}.btn{display: inline-block; margin-bottom: 0px; font-weight: normal; text-align: center; vertical-align: middle; touch-action: manipulation; cursor: pointer; background-image: none; border: 1px solid transparent; border-image-source: initial; border-image-slice: initial; border-image-width: initial; border-image-outset: initial; border-image-repeat: initial; white-space: nowrap; padding: 6px 16px; font-size: 13px; line-height: 1.846; border-radius: 3px; -webkit-user-select: none;}.btn-primary{color: rgb(255, 255, 255); background-color: rgb(30, 169, 132); border-color: transparent;}.btn-primary:hover{color: rgb(255, 255, 255); background-color: rgb(33, 186, 145); border-color: rgba(0, 0, 0, 0);}</style><body><p>Halo, </p><p>Seseorang meminta untuk mengatur ulang kata sandi akun anda. Jika itu memang Anda sendiri, silakan klik tombol di bawah ini untuk mengatur ulang kata sandi :<br><br><a class='btn btn-primary' href='" + clientHost + "/#/passrec/" + recoveryCode +"'>Atur Ulang Kata Sandi</a><br><br>Jika bukan anda yang meminta ini, silakan abaikan email ini. <br><br>Jika Anda mengalami kesulitan dengan akun Anda, silakan hubungi kami di support@appname.com </p><br><p>Terima kasih</p></body>",
  }
  mailer.sendText(msg.from, msg.to, msg.subject, msg.html, function(err, info) {
    if (err) {
      console.log(err);
     msg.err = err;
     emailModel().create(msg); 
    };
    console.log(info);
  });
}

Email.prototype.sendFeedbackSubmission = function(username, type, body) {
  console.log("sending feedback submission...");
  var msg = {
    from : "AppName <support@appname.com>",
    to : ['herpiko@gmail.com','lukmanulh.lhakim@gmail.com','cybertheis@gmail.com'],
    subject : "[ AppName ] - Feedback Submission",
    html : "<style>body{font-family: Roboto, 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.846; color: rgb(102, 102, 102); background-color: rgb(255, 255, 255);}a{text-decoration: none;}.btn{text-transform: uppercase; border-right: none; border-bottom: none; -webkit-box-shadow: rgba(0, 0, 0, 0.298039) 1px 1px 2px; box-shadow: rgba(0, 0, 0, 0.298039) 1px 1px 2px; transition: all 0.2s; -webkit-transition: all 0.2s;}.btn{display: inline-block; margin-bottom: 0px; font-weight: normal; text-align: center; vertical-align: middle; touch-action: manipulation; cursor: pointer; background-image: none; border: 1px solid transparent; border-image-source: initial; border-image-slice: initial; border-image-width: initial; border-image-outset: initial; border-image-repeat: initial; white-space: nowrap; padding: 6px 16px; font-size: 13px; line-height: 1.846; border-radius: 3px; -webkit-user-select: none;}.btn-primary{color: rgb(255, 255, 255); background-color: rgb(30, 169, 132); border-color: transparent;}.btn-primary:hover{color: rgb(255, 255, 255); background-color: rgb(33, 186, 145); border-color: rgba(0, 0, 0, 0);}</style><body><p>Halo Admin, </p><p>Seseorang mengirim feedback.<br><br>Pengirim : " + username + "<br>Jenis : " + type  + "<br>Pesan : " + body + "<br><br>Semangaaaaat!</p><p>Terima kasih</p></body>",
  }
  mailer.sendText(msg.from, msg.to, msg.subject, msg.html, function(err, info) {
    if (err) {
      console.log(err);
     msg.err = err;
     emailModel().create(msg); 
    };
    console.log(info);
  });
  
  // Send a thank you to submitter
  var msg2 = {
    from : "AppName <support@appname.com>",
    to : username,
    subject : "[ AppName ] - Terima kasih atas feedback-nya",
    html : "<style>body{font-family: Roboto, 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.846; color: rgb(102, 102, 102); background-color: rgb(255, 255, 255);}a{text-decoration: none;}.btn{text-transform: uppercase; border-right: none; border-bottom: none; -webkit-box-shadow: rgba(0, 0, 0, 0.298039) 1px 1px 2px; box-shadow: rgba(0, 0, 0, 0.298039) 1px 1px 2px; transition: all 0.2s; -webkit-transition: all 0.2s;}.btn{display: inline-block; margin-bottom: 0px; font-weight: normal; text-align: center; vertical-align: middle; touch-action: manipulation; cursor: pointer; background-image: none; border: 1px solid transparent; border-image-source: initial; border-image-slice: initial; border-image-width: initial; border-image-outset: initial; border-image-repeat: initial; white-space: nowrap; padding: 6px 16px; font-size: 13px; line-height: 1.846; border-radius: 3px; -webkit-user-select: none;}.btn-primary{color: rgb(255, 255, 255); background-color: rgb(30, 169, 132); border-color: transparent;}.btn-primary:hover{color: rgb(255, 255, 255); background-color: rgb(33, 186, 145); border-color: rgba(0, 0, 0, 0);}</style><body><p>Halo, </p><p>Kami sangat berterima kasih atas saran / masukan yang Anda kirim untuk AppName. Jika ada hal lain lagi yang ingin Anda sampaikan, jangan sungkan menghubungi kami.</p><p>Salam hangat,<br></p></body>",
  }
  mailer.sendText(msg2.from, msg2.to, msg2.subject, msg2.html, function(err, info) {
    if (err) {
      console.log(err);
     msg2.err = err;
     emailModel().create(msg2); 
    };
    console.log(info);
  });
}

Email.prototype.sendNewUserGreeting = function(email) {
  console.log("sending new user greeting email...");
  var msg = {
    from : "AppName <support@appname.com>",
    to : email,
    subject : "[ AppName ] - Selamat bergabung!",
    html : "<style>body{font-family: Roboto, 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.846; color: rgb(102, 102, 102); background-color: rgb(255, 255, 255);}a{text-decoration: none;}.btn{text-transform: uppercase; border-right: none; border-bottom: none; -webkit-box-shadow: rgba(0, 0, 0, 0.298039) 1px 1px 2px; box-shadow: rgba(0, 0, 0, 0.298039) 1px 1px 2px; transition: all 0.2s; -webkit-transition: all 0.2s;}.btn{display: inline-block; margin-bottom: 0px; font-weight: normal; text-align: center; vertical-align: middle; touch-action: manipulation; cursor: pointer; background-image: none; border: 1px solid transparent; border-image-source: initial; border-image-slice: initial; border-image-width: initial; border-image-outset: initial; border-image-repeat: initial; white-space: nowrap; padding: 6px 16px; font-size: 13px; line-height: 1.846; border-radius: 3px; -webkit-user-select: none;}.btn-primary{color: rgb(255, 255, 255); background-color: rgb(30, 169, 132); border-color: transparent;}.btn-primary:hover{color: rgb(255, 255, 255); background-color: rgb(33, 186, 145); border-color: rgba(0, 0, 0, 0);}</style><body><p>Halo, </p><p>Terima kasih telah bergabung!. Dapatkan pengalaman manajemen perjalanan yang asyik bersama AppName. Anda dapat mulai membuat rencana perjalanan sendiri maupun bergabung dengan trip-trip yang sudah dibuat oleh orang lain.</p><br><p>Jika Anda mengalami kesulitan, jangan sungkan menghubungi kami di support@appname.com </p><br><p>Salam hangat</p></body>",
  }
  mailer.sendText(msg.from, msg.to, msg.subject, msg.html, function(err, info) {
    if (err) {
      console.log(err);
     msg.err = err;
     emailModel().create(msg); 
    };
    console.log(info);
  });
}

var resend = function(obj) {
  console.log("resend email : "+ obj._id + " - " + obj.subject);
  var msg = {
    from : obj.from,
    to : obj.to,
    subject : obj.subject,
    html : obj.html
  }
  mailer.sendText(msg.from, msg.to, msg.subject, msg.html, function(err, info) {
    if (err) {
      console.log(err);
     msg.err = err;
     emailModel().create(msg); 
    };
    console.log(info);
  });
}

exports.register = function(server, options, next) {
  new Email(server, options, next);
  next();
};

exports.register.attributes = {
  pkg: require("./package.json")
};

exports.class = Email.prototype;

// resend failed emails for each 5 minutes
setInterval(function(){
  emailModel()
    .find({err : {code : { $ne : "EENVELOPE"}}})
    .exec(function(err, results) {
    if (results.length > 0) {
      async.each(results, function(result, cb) {
        resend(result);
        emailModel().remove({_id: result._id}, function(err, result) {
          // do nothing
        });

      }, function(err) {
        // done. do nothing.
      })
    }
  });
}, 60000);
/* }, 300000); */

