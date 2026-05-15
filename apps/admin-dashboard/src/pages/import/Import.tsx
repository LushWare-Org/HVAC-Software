import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Upload, FileText, CheckCircle, AlertCircle, AlertTriangle,
  ChevronRight, ChevronLeft, RotateCcw, Download, Users,
  Wrench, Loader2, X, Check, ArrowRight, RefreshCw,
  Database, Zap, FileSpreadsheet, Building2,
} from 'lucide-react'
import {
  useImportDetect, useImportValidate, useImportStart, useImportProgress,
  useImportBatches, useImportRollback,
  CUSTOMER_TARGET_FIELDS, EQUIPMENT_TARGET_FIELDS,
  type Platform, type ColumnMap, type DetectResult, type ValidationResult, type ImportBatch,
} from '../../hooks/useImport'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../lib/api'

// ── Auth-aware download helper ────────────────────────────────────────────────

async function downloadWithAuth(url: string, filename: string) {
  const res = await api.get(url, { responseType: 'blob' })
  const blob = new Blob([res.data], { type: res.headers['content-type'] ?? 'application/octet-stream' })
  const href = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  a.click()
  URL.revokeObjectURL(href)
}

// ── Step definitions ──────────────────────────────────────────────────────────

const STEPS = ['Source', 'Upload', 'Map Columns', 'Validate', 'Import', 'Done']

// ── Stepper ───────────────────────────────────────────────────────────────────

function Stepper({ current }: { current: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 36, gap: 0 }}>
      {STEPS.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 13, transition: 'all 0.3s ease',
                background: done ? 'var(--green)' : active ? 'var(--blue)' : 'var(--bg-card-2)',
                color: done || active ? 'white' : 'var(--t3)',
                border: active ? '2px solid var(--blue)' : done ? '2px solid var(--green)' : '2px solid var(--bd)',
                boxShadow: active ? '0 0 0 4px var(--blue-glow)' : 'none',
              }}>
                {done ? <Check size={16} /> : i + 1}
              </div>
              <span style={{ fontSize: 11, fontWeight: active ? 600 : 400, color: active ? 'var(--blue)' : done ? 'var(--green)' : 'var(--t3)', whiteSpace: 'nowrap' }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ width: 60, height: 2, background: i < current ? 'var(--green)' : 'var(--bd)', margin: '0 4px', marginBottom: 22, transition: 'background 0.3s' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Platform card ─────────────────────────────────────────────────────────────

function PlatformCard({ icon: Icon, title, subtitle, color, selected, onClick }: {
  icon: React.ElementType; title: string; subtitle: string; color: string; selected: boolean; onClick: () => void
}) {
  return (
    <button onClick={onClick} type="button" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10,
      padding: '20px 20px', borderRadius: 'var(--r-lg)', border: `2px solid ${selected ? 'var(--blue)' : 'var(--bd)'}`,
      background: selected ? 'var(--blue-glow)' : 'var(--bg-card)',
      cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.2s',
      boxShadow: selected ? '0 0 0 3px var(--blue-glow)' : 'var(--shadow-sm)',
      transform: selected ? 'translateY(-1px)' : 'none',
    }}>
      <div style={{ width: 44, height: 44, borderRadius: 'var(--r)', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={22} color="white" />
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--t1)', marginBottom: 3 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.5 }}>{subtitle}</div>
      </div>
      {selected && <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: 'var(--blue)' }}>
        <Check size={13} /> Selected
      </div>}
    </button>
  )
}

// ── Step 1: Choose Source ─────────────────────────────────────────────────────

function StepSource({ selected, onSelect }: { selected: Platform | null; onSelect: (p: Platform) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--t1)', marginBottom: 4 }}>Where is your data coming from?</h2>
        <p style={{ fontSize: 13, color: 'var(--t3)' }}>We'll auto-detect column names for your platform so you don't have to map everything manually.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <PlatformCard
          icon={Zap} title="Jobber" color="#16a34a"
          subtitle="Export from Jobber → Settings → Data Export. Select Clients + Properties CSV."
          selected={selected === 'jobber'} onClick={() => onSelect('jobber')}
        />
        <PlatformCard
          icon={Database} title="Housecall Pro" color="#2563eb"
          subtitle="Export from HCP → Reports → Customer Export. Download the CSV."
          selected={selected === 'hcp'} onClick={() => onSelect('hcp')}
        />
        <PlatformCard
          icon={FileSpreadsheet} title="Spreadsheet / Other" color="#7c3aed"
          subtitle="Google Sheets, Excel, or any other FSM platform. You'll map columns manually."
          selected={selected === 'generic'} onClick={() => onSelect('generic')}
        />
        <PlatformCard
          icon={Wrench} title="Equipment Template" color="#ea580c"
          subtitle="Add equipment to existing customers using our pre-formatted template. Download it below."
          selected={selected === 'equipment'} onClick={() => onSelect('equipment')}
        />
      </div>
      {selected === 'equipment' && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderRadius: 10,
          background: 'var(--bg-surface)', border: '1px solid var(--bd)',
        }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', margin: 0 }}>Equipment Template CSV</p>
            <p style={{ fontSize: 12, color: 'var(--t3)', margin: '2px 0 0' }}>Download, fill in your equipment data, then upload it above.</p>
          </div>
          <button
            onClick={() => downloadWithAuth('/crm/import/equipment-template.csv', 'equipment-template.csv')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: 'var(--blue)', color: '#fff', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            <Download size={14} /> Download Template
          </button>
        </div>
      )}
    </div>
  )
}

// ── Step 2: Upload ────────────────────────────────────────────────────────────

function StepUpload({ platform, onFile, isLoading, error }: {
  platform: Platform; onFile: (f: File) => void; isLoading: boolean; error?: string
}) {
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    setFileName(file.name)
    onFile(file)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--t1)', marginBottom: 4 }}>Upload your CSV file</h2>
        <p style={{ fontSize: 13, color: 'var(--t3)' }}>
          {platform === 'jobber' ? 'Upload the clients CSV from your Jobber export ZIP.' :
           platform === 'hcp'    ? 'Upload the customer export CSV from Housecall Pro.' :
           platform === 'equipment' ? 'Upload the filled equipment template CSV.' :
           'Upload any CSV with customer data. You\'ll map columns in the next step.'}
        </p>
      </div>

      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? 'var(--blue)' : error ? 'var(--red)' : 'var(--bd-md)'}`,
          borderRadius: 'var(--r-lg)', padding: '48px 32px', textAlign: 'center', cursor: 'pointer',
          background: dragging ? 'var(--blue-glow)' : error ? 'var(--red-dim)' : 'var(--bg-card-2)',
          transition: 'all 0.2s',
        }}
      >
        <input ref={inputRef} type="file" accept=".csv,.zip" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <Loader2 size={36} className="spin" style={{ color: 'var(--blue)' }} />
            <p style={{ fontSize: 14, color: 'var(--t2)', fontWeight: 500 }}>Analysing your file…</p>
          </div>
        ) : fileName ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 52, height: 52, background: 'var(--green-dim)', borderRadius: 'var(--r)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={26} style={{ color: 'var(--green)' }} />
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>{fileName}</p>
            <p style={{ fontSize: 12, color: 'var(--t3)' }}>Click to choose a different file</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 52, height: 52, background: 'var(--bg-card)', borderRadius: 'var(--r)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--bd)' }}>
              <Upload size={24} style={{ color: 'var(--t3)' }} />
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>Drop your CSV here</p>
            <p style={{ fontSize: 12, color: 'var(--t3)' }}>or click to browse · .csv or .zip accepted</p>
          </div>
        )}
      </div>
      {error && <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 'var(--r)', background: 'var(--red-dim)', border: '1px solid var(--red)', color: 'var(--red)', fontSize: 13 }}>
        <AlertCircle size={15} /> {error}
      </div>}
    </div>
  )
}

// ── Step 3: Column Mapping ─────────────────────────────────────────────────────

function StepMapping({ detect, columnMap, onChange }: {
  detect: DetectResult; columnMap: ColumnMap[]; onChange: (map: ColumnMap[]) => void
}) {
  const isEquipment = detect.platform === 'equipment'
  const targetFields = isEquipment ? EQUIPMENT_TARGET_FIELDS : CUSTOMER_TARGET_FIELDS

  const getMapping = (header: string) => columnMap.find(m => m.csvHeader === header)?.targetField ?? '__ignore__'

  const setMapping = (header: string, targetField: string) => {
    const next = columnMap.filter(m => m.csvHeader !== header)
    if (targetField !== '__ignore__') next.push({ csvHeader: header, targetField })
    onChange(next)
  }

  const hasFullName = columnMap.some(m => m.targetField === 'fullName')
  const requiredMapped = targetFields.filter(f => f.required).every(f => {
    // fullName satisfies both firstName and lastName requirements
    if ((f.field === 'firstName' || f.field === 'lastName') && hasFullName) return true
    return columnMap.some(m => m.targetField === f.field)
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--t1)', marginBottom: 4 }}>Map columns</h2>
        <p style={{ fontSize: 13, color: 'var(--t3)' }}>
          We've auto-mapped what we recognised. Fix anything that looks wrong, then click Next.
        </p>
      </div>

      <div style={{ overflowX: 'auto', borderRadius: 'var(--r)', border: '1px solid var(--bd)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--bg-card-2)', borderBottom: '1px solid var(--bd)' }}>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--t3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', width: '30%' }}>CSV Column</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--t3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', width: '35%' }}>Sample Data</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--t3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', width: '35%' }}>Maps To</th>
            </tr>
          </thead>
          <tbody>
            {detect.headers.map((header, i) => {
              const mapped = getMapping(header)
              const isIgnored = mapped === '__ignore__'
              const isRequired = targetFields.find(f => f.field === mapped)?.required
              return (
                <tr key={header} style={{ borderBottom: i < detect.headers.length - 1 ? '1px solid var(--bd)' : 'none', opacity: isIgnored ? 0.5 : 1 }}>
                  <td style={{ padding: '10px 14px', fontWeight: 500, color: 'var(--t1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {!isIgnored && (
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: isRequired ? 'var(--blue)' : 'var(--green)', flexShrink: 0 }} />
                      )}
                      {header}
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--t3)' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {detect.preview.slice(0, 3).map((row, ri) => (
                        <span key={ri} style={{ fontSize: 11, padding: '1px 6px', borderRadius: 4, background: 'var(--bg-card-2)', border: '1px solid var(--bd)', color: 'var(--t2)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {row[header] || <span style={{ color: 'var(--t4)' }}>—</span>}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <select
                      className="form-input"
                      style={{ fontSize: 12, padding: '5px 8px' }}
                      value={mapped}
                      onChange={e => setMapping(header, e.target.value)}
                    >
                      {targetFields.map(f => (
                        <option key={f.field} value={f.field}>
                          {f.label}{f.required ? ' *' : ''}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 'var(--r)', background: requiredMapped ? 'var(--green-dim)' : 'var(--amber-dim)', border: `1px solid ${requiredMapped ? 'var(--green)' : 'var(--amber)'}` }}>
        {requiredMapped
          ? <><Check size={14} style={{ color: 'var(--green)' }} /> <span style={{ fontSize: 13, color: 'var(--green)', fontWeight: 500 }}>All required fields mapped — ready to validate</span></>
          : <><AlertTriangle size={14} style={{ color: 'var(--amber)' }} /> <span style={{ fontSize: 13, color: 'var(--amber)', fontWeight: 500 }}>Map the required fields (marked with *) to continue</span></>
        }
      </div>
    </div>
  )
}

// ── Step 4: Validation ────────────────────────────────────────────────────────

function StepValidation({ validation, isLoading, onOverride, overrideWarnings }: {
  validation: ValidationResult | null; isLoading: boolean; onOverride: (v: boolean) => void; overrideWarnings: boolean
}) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '48px 0' }}>
      <Loader2 size={32} className="spin" style={{ color: 'var(--blue)' }} />
      <p style={{ fontSize: 14, color: 'var(--t2)' }}>Checking your data…</p>
    </div>
  )

  if (!validation) return null
  const hasHardErrors = validation.willFail > 0

  // Group errors by type
  const grouped = validation.errors.reduce((acc, e) => {
    const key = e.message
    if (!acc[key]) acc[key] = []
    acc[key].push(e)
    return acc
  }, {} as Record<string, typeof validation.errors>)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--t1)', marginBottom: 4 }}>Review before importing</h2>
        <p style={{ fontSize: 13, color: 'var(--t3)' }}>Here's what we found in your file. Fix issues or continue with warnings.</p>
      </div>

      {/* Summary chips */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { label: 'Will import', count: validation.willImport, color: 'var(--green)', bg: 'var(--green-dim)', icon: CheckCircle },
          { label: 'Duplicates — skip', count: validation.willSkip, color: 'var(--amber)', bg: 'var(--amber-dim)', icon: RefreshCw },
          { label: 'Errors — skip', count: validation.willFail, color: 'var(--red)', bg: 'var(--red-dim)', icon: X },
        ].map(({ label, count, color, bg, icon: Icon }) => (
          <div key={label} style={{ padding: '16px', borderRadius: 'var(--r)', background: bg, display: 'flex', flexDirection: 'column', gap: 6, border: `1px solid ${color}20` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon size={16} style={{ color }} />
              <span style={{ fontSize: 11, fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>{count.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: 'var(--t3)' }}>of {validation.totalRows.toLocaleString()} rows</div>
          </div>
        ))}
      </div>

      {/* Warnings */}
      {validation.warnings.map(w => (
        <div key={w.type} style={{ padding: '12px 14px', borderRadius: 'var(--r)', background: 'var(--amber-dim)', border: '1px solid var(--amber)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <AlertTriangle size={16} style={{ color: 'var(--amber)', flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 13, color: 'var(--t2)' }}>{w.message}</span>
        </div>
      ))}

      {/* Error accordion */}
      {validation.willFail > 0 && (
        <div style={{ borderRadius: 'var(--r)', border: '1px solid var(--bd)', overflow: 'hidden' }}>
          {Object.entries(grouped).map(([msg, rows], i) => (
            <div key={msg}>
              <button
                type="button"
                onClick={() => setExpanded(expanded === msg ? null : msg)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg-card-2)', border: 'none', cursor: 'pointer', borderBottom: i < Object.keys(grouped).length - 1 || expanded === msg ? '1px solid var(--bd)' : 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--t1)' }}>
                  <AlertCircle size={14} style={{ color: 'var(--red)' }} />
                  {msg}
                  <span style={{ padding: '1px 7px', borderRadius: 'var(--r-full)', background: 'var(--red-dim)', color: 'var(--red)', fontSize: 11, fontWeight: 600 }}>{rows.length}</span>
                </div>
                <ChevronRight size={14} style={{ color: 'var(--t3)', transform: expanded === msg ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              {expanded === msg && (
                <div style={{ padding: '0', maxHeight: 200, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-card)' }}>
                        <th style={{ padding: '8px 14px', textAlign: 'left', color: 'var(--t3)', fontWeight: 600 }}>Row</th>
                        <th style={{ padding: '8px 14px', textAlign: 'left', color: 'var(--t3)', fontWeight: 600 }}>Data Preview</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 20).map(r => (
                        <tr key={r.rowNumber} style={{ borderTop: '1px solid var(--bd)' }}>
                          <td style={{ padding: '7px 14px', color: 'var(--t3)' }}>{r.rowNumber}</td>
                          <td style={{ padding: '7px 14px', color: 'var(--t2)', fontFamily: 'monospace', fontSize: 11 }}>
                            {Object.values(r.rawData).slice(0, 3).join(' · ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Override toggle */}
      {hasHardErrors && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '12px 14px', borderRadius: 'var(--r)', background: 'var(--bg-card-2)', border: '1px solid var(--bd)' }}>
          <input type="checkbox" checked={overrideWarnings} onChange={e => onOverride(e.target.checked)} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>Import with errors</div>
            <div style={{ fontSize: 12, color: 'var(--t3)' }}>Error rows will be skipped. All valid rows will be imported.</div>
          </div>
        </label>
      )}
    </div>
  )
}

// ── Step 5: Live Progress ─────────────────────────────────────────────────────

function StepProgress({ batchId, onDone }: { batchId: string | null; onDone: (b: ImportBatch) => void }) {
  const progress = useImportProgress(batchId, onDone)
  const batch = progress.data

  // Real server-reported percentage
  const serverPct = batch && batch.totalRows > 0
    ? (batch.imported + batch.skipped + batch.failed) / batch.totalRows * 100
    : 0

  // Optimistic display percentage — smoothly nudges toward serverPct between polls
  const [displayPct, setDisplayPct] = useState(0)
  const displayPctRef = useRef(0)

  // When server reports a new value, snap forward if behind
  useEffect(() => {
    if (serverPct > displayPctRef.current) {
      displayPctRef.current = serverPct
      setDisplayPct(serverPct)
    }
  }, [serverPct])

  // Tick every 80ms: nudge display toward a projected target while importing
  useEffect(() => {
    if (!batch || batch.status !== 'IMPORTING') return
    const id = setInterval(() => {
      // Project slightly ahead based on current velocity — cap at serverPct + 4%
      const cap = Math.min(serverPct + 4, 99)
      if (displayPctRef.current < cap) {
        const next = Math.min(displayPctRef.current + 0.6, cap)
        displayPctRef.current = next
        setDisplayPct(next)
      }
    }, 80)
    return () => clearInterval(id)
  }, [batch?.status, serverPct])

  const isDone = batch?.status === 'DONE'
  const isFailed = batch?.status === 'FAILED'
  const isImporting = batch?.status === 'IMPORTING'
  const shownPct = isDone ? 100 : Math.min(Math.round(displayPct), 99)
  const barColor = isDone ? 'var(--green)' : isFailed ? 'var(--red)' : 'var(--blue)'
  const processedRows = batch ? batch.imported + batch.skipped + batch.failed : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '8px 0' }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--t1)', marginBottom: 4 }}>Importing your data</h2>
        <p style={{ fontSize: 13, color: 'var(--t3)' }}>You can navigate away — the import continues in the background.</p>
      </div>

      {/* Progress bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>
            {isDone ? 'Import complete' : isFailed ? 'Import failed' : 'Importing…'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {batch && (
              <span style={{ fontSize: 12, color: 'var(--t3)' }}>
                {processedRows} / {batch.totalRows} rows
              </span>
            )}
            <span style={{ fontSize: 13, fontWeight: 700, color: barColor }}>{isDone ? 100 : shownPct}%</span>
          </div>
        </div>
        <div style={{ height: 12, background: 'var(--bg-card-2)', borderRadius: 'var(--r-full)', overflow: 'hidden', border: '1px solid var(--bd)' }}>
          <div style={{
            height: '100%', borderRadius: 'var(--r-full)',
            backgroundColor: barColor,
            backgroundImage: isImporting
              ? `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)`
              : 'none',
            backgroundSize: isImporting ? '200% 100%' : undefined,
            animation: isImporting ? 'shimmer 1.8s linear infinite' : undefined,
            width: `${isDone ? 100 : shownPct}%`,
            transition: isDone ? 'width 0.4s ease' : 'none',
          }} />
        </div>
      </div>

      {/* Live counters */}
      {batch && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { label: 'Imported', count: batch.imported, color: 'var(--green)', bg: 'var(--green-dim)' },
            { label: 'Skipped',  count: batch.skipped,  color: 'var(--amber)', bg: 'var(--amber-dim)' },
            { label: 'Failed',   count: batch.failed,   color: 'var(--red)',   bg: 'var(--red-dim)'   },
          ].map(({ label, count, color, bg }) => (
            <div key={label} style={{ padding: '14px', borderRadius: 'var(--r)', background: bg, textAlign: 'center', border: `1px solid ${color}20`, transition: 'all 0.3s ease' }}>
              <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1, transition: 'all 0.2s ease' }}>{count}</div>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {!batch && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
          <Loader2 size={28} className="spin" style={{ color: 'var(--blue)' }} />
        </div>
      )}
    </div>
  )
}

// ── Step 6: Done ──────────────────────────────────────────────────────────────

function StepDone({ batch, batchId }: { batch: ImportBatch | null; batchId: string | null }) {
  const navigate = useNavigate()
  const isEquipment = batch?.source === 'equipment'
  const hasFailed = (batch?.failed ?? 0) > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, padding: '16px 0', textAlign: 'center' }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%', background: batch?.status === 'FAILED' ? 'var(--red-dim)' : 'var(--green-dim)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', border: `3px solid ${batch?.status === 'FAILED' ? 'var(--red)' : 'var(--green)'}`,
        animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {batch?.status === 'FAILED'
          ? <AlertCircle size={36} style={{ color: 'var(--red)' }} />
          : <CheckCircle size={36} style={{ color: 'var(--green)' }} />
        }
      </div>

      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--t1)', marginBottom: 6 }}>
          {batch?.status === 'FAILED' ? 'Import failed' : 'Import complete!'}
        </h2>
        <p style={{ fontSize: 13, color: 'var(--t3)' }}>
          {batch?.status === 'FAILED'
            ? 'Something went wrong. Check the error report below.'
            : `Your data is now in T&S CRM and ready to use.`}
        </p>
      </div>

      {batch && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, width: '100%' }}>
          {[
            { label: isEquipment ? 'Equipment Added' : 'Customers Added', count: batch.imported, color: 'var(--green)', bg: 'var(--green-dim)' },
            { label: 'Skipped (duplicates)', count: batch.skipped, color: 'var(--amber)', bg: 'var(--amber-dim)' },
            { label: 'Failed', count: batch.failed, color: 'var(--red)', bg: 'var(--red-dim)' },
          ].map(({ label, count, color, bg }) => (
            <div key={label} style={{ padding: '16px', borderRadius: 'var(--r)', background: bg, textAlign: 'center' }}>
              <div style={{ fontSize: 30, fontWeight: 800, color, lineHeight: 1 }}>{count}</div>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
        {hasFailed && batchId && (
          <button
            onClick={() => downloadWithAuth(`/crm/import/batches/${batchId}/errors.csv`, `import-errors-${batchId}.csv`)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 'var(--r)', background: 'var(--red-dim)', color: 'var(--red)', fontWeight: 600, fontSize: 13, border: '1px solid var(--red)', cursor: 'pointer' }}
          >
            <Download size={14} /> Download error report
          </button>
        )}
        {!isEquipment && (
          <button className="btn btn-secondary" onClick={() => navigate('/customers')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users size={14} /> View customers <ArrowRight size={13} />
          </button>
        )}
        {!isEquipment && (
          <button className="btn btn-secondary" onClick={() => navigate('/import')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Wrench size={14} /> Import equipment now <ArrowRight size={13} />
          </button>
        )}
        {isEquipment && (
          <button className="btn btn-secondary" onClick={() => navigate('/customers')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users size={14} /> View customers <ArrowRight size={13} />
          </button>
        )}
      </div>

      <p style={{ fontSize: 12, color: 'var(--t3)' }}>
        This import can be rolled back from <strong>Settings → Data Import</strong> if needed.
      </p>
    </div>
  )
}

// ── Import History (bottom panel) ─────────────────────────────────────────────

function ImportHistory() {
  const batches = useImportBatches()
  const rollback = useImportRollback()
  const { showSuccess, showError } = useToast()

  const handleRollback = async (id: string, imported: number) => {
    if (!confirm(`Roll back this import? This will permanently delete ${imported} records that were created.`)) return
    try {
      const result = await rollback.mutateAsync(id)
      showSuccess(`Rolled back: ${result.customersDeleted} customers, ${result.equipmentDeleted} equipment deleted`)
    } catch {
      showError('Rollback failed')
    }
  }

  if (!batches.data?.length) return null

  const statusColor: Record<string, string> = {
    DONE: 'var(--green)', FAILED: 'var(--red)', IMPORTING: 'var(--blue)',
    VALIDATING: 'var(--t3)', READY: 'var(--t3)', ROLLED_BACK: 'var(--t3)',
  }

  return (
    <div className="card" style={{ marginTop: 24 }}>
      <div className="card-header">
        <div className="card-title">Import History</div>
        <div className="card-subtitle">Previous imports for this company</div>
      </div>
      <div className="card-body-flush">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--bd)' }}>
              {['Source', 'Status', 'Imported', 'Skipped', 'Failed', 'Date', ''].map((h, i) => (
                <th key={i} style={{ padding: '10px 14px', textAlign: i === 6 ? 'right' : 'left', fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {batches.data.map((b, i) => (
              <tr key={b.id} style={{ borderBottom: i < batches.data!.length - 1 ? '1px solid var(--bd)' : 'none' }}>
                <td style={{ padding: '10px 14px', fontWeight: 500, color: 'var(--t1)', textTransform: 'capitalize' }}>{b.source}</td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 'var(--r-full)', fontWeight: 600, background: `${statusColor[b.status]}20`, color: statusColor[b.status] }}>{b.status}</span>
                </td>
                <td style={{ padding: '10px 14px', color: 'var(--green)' }}>{b.imported}</td>
                <td style={{ padding: '10px 14px', color: 'var(--amber)' }}>{b.skipped}</td>
                <td style={{ padding: '10px 14px', color: 'var(--red)' }}>{b.failed}</td>
                <td style={{ padding: '10px 14px', color: 'var(--t3)', fontSize: 12 }}>{new Date(b.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                  {b.status === 'DONE' && b.imported > 0 && (
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--red)', fontSize: 12 }}
                      onClick={() => handleRollback(b.id, b.imported)}
                      disabled={rollback.isPending}
                    >
                      <RotateCcw size={12} /> Rollback
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Main Wizard ───────────────────────────────────────────────────────────────

export default function Import() {
  const [step, setStep] = useState(0)
  const [platform, setPlatform] = useState<Platform | null>(null)
  const [detectResult, setDetectResult] = useState<DetectResult | null>(null)
  const [columnMap, setColumnMap] = useState<ColumnMap[]>([])
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [overrideWarnings, setOverrideWarnings] = useState(false)
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null)
  const [doneBatch, setDoneBatch] = useState<ImportBatch | null>(null)
  const [uploadError, setUploadError] = useState<string | undefined>()

  const { user } = useAuth()
  const detect = useImportDetect()
  const validate = useImportValidate()
  const start = useImportStart()
  const { showError } = useToast()

  const handleFile = async (file: File) => {
    setUploadError(undefined)
    try {
      const result = await detect.mutateAsync(file)
      setDetectResult(result)
      setColumnMap(result.columnMap)
      if (result.platform !== 'generic') {
        // Auto-advance to mapping for non-generic so user sees what was detected
      }
      setStep(2)
    } catch (e: any) {
      setUploadError(e?.response?.data?.message ?? 'Could not parse file. Make sure it is a valid CSV.')
    }
  }

  const handleValidate = async () => {
    if (!detectResult) return
    try {
      const result = await validate.mutateAsync({ batchId: detectResult.batchId, columnMap })
      setValidation(result)
      setStep(3)
    } catch {
      showError('Validation failed')
    }
  }

  const handleStart = async () => {
    if (!detectResult) return
    try {
      const { batchId } = await start.mutateAsync({ batchId: detectResult.batchId, columnMap })
      setActiveBatchId(batchId)
      setStep(4)
    } catch {
      showError('Failed to start import')
    }
  }

  const handleDone = useCallback((batch: ImportBatch) => {
    setDoneBatch(batch)
    setStep(5)
  }, [])

  const canGoNext = () => {
    if (step === 0) return !!platform
    if (step === 1) return !!detectResult
    if (step === 2) {
      const isEquipment = detectResult?.platform === 'equipment'
      const fields = isEquipment ? EQUIPMENT_TARGET_FIELDS : CUSTOMER_TARGET_FIELDS
      const hasFullName = columnMap.some(m => m.targetField === 'fullName')
      return fields.filter(f => f.required).every(f => {
        if ((f.field === 'firstName' || f.field === 'lastName') && hasFullName) return true
        return columnMap.some(m => m.targetField === f.field)
      })
    }
    if (step === 3) return validation !== null && (validation.willFail === 0 || overrideWarnings)
    return false
  }

  const handleNext = () => {
    if (step === 0) { setStep(1); return }
    if (step === 2) { handleValidate(); return }
    if (step === 3) { handleStart(); return }
  }

  const handleBack = () => {
    if (step === 3) { setStep(2); setValidation(null); return }
    if (step === 2) { setStep(1); return }
    if (step === 1) { setStep(0); setPlatform(null); setDetectResult(null); setUploadError(undefined); return }
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 900, margin: '0 auto' }}>
      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
        @keyframes popIn { 0% { transform: scale(0.5); opacity: 0 } 100% { transform: scale(1); opacity: 1 } }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--t1)', marginBottom: 4 }}>Data Import</h1>
          <p style={{ fontSize: 14, color: 'var(--t3)' }}>Migrate customers and equipment from your existing platform into T&S CRM.</p>
        </div>
        {user?.role === 'super_admin' && (
          <Link
            to="/import/admin"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: 'linear-gradient(135deg,#3b82f620,#8b5cf620)',
              border: '1px solid #3b82f633', color: '#3b82f6', textDecoration: 'none',
            }}
          >
            <Building2 size={14} /> White-Glove Panel
          </Link>
        )}
      </div>

      {/* Wizard card */}
      <div className="card">
        <div className="card-body" style={{ padding: '28px 28px' }}>
          <Stepper current={step} />

          <div style={{ minHeight: 340 }}>
            {step === 0 && <StepSource selected={platform} onSelect={p => { setPlatform(p) }} />}
            {step === 1 && platform && <StepUpload platform={platform} onFile={handleFile} isLoading={detect.isPending} error={uploadError} />}
            {step === 2 && detectResult && <StepMapping detect={detectResult} columnMap={columnMap} onChange={setColumnMap} />}
            {step === 3 && <StepValidation validation={validation} isLoading={validate.isPending} onOverride={setOverrideWarnings} overrideWarnings={overrideWarnings} />}
            {step === 4 && <StepProgress batchId={activeBatchId} onDone={handleDone} />}
            {step === 5 && <StepDone batch={doneBatch} batchId={activeBatchId} />}
          </div>

          {/* Navigation */}
          {step < 4 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--bd)' }}>
              <button
                className="btn btn-secondary"
                onClick={handleBack}
                disabled={step === 0}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <ChevronLeft size={15} /> Back
              </button>

              {step < 3 && step !== 1 && (
                <button
                  className="btn btn-primary"
                  onClick={handleNext}
                  disabled={!canGoNext() || validate.isPending}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  {validate.isPending ? <><Loader2 size={13} className="spin" /> Validating…</> : <>Next <ChevronRight size={15} /></>}
                </button>
              )}

              {step === 3 && (
                <button
                  className="btn btn-primary"
                  onClick={handleStart}
                  disabled={!canGoNext() || start.isPending}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  {start.isPending ? <><Loader2 size={13} className="spin" /> Starting…</> : <>Start Import <ArrowRight size={15} /></>}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Import history */}
      <ImportHistory />
    </div>
  )
}
