import { useKelvin } from './KelvinProvider'
import type { SpeakMode, Tone } from './types'

const OPTIONS: Array<[SpeakMode, string, string]> = [
  ['ALL', 'Talk to me', 'Kelvin speaks up for things that need action soon.'],
  ['URGENT_ONLY', 'Only urgent', 'Only emergencies, technicians off with visits, and visits running 30+ minutes late.'],
  ['NEVER', 'Never pop up', 'Kelvin stays quiet. Everything waits on his desk.'],
]

const TONES: Array<[Tone, string, string]> = [
  ['FRIENDLY', 'Friendly', 'Warm and plain, a sentence or two.'],
  ['SHORT', 'Short', 'As few words as possible. No pleasantries.'],
  ['FORMAL', 'Formal', 'Polite business English.'],
]

export default function KelvinPrefsCard() {
  const k = useKelvin()
  if (!k.enabled) return null
  const mode = k.feed?.prefs?.speakMode ?? 'ALL'
  const tone = k.feed?.prefs?.tone ?? 'FRIENDLY'
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
      <h2 id="kv-tone-h" className="kv-prefs-h2">How Kelvin writes to you</h2>
      <div role="radiogroup" aria-labelledby="kv-tone-h" className="kv-prefs-opts">
        {TONES.map(([v, label, help]) => (
          <label key={v} className={tone === v ? 'is-on' : undefined}>
            <input type="radio" name="kv-tone" checked={tone === v} onChange={() => void k.setPrefs({ tone: v })} />
            <span><strong>{label}</strong><small>{help}</small></span>
          </label>
        ))}
      </div>
    </section>
  )
}
