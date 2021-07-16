export interface SafebooruPostsResponse {
  totalCount: number
  posts: SafebooruPost[]
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
}

export interface User {
  id: string
  name: string
  querySets: QuerySet[]
  isQueried: {
    [imageId: string]: boolean
  }
  queriedImagesNumber: {
    [querySetId: string]: number
  }
}
