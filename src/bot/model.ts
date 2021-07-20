import { Context } from 'telegraf'

export enum DialogueType {
  IDLE = 'idle',
  ADD_QUERY_SET = 'add_query_set',
  REMOVE_QUERY_SET = 'remove_query_set',
}

export interface UserSession {
  dialogue: {
    type: DialogueType
    phase: number
  }
  state: { [key: string]: any }
}

export interface Dialogue {
  // if it's true, move to next phase
  // It's impossible to infer type correctly
  steps: ((
    ctx: Context & any,
    session: UserSession
  ) => Promise<DialogueControl>)[]
}

export interface GlobalSession {
  [chatId: number]: UserSession
}

export enum DialogueControl {
  REPEAT,
  NEXT,
  ABORT,
}
