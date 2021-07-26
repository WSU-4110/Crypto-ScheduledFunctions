const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");
const twilio = require("twilio");


admin.initializeApp();
const db = admin.firestore();
const docref = db.collection("users");




exports.scheduledFunctionTest = functions.pubsub.schedule('every 60 minutes').onRun(async (context) => {

    const accountSid = ''; // Your Account SID from www.twilio.com/console
    const authToken = '';   // Your Auth Token from www.twilio.com/console

    var client = new twilio(accountSid, authToken);
    const twilioMessagePromises = [];


    const twilioMessage = client.messages.create({
        body: "Testing Works",
        to: '+',  // Text this number
        from: '+' // From a valid Twilio number
    })

    twilioMessagePromises.push(twilioMessage);

    await Promise.all(twilioMessagePromises);
});
