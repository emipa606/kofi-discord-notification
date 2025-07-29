// SPDX-FileCopyrightText: 2023 Raiden
// SPDX-FileCopyrightText: 2024 Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

// Based on https://github.com/raidensakura/kofi-discord-notification which in
// turn was modified from: https://github.com/eramsorgr/kofi-discord-alerts

const express = require('express');
const serverless = require('serverless-http');
const app = express();
const bodyParser = require('body-parser');
const {Webhook} = require('discord-webhook-node');
const URL = require('url').URL;

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

    let message = "";
    if (payload.is_subscription_payment) {
      if (payload.is_first_subscription_payment) {
        message += ` **${payload.from_name}** just made a first monthly donation of ${payload.amount} ${payload.currency} via [Ko-fi](https://ko-fi.com/mlie00).\nThank you so much! 🎈`;
      } else {
        message += ` **${payload.from_name}**'s continued their monthly donation.\nTheir support is totally awesome! 💖`;
      }
    } else {
      message += ` **${payload.from_name}** just donated ${payload.amount} ${payload.currency} via [Ko-fi](https://ko-fi.com/mlie00).\nThank you so much! 👏`;
    }

    await webhook.send(message);
  } catch (err) {
    return res.json({success: false, error: err});
  }

  return res.json({success: true});
});

module.exports.handler = serverless(app);
