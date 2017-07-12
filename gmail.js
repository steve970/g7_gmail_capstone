#!/usr/bin/env node

const fs = require('fs');
const readline = require('readline');
const google = require('googleapis');
const googleAuth = require('google-auth-library');

var gmail;

var chalk = require('chalk');

var atob = require('atob');
var btoa = require('btoa');

var inquirer = require('inquirer');

var localSecret = {};

var emailData = {};
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


// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/gmail-nodejs-quickstart.json
var SCOPES = ['https://mail.google.com/'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'gmail-nodejs-quickstart.json';

// Load client secrets from a local file.
fs.readFile('client_secret.json', function processClientSecrets(err, content) {
  if (err) {
    console.log('Welcome to the initial set up for your gmail CLI. Please follow the instructions below:\n\n')
    console.log('a. Use this link to create or select a project in the Google Developers Console and automatically turn on the API: \n\n https://console.developers.google.com/flows/enableapi?apiid=gmail \n\nClick Continue, then Go to credentials.\n');
    console.log('b. On the Add credentials to your project page, click the Cancel button.\n');
    console.log('c. At the top of the page, select the OAuth consent screen tab. Select an Email address, enter a Product name if not already set, and click the Save button.\n');
    console.log('d. Select the Credentials tab, click the Create credentials button and select OAuth client ID.\n');
    console.log('e. Select the application type Other, enter the name "Gmail CLI", and click the Create button.\n');
    console.log('f. Click OK to dismiss the resulting dialog.\n');
    console.log('g. Click the file_download (Download JSON) button to the right of the client ID.\n');
    console.log('h. Move this file to the gmail_cli directory and rename it client_secret.json.\n');
    console.log('i. Restart program.\n\n\n');

    console.log('Error loading client secret file: ' + err);
    return;
  } else {
    localSecret = JSON.parse(content)
  }

  // Authorize a client with the loaded credentials, then call the Gmail API.
  authorize(localSecret, getInbox);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */

function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */

function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}

/**
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 *
 */

  // INBOX
  // RETRIEVES INBOX IDS - GMAIL API GET REQUEST
  var getInbox = function (auth) {
    gmail = google.gmail({
      version: 'v1',
      auth: auth,
    });
    gmail.users.messages.list({
      userId: 'me',
      labelId: 'INBOX',
      maxResults: maxResults,
      includeSpamTrash: false,
      q: "is:unread"
    }, function (err, response) {
      if (err) {
        throw(err);
      }
      for(var i = 0; i < maxResults; i++) {
        if (inboxId.length < maxResults) {
          inboxId.push(response.messages[i].id);
        }
      }
      getEmails(auth, inboxId); //Invoked after inboxId array is equal to maxResults variable
    });
  };

  // RETRIEVES INDIVIDUAL EMAILS AND CREATES AN OBJECT - GMAIL API GET REQUEST
  var getEmails = function(auth, inboxId) {
    inboxId.forEach(function(elem, i) {
      gmail.users.messages.get({
        userId: 'me',
        id: elem
      }, function (err, response) {
        // console.log(response.payload.headers);
        if(response.payload.body.data === undefined) {
          emailData[i] = {
            id: response.id,
            subject: response.payload.headers.filter( function(header) {
              return header.name === 'Subject';
            })[0].value,
            threadId: response.threadId,
            from: response.payload.headers.filter( function(header) {
              return header.name === 'From';
            })[0].value,
            to: response.payload.headers.filter(function(header) {
            return header.name === 'To';
            })[0].value,
            body: atob(response.payload.parts[0].body.data)}
        } else {
          emailData[i] = {id: response.id, subject: response.payload.headers.filter( function(header) {
            return header.name === 'Subject';
          })[0].value, threadId: response.threadId, from: response.payload.headers.filter(function(header) {
            return header.name === 'From';
          })[0].value, to: response.payload.headers.filter(function(header) {
            return header.name === 'To';
          })[0].value, body: atob(response.payload.body.data)}
        };
        if (err) {
          throw(err);
        } else {
          if (Object.keys(emailData).length === maxResults ) {
            ask(); // Uses counter to invoke script once emailData is created matching the number of maxResults
          };
        };
      });
    });
  };

  //  SEND AN EMAIL - GMAIL API POST REQUEST
  var sendEmail = function (email) {
    gmail.users.messages.send({
      userId: "me",
      resource: {
        raw: email
      }
    }, function(err, res) {
      if(err) {
        console.log("THIS IS A SEND EMAIL ERROR: " + err)
        throw(err);      }
    });
  };

  // DELETE AN EMAIL - GMAIL API POST REQUEST
  var deleteEmail = function (id) {
    gmail.users.messages.trash({
      userId: 'me',
      'id': id
    }, function (err, res) {
      if (err) {
        console.log("THIS IS A DELETE EMAIL ERROR: " + err)
        throw(err);      }
    });
  }

/**
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 *
 */

  // CHANGE EMAIL TO READ - GMAIL API POST REQUEST
  var readEmail = function(id) {
    gmail.users.messages.modify({
      userId: 'me',
      'id': id,
      resource: {
        removeLabelIds: ["UNREAD"]
      }
    }, function (err, res) {
      if (err) {
        console.log("THIS IS A READ EMAIL ERROR: " + err)
        throw(err);
      }
    });
  };

// INVOKES THE COMMAND LINE SCRIPT
var ask = function () {
  inquirer.prompt( questions, function( answers ) {
    if (answers.nextStep === "Inbox" || answers.deleteEmail || answers.nextStepAfterComposing === "Inbox" || answers.nextStepAfterReplying === "Inbox")  {
        ask();
    } else {
      console.log( "\n\nGoodbye!\n\n" );
    }
  });
}


console.log('\n\n~~~~~~~~~~WELCOME TO GMAIL~~~~~~~~~~\n\n')

/**
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 *
 */

  // QUESTIONS ARRAY USED IN THE ASK FUNCTION
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
            if(deletedEmailId.indexOf(emailData[i]) !== -1) {
              console.log(chalk.white.bgRed.bold(i + ' -- ' + 'FROM: ' + emailData[i].from + "  SUBJECT: " + emailData[i].subject));
            } else if (readEmailId.indexOf(emailData[i]) !== -1) {
              console.log(chalk.blue(i + ' -- ' + 'FROM: ' + emailData[i].from + "  SUBJECT: " + emailData[i].subject));
            } else if (replyEmailId.indexOf(emailData[i]) !== -1) {
              console.log(chalk.yellow(i + ' -- ' + 'FROM: ' + emailData[i].from + "  SUBJECT: " + emailData[i].subject));
            } else {
              console.log(i + ' -- ' + 'FROM: ' + emailData[i].from + "  SUBJECT: " + emailData[i].subject);
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
        readEmail(emailData[value].id);
        if(readEmailId.indexOf(emailData[value]) === -1) {
          readEmailId.push(emailData[value]);
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
            console.log('\nSubject: ' + emailData[answer.inboxNumber].subject + '\n');
            console.log('From: ' + emailData[answer.inboxNumber].from + '\n');
            console.log('To: ' + emailData[answer.inboxNumber].to + '\n');
            console.log(emailData[answer.inboxNumber].body + '\n');
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
        deletedEmailId.push(emailData[emailId]);
        deleteEmail(emailData[emailId].id);
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
          console.log("From: me\r\nTo:" + emailData[emailId].from + "\r\nSubject: Re:"+ emailData[emailId].subject + "\r\n\r\n" + emailMessage);
          btoaEmail = btoa("From: me\r\nTo:" + emailData[emailId].from + "\r\nSubject: Re:"+ emailData[emailId].subject + "\r\n\r\n" + emailMessage).replace(/\//g,'_').replace(/\+/g,'-');
          return answer.replyMessage;
        }
      },
      filter: function(value) {
        if(value === "Send") {
          sendEmail(btoaEmail);
          var test = readEmailId.indexOf(emailData[emailId]);
          readEmailId.splice(test, 1);
          replyEmailId.push(emailData[emailId]);
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
