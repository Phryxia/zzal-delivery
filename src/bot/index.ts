import { Context, Telegraf } from 'telegraf'
import DBService from '../services/db'
import * as dayjs from 'dayjs'
import * as customParseFormat from 'dayjs/plugin/customParseFormat'
import { Dialogue, DialogueControl, DialogueType, GlobalSession } from './model'
import { ADD_QUERY_SET_DIALOGUE, REMOVE_QUERY_SET_DIALOGUE } from './dialogues'
import listQuerySets from './listQuerySets'

dayjs.extend(customParseFormat)

const globalSession: GlobalSession = {}

const dialogues: { [type: string]: Dialogue } = {
  [DialogueType.ADD_QUERY_SET]: ADD_QUERY_SET_DIALOGUE,
  [DialogueType.REMOVE_QUERY_SET]: REMOVE_QUERY_SET_DIALOGUE,
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

async function exectueDialogue(chatId: number, ctx: Context) {
  if (!globalSession[chatId]) return

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

    const response = await listQuerySets(user.querySets)

    if (response) ctx.reply(response)
  })

  bot.command('addQuerySet', (ctx) => {
    enterDialogue(ctx.chat.id, DialogueType.ADD_QUERY_SET, ctx)
  })

  bot.command('removeQuerySet', (ctx) => {
    enterDialogue(ctx.chat.id, DialogueType.REMOVE_QUERY_SET, ctx)
  })

  // Process dialogue
  bot.on('text', (ctx) => {
    exectueDialogue(ctx.chat.id, ctx)
  })
}
