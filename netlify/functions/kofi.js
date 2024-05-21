// Modified from: https://github.com/eramsorgr/kofi-discord-alerts
const express = require('express');
const serverless = require('serverless-http');
const app = express();
const bodyParser = require('body-parser');
const {Webhook} = require('discord-webhook-node');
const URL = require('url').URL;
const {createLogger, transports} = require('winston');

const logLevels = {
  fatal: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  trace: 5,
};

const logger = createLogger({
  levels: logLevels,
  transports: [new transports.Console()],
});

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use('/', async function(req, res) {
  // Check for needed secrets
  const stringIsAValidUrl = (s) => {
    try {
      new URL(s);
      return true;
    } catch (err) {
      return false;
    }
  };
  const webhook_url = process.env.WEBHOOK_URL;
  if (!webhook_url || !stringIsAValidUrl(webhook_url)) {
    return res.json({success: false, error: 'Invalid Webhook URL.'});
  }

  const kofi_token = process.env.KOFI_TOKEN;
  if (!kofi_token) {
    return res.json({success: false, error: 'Ko-fi token required.'});
  }

  const webhook = new Webhook(webhook_url);

  // Check if payload data is valid
  const data = req.body.data;
  if (!data) return res.json(`Hello world.`);
  const payload = JSON.parse(data);

  // Check if kofi token is valid
  if (payload.verification_token !== kofi_token) {
    return res.json({success: false, error: 'Ko-fi token does not match.'});
  }

  // Strip sensitive info from payload
  try {
    censor = '*****';
    payload['verification_token'] = censor;
    payload['email'] = censor;
    payload['kofi_transaction_id'] = censor;
    payload['shipping'] = null;
  } catch {
    return res.json({success: false, error: 'Payload data invalid.'});
  }

  // Ignore private messages
  if (!payload.is_public) {
    return res.json({success: true});
  }

  // Send Discord message
  try {
    webhook.setUsername('Ko-fi');
    webhook.setAvatar(
        'https://assets-global.website-files.com/5c14e387dab576fe667689cf/64f1a9ddd0246590df69e9f4_ko-fi_logo_01-p-500.png');

    const greetings = [
      '🎂 **Let\'s celebrate!**',
      '🥳 **Yay!**',
      '🎉 **Hooray!**',
      '🎊 **Party time!**',
      '🍰 **Let\'s have some pie!**',
      '🥧 **Pie time!**',
      '☕ **Time for a coffee!**',
      '🧁 **How sweet!**',
    ];

    let message = greetings[Math.floor(Math.random() * greetings.length)];

    if (payload.is_subscription_payment) {
      if (payload.is_first_subscription_payment) {
        message += ` **${
            payload
                .from_name}** just made a first monthly donation. Thank you so much! 🎊🎈`;
      } else {
        message += ` **${
            payload
                .from_name}**'s continued monthly Kando support is totally awesome! 💖`;
      }
    } else {
      message += ` **${
          payload.from_name}** just donated via Ko-fi. Thank you so much! 👏`;
    }

    await webhook.send(message);
  } catch (err) {
    logger.error(err);
    return res.json({success: false, error: err});
  }

  logger.info(`Processed payload ${payload.message_id}.`);

  return res.json({success: true});
});

module.exports.handler = serverless(app);
