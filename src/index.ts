import * as dotenv from 'dotenv'
import { Telegraf } from 'telegraf'
import SafebooruService from './safebooru'

// .env load
const dotenvResult = dotenv.config()
if (dotenvResult.error) {
  console.log(dotenvResult.error)
  console.log(
    "[zzal-delivery] Maybe you don' have .env file at the root of the project"
  )
  process.exit()
}

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)

bot.start((ctx) => {
  ctx.reply('Welcome!')
})

bot.launch()

const testQuerySet = {
  id: 'test',
  tags: ['ibuki_tsubasa', 'solo'],
}

;(async () => {
  console.log(
    await SafebooruService.getImageList(testQuerySet, 0, 8)
  )
})()
