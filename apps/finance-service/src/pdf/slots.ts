export interface TextStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 400 | 600 | 700 | 800;
  color?: string;
  align?: 'left' | 'center' | 'right';
}

export interface BoxStyle {
  background?: string;
  borderColor?: string;
  borderRadiusPx?: number;
  paddingPx?: number;
}

export interface TemplateBlock {
  id: string;
  slot: string; // registered partial name, e.g. "invoice/billTo"
  widthPct: number; // used by body-section (flow/row-based) blocks
  x?: number; // px — used by hero-section (free-canvas) blocks instead of widthPct/flow position
  y?: number; // px
  widthPx?: number; // px — hero-section block width
  style?: TextStyle & BoxStyle;
}

export interface TemplateRow {
  id: string;
  section: 'hero' | 'body'; // which visual band this row renders in — the dark header band or the white body
  blocks: TemplateBlock[];
}

/** Height of the free-positioning hero canvas — generous enough to fit the default
 * layout with room to drag things around. Matches the `.hero` min-height in the .hbs. */
export const HERO_CANVAS_HEIGHT = 380;

/** The arrangement every template renders with until an admin drags something — reproduces today's exact layout.
 * Hero-section blocks use free x/y canvas positions (literally draggable anywhere); body-section blocks stay
 * row/flow-based since their height depends on real document data (line-item count, notes length, etc.) that a
 * fixed canvas position can't account for. */
export const DEFAULT_ROWS: Record<'INVOICE' | 'QUOTE' | 'AGREEMENT' | 'PAYMENT_RECEIPT', TemplateRow[]> = {
  INVOICE: [
    { id: 'row-hero', section: 'hero', blocks: [
      { id: 'b-logo', slot: 'invoice/logo', widthPct: 100, x: 40, y: 36, widthPx: 150 },
      { id: 'b-docBadge', slot: 'invoice/docBadge', widthPct: 100, x: 464, y: 36, widthPx: 300 },
      { id: 'b-tagline', slot: 'invoice/tagline', widthPct: 100, x: 40, y: 86, widthPx: 400 },
      { id: 'b-companyName', slot: 'invoice/companyName', widthPct: 100, x: 40, y: 114, widthPx: 400 },
      { id: 'b-companyAddress', slot: 'invoice/companyAddress', widthPct: 100, x: 40, y: 150, widthPx: 320 },
      { id: 'b-headerText', slot: 'invoice/headerText', widthPct: 100, x: 40, y: 196, widthPx: 320 },
      { id: 'b-billTo', slot: 'invoice/billTo', widthPct: 100, x: 40, y: 230, widthPx: 380 },
      { id: 'b-balanceDue', slot: 'invoice/balanceDueCard', widthPct: 100, x: 464, y: 230, widthPx: 300 },
    ] },
    { id: 'row-infoGrid', section: 'body', blocks: [{ id: 'b-infoGrid', slot: 'invoice/infoGrid', widthPct: 100 }] },
    { id: 'row-table', section: 'body', blocks: [{ id: 'b-table', slot: 'invoice/lineItemsTable', widthPct: 100 }] },
    { id: 'row-totals', section: 'body', blocks: [{ id: 'b-totals', slot: 'invoice/totalsCard', widthPct: 100 }] },
    { id: 'row-paymentHistory', section: 'body', blocks: [{ id: 'b-paymentHistory', slot: 'invoice/paymentHistory', widthPct: 100 }] },
    { id: 'row-notes', section: 'body', blocks: [
      { id: 'b-notes', slot: 'invoice/notesCard', widthPct: 50 },
      { id: 'b-terms', slot: 'invoice/termsCard', widthPct: 50 },
      { id: 'b-bankDetails', slot: 'invoice/bankDetailsCard', widthPct: 100 },
    ] },
    { id: 'row-footer', section: 'body', blocks: [
      { id: 'b-pageFooterMeta', slot: 'invoice/pageFooterMeta', widthPct: 70 },
      { id: 'b-footerText', slot: 'invoice/footerText', widthPct: 30 },
    ] },
  ],
  QUOTE: [
    { id: 'row-hero', section: 'hero', blocks: [
      { id: 'b-logo', slot: 'quote/logo', widthPct: 100, x: 40, y: 36, widthPx: 150 },
      { id: 'b-docBadge', slot: 'quote/docBadge', widthPct: 100, x: 464, y: 36, widthPx: 300 },
      { id: 'b-tagline', slot: 'quote/tagline', widthPct: 100, x: 40, y: 86, widthPx: 400 },
      { id: 'b-companyName', slot: 'quote/companyName', widthPct: 100, x: 40, y: 114, widthPx: 400 },
      { id: 'b-companyAddress', slot: 'quote/companyAddress', widthPct: 100, x: 40, y: 150, widthPx: 320 },
      { id: 'b-headerText', slot: 'quote/headerText', widthPct: 100, x: 40, y: 196, widthPx: 320 },
      { id: 'b-scope', slot: 'quote/scopeOfWorkCard', widthPct: 100, x: 40, y: 230, widthPx: 380 },
      { id: 'b-quotedTotal', slot: 'quote/quotedTotalCard', widthPct: 100, x: 464, y: 230, widthPx: 300 },
    ] },
    { id: 'row-infoGrid', section: 'body', blocks: [{ id: 'b-infoGrid', slot: 'quote/infoGrid', widthPct: 100 }] },
    { id: 'row-table', section: 'body', blocks: [{ id: 'b-table', slot: 'quote/lineItemsTable', widthPct: 100 }] },
    { id: 'row-totals', section: 'body', blocks: [{ id: 'b-totals', slot: 'quote/totalsCard', widthPct: 100 }] },
    { id: 'row-approval', section: 'body', blocks: [{ id: 'b-approval', slot: 'quote/approvalBlock', widthPct: 100 }] },
    { id: 'row-notes', section: 'body', blocks: [
      { id: 'b-notes', slot: 'quote/notesCard', widthPct: 50 },
      { id: 'b-terms', slot: 'quote/termsCard', widthPct: 50 },
      { id: 'b-bankDetails', slot: 'quote/bankDetailsCard', widthPct: 100 },
    ] },
    { id: 'row-footer', section: 'body', blocks: [
      { id: 'b-pageFooterMeta', slot: 'quote/pageFooterMeta', widthPct: 70 },
      { id: 'b-footerText', slot: 'quote/footerText', widthPct: 30 },
    ] },
  ],
  AGREEMENT: [
    { id: 'row-hero', section: 'hero', blocks: [
      { id: 'b-logo', slot: 'agreement/logo', widthPct: 100, x: 40, y: 36, widthPx: 150 },
      { id: 'b-docBadge', slot: 'agreement/docBadge', widthPct: 100, x: 464, y: 36, widthPx: 300 },
      { id: 'b-tagline', slot: 'agreement/tagline', widthPct: 100, x: 40, y: 86, widthPx: 400 },
      { id: 'b-companyName', slot: 'agreement/companyName', widthPct: 100, x: 40, y: 114, widthPx: 400 },
      { id: 'b-companyAddress', slot: 'agreement/companyAddress', widthPct: 100, x: 40, y: 150, widthPx: 320 },
      { id: 'b-headerText', slot: 'agreement/headerText', widthPct: 100, x: 40, y: 196, widthPx: 320 },
    ] },
    { id: 'row-parties', section: 'body', blocks: [{ id: 'b-parties', slot: 'agreement/partiesSection', widthPct: 100 }] },
    { id: 'row-schedule', section: 'body', blocks: [{ id: 'b-schedule', slot: 'agreement/scheduleSection', widthPct: 100 }] },
    { id: 'row-pricing', section: 'body', blocks: [{ id: 'b-pricing', slot: 'agreement/pricingSection', widthPct: 100 }] },
    { id: 'row-notes', section: 'body', blocks: [{ id: 'b-notes', slot: 'agreement/notesSection', widthPct: 100 }] },
    { id: 'row-bankDetails', section: 'body', blocks: [{ id: 'b-bankDetails', slot: 'agreement/bankDetailsSection', widthPct: 100 }] },
    { id: 'row-signature', section: 'body', blocks: [{ id: 'b-signature', slot: 'agreement/signatureBlock', widthPct: 100 }] },
    { id: 'row-footer', section: 'body', blocks: [{ id: 'b-footerText', slot: 'agreement/footerText', widthPct: 100 }] },
  ],
  PAYMENT_RECEIPT: [
    { id: 'row-hero', section: 'hero', blocks: [
      { id: 'b-logo', slot: 'payment-receipt/logo', widthPct: 100, x: 40, y: 36, widthPx: 150 },
      { id: 'b-docBadge', slot: 'payment-receipt/docBadge', widthPct: 100, x: 464, y: 36, widthPx: 300 },
      { id: 'b-tagline', slot: 'payment-receipt/tagline', widthPct: 100, x: 40, y: 86, widthPx: 400 },
      { id: 'b-companyName', slot: 'payment-receipt/companyName', widthPct: 100, x: 40, y: 114, widthPx: 400 },
      { id: 'b-companyAddress', slot: 'payment-receipt/companyAddress', widthPct: 100, x: 40, y: 150, widthPx: 320 },
      { id: 'b-headerText', slot: 'payment-receipt/headerText', widthPct: 100, x: 40, y: 196, widthPx: 320 },
      { id: 'b-paidBy', slot: 'payment-receipt/paidByCard', widthPct: 100, x: 40, y: 230, widthPx: 380 },
      { id: 'b-amountPaid', slot: 'payment-receipt/amountPaidCard', widthPct: 100, x: 464, y: 230, widthPx: 300 },
    ] },
    { id: 'row-infoGrid', section: 'body', blocks: [{ id: 'b-infoGrid', slot: 'payment-receipt/infoGrid', widthPct: 100 }] },
    { id: 'row-summary', section: 'body', blocks: [{ id: 'b-summary', slot: 'payment-receipt/paymentSummaryCard', widthPct: 100 }] },
    { id: 'row-notes', section: 'body', blocks: [{ id: 'b-notes', slot: 'payment-receipt/notesCard', widthPct: 100 }] },
    { id: 'row-footer', section: 'body', blocks: [
      { id: 'b-pageFooterMeta', slot: 'payment-receipt/pageFooterMeta', widthPct: 70 },
      { id: 'b-footerText', slot: 'payment-receipt/footerText', widthPct: 30 },
    ] },
  ],
};
