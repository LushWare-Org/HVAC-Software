
export function LiveMap() {
    return (
        <div className="anim-fade-up" style={{ height: 'calc(100vh - 110px)', position: 'relative' }}>
            <iframe
                title="US Live Map"
                src="https://www.openstreetmap.org/export/embed.html?bbox=-125.0,24.396,-66.934,49.384&layer=mapnik"
                width="100%"
                height="100%"
                style={{ border: 0, borderRadius: 'var(--r)', display: 'block' }}
                allowFullScreen
            />

            <div style={{ position: 'absolute', bottom: 20, right: 20, background: 'var(--bg-card)', border: '1px solid var(--bd)', borderRadius: 'var(--r)', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                <div className="text-sm font-semibold mb-1" style={{ color: 'var(--t1)' }}>Tracker Legend</div>
                {[{ c: '#3B82F6', l: 'On Job' }, { c: '#10B981', l: 'Available' }, { c: '#F59E0B', l: 'En Route' }].map(item => (
                    <div key={item.l} className="flex items-center gap-2">
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.c, boxShadow: `0 0 5px ${item.c} ` }} />
                        <span style={{ fontSize: 12, color: 'var(--t2)', fontWeight: 500 }}>{item.l}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
