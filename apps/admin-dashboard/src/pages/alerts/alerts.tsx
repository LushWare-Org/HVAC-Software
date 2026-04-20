import { useState, useMemo } from 'react';
import { Bell, AlertTriangle, CheckCircle, Clock, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader } from 'lucide-react';
import AlertDetailModal from './AlertDetailModal';
import { useEquipmentAlerts } from '../../hooks/useEquipmentAlerts';
import type { Alert } from '../../hooks/useEquipmentAlerts';
import { useMLHealth } from '../../hooks/usePredictions';
import { useAuth } from '../../contexts/AuthContext';

const SEV_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
const sevBadge = (s: string | undefined): string => {
  const severityMap: Record<string, string> = {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-green-100 text-green-700'
  };
  return severityMap[(s || '').toLowerCase()] || 'bg-gray-100 text-gray-600';
};

function MetricCard({ title, value, icon: Icon, valueColor = 'text-gray-900', active, onClick }: { title: string; value: number; icon: any; valueColor?: string; active?: boolean; onClick?: () => void }) {
  return (
    <div onClick={onClick} className={`bg-white rounded-lg border transition-all py-1 ${onClick ? 'cursor-pointer hover:shadow-md' : ''} ${active ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
      <div className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
        <span className="text-xs font-medium text-gray-500">{title}</span>
        <div className="text-gray-800"><Icon size={16} /></div>
      </div>
      <div className="px-4 pb-3">
        <div className={`text-2xl font-bold ${valueColor}`}>{(value ?? 0).toLocaleString()}</div>
      </div>
    </div>
  );
}

const ITEMS = 20;

export default function Alerts() {
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('active');
  const [sevFilter, setSevFilter] = useState('');
  const [search, setSearch] = useState('');
  const [daysToFailureFilter, setDaysToFailureFilter] = useState('');
  const [issueTypeFilter, setIssueTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Fetch real alerts from ML backend via hooks
  const { data: alerts = [], isLoading: alertsLoading, error: alertsError, refetch } = useEquipmentAlerts(null);
  const { data: mlHealth } = useMLHealth();
  
  // Modal states
  const [selected, setSelected] = useState<Alert | null>(null);
  
  // AI Copilot states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [aiQuery, setAiQuery] = useState('');

  // Track acknowledged/resolved alerts (in production: persist to API)
  const [alertStatuses, setAlertStatuses] = useState<Record<string, string>>({});

  // Extract unique issue types from alerts
  const uniqueIssueTypes = useMemo(() => {
    const types = new Set<string>();
    (Array.isArray(alerts) ? alerts : []).forEach(a => {
      if (a.title && a.title !== 'Normal') types.add(a.title);
    });
    return Array.from(types).sort();
  }, [alerts]);

  // Filter alerts
  const filtered = useMemo(() => {
    const alertsArray = Array.isArray(alerts) ? alerts : [];
    return alertsArray
      .map(a => ({
        ...a,
        status: (alertStatuses[String(a.id)] || a.status) as 'active' | 'acknowledged' | 'resolved'
      }))
      .filter((a) => {
        if ((a.severity || '').toLowerCase() === 'low') return false;
        
        if (a.status !== activeTab && activeTab !== 'all') return false;
        if (sevFilter && (a.severity || '').toLowerCase() !== sevFilter.toLowerCase()) return false;
        if (issueTypeFilter && (a.title || '').toLowerCase() !== issueTypeFilter.toLowerCase()) return false;
        
        // Days to failure filter
        if (daysToFailureFilter) {
          const dtf = parseInt(daysToFailureFilter);
          if (a.days_to_failure && a.days_to_failure > dtf) return false;
        }
        
        if (search) {
          const q = search.toLowerCase();
          return (
            (a.title || '').toLowerCase().includes(q) || 
            (a.description || '').toLowerCase().includes(q) || 
            (a.equipment?.brand || '').toLowerCase().includes(q) || 
            (a.equipment?.model || '').toLowerCase().includes(q) || 
            (a.equipment?.serial_number || '').toLowerCase().includes(q) || 
            String(a.equipment_id).includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => (SEV_ORDER[(a.severity || '').toLowerCase()] ?? 99) - (SEV_ORDER[(b.severity || '').toLowerCase()] ?? 99));
  }, [alerts, activeTab, sevFilter, search, alertStatuses, daysToFailureFilter, issueTypeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS));
  const paginated = filtered.slice((page - 1) * ITEMS, page * ITEMS);
  const start = filtered.length === 0 ? 0 : (page - 1) * ITEMS + 1;
  const end = Math.min(page * ITEMS, filtered.length);

  // Calculate stats
  const liveCounts = {
    active: alerts.filter((a) => (alertStatuses[String(a.id)] || a.status) === 'active' && (a.severity || '').toLowerCase() !== 'low').length,
    acknowledged: alerts.filter((a) => (alertStatuses[String(a.id)] || a.status) === 'acknowledged').length,
    resolved: alerts.filter((a) => (alertStatuses[String(a.id)] || a.status) === 'resolved').length,
    critical: alerts.filter((a) => (a.severity || '').toLowerCase() === 'critical').length,
    high: alerts.filter((a) => (a.severity || '').toLowerCase() === 'high').length,
    medium: alerts.filter((a) => (a.severity || '').toLowerCase() === 'medium').length,
    total: alerts.length,
    avgConfidence: alerts.length > 0 ? (alerts.reduce((sum, a) => sum + (a.confidence || 0), 0) / alerts.length * 100).toFixed(0) : 0,
    avgDaysToFailure: alerts.length > 0 ? (alerts.reduce((sum, a) => sum + (a.days_to_failure || 0), 0) / alerts.length).toFixed(0) : 0,
  };

  // Handler functions
  const handleAcknowledge = async (id: string | number) => {
    setActionLoading(String(id));
    try {
      // Call API to update status
      const response = await fetch(`/api/ml/predictions/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equipment_id: String(id), status: 'acknowledged' })
      });
      
      if (response.ok) {
        setAlertStatuses(prev => ({ ...prev, [String(id)]: 'acknowledged' }));
        if (selected && selected.id === id) {
          setSelected({ ...selected, status: 'acknowledged' });
        }
      }
    } catch (err) {
      console.error('Error acknowledging alert:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolve = async (id: string | number) => {
    setActionLoading(String(id));
    try {
      // Call API to update status
      const response = await fetch(`/api/ml/predictions/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equipment_id: String(id), status: 'resolved' })
      });
      
      if (response.ok) {
        setAlertStatuses(prev => ({ ...prev, [String(id)]: 'resolved' }));
        if (selected && selected.id === id) {
          setSelected({ ...selected, status: 'resolved' });
        }
      }
    } catch (err) {
      console.error('Error resolving alert:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const askAi = async (_alertId: string | number, _query: string, isInitial: boolean) => {
    setAiLoading(true);
    try {
      // TODO: Call API to generate AI response
      const mockResponse = `Step 1: Safety Check
- Turn off the HVAC system at the main breaker
- Wait 5 minutes for system depressurization
- Wear appropriate PPE (gloves, safety glasses)

Step 2: Diagnostic
- Check compressor terminal voltage: should be 240V ±10%
- Listen for unusual compressor noise
- Feel for vibration at compressor mounting

Step 3: Repair Procedure
- Replace compressor overload protection if faulty
- Clean compressor cooling fins
- Check refrigerant levels

Step 4: Testing
- Restore power to the system
- Run in cool mode for 15 minutes
- Monitor temperature differential: should be 15-20°F`;
      setAiResponse(mockResponse);
      if (!isInitial) setAiQuery('');
    } catch (err) {
      setAiResponse('AI Error: Unable to generate repair procedure');
    } finally {
      setAiLoading(false);
    }
  };

  const tabs = [
    { id: 'active', label: 'Active', count: liveCounts.active, icon: AlertTriangle, color: 'text-red-500' },
    { id: 'acknowledged', label: 'Acknowledged', count: liveCounts.acknowledged, icon: Clock, color: 'text-amber-500' },
    { id: 'resolved', label: 'Resolved', count: liveCounts.resolved, icon: CheckCircle, color: 'text-green-500' },
  ];

  // Show loading state
  if (alertsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-600">Loading alerts from ML backend...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (alertsError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm font-medium text-red-800">Error loading alerts</p>
        <p className="text-xs text-red-600 mt-1">
          {alertsError instanceof Error ? alertsError.message : 'Unknown error occurred'}
        </p>
        <button 
          onClick={() => refetch()} 
          className="mt-3 px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <MetricCard 
          title="Equipment w/ Issues" 
          value={liveCounts.total} 
          icon={Bell} 
          valueColor="text-gray-900"
        />
        <MetricCard 
          title="Critical" 
          value={liveCounts.critical} 
          icon={AlertTriangle} 
          valueColor="text-red-700" 
          active={sevFilter === 'critical'} 
          onClick={() => { setSevFilter(sevFilter === 'critical' ? '' : 'critical'); }}
        />
        <MetricCard 
          title="High" 
          value={liveCounts.high} 
          icon={AlertTriangle} 
          valueColor="text-orange-600" 
          active={sevFilter === 'high'} 
          onClick={() => { setSevFilter(sevFilter === 'high' ? '' : 'high'); }}
        />
        <MetricCard 
          title="Medium" 
          value={liveCounts.medium} 
          icon={AlertTriangle} 
          valueColor="text-amber-500" 
          active={sevFilter === 'medium'} 
          onClick={() => { setSevFilter(sevFilter === 'medium' ? '' : 'medium'); }}
        />
        <MetricCard 
          title="Resolved" 
          value={liveCounts.resolved} 
          icon={CheckCircle} 
          valueColor="text-green-600" 
          active={activeTab === 'resolved'} 
          onClick={() => setActiveTab('resolved')}
        />
      </div>

      <div className="space-y-3">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center gap-0 border-b border-gray-200 bg-gray-50 px-4 flex-wrap">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                  <Icon size={14} className={activeTab === tab.id ? tab.color : ''} />
                  {tab.label}
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{tab.count ?? '—'}</span>
                </button>
              );
            })}
            <div className="ml-auto flex items-center gap-6 py-2 flex-wrap">
              <input type="text" placeholder="Search by ID, brand, model, serial..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-400 w-72" />
              <select value={issueTypeFilter} onChange={(e) => { setIssueTypeFilter(e.target.value); setPage(1); }} className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-400">
                <option value="">All Issue Types</option>
                {uniqueIssueTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
              <select value={sevFilter} onChange={(e) => { setSevFilter(e.target.value); setPage(1); }} className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-400">
                <option value="">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
              </select>
              {(search || sevFilter || issueTypeFilter || daysToFailureFilter) && <button onClick={() => { setSearch(''); setSevFilter(''); setIssueTypeFilter(''); setDaysToFailureFilter(''); setPage(1); }} className="text-sm text-gray-400 hover:text-gray-600">Clear All</button>}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Equipment ID', 'Equipment Details', 'Predicted Issue', 'Risk Level', 'Days to Fail', 'Detected At', activeTab === 'active' ? 'Status' : null].filter(Boolean).map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={7} className="py-14">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 text-gray-400"><Bell size={20} strokeWidth={1.5} /></div>
                      <p className="text-sm font-medium text-gray-600">No {activeTab} alerts{sevFilter ? ` with severity "${sevFilter}"` : ''}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{search || sevFilter ? 'Try adjusting your filters' : 'All clear'}</p>
                    </div>
                  </td></tr>
                ) : paginated.map((a) => (
                  <tr key={a.id} onClick={() => setSelected(a)} className="group hover:bg-gray-50/80 border-b border-gray-100 transition-colors cursor-pointer">
                    <td className="px-4 py-3 text-xs font-mono font-medium text-gray-600">
                      #{a.equipment_id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-bold text-gray-900">{a.equipment?.brand} {a.equipment?.model}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Serial: {a.equipment?.serial_number}</div>
                    </td>
                    <td className="px-4 py-3 text-xs max-w-[200px]">
                      <span className="font-medium text-gray-900 block">{a.title || 'Normal'}</span>
                      <span className="text-gray-600 text-[11px] mt-1 block truncate">{(a.confidence * 100).toFixed(1)}% confidence</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${sevBadge(a.severity)}`}>
                        {a.severity || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-bold text-red-600">
                        {a.days_to_failure > 0 ? a.days_to_failure : '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                      {new Date(a.created_at).toLocaleDateString()}
                    </td>
                    {activeTab === 'active' && (
                      <td className="px-4 py-3 flex gap-2 items-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleAcknowledge(a.id)}
                          disabled={actionLoading === String(a.id)}
                          className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-700 hover:bg-amber-200 disabled:opacity-50 whitespace-nowrap"
                        >
                          {actionLoading === String(a.id) ? 'Ack...' : 'Acknowledge'}
                        </button>
                        <button
                          onClick={() => handleResolve(a.id)}
                          disabled={actionLoading === String(a.id)}
                          className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 whitespace-nowrap"
                        >
                          {actionLoading === String(a.id) ? 'Res...' : 'Resolve'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filtered.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-white">Showing <span className="font-medium text-white">{start}</span> to <span className="font-medium text-white">{end}</span> of <span className="font-medium text-white">{filtered.length}</span> alerts</p>
            <Pagination page={page} total={totalPages} onChange={setPage} />
          </div>
        )}
      </div>

      {/* Alert Detail Modal */}
      {selected && (
        <AlertDetailModal
          alert={selected}
          onClose={() => { setSelected(null); setAiResponse(''); setAiQuery(''); }}
          onAcknowledge={(id) => handleAcknowledge(id)}
          onResolve={(id) => handleResolve(id)}
          actionLoading={actionLoading}
          aiLoading={aiLoading}
          aiResponse={aiResponse}
          aiQuery={aiQuery}
          onAiQuery={askAi}
          onAiQueryChange={setAiQuery}
          allAlerts={filtered}
        />
      )}
    </div>
  );
}

function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (page: number) => void }) {
  const pages = Array.from({ length: Math.min(5, total) }, (_, i) => {
    if (total <= 5) return i + 1;
    if (page <= 3) return i + 1;
    if (page >= total - 2) return total - 4 + i;
    return page - 2 + i;
  });
  const btn = 'h-7 w-7 flex items-center justify-center text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors';
  return (
    <div className="flex items-center gap-1">
      <button className={btn} onClick={() => onChange(1)} disabled={page === 1}><ChevronsLeft size={13} /></button>
      <button className={`${btn} px-2.5 w-auto gap-0.5`} onClick={() => onChange(page - 1)} disabled={page === 1}><ChevronLeft size={13} />Prev</button>
      {pages.map((p) => <button key={p} className={`h-7 w-7 flex items-center justify-center text-xs font-medium rounded-lg border transition-colors ${page === p ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`} onClick={() => onChange(p)}>{p}</button>)}
      <button className={`${btn} px-2.5 w-auto gap-0.5`} onClick={() => onChange(page + 1)} disabled={page === total}>Next<ChevronRight size={13} /></button>
      <button className={btn} onClick={() => onChange(total)} disabled={page === total}><ChevronsRight size={13} /></button>
    </div>
  );
}
