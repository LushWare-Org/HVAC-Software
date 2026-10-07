/** Plan cards: which steps are ticked, the undo countdown, and spotting "undo". Pure, so they are testable. */
export interface StepRef { n: number; dependsOn: number[] }

/** Ticking a step also ticks what it needs; unticking it also unticks what needs it. */
export function toggleStep(steps: StepRef[], ticked: Set<number>, n: number, on: boolean): Set<number> {
  const next = new Set(ticked)
  if (on) {
    const add = (k: number) => {
      if (next.has(k) && k !== n) return
      next.add(k)
      steps.find(s => s.n === k)?.dependsOn.forEach(add)
    }
    add(n)
    return next
  }
  const remove = (k: number) => {
    next.delete(k)
    steps.filter(s => s.dependsOn.includes(k) && next.has(s.n)).forEach(s => remove(s.n))
  }
  remove(n)
  return next
}

/** The steps the person unticked, which the server skips. */
export function skipList(steps: StepRef[], ticked: Set<number>): number[] {
  return steps.filter(s => !ticked.has(s.n)).map(s => s.n)
}

/** "9:41" until the undo pass runs out, then null. */
export function countdown(expiresAt: string | undefined, now = Date.now()): string | null {
  if (!expiresAt) return null
  const left = Math.floor((Date.parse(expiresAt) - now) / 1000)
  if (!(left > 0)) return null
  return `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`
}

/** A plain "undo" request, handled on the card without asking the AI. */
export function isUndoCommand(text: string): boolean {
  return /^\s*(undo( that| it| this)?|take (that|it) back)\s*[.!]?\s*$/i.test(text)
}
