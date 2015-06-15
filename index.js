var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;
var oauth2Client = new OAuth2(process.env['GOOGLE_CLIENT'], process.env['GOOGLE_SECRET'], process.env['GOOGLE_URI']);
var auth = require('googleauth');
var atob = require('atob');
var btoa = require('btoa');
"use strict";
var inquirer = require("inquirer");

var gmail = google.gmail({version: 'v1', auth: oauth2Client});

var object = {};
var inboxId = [];
var emailId;
var writeEmail = [];
var recipient = '';
var emailSubject = '';
var emailMessage = '';
var deleteId;
var btoaEmail;

var googleAPI = function () {
  auth({
    configName: 'googleauth',
    client_id: process.env['GOOGLE_CLIENT'],
    client_secret: process.env['GOOGLE_SECRET'],
    refresh: true,
    scope: 'https://mail.google.com/',
    redirect_uri: process.env['GOOGLE_URI'],
  }, function (err, authData) {
    if (err) {
      console.log(err);
    } else {
      oauth2Client.setCredentials({
        access_token: authData.access_token,
        refresh_token: authData.refresh_token
      });
      runEverything(oauth2Client);
    }
  })
}
var runEverything = function (oauth2Client) {

  // INBOX
  // RETRIEVES INBOX SUBJECTS
  function inbox () {
    gmail.users.messages.list({
      userId: 'me',
      labelId: 'INBOX',
      maxResults: 1,
      includeSpamTrash: false
    }, function (err, req) {
      for(var i = 0; i < 1; i++) {
        inboxId.push(req.messages[i].id);
      }
      inboxId.forEach(function(elem, i) {
        gmail.users.messages.get({
          userId: 'me',
          id: elem
        }, function (err, req) {
          if (err) {
            console.log(err);
          } else {
            object[i] = {id: req.id, subject: req.payload.headers.filter( function(header) {
              return header.name === 'Subject';
            })[0].value, threadId: req.threadId, from: req.payload.headers.filter(function(header) {
              return header.name === 'From';
            })[0].value, to: req.payload.headers.filter(function(header) {
              return header.name === 'To';
            })[0].value, body: atob(req.payload.body.data)}
          }
          // if (req.payload.parts === undefined) {

            // , threadId: req.threadId, from: req.payload.headers.filter(function(header) {
            //   return header.name === 'From';
            // })[0].value, to: req.payload.headers.filter(function(header) {
            //   return header.name === 'To';
            // })[0].value}
            // body: atob(req.payload.body.data)}

          // };
          // else {
          //   object[i] = {id: req.id, subject: req.payload.headers.filter( function(header) {
          //     return header.name === 'Subject';
          //   })[0].value, threadId: req.threadId, from: req.payload.headers.filter(function(header) {
          //     return header.name === 'From';
          //   })[0].value, to: req.payload.headers.filter(function(header) {
          //     return header.name === 'To';
          //   })[0].value, body: atob(req.payload.parts[0].body.data)}
          // };
        })
      });
    });
  };
  inbox();
}

googleAPI();

// var body = function (value) {
//   emailId = object[parseInt(value)];
//   console.log('Subject: ' + emailId.subject + '\n');
//   console.log('From: ' + emailId.from + '\n');
//   console.log('To: ' + emailId.to + '\n');
//   console.log(emailId.body);
// };

// // BODY OF EMAIL
// var body = function(answer) {
//   gmail.users.messages.get({userId: 'me', 'id': emailId}, function(err, req) {
//     var subject = req.payload.headers.filter(function(header) {
//       return header.name === 'Subject';
//     })[0].value;
//     var fromPerson = req.payload.headers.filter(function(header) {
//       return header.name === 'From';
//     })[0].value;
//     var toPerson = req.payload.headers.filter(function(header) {
//       return header.name === 'To';
//     })[0].value;
//
//     if (req.payload.parts === undefined) {
//       var emailBody = atob(req.payload.body.data);
//     } else {
//       var emailBody = atob(req.payload.parts[0].body.data);
//     };
//     console.log('Subject: ' + subject + '\n');
//     console.log('From: ' + fromPerson + '\n');
//     console.log('To: ' + toPerson + '\n');
//   });
// };

//  SEND AN EMAIL
var sendEmail = function (email) {
  gmail.users.messages.send({
    'userId': "me",
    'resource': {
      'raw': email
    }
  }, function(err) {
    if(err) {
      console.log(err);
    }
  });
};
//
// DELETE AN EMAIL
var deleteEmail = function (id) {
  gmail.users.messages.trash({userId: 'me', 'id': id }, function (err, resp) {
    if (err) {
      console.log(err);
    }
  });
}
//
// // // gmail.users.messages.list({
// // //   userId: 'me',
// // //   maxResults: 10
// // // }, function (err, res) {
// // //   console.log(res);
// // // })
//
console.log('~~~~~~~~~~WELCOME TO GMAIL~~~~~~~~~~\n\n')
// //
// // // var questions = [
// // //   {
// // //     type: "list",
// // //     name: "gmail",
// // //     message: "What would you like to do?",
// // //     choices: ["Inbox", "Compose", "Log Out"],
// // //     filter: function(value) {
// // //       var done = this.async();
// // //       setTimeout(function() {
// // //         if(value === 'Inbox') {
// // //           console.log("\nInbox\n");
// // //           for(var i = 0; i < 1; i ++) {
// // //             console.log(i + ' -- ' + 'FROM: ' + object[i].from + "  " + object[i].subject);
// // //           };
// // //           console.log("\n\n");
// // //         }
// // //         done(value.toLowerCase());
// // //       }, 5000);
// // //     }
// // //   },
// // //   {
// // //     type: "input",
// // //     name: "inboxNumber",
// // //     message: "What would you like to open?    # = READ",
// // //     // choices: ["0","1","2","3","4"],
// // //     when: function(value) {
// // //       return value.gmail === "inbox";
// // //     },
// //     // validate: function(value) {
// //     //  var valid = !isNaN(parseFloat(value));
// //     //  return valid || "Please enter a number";
// //     // },
// //     // filter: function(value) {
// //     //   return parseInt(value) || value;
// //     // }
// // //   },
// // //   {
// // //     type: "input",
// // //     name: "recipient",
// // //     message: "Compose An Email To:",
// // //     when: function(value) {
// // //       return value.gmail === "compose";
// // //     },
// //     // filter: function(value) {
// //     //   recipient = value;
// //     //   return value;
// //     // }
// // //   },
// // //   {
// // //     type: "input",
// // //     name: "emailSubject",
// // //     message: "Email Subject:",
// // //     when: function(value) {
// // //       return value.recipient;
// // //     },
// //     // filter: function(value) {
// //     //   emailSubject = value;
// //     //   return value;
// //     // }
// // //   },
// // //   {
// // //     type: "input",
// // //     name: "emailMessage",
// // //     message: "Write your email:",
// // //     when: function(value) {
// // //       return value.emailSubject;
// // //     },
// //     // filter: function(value) {
// //     //   emailMessage = value;
// //     //   return value;
// //     // }
// // //   },
// // //   {
// // //     type: "list",
// // //     name: "sendMessage",
// // //     message: "Look good, ready to send?",
// // //     choices: ["Send", "Trash"],
// // //     when: function(value) {
// //       // console.log("From: me\r\nTo:" + recipient + "\r\nSubject:"+ emailSubject + "\r\n\r\n" + emailMessage);
// // //       return value.emailMessage;
// // //     }
// // //   },
// // //   {
// // //     type: "list",
// // //     name: "gmail",
// // //     message: "What would you like to do?",
// // //     choices: ["Inbox", "Compose", "Log Out"],
// // //     when: function(value) {
// // //       if(value.sendMessage === "Send") {
// //         // sendEmail(btoa("From: me\r\nTo:" + recipient + "\r\nSubject:"+ emailSubject + "\r\n\r\n" + emailMessage).replace(/\+/g, '-').replace(/\//g, '_'));
// // //       }
// // //       return value.sendMessage;
// // //     }
// // //   },
// // //   {
// // //     type: "list",
// // //     name: "nextStep",
// // //     message: "What would you like to do now?",
// // //     choices: ["Inbox", "Reply", "Delete", "Log Out"],
// // //     when: function(value) {
// // //       deleteId = value.inboxNumber;
// // //       if(deleteId === Number(value.inboxNumber))
// //       // console.log('\nSubject: ' + object[parseInt(value.inboxNumber)].subject + '\n');
// //       // console.log('From: ' + object[parseInt(value.inboxNumber)].from + '\n');
// //       // console.log('To: ' + object[parseInt(value.inboxNumber)].to + '\n');
// //       // console.log(object[parseInt(value.inboxNumber)].body + '\n');
// // //       return value.inboxNumber;
// // //     },
// // //     filter: function(value, answer) {
// // //       var done = this.async();
// // //       setTimeout(function() {
// // //         if(value === 'Inbox') {
// // //           console.log("\nInbox\n");
// // //           for(var i = 0; i < 5; i ++) {
// // //             console.log(i + ' -- ' + 'FROM: ' + object[i].from + "  " + object[i].subject);
// // //           };
// // //           console.log("\n\n");
// // //         } else if (value === 'Delete') {
// // //           deleteEmail(object[deleteId].id);
// // //         }
// // //         done(value.toLowerCase());
// // //       }, 500);
// // //     }
// // //   }
// // // ];
// //
var questions = [
  {
    type: "list",
    name: "gmail",
    message: "Welcome to your inbox, what would you like to do?",
    choices: ["Read Mail", "Compose", "Log Out"],
    filter: function(value) {
      var done = this.async();
      setTimeout(function() {
        if(value === "Read Mail") {
          console.log("\nInbox\n");
          for(var i = 0; i < 1; i++) {
            console.log(i + ' -- ' + 'FROM: ' + object[i].from + "  " + object[i].subject);
          }
          console.log("\n");
        };
        done(value.toLowerCase());
      },4000)
    }
  },
  {
    type: "input",
    name: "inboxNumber",
    message: "What would you like to open?    # = READ",
    choices: ["0","1","2","3","4"],
    when: function(answer) {

      return answer.gmail === "read mail";
    },
    validate: function(value) {
      var valid = !isNaN(parseInt(value));
      return valid || "Please enter a number";
    },
    filter: function(value) {
      return value;
    }
  },
  {
    type: "input",
    name: "recipient",
    message: "Compose An Email To:",
    when: function(answer) {
      return answer.gmail === "compose";
    },
    filter: function(value) {
      recipient = value;
      return value;
    }
  },
  {
    type: "input",
    name: "emailSubject",
    message: "Email Subject:",
    when: function(answer) {
      return answer.recipient;
    },
    filter: function(value) {
      emailSubject = value;
      return value;
    }
  },
  {
    type: "input",
    name: "emailMessage",
    message: "Write your email:",
    when: function(answer) {
      return answer.emailSubject;
    },
    filter: function(value) {
      emailMessage = value + "\n\n\nSent from my Gmail Command Line App";
      return value;
    }
  },
  {
    type: "list",
    name: "sendMessage",
    message: "Look good, ready to send?",
    choices: ["Send", "Trash"],
    when: function(answer) {
      console.log("From: me\r\nTo:" + recipient + "\r\nSubject:"+ emailSubject + "\r\n\r\n" + emailMessage);
      btoaEmail = btoa("From: me\r\nTo:" + recipient + "\r\nSubject:"+ emailSubject + "\r\n\r\n" + emailMessage);
      return answer.emailMessage;
    },
    filter: function(value) {
      if(value === "Send") {
        sendEmail(btoaEmail);
      }
      return value;
    }
  },
  {
    type: "list",
    name: "nextStep",
    message: "What would you like to do now?",
    choices: ["Inbox", "Reply", "Delete", "Log Out"],
    when: function(answer) {
      emailId = parseInt(answer.inboxNumber);
      if(typeof parseInt(answer.inboxNumber) == "number") {
        console.log('\nSubject: ' + object[answer.inboxNumber].subject + '\n');
        console.log('From: ' + object[answer.inboxNumber].from + '\n');
        console.log('To: ' + object[answer.inboxNumber].to + '\n');
        console.log(object[answer.inboxNumber].body + '\n');
      }
      return answer.inboxNumber;
    }
  },
  {
    type: "list",
    name: "deleteEmail",
    message: "Delete Email?",
    choices: ["Yes", "No"],
    when: function(answer) {
      return answer.nextStep === "Delete";
    },
    filter: function(value) {
      var done = this.async();
      if(value === "Yes") {
        deleteEmail(object[emailId].id);
      }
      setTimeout(function() {
        done(value);
      },5000)
    }
  },
  // {
  //   type: "input",
  //   name: "replySubject",
  //   message: "Reply Subject:",
  //   when: function(answer) {
  //     return answer.nextStep === "Reply";
  //   },
  //   filter: function(value) {
  //     emailSubject = value;
  //     return value;
  //   }
  // },
  {
    type: "input",
    name: "replyMessage",
    message: "Reply Message:",
    when: function(answer) {
      return answer.nextStep === "Reply"
    },
    filter: function(value) {
      emailMessage = value + "\n\n\nSent from my Gmail Command Line App";
      return value;
    }
  },
  {
    type: "list",
    name: "sendReplyMessage",
    message: "Look good, ready to send?",
    choices: ["Send", "Trash"],
    when: function(answer) {
      console.log("From: me\r\nTo: " + object[emailId].from + "\r\nSubject: Re: "+ object[emailId].subject + "\r\n\r\n" + emailMessage);
      btoaEmail = btoa("From: me\r\nTo: " + object[emailId].from + "\r\nSubject: Re: "+ object[emailId].subject + "\r\n\r\n" + emailMessage);
      return answer.replyMessage;
    },
    filter: function(value) {
      if(value === "Send") {
        sendEmail(btoaEmail);
      }
      return value;
    }
  }
];

function ask() {
  inquirer.prompt( questions, function( answers ) {
    if (answers.sendReplyMessage || answers.nextStep === "Inbox" || answers.deleteEmail === "Yes" || answers.sendMessage) {
      ask();
    } else {
      console.log( "May you be happy!" );
    }
  });
}

ask();
