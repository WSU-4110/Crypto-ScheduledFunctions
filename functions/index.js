const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");
const twilio = require("twilio");

admin.initializeApp();
const db = admin.firestore();
const docref = db.collection("users");

exports.scheduledFunction = functions.pubsub.schedule('every 60 minutes').onRun(async (context) => {
    const getCoinValue = async (coin) => {
        const results = await fetch(`https://api.coinbase.com/v2/prices/${coin}-USD/buy`);
        const json = await results.json();
        return json.data;
    }

    const currencyPromises = [`BTC`, `ETH`, `DOGE`].map(x => getCoinValue(x));
    const currencies = await Promise.all(currencyPromises);

    const querySnapshot = await docref.get();
    const subscribedUsers = [];

    querySnapshot.forEach(user => {
        const data = user.data();
        if (data.currency && Object.keys(data.currency).length > 0) {
            subscribedUsers.push(data)
        }
    })

    if (subscribedUsers.length == 0) {
        return
    }

    const buildTwilioMessage = (currencyName, currencyValue) => {
        return `${currencyName} has reached ${currencyValue}`;
    }

    var accountSid = ''; // Your Account SID from www.twilio.com/console
    var authToken = '';   // Your Auth Token from www.twilio.com/console

    var client = new twilio(accountSid, authToken);

    const twilioMessagePromises = [];

    for (const user of subscribedUsers) {
        const msg = [];

        for (const currency of currencies) {
            if (user.currency.hasOwnProperty(currency.base) && user.currency[currency.base] <= currency.amount) {
                msg.push(buildTwilioMessage(currency.base, currency.amount))
            }
        }

        if (msg.length == 0) {
            continue
        }


        const cleanNumber = user.userphonenumber.split().filter(str => /^\d+$/.test(str)).join("").trim();
        console.log(`Clean Number: ${cleanNumber}`);

        const twilioMessage = client.messages.create({
            body: msg.join("\n\n"),
            to: `+1${cleanNumber}`,  // Text this number
            from: '+1' // From a valid Twilio number
        })

        twilioMessagePromises.push(twilioMessage);
    }

    await Promise.all(twilioMessagePromises);
});
