import { Context, Telegraf, TelegramError } from 'telegraf'
import DBService from '../services/db'
import * as dayjs from 'dayjs'
import * as customParseFormat from 'dayjs/plugin/customParseFormat'
import { Dialogue, DialogueControl, DialogueType, GlobalSession } from './model'
import { ADD_QUERY_SET_DIALOGUE, REMOVE_QUERY_SET_DIALOGUE } from './dialogues'
import listQuerySets from './listQuerySets'
import { deliverAll } from '../delivery'
import { suppressError } from '../util'

dayjs.extend(customParseFormat)

const globalSession: GlobalSession = {}

const dialogues: { [type: string]: Dialogue } = {
  [DialogueType.ADD_QUERY_SET]: ADD_QUERY_SET_DIALOGUE,
  [DialogueType.REMOVE_QUERY_SET]: REMOVE_QUERY_SET_DIALOGUE,
}

function createSession(chatId: number): void {
  globalSession[chatId] = {
    dialogue: {
      type: DialogueType.IDLE,
      phase: 0,
    },
    state: {},
  }
}

function isSessionExist(chatId: number): boolean {
  return !!globalSession[chatId]
}

function assureSession(chatId: number) {
  if (!isSessionExist(chatId)) createSession(chatId)
}

function enterDialogue(chatId: number, type: DialogueType, context: Context) {
  assureSession(chatId)

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

async function exectueDialogue(chatId: number, ctx: Context) {
  if (!isSessionExist(chatId)) return

  const { phase, type } = globalSession[chatId].dialogue

  switch (await dialogues[type]?.steps[phase](ctx, globalSession[chatId])) {
    case DialogueControl.NEXT:
      moveToNextPhase(chatId)

      if (phase + 1 >= dialogues[type].steps.length) {
        leaveDialogue(chatId)
      }
      break
    case DialogueControl.REPEAT:
      break
    default:
      leaveDialogue(chatId)
      break
  }
}

export function setupBot(bot: Telegraf) {
  bot.start(async (ctx) => {
    let user = await DBService.getUser(ctx.chat.id)

    // If there is no user, add one
    if (!user) {
      // DB
      user = await DBService.addUser(ctx.chat.id)
    }

    suppressError(ctx.reply('Welcome! Check the manual using /help.'))
  })

  bot.command('help', (ctx) => {
    suppressError(
      ctx.reply(
        '/help - show this.\n' +
          "/listQuerySets - show your chat's query sets.\n" +
          '/addQuerySet - add new query set for your chat.\n' +
          '/removeQuerySet - remove existing query set for your chat.\n' +
          "/deliver - use this when you don't want to wait it for tommorow.\n\n" +
          "If you are first here, start with /addQuerySet. I'll help you."
      )
    )
  })

  bot.command('listQuerySets', async (ctx) => {
    const user = await DBService.getUser(ctx.chat.id)

    if (!user) return

    const response = await listQuerySets(user.querySets)

    if (response) suppressError(ctx.reply(response))
  })

  bot.command('addQuerySet', (ctx) => {
    enterDialogue(ctx.chat.id, DialogueType.ADD_QUERY_SET, ctx)
  })

  bot.command('removeQuerySet', (ctx) => {
    enterDialogue(ctx.chat.id, DialogueType.REMOVE_QUERY_SET, ctx)
  })

  bot.command('deliver', async (ctx) => {
    const user = await DBService.getUser(ctx.chat.id)

    if (!user) return

    if (user.querySets.length === 0) {
      suppressError(
        ctx.reply(
          `You don't have any query set to receive. Start adding your own query set using /addQuerySet.`
        )
      )
      return
    }

    deliverAll(bot, user)
  })

  // Process dialogue
  bot.on('text', (ctx) => {
    exectueDialogue(ctx.chat.id, ctx)
  })
}
