# zzal-delivery

`zzal-delivery` is a simple telegram bot which delivers fresh images from [Safebooru](https://safebooru.org/) using their API. User can set their own query sets, which are just arrays of tags to search. You can fetch manually from bot or just simply waiting for their daily delivery.

Currently this project is working in progress, so there is nothing but test boiler plate.

# Develop Environment Setting

install: `npm install`

build: `npm run build`

start server: `npm run start`

# Add your bot to telegram

1. Search BotFather in the Telegram
2. Type `/newbot` and answer to proceeding BotFather's questions
3. Drag and copy the token of your bot
4. Create `.env` file into your project root directory and add `TELEGRAM_BOT_TOKEN="Your Token"`
5. Start server
6. Create chat with your bot or add it to a group
   - On private chat, just type `/start`
   - On group chat, type `/start@your_bot_handle`

# Warning

DO NOT INCLUDE `.env` FILE TO YOUR GIT

# Used Technologies & Libraries

- node.js
- TypeScript
- [axios](https://github.com/axios/axios)
- [dotenv](https://github.com/motdotla/dotenv#readme)
- [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser)
- [Prettier](https://prettier.io/)
- [telegraf.js](https://telegraf.js.org/)
- [query-string](https://github.com/sindresorhus/query-string#readme)
