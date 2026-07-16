/**
 * Overview tab — profile fields, tags, Account Contacts (local-only, unchanged),
 * and Addresses. Extracted from the old "Contact" + "Addresses" tabs.
 */
import { User, Users, MapPin, Plus, Trash2 } from 'lucide-react'
import { TagInput } from '../../../components/TagInput'
import { Field, SectionLabel, Badge, patchById, sectionCardStyle } from '../shared'

interface Contact { id: number; name: string; role: string; email: string; phone: string }
interface Address { id: number | string; type: string; line1: string; line2?: string; city: string; state?: string; postcode: string; primary?: boolean }

export default function OverviewTab({
  formData, isEditMode, onFieldChange, tags, onTagsChange, allTags,
  contacts, onContactsChange, addresses, onAddressesChange,
}: {
  formData: any
  isEditMode: boolean
  onFieldChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  tags: string[]
  onTagsChange: (tags: string[]) => void
  allTags: string[]
  contacts: Contact[]
  onContactsChange: (updater: (prev: Contact[]) => Contact[]) => void
  addresses: Address[]
  onAddressesChange: (updater: (prev: Address[]) => Address[]) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Profile */}
      <div style={sectionCardStyle}>
        <SectionLabel icon={User}>Profile</SectionLabel>
        <div style={{ border: '1px solid var(--bd)', borderRadius: 12, padding: 14, background: 'var(--bg-card)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px 16px' }}>
            <Field label="Full Name" name="name" value={formData.name} isEdit={isEditMode} onChange={onFieldChange} />
            <Field label="Email" name="email" type="email" value={formData.email} isEdit={isEditMode} onChange={onFieldChange} />
            <Field label="Phone" name="phone" value={formData.phone} isEdit={isEditMode} onChange={onFieldChange} placeholder="+1 7700 000000" />
            <Field label="Lead Source" name="source" value={formData.source} isEdit={isEditMode} onChange={onFieldChange}
              as="select" options={['Google', 'Referral', 'Facebook', 'Yelp', 'Walk-in', 'Other']} placeholder="Select Source" />
            <Field label="Customer Type" name="type" value={formData.type} isEdit={isEditMode} onChange={onFieldChange}
              as="select" options={['RESIDENTIAL', 'COMMERCIAL']} placeholder="Select Type" />
            <Field label="Notes / Remarks" name="notes" value={formData.notes} isEdit={isEditMode} onChange={onFieldChange} as="textarea" full />
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>
                Tags
              </div>
              <div style={{ fontSize: 11, color: 'var(--t4)', marginBottom: 8 }}>
                Used for filtering, campaign segmentation and reporting. Press Enter or comma to add.
              </div>
              <TagInput tags={tags} onChange={onTagsChange} suggestions={allTags} placeholder="Type a tag and press Enter…" readOnly={!isEditMode} />
            </div>
          </div>
        </div>
      </div>

      {/* Addresses */}
      <div style={sectionCardStyle}>
        <SectionLabel
          icon={MapPin}
          action={isEditMode && (
            <button
              onClick={() => onAddressesChange(prev => [
                ...prev,
                { id: Date.now(), type: 'Site', line1: '', line2: '', city: '', postcode: '', primary: false },
              ])}
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <Plus size={13} /> Add Address
            </button>
          )}
        >
          Addresses
        </SectionLabel>

        {addresses.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--t4)', fontSize: 13 }}>
            <MapPin size={26} style={{ opacity: 0.3, marginBottom: 8 }} />
            <div>No addresses yet.{isEditMode && <> Click <b>Add Address</b> to add one.</>}</div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {addresses.map(addr => (
            <div key={addr.id} style={{ border: '1px solid var(--bd)', borderRadius: 11, padding: 13, background: 'var(--bg-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isEditMode ? (
                    <select
                      value={addr.type}
                      onChange={e => patchById(onAddressesChange, addr.id, { type: e.target.value })}
                      style={{ fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '3px 6px', border: '1px solid var(--bd)', background: 'var(--bg-card)', color: 'var(--t1)' }}
                    >
                      <option>Site</option>
                      <option>Billing</option>
                      <option>Shipping</option>
                    </select>
                  ) : (
                    <Badge tone={addr.type === 'Site' ? 'blue' : 'neutral'}>{addr.type}{addr.primary ? ' · Primary' : ''}</Badge>
                  )}
                </div>
                {isEditMode && addresses.length > 1 && (
                  <button
                    onClick={() => onAddressesChange(prev => prev.filter(a => a.id !== addr.id))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', padding: 2 }}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { lbl: 'Address Line 1', key: 'line1' },
                  { lbl: 'Address Line 2', key: 'line2' },
                  { lbl: 'City', key: 'city' },
                  { lbl: 'State', key: 'state' },
                  { lbl: 'Postcode', key: 'postcode' },
                ].map(f => (
                  <Field
                    key={f.key}
                    label={f.lbl}
                    name={f.key}
                    value={(addr as any)[f.key]}
                    isEdit={isEditMode}
                    onChange={e => patchById(onAddressesChange, addr.id, { [f.key]: e.target.value } as any)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Account Contacts — local-only, never persisted (unchanged from before) */}
      <div style={sectionCardStyle}>
        <SectionLabel
          icon={Users}
          action={isEditMode && (
            <button
              onClick={() => onContactsChange(prev => [...prev, { id: Date.now(), name: '', role: 'Tenant', email: '', phone: '' }])}
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <Plus size={13} /> Add Contact
            </button>
          )}
        >
          Account Contacts
        </SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {contacts.map((c, idx) => (
            <div key={c.id} style={{ border: '1px solid var(--bd)', borderRadius: 11, padding: 13, background: 'var(--bg-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Contact {idx + 1}
                </span>
                {isEditMode && contacts.length > 1 && (
                  <button
                    onClick={() => onContactsChange(prev => prev.filter(x => x.id !== c.id))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', padding: 2 }}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field label="Name" name="name" value={c.name} isEdit={isEditMode}
                  onChange={e => patchById(onContactsChange, c.id, { name: e.target.value })} placeholder="Full Name" />
                <Field label="Role" name="role" value={c.role} isEdit={isEditMode} as="select" options={['Owner', 'Tenant', 'Property Manager', 'Other']}
                  onChange={e => patchById(onContactsChange, c.id, { role: e.target.value })} />
                <Field label="Email" name="email" type="email" value={c.email} isEdit={isEditMode}
                  onChange={e => patchById(onContactsChange, c.id, { email: e.target.value })} placeholder="email@example.com" />
                <Field label="Phone" name="phone" value={c.phone} isEdit={isEditMode}
                  onChange={e => patchById(onContactsChange, c.id, { phone: e.target.value })} placeholder="+44 7700 000000" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
