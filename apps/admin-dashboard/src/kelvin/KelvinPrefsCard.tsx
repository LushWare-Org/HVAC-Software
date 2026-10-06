import { useKelvin } from './KelvinProvider'
import type { SpeakMode } from './types'

const OPTIONS: Array<[SpeakMode, string, string]> = [
  ['ALL', 'Talk to me', 'Kelvin speaks up for things that need action soon.'],
  ['URGENT_ONLY', 'Only urgent', 'Only emergencies, technicians off with visits, and visits running 30+ minutes late.'],
  ['NEVER', 'Never pop up', 'Kelvin stays quiet. Everything waits on his desk.'],
]

export default function KelvinPrefsCard() {
  const k = useKelvin()
  if (!k.enabled) return null
  const mode = k.feed?.prefs?.speakMode ?? 'ALL'
  return (
    <section className="kv-prefs" aria-labelledby="kv-prefs-h">
      <h2 id="kv-prefs-h">How Kelvin talks to you</h2>
      <div role="radiogroup" aria-labelledby="kv-prefs-h" className="kv-prefs-opts">
        {OPTIONS.map(([v, label, help]) => (
          <label key={v} className={mode === v ? 'is-on' : undefined}>
            <input type="radio" name="kv-mode" checked={mode === v} onChange={() => void k.setPrefs({ speakMode: v })} />
            <span><strong>{label}</strong><small>{help}</small></span>
          </label>
        ))}
      </div>
    </section>
  )
}
