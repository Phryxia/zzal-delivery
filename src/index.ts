import * as dayjs from 'dayjs'
import * as dotenv from 'dotenv'
import { Telegraf } from 'telegraf'
import { QuerySet } from './model'
import BatchService from './services/batch'
import DBService from './services/db'
import { setupBot } from './bot'

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

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

setupBot(bot)

bot.launch()

// batch config
BatchService.startBatch(() => {
  const users = DBService.getUsers()
  users.forEach((user) => {
    user.querySets.forEach((querySet) => {
      bot.telegram.sendMessage(
        user.chatId,
        `Your querySet is ${querySet.tags.join(', ')}`
      )
    })
  })
})

const testQuerySet: QuerySet = {
  id: 'test',
  tags: ['ibuki_tsubasa', 'solo'],
  deliveryTime: dayjs('9:00'),
}

/*
;(async () => {
  console.log(await SafebooruService.getImageList(testQuerySet, 0, 8))
})()
*/
