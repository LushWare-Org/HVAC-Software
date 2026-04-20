import React, { useState } from 'react';
import { Bell, RefreshCw } from 'lucide-react';

interface ComponentData {
  health_data?: {
    status: string;
    base_health: number;
    sensor_penalty: number;
    final_health: number;
    sensor_tracking?: Record<string, any>;
  };
  ml_data?: {
    failure_probability: number;
    days_to_failure: number;
    confidence_score: number;
    model: string;
  };
  llm_data?: {
    explanation: string;
    likely_cause: string;
    recommended_action: string;
  };
  timestamp: string;
}

interface MLPrediction {
  probability: number;
  days_to_failure: number;
  failure_type: string;
  root_cause: string;
  contributing_factors: string;
  confidence: number;
}

interface Equipment {
  brand: string;
  model: string;
  serial_number: string;
  location_name: string;
  city: string;
  customer_name: string;
}

interface AlertDetail {
  id: string | number;
  equipment_id: string;
  title: string;
  description: string;
  severity: string;
  status: 'active' | 'acknowledged' | 'resolved';
  _status?: string;
  created_at: string | Date;
  predicted_fault: string;
  confidence: number;
  days_to_failure: number;
  contributing_factors: string;
  recommended_action: string;
  equipment?: Equipment;
  component_details?: Record<string, ComponentData>;
  ml_prediction?: MLPrediction;
  is_acknowledged?: boolean;
  is_resolved?: boolean;
}

interface AlertDetailModalProps {
  alert: AlertDetail;
  onClose: () => void;
  onAcknowledge: (id: string | number) => Promise<void>;
  onResolve: (id: string | number) => Promise<void>;
  actionLoading: string | null;
  aiLoading: boolean;
  aiResponse: string;
  aiQuery: string;
  onAiQuery: (alertId: string | number, query: string, isInitial: boolean) => Promise<void>;
  onAiQueryChange: (query: string) => void;
  allAlerts: AlertDetail[];
}

const AlertDetailModal: React.FC<AlertDetailModalProps> = ({
  alert,
  onClose,
  onAcknowledge,
  onResolve,
  actionLoading,
  aiLoading,
  aiResponse,
  aiQuery,
  onAiQuery,
  onAiQueryChange,
  allAlerts,
}) => {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [alertsFilterTab, setAlertsFilterTab] = useState<'all' | 'active' | 'acknowledged' | 'resolved'>('all');
  const [mainTab, setMainTab] = useState<'details' | 'allAlerts'>('details');

  const sevBadge = (s: string) => ({
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-green-100 text-green-700',
  })[(s || '').toLowerCase()] || 'bg-gray-100 text-gray-600';

  // Filter alerts by status AND equipment
  const getAlertStatus = (a: any) => a._status || a.status || (a.is_resolved ? 'resolved' : a.is_acknowledged ? 'acknowledged' : 'active');
  
  // Only show alerts for this specific equipment
  const equipmentAlerts = allAlerts.filter(a => a.equipment_id === alert.equipment_id);
  
  const filteredAlerts = equipmentAlerts.filter(a => {
    if (alertsFilterTab === 'all') return true;
    return getAlertStatus(a) === alertsFilterTab;
  });

  const alertsTabs = [
    { id: 'all', label: 'All', count: equipmentAlerts.length },
    { id: 'active', label: 'Active', count: equipmentAlerts.filter(a => getAlertStatus(a) === 'active').length },
    { id: 'acknowledged', label: 'Acknowledged', count: equipmentAlerts.filter(a => getAlertStatus(a) === 'acknowledged').length },
    { id: 'resolved', label: 'Resolved', count: equipmentAlerts.filter(a => getAlertStatus(a) === 'resolved').length },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-blue-600 px-5 py-4 rounded-t-xl flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Bell size={20} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm max-w-sm truncate">{alert.title}</p>
              <p className="text-xs text-blue-200 mt-0.5 max-w-sm truncate">
                Detected: {new Date(alert.created_at).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-xl leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Main Tabs */}
        <div className="flex items-center gap-0 border-b border-gray-200 bg-gray-50 px-4">
          <button
            onClick={() => setMainTab('details')}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              mainTab === 'details'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Bell size={16} className={mainTab === 'details' ? 'text-blue-600' : ''} />
            Alert Details
          </button>
          <button
            onClick={() => setMainTab('allAlerts')}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              mainTab === 'allAlerts'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Equipment History
          </button>
        </div>

        {/* Scrollable Body */}
        <div className={`flex-1 overflow-y-auto ${mainTab === 'details' ? 'p-5 space-y-5' : ''}`}>
          {mainTab === 'details' ? (
            <>
              {/* Core Alert Info */}
              <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Alert Details
            </p>
            <div className="bg-gray-50 rounded-lg border border-gray-200 divide-y divide-gray-100">
              <div className="flex items-start justify-between px-3 py-2.5 gap-4">
                <span className="text-sm text-gray-500 flex-shrink-0">Severity</span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${sevBadge(
                    alert.severity
                  )}`}
                >
                  {alert.severity}
                </span>
              </div>
              <div className="flex items-start justify-between px-3 py-2.5 gap-4">
                <span className="text-sm text-gray-500 flex-shrink-0">Status</span>
                <span className="text-sm font-semibold capitalize bg-gray-200 px-2 py-0.5 rounded-full text-gray-700">
                  {alert._status}
                </span>
              </div>
              <div className="flex flex-col px-3 py-2.5 gap-1.5">
                <span className="text-sm text-gray-500">Description</span>
                <span className="text-sm text-gray-900">{alert.description}</span>
              </div>
              {alert.recommended_action && (
                <div className="flex flex-col px-3 py-2.5 gap-1.5 bg-amber-50/50">
                  <span className="text-sm font-semibold text-amber-800">Recommendation / Fix</span>
                  <span className="text-sm text-amber-900">{alert.recommended_action}</span>
                </div>
              )}
            </div>
          </div>

          {/* ML Prediction Data */}
          <div>
            <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-2">
              🤖 ML Prediction Results
            </p>
            <div className="bg-blue-50 rounded-lg border border-blue-200 divide-y divide-blue-100">
              <div className="flex justify-between px-3 py-2.5">
                <span className="text-sm text-gray-600">Prediction</span>
                <span className="text-sm font-bold text-blue-900">{alert.predicted_fault}</span>
              </div>
              <div className="flex justify-between px-3 py-2.5">
                <span className="text-sm text-gray-600">Confidence Score</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full" 
                      style={{ width: `${alert.confidence * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-blue-900">{(alert.confidence * 100).toFixed(1)}%</span>
                </div>
              </div>
              <div className="flex justify-between px-3 py-2.5">
                <span className="text-sm text-gray-600">Days to Failure</span>
                <span className="text-sm font-bold text-red-600">{alert.days_to_failure} days</span>
              </div>
              <div className="flex flex-col px-3 py-2.5 gap-1.5">
                <span className="text-sm text-gray-600">Root Cause Factors</span>
                <span className="text-xs text-gray-700 leading-relaxed">{alert.contributing_factors}</span>
              </div>
              <div className="flex flex-col px-3 py-2.5 gap-1.5 bg-green-50/50">
                <span className="text-sm font-semibold text-green-800">Recommended Action</span>
                <span className="text-xs text-green-900 leading-relaxed">{alert.recommended_action}</span>
              </div>
            </div>
          </div>

          {/* Equipment Context */}
          {alert.equipment && (
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Affected Equipment Context
              </p>
              <div className="bg-gray-50 rounded-lg border border-gray-200 divide-y divide-gray-100">
                <div className="flex justify-between px-3 py-2.5">
                  <span className="text-sm text-gray-500">Unit</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {alert.equipment.brand} {alert.equipment.model}
                  </span>
                </div>
                <div className="flex justify-between px-3 py-2.5">
                  <span className="text-sm text-gray-500">Serial / Asset ID</span>
                  <span className="text-sm font-mono text-gray-600">{alert.equipment.serial_number}</span>
                </div>
                <div className="flex justify-between px-3 py-2.5">
                  <span className="text-sm text-gray-500">Location</span>
                  <span className="text-sm text-gray-900">
                    {alert.equipment.location_name} • {alert.equipment.city}
                  </span>
                </div>
                <div className="flex justify-between px-3 py-2.5">
                  <span className="text-sm text-gray-500">Customer</span>
                  <span className="text-sm text-gray-900">{alert.equipment.customer_name}</span>
                </div>
              </div>
            </div>
          )}

          {/* Component Breakdown */}
          {alert.component_details && Object.keys(alert.component_details).length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-purple-600 uppercase tracking-wider mb-3">
                📊 Component Health Breakdown (All 7)
              </p>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {Object.entries(alert.component_details).map(([componentType, componentData]) => (
                  <div
                    key={componentType}
                    className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow"
                  >
                    {/* Component Header */}
                    <div
                      onClick={() =>
                        setSelectedComponent(selectedComponent === componentType ? null : componentType)
                      }
                      className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 cursor-pointer hover:bg-gray-100 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-lg">
                          {componentData.health_data?.status === 'CRITICAL'
                            ? '🔴'
                            : componentData.health_data?.status === 'HIGH_RISK'
                              ? '🟠'
                              : componentData.health_data?.status === 'WARNING'
                                ? '🟡'
                                : '🟢'}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 capitalize">
                            {componentType.replace(/_/g, ' ')}
                          </p>
                          <p className="text-xs text-gray-600">
                            Health: <span className="font-bold">{componentData.health_data?.final_health?.toFixed(1) || 0}%</span>
                            • ML: <span className="font-bold">{(componentData.ml_data?.failure_probability ? componentData.ml_data.failure_probability * 100 : 0).toFixed(0)}%</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-lg text-gray-400">
                        {selectedComponent === componentType ? '▲' : '▼'}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {selectedComponent === componentType && (
                      <div className="px-4 py-4 border-t border-gray-100 bg-gray-50 space-y-4">
                        {/* Health Data */}
                        <div>
                          <h4 className="text-xs font-bold text-green-700 uppercase mb-2">
                            💚 Health-Based Data
                          </h4>
                          <div className="bg-white rounded border border-green-100 p-3 space-y-2">
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-600">Base Health (Age)</span>
                              <span className="text-xs font-bold text-gray-900">
                                {componentData.health_data?.base_health?.toFixed(1) || 0}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-600">Sensor Penalties (7-day)</span>
                              <span className="text-xs font-bold text-red-600">
                                -{componentData.health_data?.sensor_penalty?.toFixed(1) || 0}%
                              </span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-green-100">
                              <span className="text-xs font-semibold text-gray-900">Final Health</span>
                              <span className="text-xs font-bold text-green-700">
                                {componentData.health_data?.final_health?.toFixed(1) || 0}%
                              </span>
                            </div>
                          </div>
                          {componentData.health_data?.sensor_tracking &&
                            Object.keys(componentData.health_data.sensor_tracking).length > 0 && (
                              <div className="mt-2 text-xs">
                                <p className="font-semibold text-gray-700 mb-1">Sensor Status:</p>
                                {Object.entries(componentData.health_data.sensor_tracking).map(
                                  ([sensor, tracking]: [string, any]) => (
                                    <div key={sensor} className="text-[11px] text-gray-600 ml-2 py-0.5">
                                      {sensor.replace(/_/g, ' ')}: <span className="font-bold">
                                        {tracking.penalty_applied
                                          ? '🔴 ALERT (7 days)'
                                          : tracking.is_out_of_range
                                            ? `⚠️ Day ${Math.ceil(tracking.consecutive_days)}/7`
                                            : '✓ Normal'}
                                      </span>
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                        </div>

                        {/* ML Data */}
                        <div>
                          <h4 className="text-xs font-bold text-blue-700 uppercase mb-2">
                            🤖 ML-Based Prediction
                          </h4>
                          <div className="bg-white rounded border border-blue-100 p-3 space-y-2">
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-600">Failure Probability</span>
                              <span className="text-xs font-bold text-blue-600">
                                {(componentData.ml_data?.failure_probability ? componentData.ml_data.failure_probability * 100 : 0).toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-600">Days to Failure</span>
                              <span className="text-xs font-bold text-gray-900">
                                {componentData.ml_data?.days_to_failure || 0}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-600">Model Confidence</span>
                              <span className="text-xs font-bold text-gray-900">
                                {(componentData.ml_data?.confidence_score ? componentData.ml_data.confidence_score * 100 : 0).toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-600">Model Type</span>
                              <span className="text-xs font-mono text-gray-600">
                                {componentData.ml_data?.model || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* LLM Data */}
                        <div>
                          <h4 className="text-xs font-bold text-amber-700 uppercase mb-2">
                            ✨ AI Explanation
                          </h4>
                          <div className="bg-white rounded border border-amber-100 p-3 space-y-2">
                            <div>
                              <p className="text-[11px] font-semibold text-gray-900 mb-1">Why?</p>
                              <p className="text-xs text-gray-700 leading-relaxed">
                                {componentData.llm_data?.explanation || 'No explanation available'}
                              </p>
                            </div>
                            <div>
                              <p className="text-[11px] font-semibold text-gray-900 mb-1">
                                Likely Cause
                              </p>
                              <p className="text-xs font-mono bg-gray-100 rounded px-2 py-1">
                                {componentData.llm_data?.likely_cause || 'unknown'}
                              </p>
                            </div>
                            <div>
                              <p className="text-[11px] font-semibold text-gray-900 mb-1">
                                Recommended Action
                              </p>
                              <p className="text-xs text-gray-700">
                                {componentData.llm_data?.recommended_action ||
                                  'Schedule inspection'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Last Updated */}
                        <div className="text-[10px] text-gray-500 text-center py-2 border-t border-gray-200">
                          Data as of: {new Date(componentData.timestamp).toLocaleTimeString()}
                          <button className="ml-2 text-blue-600 hover:underline font-semibold">
                            Refresh
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ML AI Deep Dive */}
          {alert.ml_prediction && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">
                  🤖 AI Model Insight
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-rose-50 rounded-lg border border-rose-100 p-3">
                  <p className="text-xs font-semibold text-rose-800 mb-0.5">Failure Probability</p>
                  <p className="text-2xl font-bold text-rose-600">
                    {(alert.ml_prediction.probability * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg border border-blue-100 p-3">
                  <p className="text-xs font-semibold text-blue-800 mb-0.5">Time to Failure</p>
                  <p className="text-2xl font-bold text-blue-700">~{alert.ml_prediction.days_to_failure} Days</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 shadow-sm divide-y divide-gray-100">
                <div className="flex flex-col px-4 py-3 gap-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">
                    Predicted Failure Type
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {alert.ml_prediction.failure_type}
                  </span>
                </div>
                <div className="flex flex-col px-4 py-3 gap-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">
                    Root Cause Analysis
                  </span>
                  <span className="text-sm text-gray-800 leading-relaxed">
                    {alert.ml_prediction.root_cause}
                  </span>
                </div>
                <div className="flex flex-col px-4 py-3 gap-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">
                    Contributing Data Points
                  </span>
                  <span className="text-sm font-mono text-gray-600 text-xs bg-gray-100 p-2 rounded">
                    {alert.ml_prediction.contributing_factors}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-2 bg-gray-50/50">
                  <span className="text-xs text-gray-500">Model Confidence</span>
                  <span className="text-xs font-bold text-blue-700">
                    {(alert.ml_prediction.confidence * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* AI Copilot Assistant */}
          <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-lg mt-4">
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🤖</span>
                <h3 className="text-sm font-semibold text-white tracking-wide">AI Technician Copilot</h3>
              </div>
              {!aiResponse && !aiLoading && (
                <button
                  onClick={() => onAiQuery(String(alert.id), '', true)}
                  className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg font-medium transition-colors shadow-[0_0_10px_rgba(37,99,235,0.3)]"
                >
                  Generate Repair Procedure
                </button>
              )}
            </div>

            <div className="p-4 bg-slate-900 min-h-[140px] flex flex-col">
              {aiLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-3 py-8 text-slate-400">
                  <RefreshCw size={24} className="animate-spin text-blue-500" />
                  <p className="text-sm">
                    AI is analyzing {alert.ml_prediction?.failure_type || 'this alert'} to generate
                    procedures...
                  </p>
                </div>
              ) : aiResponse ? (
                <div className="flex-1 space-y-4">
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 custom-scrollbar">
                    <pre className="text-sm text-slate-300 font-sans whitespace-pre-wrap leading-relaxed">
                      {aiResponse}
                    </pre>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={aiQuery}
                      onChange={(e) => onAiQueryChange(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === 'Enter' && aiQuery && onAiQuery(String(alert.id), aiQuery, false)
                      }
                      placeholder="Ask the AI a follow up question..."
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600"
                    />
                    <button
                      onClick={() => onAiQuery(String(alert.id), aiQuery, false)}
                      disabled={!aiQuery}
                      className="bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Ask
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-500 py-8 text-sm text-center">
                  Click the button above to generate a step-by-step diagnostic and repair procedure for this
                  specific failure type using your trained AI model.
                </div>
              )}
            </div>
          </div>
            </>
          ) : (
            <>
              <div className="flex flex-col h-full">
                <div className="px-5 pt-4 flex-shrink-0">
                  {/* Alert Tabs */}
                  <div className="flex items-center gap-1 border-b border-gray-200 mb-3 flex-wrap">
                    {alertsTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setAlertsFilterTab(tab.id as any)}
                        className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                          alertsFilterTab === tab.id
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {tab.label}
                        <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                          alertsFilterTab === tab.id
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {tab.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Alerts List - Full Height with Scroll */}
                <div className="px-5 pb-5 flex-1 overflow-y-auto space-y-2">
              {filteredAlerts.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">
                  No {alertsFilterTab} alerts
                </div>
              ) : (
                filteredAlerts.map((a: any) => (
                  <div key={a.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => {}}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{a.title || 'Untitled Alert'}</p>
                        <p className="text-xs text-gray-600 mt-1">{a.description || 'No description'}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${sevBadge(a.severity)}`}>
                          {a.severity || 'Low'}
                        </span>
                        <span className="text-xs font-medium capitalize px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                          {getAlertStatus(a)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sticky Actions Footer */}
        {alert._status === 'active' && (
          <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-end gap-3 flex-shrink-0 rounded-b-xl">
            <button
              onClick={() => onAcknowledge(String(alert.id))}
              disabled={actionLoading === String(alert.id)}
              className="px-5 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 transition"
            >
              Acknowledge Issue
            </button>
            <button
              onClick={() => onResolve(String(alert.id))}
              disabled={actionLoading === String(alert.id)}
              className="px-5 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm transition"
            >
              Mark as Resolved & Fixed
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertDetailModal;
