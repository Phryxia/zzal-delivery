import * as dayjs from 'dayjs'

export function getDurationInMillisecond(time: dayjs.Dayjs): number {
  return (
    time.hour() * 3600000 +
    time.minute() * 60000 +
    time.second() * 1000 +
    time.millisecond()
  )
}
