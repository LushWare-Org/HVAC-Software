import type { Job, WorkOrder } from '../types/api'
import { formatMoney } from './format'

function fmt(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}
function fmtTime(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

/** Opens a print window with a professional service report — browser prints/saves as PDF. */
export function printServiceReport(job: Job, workOrders: WorkOrder[], technicianName: string) {
  const allTasks = workOrders.flatMap(w => w.taskCompletions)
  const done = allTasks.filter(t => t.isCompleted).length
  const partsTotal = workOrders.flatMap(w => w.lineItems).reduce((s, li) => s + Number(li.lineTotal), 0)
  const onSiteMs = workOrders.reduce((s, w) => {
    if (!w.checkinAt || !w.checkoutAt) return s
    return s + (new Date(w.checkoutAt).getTime() - new Date(w.checkinAt).getTime())
  }, 0)
  const onSiteLabel = onSiteMs > 0
    ? `${Math.floor(onSiteMs / 3600000)}h ${Math.round((onSiteMs % 3600000) / 60000)}m`
    : null

  const workOrderBlocks = workOrders.map(wo => {
    const woDone = wo.taskCompletions.filter(t => t.isCompleted).length

    const tasks = wo.taskCompletions.length > 0
      ? `<table class="data-table">
          <thead><tr><th style="width:36px">Done</th><th>Task</th><th>Notes</th></tr></thead>
          <tbody>
            ${wo.taskCompletions.map(t => `
              <tr>
                <td style="text-align:center;font-size:15px">${t.isCompleted ? '✔' : '○'}</td>
                <td style="font-weight:${t.isCompleted ? '600' : '400'};color:${t.isCompleted ? '#111' : '#6B7280'}">${t.taskName}</td>
                <td style="color:#6B7280;font-size:11px">${t.notes || ''}</td>
              </tr>`).join('')}
          </tbody>
        </table>`
      : ''

    const lineItems = wo.lineItems.length > 0
      ? `<h4 class="section-sub">Parts &amp; Materials</h4>
         <table class="data-table">
           <thead><tr><th>Description</th><th>Qty</th><th style="text-align:right">Unit</th><th style="text-align:right">Total</th></tr></thead>
           <tbody>
             ${wo.lineItems.map(li => `
               <tr>
                 <td>${li.description}</td>
                 <td>${Number(li.quantity)}</td>
                 <td style="text-align:right">${formatMoney(li.unitPrice)}</td>
                 <td style="text-align:right;font-weight:600">${formatMoney(li.lineTotal)}</td>
               </tr>`).join('')}
             <tr class="total-row">
               <td colspan="3" style="text-align:right;font-weight:700">Parts Total</td>
               <td style="text-align:right;font-weight:700">${formatMoney(partsTotal)}</td>
             </tr>
           </tbody>
         </table>`
      : ''

    const notes = wo.technicianNotes
      ? `<h4 class="section-sub">Technician Notes</h4>
         <div class="notes-box">${wo.technicianNotes.replace(/\n/g, '<br/>')}</div>`
      : ''

    const signature = wo.signatureUrl
      ? `<div class="signature-block">
           <p class="section-sub" style="margin-bottom:6px">Customer Signature</p>
           <img src="${wo.signatureUrl}" alt="Signature" style="max-height:70px;border:1px solid #E5E7EB;border-radius:6px;padding:6px;background:#fff"/>
         </div>`
      : ''

    return `
      <div class="wo-block">
        <div class="wo-header">
          <span class="wo-num">${wo.workOrderNumber}</span>
          <span class="wo-tech">Technician: ${wo.technicianName}</span>
        </div>
        ${wo.checkinAt ? `<div class="wo-times">On site ${fmtTime(wo.checkinAt)} — ${wo.checkoutAt ? fmtTime(wo.checkoutAt) : 'In progress'}</div>` : ''}
        ${wo.taskCompletions.length > 0 ? `<h4 class="section-sub">Work Performed (${woDone}/${wo.taskCompletions.length} tasks)</h4>${tasks}` : ''}
        ${lineItems}
        ${notes}
        ${signature}
      </div>`
  }).join('')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Service Report — ${job.jobNumber}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #111827; background: #fff; padding: 0; }

    /* Cover strip */
    .cover { background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); color: #fff; padding: 32px 40px 28px; }
    .cover-top { display: flex; align-items: flex-start; justify-content: space-between; }
    .brand { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.7); margin-bottom: 6px; }
    .report-title { font-size: 24px; font-weight: 800; letter-spacing: -0.03em; }
    .report-sub { font-size: 13px; color: rgba(255,255,255,0.75); margin-top: 4px; }
    .job-num { font-size: 22px; font-weight: 800; color: rgba(255,255,255,0.9); text-align: right; }
    .job-date { font-size: 12px; color: rgba(255,255,255,0.6); text-align: right; margin-top: 4px; }

    /* Stats bar */
    .stats-bar { display: flex; background: #F1F5FF; border-bottom: 2px solid #DBEAFE; }
    .stat { flex: 1; padding: 14px 20px; border-right: 1px solid #DBEAFE; }
    .stat:last-child { border-right: none; }
    .stat-val { font-size: 20px; font-weight: 800; color: #1D4ED8; font-variant-numeric: tabular-nums; }
    .stat-lbl { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #6B7280; margin-top: 2px; }

    /* Main body */
    .body { padding: 28px 40px; }

    /* Job summary */
    .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 28px; }
    .field { background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 10px 12px; }
    .field-lbl { font-size: 10px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px; }
    .field-val { font-size: 13px; font-weight: 600; color: #111827; }

    /* Work order sections */
    .wo-block { border: 1px solid #E5E7EB; border-radius: 10px; padding: 18px; margin-bottom: 18px; page-break-inside: avoid; }
    .wo-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
    .wo-num { font-size: 15px; font-weight: 700; color: #111827; }
    .wo-tech { font-size: 12px; color: #6B7280; }
    .wo-times { font-size: 11px; color: #9CA3AF; margin-bottom: 12px; }
    .section-sub { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #374151; margin: 12px 0 6px; }

    /* Tables */
    .data-table { width: 100%; border-collapse: collapse; margin-bottom: 4px; font-size: 12px; }
    .data-table th { background: #F3F4F6; text-align: left; padding: 6px 10px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #6B7280; border-bottom: 1px solid #E5E7EB; }
    .data-table td { padding: 7px 10px; border-bottom: 1px solid #F3F4F6; vertical-align: top; }
    .total-row td { background: #EFF6FF; font-size: 13px; padding: 9px 10px; border-top: 2px solid #BFDBFE; }

    /* Notes */
    .notes-box { background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px 14px; font-size: 12px; line-height: 1.65; color: #374151; white-space: pre-wrap; }
    .signature-block { margin-top: 12px; }

    /* Footer */
    .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #E5E7EB; display: flex; justify-content: space-between; font-size: 10px; color: #9CA3AF; }

    @media print {
      body { padding: 0; }
      @page { margin: 0; size: A4 portrait; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>

  <div class="cover">
    <div class="cover-top">
      <div>
        <div class="brand">Service Report</div>
        <div class="report-title">${job.title}</div>
        <div class="report-sub">Technician: ${technicianName}</div>
      </div>
      <div>
        <div class="job-num">${job.jobNumber}</div>
        <div class="job-date">Completed ${fmt(job.scheduledStart)}</div>
      </div>
    </div>
  </div>

  ${[allTasks.length && `<div class="stats-bar">
    ${allTasks.length ? `<div class="stat"><div class="stat-val">${done}/${allTasks.length}</div><div class="stat-lbl">Tasks completed</div></div>` : ''}
    ${onSiteLabel ? `<div class="stat"><div class="stat-val">${onSiteLabel}</div><div class="stat-lbl">Time on site</div></div>` : ''}
    ${partsTotal > 0 ? `<div class="stat"><div class="stat-val">${formatMoney(partsTotal)}</div><div class="stat-lbl">Parts &amp; materials</div></div>` : ''}
  </div>`].filter(Boolean).join('')}

  <div class="body">
    <div class="summary-grid">
      <div class="field"><div class="field-lbl">Job Number</div><div class="field-val">${job.jobNumber}</div></div>
      <div class="field"><div class="field-lbl">Status</div><div class="field-val">${job.status.replace(/_/g, ' ')}</div></div>
      <div class="field"><div class="field-lbl">Service</div><div class="field-val">${job.title}</div></div>
      <div class="field"><div class="field-lbl">Technician</div><div class="field-val">${technicianName}</div></div>
      ${job.description ? `<div class="field" style="grid-column:1/-1"><div class="field-lbl">Description</div><div class="field-val" style="font-weight:400">${job.description}</div></div>` : ''}
    </div>

    ${workOrderBlocks}

    <div class="footer">
      <span>Generated ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
      <span>${job.jobNumber} · Trade &amp; Service CRM</span>
    </div>
  </div>

  <script>window.onload = () => window.print()</script>
</body>
</html>`

  const win = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700')
  if (!win) { alert('Please allow pop-ups to download the PDF.'); return }
  win.document.write(html)
  win.document.close()
}
