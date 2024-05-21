// Modified from: https://github.com/eramsorgr/kofi-discord-alerts
const express = require('express');
const serverless = require('serverless-http');
const app = express();
const bodyParser = require('body-parser');
const {Webhook, MessageBuilder} = require('discord-webhook-node');
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

  const kofi_username = process.env.KOFI_USERNAME;

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

  // Send Discord embed
  try {
    // const embed = new MessageBuilder();

    // if (kofi_username) embed.setURL(`https://ko-fi.com/${kofi_username}`);

    // switch (payload.tier_name) {
    //   case 'Silver':
    //     embed.setColor('#797979');
    //   case 'Gold:':
    //     embed.setColor('#ffc530');
    //   case 'Platinum':
    //     embed.setColor('#2ed5ff');
    //   default:
    //     embed.setColor('#9b59b6');
    // }

    // embed.addField(`From`, `${payload.from_name}`, true);
    // embed.addField(`Type`, `${payload.type}`, true);
    // embed.addField(`Amount`, `${payload.amount} ${payload.currency}`, true);
    // if (payload.message && payload.message !== 'null')
    //   embed.addField(`Message`, `${payload.message}`);
    // embed.setTimestamp();

    hook.setUsername('Foo Bot');
    hook.setAvatar('https://storage.ko-fi.com/cdn/nav-logo-stroke.png');

    let message = `🎂 **Let's celebrate!** 🎂
${payload.from_name} just made a first monthly donation. Thank you so much! 🎊🎈`;

    if (payload.message && payload.message !== 'null') {
      message += `\n${payload.from_name} writes: ${payload.message}`;
    }

    await hook.send(message);
  } catch (err) {
    logger.error(err);
    return res.json({success: false, error: err});
  }

  logger.info(`Processed payload ${payload.message_id}.`);

  return res.json({success: true});
});

module.exports.handler = serverless(app);
