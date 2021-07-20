import * as dayjs from 'dayjs'
import * as customParseFormat from 'dayjs/plugin/customParseFormat'
import { Dialogue, DialogueControl } from '../model'
import DBService from '../../services/db'
import listQuerySets from '../listQuerySets'

dayjs.extend(customParseFormat)

export const REMOVE_QUERY_SET_DIALOGUE: Dialogue = {
  steps: [
    // Phase 0: announce and show the list of query sets
    async (ctx, session) => {
      const user = DBService.getUser(ctx.chat.id)

      if (!user) return DialogueControl.ABORT

      if (user.querySets.length === 0) {
        ctx.reply("You don't have any query set.")
        return DialogueControl.ABORT
      }

      ctx.reply(`${await listQuerySets(user.querySets)}\n\n
        Enter the number of the query set you want to remove.`)

      session.state.querySets = user.querySets

      return DialogueControl.NEXT
    },
    // Phase 1: get remove index
    async (ctx, session) => {
      if (ctx.updateType !== 'message') {
        ctx.reply('Please enter valid message')
        return DialogueControl.REPEAT
      }

      try {
        const removeIndex = parseInt(ctx.message.text)

        if (removeIndex < 1 || removeIndex > session.state.querySets.length) {
          throw Error()
        }

        DBService.removeQuerySet(
          ctx.chat.id,
          session.state.querySets[removeIndex - 1].id
        )

        ctx.reply('Your query set is successfully removed.')
      } catch (error) {
        ctx.reply(
          `Please enter a valid number between 1 ~ ${session.state.querySets.length}.`
        )
        return DialogueControl.REPEAT
      }

      return DialogueControl.NEXT
    },
  ],
}
