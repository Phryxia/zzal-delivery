import * as dayjs from 'dayjs'

export interface SafebooruPostsResponse {
  totalCount: number
  posts: SafebooruPost[]
  error?: string
}

export interface SafebooruPost {
  id: string
  original: {
    url: string
    width: number
    height: number
  }
  preview: {
    url: string
    width: number
    height: number
  }
  sample: {
    url: string
    width: number
    height: number
  }
  tags: string[]
}

export interface QuerySet {
  id: string
  tags: string[]
  deliveryTime: dayjs.Dayjs // use only hour and minute
}

export interface User {
  id: string
  chatId: number
  querySets: QuerySet[]
  isImageQueried: {
    [imageId: string]: boolean
  }
  queriedImagesNumber: {
    [querySetId: string]: number
  }
}

export const IMAGES_PER_PAGE = 8
