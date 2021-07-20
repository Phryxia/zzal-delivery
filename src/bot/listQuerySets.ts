import { QuerySet } from '../model'
import { getDurationInMillisecond } from '../util'

/*
  Render query set list as below:

  1. 03:00: "ibuki_tsubasa", "solo"
  2. 05:00: "wet", "blue"
  3. 18:00: "night"
*/
export default async function listQuerySets(
  querySets: QuerySet[]
): Promise<string> {
  if (querySets.length === 0) {
    return "You don't have any query set."
  }

  const sortedQuerySets = [...querySets].sort(
    (qsA, qsB) =>
      getDurationInMillisecond(qsA.deliveryTime) -
      getDurationInMillisecond(qsB.deliveryTime)
  )

  const response =
    'Your query sets\n' +
    sortedQuerySets
      .map((querySet, index) => {
        return `${index + 1}. ${querySet.deliveryTime.format(
          'hh:mm'
        )}: ${querySet.tags.map((tag) => `"${tag}"`).join(', ')}`
      })
      .join('\n')

  return response
}
