import * as dotenv from 'dotenv'
import { Telegraf } from 'telegraf'
import BatchService from './services/batch'
import DBService from './services/db'
import { setupBot } from './bot'
import { deliverAll } from './delivery'

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

// this bot doesn't need to process pending message
// all it have to do is just response to command when it is on live
bot.launch({
  dropPendingUpdates: true,
})

console.log('Server is now running...')

// batch config
BatchService.startBatch(async () => {
  const users = await DBService.getUsers()
  users.forEach((user) => {
    deliverAll(bot, user)
  })
})
