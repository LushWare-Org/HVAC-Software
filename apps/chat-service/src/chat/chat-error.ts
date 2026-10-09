/** What the person sees when a chat fails: the cause when it helps them, never internals. */
export function chatErrorMessage(err: any): string {
  const status = err?.status ?? err?.response?.status;
  if (status === 429 || err?.code === 'insufficient_quota') {
    return "Kelvin's AI has reached its usage limit for now. Try again later, or ask an admin to check the AI plan.";
  }
  if (/No AI key is configured/.test(String(err?.message ?? ''))) return "Kelvin's AI isn't set up yet. Ask an admin to add an AI key.";
  return 'Chat service error. Please try again.';
}
