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
async function getUser(chatId: number): Promise<User | undefined> {
  return db.users.find((user) => user.chatId === chatId)
}

async function getUsers(): Promise<User[]> {
  return db.users
}

async function addUser(chatId: number): Promise<User> {
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

async function removeUser(chatId: number): Promise<void> {
  db.users = db.users.filter((user) => user.chatId !== chatId)
}

async function updateQueriedImagesNumber(
  chatId: number,
  querySetId: string,
  value: number
): Promise<void> {
  const user = db.users.find((user) => user.chatId === chatId)
  if (!user) return
  user.queriedImagesNumber[querySetId] = value
}

async function addQueriedImages(
  chatId: number,
  imageIds: string[]
): Promise<void> {
  const user = db.users.find((user) => user.chatId === chatId)
  if (!user) return
  imageIds.forEach((imageId) => (user.isImageQueried[imageId] = true))
}

async function addQuerySet(
  chatId: number,
  tags: string[],
  deliveryTime: dayjs.Dayjs
): Promise<void> {
  const newQuerySet: QuerySet = {
    id: `${db.querySetIdCounter++}`,
    tags,
    deliveryTime,
  }
  const user = db.users.find((user) => user.chatId === chatId)

  if (
    user &&
    !user.querySets.some((querySet) => isEquivalent(querySet, newQuerySet))
  ) {
    user.querySets.push(newQuerySet)
  }
}

async function removeQuerySet(
  chatId: number,
  querySetId: string
): Promise<void> {
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
  updateQueriedImagesNumber,
  addQueriedImages,
  addQuerySet,
  removeQuerySet,
}
