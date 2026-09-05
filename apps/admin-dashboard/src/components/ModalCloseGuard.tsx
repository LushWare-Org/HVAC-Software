/**
 * ModalCloseGuard — asks for confirmation before an accidental backdrop click
 * closes a modal.
 *
 * Why this is global rather than per-modal: this app has ~45 modals/drawers,
 * every one of them built on the same shape — a full-viewport `position: fixed`
 * backdrop whose onClick closes it, wrapping a content box that calls
 * `stopPropagation()`. Wiring a confirmation into each one by hand would mean
 * hundreds of edits, and any modal added later would silently miss the
 * behaviour. Intercepting at the document level in the CAPTURE phase means
 * every existing modal is covered and every future one is too, for free.
 *
 * How it works: we listen for clicks during capture (before React's own root
 * listener sees them). If the click landed *directly* on a modal backdrop —
 * i.e. `event.target` IS the overlay, not something inside it — we swallow the
 * event and show a confirm prompt instead. On "Close", we re-dispatch the very
 * same click on that element carrying an approval flag, so the modal's original
 * onClose runs exactly as it normally would. Nothing about the modals changes.
 *
 * Escape hatch: put `data-no-close-confirm` on an overlay that should close
 * instantly (it is then ignored entirely by this guard).
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle } from 'lucide-react'

/** Marks a click we already approved, so the capture handler lets it through. */
const APPROVED = '__modalGuardApproved'

/**
 * Reads the React props React stores on the DOM node, so we can tell whether an
 * overlay actually has an onClick (i.e. it really is closable by clicking out)
 * rather than guessing from geometry alone. Without this, a full-screen loading
 * overlay — which has no handler and does nothing when clicked — would wrongly
 * trigger a "close?" prompt.
 *
 * This reads a React internal, so it is used only as a *narrowing* signal: if
 * the key is missing (React changed its internals), we return `undefined` and
 * the caller falls back to the geometric heuristic instead of breaking.
 */
function getReactOnClick(el: HTMLElement): ((e: unknown) => void) | undefined | null {
  const key = Object.keys(el).find((k) => k.startsWith('__reactProps$'))
  if (!key) return undefined // unknown — caller decides
  const props = (el as unknown as Record<string, { onClick?: (e: unknown) => void }>)[key]
  return props?.onClick ?? null // null = definitively has no handler
}

/**
 * A backdrop is a fixed-position element that covers essentially the whole
 * viewport and contains the modal content. The "clicked the element itself"
 * test is what distinguishes an outside-click from a click on the content:
 * content clicks have a deeper `target`, and these modals already stop
 * propagation, so they never reach us as a backdrop hit anyway.
 */
function isModalBackdrop(el: EventTarget | null): el is HTMLElement {
  if (!(el instanceof HTMLElement)) return false
  if (el.hasAttribute('data-no-close-confirm')) return false
  // An overlay with nothing inside it isn't a modal (toasts, hit-areas, etc).
  if (!el.firstElementChild) return false

  const style = window.getComputedStyle(el)
  if (style.position !== 'fixed') return false
  // Toast/snackbar layers are click-through; never treat them as backdrops.
  if (style.pointerEvents === 'none') return false

  const rect = el.getBoundingClientRect()
  const coversViewport =
    rect.width >= window.innerWidth * 0.9 && rect.height >= window.innerHeight * 0.9
  if (!coversViewport) return false

  // If React tells us there's no click handler, this overlay doesn't close on
  // outside-click at all (loading veil, static scrim) — leave it alone.
  return getReactOnClick(el) !== null
}

/**
 * True when the modal holds text the user typed, so the prompt can warn about
 * losing it. A read-only detail view gets neutral wording instead of an
 * inaccurate "unsaved changes" warning.
 */
function hasUserInput(root: HTMLElement): boolean {
  const fields = root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
    'input, textarea',
  )
  for (const field of fields) {
    if (field instanceof HTMLInputElement && (field.type === 'checkbox' || field.type === 'radio')) {
      if (field.checked !== field.defaultChecked) return true
      continue
    }
    if (field.value && field.value !== field.defaultValue) return true
  }
  return false
}

export default function ModalCloseGuard() {
  const [pending, setPending] = useState<HTMLElement | null>(null)
  const [dirty, setDirty] = useState(false)
  // Kept in a ref too so the (stable) capture listener never needs re-binding.
  const pendingRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    function onCaptureClick(event: MouseEvent) {
      if ((event as unknown as Record<string, unknown>)[APPROVED]) return
      // While the prompt is open its own overlay is on top; don't stack prompts.
      if (pendingRef.current) return
      if (!isModalBackdrop(event.target)) return

      event.preventDefault()
      event.stopPropagation()
      pendingRef.current = event.target
      setDirty(hasUserInput(event.target))
      setPending(event.target)
    }

    // Capture phase: React attaches its listeners at the root container, so
    // capturing at the document lets us decide before any onClick handler runs.
    document.addEventListener('click', onCaptureClick, true)
    return () => document.removeEventListener('click', onCaptureClick, true)
  }, [])

  const dismiss = useCallback(() => {
    pendingRef.current = null
    setPending(null)
  }, [])

  const confirm = useCallback(() => {
    const target = pendingRef.current
    pendingRef.current = null
    setPending(null)
    if (!target?.isConnected) return
    // Replay the click the user actually made, flagged so we let it through.
    const replay = new MouseEvent('click', { bubbles: true, cancelable: true })
    ;(replay as unknown as Record<string, unknown>)[APPROVED] = true
    target.dispatchEvent(replay)
  }, [])

  // Esc dismisses the prompt (returns you to the still-open modal).
  useEffect(() => {
    if (!pending) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        dismiss()
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [pending, dismiss])

  if (!pending) return null

  return (
    <div
      data-no-close-confirm
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="modal-close-guard-title"
      style={{
        position: 'fixed',
        inset: 0,
        // Above every modal in the app (highest seen is z-index 99999).
        zIndex: 2147483000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(2px)',
        padding: 16,
      }}
      onClick={dismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 380,
          background: 'var(--bg-card)',
          color: 'var(--t1)',
          border: '1px solid var(--bd)',
          borderRadius: 'var(--r-lg, 12px)',
          boxShadow: 'var(--shadow-lg, 0 10px 30px rgba(0,0,0,0.25))',
          padding: 22,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              flexShrink: 0,
              background: 'var(--amber-dim, rgba(217,119,6,0.12))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertTriangle size={18} style={{ color: 'var(--amber, #D97706)' }} />
          </div>
          <div id="modal-close-guard-title" style={{ fontWeight: 700, fontSize: 15 }}>
            {dirty ? 'Close without saving?' : 'Close this window?'}
          </div>
        </div>
        <p
          style={{
            fontSize: 13,
            lineHeight: 1.6,
            color: 'var(--t3)',
            margin: '0 0 18px',
          }}
        >
          {dirty
            ? 'You clicked outside this window. Anything you have typed here will be lost.'
            : 'You clicked outside this window.'}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={dismiss} autoFocus>
            Keep editing
          </button>
          <button
            className="btn"
            onClick={confirm}
            style={{ background: 'var(--red)', borderColor: 'var(--red)', color: '#fff' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
