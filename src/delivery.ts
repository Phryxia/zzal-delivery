import { Telegraf } from 'telegraf'
import SafebooruService from './services/safebooru'
import { IMAGES_PER_PAGE, QuerySet, SafebooruPost, User } from './model'
import DBService from './services/db'
import { suppressError } from './util'

async function sendImages(bot: Telegraf, chatId: number, imageUrls: string[]) {
  if (imageUrls.length === 0) {
    return suppressError(
      bot.telegram.sendMessage(chatId, 'There is no new images for it.')
    )
  }

  if (imageUrls.length === 1) {
    return suppressError(bot.telegram.sendPhoto(chatId, imageUrls[0]))
  } else {
    return suppressError(
      bot.telegram.sendMediaGroup(
        chatId,
        imageUrls.map((imageUrl) => {
          return {
            type: 'photo',
            media: {
              url: imageUrl,
            },
          }
        })
      )
    )
  }
}

// most of the algorithm description is on https://docs.google.com/document/d/1d8EIesgCD7D2Rs09o-CqECCXFYU_b3gIxa75tWq0cxY/edit?usp=sharing
// note that queries with same user should be synchronized, otherwise duplicated images can be sent to user.
export async function deliver(
  bot: Telegraf,
  user: User,
  querySet: QuerySet
): Promise<void> {
  console.log(
    `Deliver starts for user:${user.chatId} with querySet:${querySet.id}`
  )
  const metas = await SafebooruService.getImageList(querySet, 0, 1)
  console.log(`Meta arrived`)

  // error handling
  if (metas.error) {
    suppressError(
      bot.telegram.sendMessage(
        user.chatId,
        `Service is not available: ${metas.error}`
      )
    )
    console.log(`SafebooruService Error: ${metas.error}`)
    return
  }

  // calculate remain unqueried images
  const numOfTotal = metas.totalCount
  const numOfQueried = user.queriedImagesNumber[querySet.id] ?? 0
  const numOfRemains = numOfTotal - numOfQueried

  // there might be no new image, or even some of them might be deleted.
  if (numOfRemains <= 0) {
    sendImages(bot, user.chatId, [])

    // There is possiblity of image deletion, which brings numOfRemains < 0
    // In that case, we have to refresh our data
    return DBService.updateQueriedImagesNumber(
      user.chatId,
      querySet.id,
      numOfTotal
    )
  }

  // oldest image index which is not queried yet
  const startIndex = numOfRemains - 1

  let pid = Math.floor(startIndex / IMAGES_PER_PAGE)
  let result: SafebooruPost[] = []

  let newNumOfQueried = numOfQueried
  while (result.length < IMAGES_PER_PAGE && pid >= 0) {
    console.log(`Processing ...`)
    const originalChunk = await SafebooruService.getImageList(
      querySet,
      pid,
      IMAGES_PER_PAGE
    )
    const filteredChunk = originalChunk.posts.filter(
      (post) => !user.isImageQueried[post.id]
    )

    // if there is something wrong, original chunk can be 0 length
    if (originalChunk.error) {
      console.log(`SafebooruService Error: ${originalChunk.error}`)
      break
    }

    // add old image first
    let idx = filteredChunk.length - 1
    while (result.length < IMAGES_PER_PAGE && idx >= 0) {
      result.push(filteredChunk[idx])
      idx -= 1
    }
    const numOfRemainsInChunk = idx + 1
    newNumOfQueried += originalChunk.posts.length - numOfRemainsInChunk

    pid -= 1
  }

  // Update queried image list
  const promise0 = DBService.addQueriedImages(
    user.chatId,
    result.map((post) => post.id)
  )

  // Update number of queried image for query set
  const promise1 = DBService.updateQueriedImagesNumber(
    user.chatId,
    querySet.id,
    newNumOfQueried
  )

  sendImages(
    bot,
    user.chatId,
    result.map((post) => post.original.url)
  )

  await Promise.all([promise0, promise1])
  console.log('Delivery ends')
  return
}

// This is intended: some query sets may share target images
// and there is some possibility to send duplicated images for user
export async function deliverAll(bot: Telegraf, user: User): Promise<void> {
  for (const querySet of user.querySets) {
    await deliver(bot, user, querySet)
  }
}
