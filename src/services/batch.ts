import * as dayjs from 'dayjs'
import * as customParseFormat from 'dayjs/plugin/customParseFormat'
import { getDurationInMillisecond } from '../util'

dayjs.extend(customParseFormat)

let batchConfig = {
  period: dayjs('00:00:10', 'hh:mm:ss'),
  timeOffset: dayjs('00:00:00', 'hh:mm:ss'),
}

function configureBatch(config: Partial<typeof batchConfig>) {
  batchConfig = {
    ...batchConfig,
    ...config,
  }
}

function getMillisecondDiffToNextBatch(currentTime?: dayjs.Dayjs): number {
  currentTime = currentTime ?? dayjs()

  const tc = getDurationInMillisecond(currentTime)
  const t0 = getDurationInMillisecond(batchConfig.timeOffset)
  const ti = getDurationInMillisecond(batchConfig.period)

  const td = t0 + Math.floor((tc - t0) / ti + 1) * ti - tc

  return td
}

function startBatch(callback: () => void) {
  function runBatch() {
    callback()
    setTimeout(runBatch, getMillisecondDiffToNextBatch())
  }

  runBatch()
}

export default {
  configureBatch,
  startBatch,
}
