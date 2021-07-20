import * as dayjs from 'dayjs'

export function getDurationInMillisecond(time: dayjs.Dayjs): number {
  return (
    time.hour() * 3600000 +
    time.minute() * 60000 +
    time.second() * 1000 +
    time.millisecond()
  )
}

// every telegram message can make unexpected error
// for example, getting kicked from group.
// It is too labored to guard with try-catch for every telegram-api
// It decreases readability. So most of them is wrapped by this.
export async function suppressError<T>(promise: Promise<T>) {
  try {
    await promise
  } catch (error) {
    console.log(error)
  }
}
