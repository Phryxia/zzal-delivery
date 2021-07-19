import * as dayjs from 'dayjs'
import * as customParseFormat from 'dayjs/plugin/customParseFormat'
import { Dialogue } from '../model'
import DBService from '../../services/db'

dayjs.extend(customParseFormat)

export const ADD_QUERY_SETS_DIALOGUE: Dialogue = {
  steps: [
    (ctx) => {
      ctx.reply(
        'What image tags do you want to query? Add a space between tags (ex: ibuki_tsubasa solo)'
      )
      return true
    },
    (ctx, session) => {
      if (ctx.updateType !== 'message') {
        ctx.reply('Please enter valid message')
        return false
      }

      const tags = ctx.message.text.split(' ')
      if (tags.length === 0) {
        ctx.reply('Please enter at least one tag.')
        return false
      }
      session.state.tags = tags

      ctx.reply(
        'When do you want to receive images? Please answers with hour only (ex: 6pm)'
      )
      return true
    },
    (ctx, session) => {
      if (ctx.updateType !== 'message') {
        ctx.reply('Please enter valid message')
        return false
      }

      let hour = parseInt(ctx.message.text.match(/\d\d?/)?.[0] ?? '-1')
      const isAm = ctx.message.text.includes('AM')
      const isPm = ctx.message.text.includes('PM')

      if (
        hour < 0 ||
        ((isAm || isPm) && (hour > 12 || hour === 0)) ||
        hour >= 24
      ) {
        ctx.reply('Please enter valid hour')
        return false
      }

      if (isAm && hour === 12) hour = 0
      if (isPm && hour < 12) hour += 12

      console.log(
        `Add query set on ${hour} with ${session.state.tags.join(', ')}`
      )

      ctx.chat &&
        DBService.addQuerySet(
          ctx.chat.id,
          session.state.tags,
          dayjs(`${hour}:00`, 'hh:mm')
        )

      ctx.reply('Your query set is added successfully.')
      return true
    },
  ],
}
