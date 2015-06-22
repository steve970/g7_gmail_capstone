var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;
var oauth2Client = new OAuth2(process.env['GOOGLE_CLIENT'], process.env['GOOGLE_SECRET'], process.env['GOOGLE_URI']);
var auth = require('googleauth');
var gmail = google.gmail({version: 'v1', auth: oauth2Client});
var chalk = require('chalk');

var atob = require('atob');
var btoa = require('btoa');

"use strict";
var inquirer = require("inquirer");


var object = {};
var inboxId = [];
var emailId;
var writeEmail = [];
var recipient = '';
var emailSubject = '';
var emailMessage = '';
var btoaEmail;
var emailComfirmation;
var maxResults = 5;
var deletedEmailId = [];
var readEmailId = [];
var replyEmailId = [];

var googleAPI = function () {
  var test = auth({
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
      })
      getInbox();
    }
  })
}

googleAPI();

// INBOX
// RETRIEVES INBOX SUBJECTS

var getInbox = function () {
  gmail.users.messages.list({
    userId: 'me',
    labelId: 'INBOX',
    maxResults: maxResults,
    includeSpamTrash: false,
    q: "is:unread"
  }, function (err, req) {
    for(var i = 0; i < maxResults; i++) {
      if (inboxId.length < maxResults) {
        inboxId.push(req.messages[i].id);
      }
    }
    getEmails(inboxId)
  });
};

var getEmails = function(inboxId) {
    inboxId.forEach(function(elem, i) {
      gmail.users.messages.get({
        userId: 'me',
        id: elem
      }, function (err, req) {
        if(req.payload.body.data === undefined) {
          object[i] = {id: req.id, subject: req.payload.headers.filter( function(header) {
            return header.name === 'Subject';
          })[0].value, threadId: req.threadId, from: req.payload.headers.filter(function(header) {
            return header.name === 'From';
          })[0].value, to: req.payload.headers.filter(function(header) {
            return header.name === 'To';
          })[0].value, body: atob(req.payload.parts[0].body.data)}
        } else {
          object[i] = {id: req.id, subject: req.payload.headers.filter( function(header) {
            return header.name === 'Subject';
          })[0].value, threadId: req.threadId, from: req.payload.headers.filter(function(header) {
            return header.name === 'From';
          })[0].value, to: req.payload.headers.filter(function(header) {
            return header.name === 'To';
          })[0].value, body: atob(req.payload.body.data)}
        };
      if (Object.keys(object).length === maxResults ) {
        ask();
      };
      })
    });
};

var refreshInbox = function () {
  gmail.users.messages.list({
    userId: 'me',
    labelId: 'INBOX',
    maxResults: maxResults,
    includeSpamTrash: false,
    q: "is:unread"
  }, function (err, req) {
    for(var i = 0; i < maxResults; i++) {
      if (inboxId.length < maxResults) {
        inboxId.push(req.messages[i].id);
      }
    }
    refreshEmail(inboxId)
  });
};

var refreshEmail = function(inboxId) {
  if(Object.keys(object).length === 0) {
    inboxId.forEach(function(elem, i) {
      gmail.users.messages.get({
        userId: 'me',
        id: elem
      }, function (err, req) {
        if(req.payload.body.data === undefined) {
          object[i] = {id: req.id, subject: req.payload.headers.filter( function(header) {
            return header.name === 'Subject';
          })[0].value, threadId: req.threadId, from: req.payload.headers.filter(function(header) {
            return header.name === 'From';
          })[0].value, to: req.payload.headers.filter(function(header) {
            return header.name === 'To';
          })[0].value, body: atob(req.payload.parts[0].body.data)}
        } else {
          object[i] = {id: req.id, subject: req.payload.headers.filter( function(header) {
            return header.name === 'Subject';
          })[0].value, threadId: req.threadId, from: req.payload.headers.filter(function(header) {
            return header.name === 'From';
          })[0].value, to: req.payload.headers.filter(function(header) {
            return header.name === 'To';
          })[0].value, body: atob(req.payload.body.data)}
        };
      })
    });
  }
};

var ask = function () {
  inquirer.prompt( questions, function( answers ) {
    if (answers.nextStep === "Inbox" || answers.deleteEmail || answers.nextStepAfterComposing === "Inbox" || answers.nextStepAfterReplying === "Inbox")  {
        ask();
    } else {
      console.log( "\n\nGoodbye!\n\n" );
    }
  });
}

//  SEND AN EMAIL
var sendEmail = function (email) {
  gmail.users.messages.send({
    userId: "me",
    resource: {
      raw: email
    }
  }, function(err, res) {
    if(err) {
      sendEmail(email);
    }
  });
};

// DELETE AN EMAIL
var deleteEmail = function (id) {
  gmail.users.messages.trash({userId: 'me', 'id': id }, function (err, res) {
    if (err) {
      deleteEmail(id);
    }
  });
}

// CHANGE EMAIL TO READ
var readEmail = function(id) {
  gmail.users.messages.modify({
    userId: 'me',
    'id': id,
    resource: {
      removeLabelIds: ["UNREAD"]
}}, function (err, res) {
    if (err) {
      readEmail(id);
    }
  })
}

console.log('~~~~~~~~~~WELCOME TO GMAIL~~~~~~~~~~\n\n')

var questions = [
  {
    type: "list",
    name: "gmail",
    message: "Welcome to your inbox, what would you like to do?",
    choices: ["Read Mail", "Compose", "Log Out"],
    filter: function(value) {
      if(value === "Read Mail") {
        console.log("\nInbox\n\n" + chalk.white.bgRed.bold("Deleted") + "   " + chalk.blue("Read") + "   " + chalk.yellow("Replied") + "\n");
        for(var i = 0; i < maxResults; i++) {
          if(deletedEmailId.indexOf(object[i]) !== -1) {
            console.log(chalk.white.bgRed.bold(i + ' -- ' + 'FROM: ' + object[i].from + "  " + object[i].subject));
          } else if (readEmailId.indexOf(object[i]) !== -1) {
            console.log(chalk.blue(i + ' -- ' + 'FROM: ' + object[i].from + "  " + object[i].subject));
          } else if (replyEmailId.indexOf(object[i]) !== -1) {
            console.log(chalk.yellow(i + ' -- ' + 'FROM: ' + object[i].from + "  " + object[i].subject));
          } else {
            console.log(i + ' -- ' + 'FROM: ' + object[i].from + "  " + object[i].subject);
          }
        }
      };
      return value.toLowerCase();
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
      readEmail(object[value].id);
      if(readEmailId.indexOf(object[value]) === -1) {
        readEmailId.push(object[value]);
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
      if (answer.inboxNumber) {
        if(typeof parseInt(answer.inboxNumber) == "number"  || 0) {
          console.log('\nSubject: ' + object[answer.inboxNumber].subject + '\n');
          console.log('From: ' + object[answer.inboxNumber].from + '\n');
          console.log('To: ' + object[answer.inboxNumber].to + '\n');
          console.log(object[answer.inboxNumber].body + '\n');
        }
        emailId = parseInt(answer.inboxNumber);
        return answer.inboxNumber;
      }
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
      emailMessage = value + "\n\nSteve\n\n\nSent from my Gmail Command Line App";
      return value;
    }
  },
  {
    type: "list",
    name: "sendMessage",
    message: "Look good, ready to send?",
    choices: ["Send", "Trash"],
    when: function(answer) {
      if(answer.emailMessage) {
        console.log("From: me\r\nTo:" + recipient + "\r\nSubject:"+ emailSubject + "\r\n\r\n" + emailMessage);
        btoaEmail = btoa("From: me\r\nTo:" + recipient + "\r\nSubject:"+ emailSubject + "\r\n\r\n" + emailMessage).replace(/\//g,'_').replace(/\+/g,'-');
        return answer.emailMessage;
      }
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
    name: "deleteEmail",
    message: "Delete Email?",
    choices: ["Yes", "No"],
    when: function(answer) {
      return answer.nextStep === "Delete";
    },
    filter: function(value) {
      deletedEmailId.push(object[emailId]);
      deleteEmail(object[emailId].id);
      return value;
    }
  },
  {
    type: "input",
    name: "replyMessage",
    message: "Reply Message:",
    when: function(answer) {
      return answer.nextStep === "Reply"
    },
    filter: function(value) {
      emailMessage = value + "\n\nSteve\n\n\nSent from my Gmail Command Line App";
      return value;
    }
  },
  {
    type: "list",
    name: "sendReply",
    message: "Look good, ready to send?",
    choices: ["Send", "Trash"],
    when: function(answer) {
      if(answer.replyMessage) {
        console.log("From: me\r\nTo:" + object[emailId].from + "\r\nSubject: Re:"+ object[emailId].subject + "\r\n\r\n" + emailMessage);
        btoaEmail = btoa("From: me\r\nTo:" + object[emailId].from + "\r\nSubject: Re:"+ object[emailId].subject + "\r\n\r\n" + emailMessage).replace(/\//g,'_').replace(/\+/g,'-');
        return answer.replyMessage;
      }
    },
    filter: function(value) {
      if(value === "Send") {
        sendEmail(btoaEmail);
        var test = readEmailId.indexOf(object[emailId]);
        readEmailId.splice(test, 1);
        replyEmailId.push(object[emailId]);
      }
      return value;
    }
  },
  {
    type: "list",
    name: "nextStepAfterComposing",
    message: "What would you like to do now?",
    choices: ["Inbox", "Log Out"],
    when: function(answer) {
      return answer.sendMessage;
    }
  },
  {
    type: "list",
    name: "nextStepAfterReplying",
    message: "What would you like to do now?",
    choices: ["Inbox", "Log Out"],
    when: function(answer) {
      return answer.sendReply;
    }
  }
];
