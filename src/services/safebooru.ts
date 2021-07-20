import { QuerySet, SafebooruPostsResponse } from '../model'
import axios from 'axios'
import * as qs from 'query-string'
import * as parser from 'fast-xml-parser'
import { SAFEBOORU_API } from '../const'

async function getImageList(
  querySet: QuerySet,
  pid: number,
  limit: number
): Promise<SafebooruPostsResponse> {
  const url = `${SAFEBOORU_API}?${qs.stringify({
    page: 'dapi',
    s: 'post',
    q: 'index',
    tags: querySet.tags.join(' '),
    pid,
    limit,
  })}`
  try {
    const response = await axios.get(url)

    if (response.status !== 200) {
      return {
        totalCount: 0,
        posts: [],
        error: 'Safebooru server is not available',
      }
    }

    const json = parser.parse(response.data, {
      attributeNamePrefix: '',
      ignoreAttributes: false,
      parseNodeValue: true,
    })

    // because of parser differs its result when count is zero or one
    if (!(json.posts.post instanceof Array)) {
      if (json.posts.post) {
        json.posts.post = [json.posts.post]
      } else {
        json.posts.post = []
      }
    }

    return {
      totalCount: parseInt(json.posts.count),
      posts: json.posts.post.map((post: any) => ({
        id: post.id,
        original: {
          url: post.file_url,
          width: parseInt(post.width),
          height: parseInt(post.height),
        },
        preview: {
          url: post.preview_url,
          width: parseInt(post.preview_width),
          height: parseInt(post.preview_height),
        },
        sample: {
          url: post.sample_url,
          width: parseInt(post.sample_width),
          height: parseInt(post.sample_height),
        },
        tags: post.tags.split(' '),
      })),
    }
  } catch (err) {
    console.log(`[zzal-delivery] Unable to fetch from ${url}`)
    console.log(err)

    return {
      totalCount: 0,
      posts: [],
      error: 'Fail to fetch or process request',
    }
  }
}

export default { getImageList }
