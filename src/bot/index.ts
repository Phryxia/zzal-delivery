import { Context, Telegraf } from 'telegraf'
import DBService from '../services/db'
import * as dayjs from 'dayjs'
import * as customParseFormat from 'dayjs/plugin/customParseFormat'
import { getDurationInMillisecond } from '../util'
import { Dialogue, DialogueType, GlobalSession } from './model'
import { ADD_QUERY_SETS_DIALOGUE } from './dialogues'

dayjs.extend(customParseFormat)

const globalSession: GlobalSession = {}

const dialogues: { [type: string]: Dialogue } = {
  [DialogueType.ADD_QUERY_SET]: ADD_QUERY_SETS_DIALOGUE,
}

function enterDialogue(chatId: number, type: DialogueType, context: Context) {
  const session = globalSession[chatId]
  session.dialogue.type = type
  session.dialogue.phase = 0

  exectueDialogue(chatId, context)
}

function moveToNextPhase(chatId: number) {
  globalSession[chatId].dialogue.phase += 1
}

function leaveDialogue(chatId: number) {
  globalSession[chatId].dialogue.type = DialogueType.IDLE
}

function exectueDialogue(chatId: number, ctx: Context) {
  if (!globalSession[chatId]) return

  const { phase, type } = globalSession[chatId].dialogue

  if (dialogues[type]?.steps[phase](ctx, globalSession[chatId])) {
    moveToNextPhase(chatId)

    if (phase + 1 >= dialogues[type].steps.length) {
      leaveDialogue(chatId)
    }
  }
}

export function setupBot(bot: Telegraf) {
  bot.start(async (ctx) => {
    console.log('Welcome!')

    let user = DBService.getUser(ctx.chat.id)

    // If there is no user, add one
    if (!user) {
      // DB
      user = DBService.addUser(ctx.chat.id)

      // Session
      globalSession[ctx.chat.id] = {
        dialogue: {
          type: DialogueType.IDLE,
          phase: 0,
        },
        state: {},
      }
    }

    // ctx.telegram.sendPhoto(
    //   ctx.chat.id,
    //   'https://safebooru.org//samples/1822/sample_a07d8fec601379496af62fcc59d7f2e1ced5a5bb.jpg?3551335'
    // )
  })

  bot.command('listQuerySets', async (ctx) => {
    const user = DBService.getUser(ctx.chat.id)

    if (!user) return

    if (user.querySets.length === 0) {
      ctx.telegram.sendMessage(user.chatId, "You don't have any query set")
      return
    }

    const sortedQuerySets = [...user.querySets].sort(
      (qsA, qsB) =>
        getDurationInMillisecond(qsA.deliveryTime) -
        getDurationInMillisecond(qsB.deliveryTime)
    )
    const response =
      'Your query sets\n' +
      sortedQuerySets
        .map((querySet) => {
          return `${querySet.deliveryTime.format('hh:mm')}: ${querySet.tags
            .map((tag) => `"${tag}"`)
            .join(', ')}`
        })
        .join('\n')

    ctx.telegram.sendMessage(user.chatId, response)
  })

  bot.command('addQuerySet', (ctx) => {
    enterDialogue(ctx.chat.id, DialogueType.ADD_QUERY_SET, ctx)
  })

  // Process dialogue
  bot.on('text', (ctx) => {
    exectueDialogue(ctx.chat.id, ctx)
  })
}
