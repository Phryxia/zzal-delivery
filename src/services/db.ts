import dayjs = require('dayjs')
import { QuerySet, User } from '../model'

interface MockDB {
  userIdCounter: number
  users: User[]
  querySetIdCounter: number
}

let db: MockDB = {
  userIdCounter: 0,
  users: [],
  querySetIdCounter: 0,
}

// api
function getUser(chatId: number): User | undefined {
  return db.users.find((user) => user.chatId === chatId)
}

function getUsers(): User[] {
  return db.users
}

function addUser(chatId: number): User {
  const user: User = {
    id: `${db.userIdCounter++}`,
    chatId,
    isImageQueried: {},
    queriedImagesNumber: {},
    querySets: [],
  }

  db.users.push(user)

  return user
}

function removeUser(chatId: number): void {
  db.users = db.users.filter((user) => user.chatId !== chatId)
}

function addQuerySet(
  chatId: number,
  tags: string[],
  deliveryTime: dayjs.Dayjs
): void {
  const newQuerySet: QuerySet = {
    id: `${db.querySetIdCounter++}`,
    tags,
    deliveryTime,
  }
  const user = db.users.find((user) => user.chatId === chatId)

  if (
    user &&
    !user.querySets.some((querySet) =>
      isEquivalent(querySet, newQuerySet)
    )
  ) {
    user.querySets.push(newQuerySet)
  }
}

function removeQuerySet(
  chatId: number,
  querySetId: string
): void {
  const user = db.users.find((user) => user.chatId === chatId)

  if (user) {
    user.querySets = user.querySets.filter(
      (querySet) => querySet.id !== querySetId
    )
  }
}

// utility
function isEquivalent(qsA: QuerySet, qsB: QuerySet): boolean {
  return (
    qsA.deliveryTime.isSame(qsB.deliveryTime) &&
    qsA.tags.length === qsB.tags.length &&
    !qsA.tags.some((tagA) => !qsB.tags.includes(tagA))
  )
}

export default {
  getUser,
  getUsers,
  addUser,
  removeUser,
  addQuerySet,
  removeQuerySet,
}
