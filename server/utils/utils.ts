import dayjs from 'dayjs'

export const getExpireDateTime = (value: number, unit: dayjs.ManipulateType) => dayjs().add(value, unit).format()
