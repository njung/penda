
  var request = require('request');
  var fs = require('fs');
module.exports = function(cred, debug) {
  var api_key = cred.key;
  var domain = cred.domain;
  var address = cred.address;
  //Sample link used for debug
  var link = 'fusiform.co';
  var customizeDoc = function(file, toReplace, callback) {
    // var file = "path to file";
    // var toReplace = [
    //     {"find":"John", "replace":"Doe"},
    //     {"find":"Anna", "replace":"Smith"},
    //     {"find":"Peter","replce": "Jones"}
    // ];
    fs.readFile(file, 'utf8', function (err,data) {
      if (err) {
        return console.log(err);
      }
      //console.log(data);
      for (var i = 0, len = toReplace.length; i < len; i++) {
        data = data.replace(toReplace[i].find, toReplace[i].replace);

      }
      callback(data);
    });
  };
  return {
    /**
      Set the api key
      @param key - new API key
    **/
    setApiKey: function(key) {
        api_key = key;
    },
    /**
      Set the domain
      @param dom - new domain
    **/
    setDomain: function(dom) {
      domain = dom;
    },
    /**
      Set the from address
      @param ad - new from address
    **/
    setAddress: function(ad) {
      address = ad;
    },
    /**
      Send email
      @param name - name of the user.
      @param toAddress - recipient's email address
      @param subject - subject of email
      @param templateFile - html template for email
    **/
    sendMail: function(name, toAddress, subject, templateFile) {
      var toReplace = [
          {"find":"**|VLINK|**", "replace":"hello"}
      ];
      // customizeDoc('./app/emailTemplates/verifyEmail.html', toReplace, function (body) {
      customizeDoc(templateFile, toReplace, function (body) {
         request({
            url: 'https://api.mailgun.net/v3/' + domain + '/messages',
            method: 'POST',
            'auth': {
              'user': 'api',
              'password': api_key
            },
            form: {
              'from': address,
              'to': toAddress,
              'subject': subject,
              'html': body,
            }
        }, function(error, response, body) {
            if (debug) {
              if (error) {
                  console.log(error);
              } else if (response.statusCode != 200) {
                  console.log({
                    'Status': 'Message send failure',
                    'Subject': subject
                  });
              } else {
                  console.log({
                    'Status': 'Message sent',
                    'Subject': subject
                  });
              }
            }
        });
      });
    },
    
    /**
      Send email, body string as parameter instead of path
      @param name - name of the user.
      @param toAddress - recipient's email address
      @param subject - subject of email
      @param body - body string
    **/
    sendText: function(name, toAddress, subject, body) {
      request({
         url: 'https://api.mailgun.net/v3/' + domain + '/messages',
         method: 'POST',
         'auth': {
           'user': 'api',
           'password': api_key
         },
         form: {
           'from': address,
           'to': toAddress,
           'subject': subject,
           'html': body,
         }
      }, function(error, response, body) {
          if (debug) {
            if (error) {
                console.log(error);
            } else if (response.statusCode != 200) {
                console.log({
                  'Status': 'Message send failure',
                  'Subject': subject
                });
            } else {
                console.log({
                  'Status': 'Message sent',
                  'Subject': subject
                });
            }
          }
      });
    },

    /**
      Send email with verification link
      @param name - name of the user.
      @param toAddress - recipient's email address
      @param subject - subject of email
      @param templateFile - html template for email
      @param link - link to verify email
    **/
    sendLink: function(name, toAddress, subject, templateFile, link) {
      var toReplace = [
          {"find":"**|VLINK|**", "replace": link}
      ];
      // customizeDoc('./app/emailTemplates/verifyEmail.html', toReplace, function (body) {
      customizeDoc(templateFile, toReplace, function (body) {
         request({
            url: 'https://api.mailgun.net/v3/' + domain + '/messages',
            method: 'POST',
            'auth': {
              'user': 'api',
              'password': api_key
            },
            form: {
              'from': address,
              'to': toAddress,
              'subject': subject,
              'html': body,
            }
        }, function(error, response, body) {
            if (debug) {
              if (error) {
                  console.log(error);
              } else if (response.statusCode != 200) {
                  console.log({
                    'Status': 'Message send failure',
                    'Subject': subject
                  });
              } else {
                  console.log({
                    'Status': 'Message sent',
                    'Subject': subject
                  });
              }
            }
        });
      });
    },
    /**
      Send email with verification link
      @param name - name of the user.
      @param toAddress - recipient's email address
      @param subject - subject of email
      @param templateFile - html template for email
      @param link - link to verify email
    **/
    sendReplace: function(name, toAddress, subject, templateFile, toReplace) {
      // customizeDoc('./app/emailTemplates/verifyEmail.html', toReplace, function (body) {
      customizeDoc(templateFile, toReplace, function (body) {
         request({
            url: 'https://api.mailgun.net/v3/' + domain + '/messages',
            method: 'POST',
            'auth': {
              'user': 'api',
              'password': api_key
            },
            form: {
              'from': address,
              'to': toAddress,
              'subject': subject,
              'html': body,
            }
        }, function(error, response, body) {
            if (debug) {
              if (error) {
                  console.log(error);
              } else if (response.statusCode != 200) {
                  console.log({
                    'Status': 'Message send failure',
                    'Subject': subject
                  });
              } else {
                  console.log({
                    'Status': 'Message sent',
                    'Subject': subject
                  });
              }
            }
        });
      });
    },
// OLD - functions for every email =============================================

    /**
      Send a welcome email
      @param name - name of the user.
      @param toAddress - recipient's email address
    **/
    welcome: function(name, toAddress) {
      request({
          url: 'https://api.mailgun.net/v3/' + domain + '/messages',
          method: 'POST',
          'auth': {
            'user': 'api',
            'password': api_key
          },
          form: {
            'from': address,
            'to': toAddress,
            'subject': 'Welcome to FusiformCAST!',
            'html': 'Hello, <b>' + name + '</b>.\
              <p>Welcome to <b><a href="' + link + '">FusiformCAST</a>!</b>',
          }
      }, function(error, response, body) {
          if(error) {
              console.log(error);
          } else {
              console.log({
                'Status': 'Message sent',
                'Type': 'Welcome'
              });
          }
      });
    },


    /**
      Verify your email
      @param name - name of the user.
      @param toAddress - recipient's email address
      @param templateFile -
      @param verify_link - link to verify email
    **/
    verifyEmail: function(name, toAddress, templateFile, verify_link) {
      var toReplace = [
          {"find":"**|VLINK|**", "replace":verify_link}
      ];
      // customizeDoc('./app/emailTemplates/verifyEmail.html', toReplace, function (body) {
      customizeDoc(templateFile, toReplace, function (body) {
         request({
            url: 'https://api.mailgun.net/v3/' + domain + '/messages',
            method: 'POST',
            'auth': {
              'user': 'api',
              'password': api_key
            },
            form: {
              'from': address,
              'to': toAddress,
              'subject': 'Welcome to FusiformCAST!',
              'html': body,
            }
        }, function(error, response, body) {
            if (debug) {
              if (error) {
                  console.log(error);
              } else if (response.statusCode != 200) {
                  console.log({
                    'Status': 'Message send failure',
                    'Type': 'Email verification'
                  });
              } else {
                  console.log({
                    'Status': 'Message sent',
                    'Type': 'Email verification'
                  });
              }
            }
        });
      });
    },


    /**
      Send an email to reset the password
      @param name - name of the user.
      @param toAddress - recipient's email address
    **/
    passReset: function(name, toAddress) {
      request({
          url: 'https://api.mailgun.net/v3/' + domain + '/messages',
          method: 'POST',
          'auth': {
            'user': 'api',
            'password': api_key
          },
          form: {
            'from': address,
            'to': toAddress,
            'subject': 'FusiformCAST Password Reset',
            'html': 'Hello, ' + name + '. Click here to reset your password.'
          }
      }, function(error, response, body) {
          if (debug) {
            if(error) {
                console.log(error);
            } else if (response.statusCode != 200) {
                console.log({
                  'Status': 'Message send failure',
                  'Type': 'Password reset'
                });
            } else {
                console.log({
                  'Status': 'Message sent',
                  'Type': 'Password reset'
                });
            }

          }
      });
    },


    /**
      Send a notification that the password was changed
      @param name - name of the user.
      @param toAddress - recipient's email address
    **/
    passChanged: function(name, toAddress) {
      request({
          url: 'https://api.mailgun.net/v3/' + domain + '/messages',
          method: 'POST',
          'auth': {
            'user': 'api',
            'password': api_key
          },
          form: {
            'from': address,
            'to': toAddress,
            'subject': 'FusiformCAST Password Change Notification',
            'html': 'Hello, ' + name + '. Your FusiformCAST password was recently changed.'
          }
      }, function(error, response, body) {
          if (debug) {
            if(error) {
                console.log(error);
            } else if (response.statusCode != 200) {
                console.log({
                  'Status': 'Message send failure',
                  'Type': 'Password reset notification'
                });
            } else {
                console.log({
                  'Status': 'Message sent',
                  'Type': 'Password reset notification'
                });
            }
          }
      });
    },


    /**
      Send a notification that the password was changed
      @param name - name of the user.
      @param toAddress - recipient's email address
    **/
    tfaReset: function(name, toAddress) {
      request({
          url: 'https://api.mailgun.net/v3/' + domain + '/messages',
          method: 'POST',
          'auth': {
            'user': 'api',
            'password': api_key
          },
          form: {
            'from': address,
            'to': toAddress,
            'subject': 'FusiformCAST Two-Factor Authentication Reset',
            'html': 'Hello, ' + name + '. Click here to reset your two-factor authentication.'
          }
      }, function(error, response, body) {
          if (debug) {
            if(error) {
                console.log(error);
            } else if (response.statusCode != 200) {
                console.log({
                  'Status': 'Message send failure',
                  'Type': 'TFA reset'
                });
            } else {
                console.log({
                  'Status': 'Message sent',
                  'Type': 'TFA reset'
                });
            }
          }
      });
    }
  }
}
