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

    const emojis = ["<:Alpaca:773855564098174997>", 
                    "<:Boomalope:773856589659635713> ", 
                    "<:Centipede:773859247540404234>",
                    "<:Cow:773862198019227648>", 
                    "<:Donkey:773856793079709696>", 
                    "<:Duck:773856899644260383>", 
                    "<:Elephant:773861941994586133>", 
                    "<:Goose:773857060155949076>", 
                    "<:GuineaPig:773857170990301185>", 
                    "<:Horse:773856262134956043>", 
                    "<:Lancer:773859525513445416>", 
                    "<:Muffalo:773855344131833886>", 
                    "<:Pikeman:773859401583951892>", 
                    "<:Scyther:773859076420927498>", 
                    "<:Sheep:773857329615339520>", 
                    "<:Thrumbo:773855902310334496>", 
                    "<:Warg:773861690810171392>"];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

    let message = "";
    let amount = parseFloat(payload.amount);
    let fromName = payload.from_name;
    let currency = payload.currency;
    let messageText = payload.message?.trim();
    let formattedAmount = amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2);
    let link = `[Ko-fi](<${payload.url}>)`
    let extraMessage = messageText ? `\n*- ${messageText}*` : "";
   
    if (payload.is_subscription_payment) {
      if (payload.is_first_subscription_payment) {
        message += ` **${fromName}** just made a first monthly donation of ${formattedAmount} ${currency} via ${link}! ${randomEmoji}${extraMessage}`;
      } else {
        message += ` **${fromName}**'s continued their monthly donation via ${link}. ${randomEmoji}`;
      }
    } else {
      message += ` **${fromName}** just donated ${formattedAmount} ${currency} via ${link}! ${randomEmoji}${extraMessage}`;
    }

    await webhook.send(message);
  } catch (err) {
    return res.json({success: false, error: err});
  }

  return res.json({success: true});
});

module.exports.handler = serverless(app);
