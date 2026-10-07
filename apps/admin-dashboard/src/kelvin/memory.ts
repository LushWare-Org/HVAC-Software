/** Kelvin's routines, said the way people say them. Pure, so it is testable. */
const SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** "Every weekday at 8:00 am". */
export function routineWhen(days: number[], time: string): string {
  const [h, m] = time.split(':').map(Number)
  const clock = `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`
  const key = [...days].sort().join(',')
  const which = key === '0,1,2,3,4,5,6' ? 'day' : key === '1,2,3,4,5' ? 'weekday' : key === '0,6' ? 'weekend day' : days.map(d => SHORT[d]).join(', ')
  return `Every ${which} at ${clock}`
}
