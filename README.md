# Discord Notification for Ko-fi

Serverless Express app running on Netlify functions to send Ko-fi notification to Kando's Discord.

## Why?

Ko-fi currently has Discord Integration which only does role assignment but not message notification on donation. I first tried using Zapier, but the free plan cannot filter messages. Then I discovered [this repository](https://github.com/raidensakura/kofi-discord-notification) which lets you send Discord embeds for Ko-fi donations using Netlify functions. I forked it and made some changes to the code to make it work for my server.

If you want to use this as well, I would suggest to base your code on the original repository.
