/** Event the chat widget listens for: open, and send this message as the person. */
export const ASK_ASSISTANT_EVENT = 'hvactor:ask-assistant'

/** Opens the assistant with a request already sent, e.g. "Send a reminder for INV-1". */
export function askAssistant(message: string) {
  window.dispatchEvent(new CustomEvent(ASK_ASSISTANT_EVENT, { detail: { message } }))
}
