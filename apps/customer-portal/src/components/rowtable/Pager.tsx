import { ChevronLeft, ChevronRight } from 'lucide-react'
import './rowTable.css'

export const PAGE_SIZE = 15

/** "Showing 1–15 of 42" with previous and next. Shows only the count when everything fits on one page. */
export default function Pager({ total, page, onPage, noun = 'items' }: { total: number; page: number; onPage: (p: number) => void; noun?: string }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const current = Math.min(page, pages)
  return (
    <div className="jt-foot">
      <span style={{ fontSize: 13, color: 'var(--t3)' }}>
        {total === 0 ? `0 ${noun}` : `Showing ${(current - 1) * PAGE_SIZE + 1}–${Math.min(current * PAGE_SIZE, total)} of ${total}`}
      </span>
      {pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" style={{ width: 32, height: 32, padding: 0, justifyContent: 'center' }} aria-label="Previous page" onClick={() => onPage(Math.max(1, current - 1))} disabled={current === 1}><ChevronLeft size={18} /></button>
          <span style={{ fontSize: 13, color: 'var(--t2)', margin: '0 4px' }}>Page {current} of {pages}</span>
          <button className="btn btn-secondary btn-sm" style={{ width: 32, height: 32, padding: 0, justifyContent: 'center' }} aria-label="Next page" onClick={() => onPage(Math.min(pages, current + 1))} disabled={current === pages}><ChevronRight size={18} /></button>
        </div>
      )}
    </div>
  )
}
