/**
 * CreateJobModal — Dispatch-page version of job creation with GPS map picker.
 * After creation, the job appears in the unassigned list for smart dispatch.
 */

import { useState } from "react";
import {
  X, Wrench, Loader2, AlertCircle, Calendar,
} from "lucide-react";
import { useCreateJob, useJobTypes } from "../../hooks/useJobs";
import { useCustomers } from "../../hooks/useCustomers";
import MapPicker from "../../components/MapPickerLazy";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateJobModal({ isOpen, onClose }: Props) {
  const createJob = useCreateJob();
  const [error, setError] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const customersQuery = useCustomers({ page: 1, limit: 50, search: customerSearch || undefined });
  const customers = customersQuery.data?.data ?? [];
  const jobTypesQuery = useJobTypes();
  const jobTypes = jobTypesQuery.data ?? [];

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "NORMAL",
    customerId: "",
    customerName: "",
    serviceAddress: "",
    jobTypeId: "",
    date: new Date().toISOString().split("T")[0],
    time: "09:00",
    lat: 6.9271,
    lng: 79.8612,
  });

  if (!isOpen) return null;

  const handleCustomerSelect = (id: string) => {
    if (!id) {
      setForm((p) => ({ ...p, customerId: "", customerName: "", serviceAddress: "" }));
      return;
    }
    const c = customers.find((c: any) => c.id === id);
    if (c) {
      const name = `${c.firstName} ${c.lastName}`.trim();
      const addr = [c.address, c.city, c.state, c.zipCode].filter(Boolean).join(", ");
      setForm((p) => ({ ...p, customerId: c.id, customerName: name, serviceAddress: addr || "" }));
    }
  };

  const handleSubmit = () => {
    setError("");
    if (!form.title.trim()) { setError("Job title is required."); return; }
    if (!form.customerId) { setError("Please select a customer."); return; }
    if (!form.serviceAddress.trim()) { setError("Service address is required."); return; }

    let scheduledStart: string | undefined;
    if (form.date) {
      const dt = new Date(`${form.date}T${form.time || "09:00"}:00`);
      if (!isNaN(dt.getTime())) scheduledStart = dt.toISOString();
    }

    createJob.mutate(
      {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        priority: form.priority,
        customerId: form.customerId,
        customerName: form.customerName,
        serviceAddress: form.serviceAddress,
        jobTypeId: form.jobTypeId || undefined,
        scheduledStart,
        serviceLatitude: form.lat,
        serviceLongitude: form.lng,
      } as any,
      {
        onSuccess: () => {
          onClose();
          setForm({
            title: "", description: "", priority: "NORMAL",
            customerId: "", customerName: "", serviceAddress: "",
            jobTypeId: "", date: new Date().toISOString().split("T")[0],
            time: "09:00", lat: 6.9271, lng: 79.8612,
          });
          setError("");
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message;
          setError(Array.isArray(msg) ? msg.join(", ") : (msg ?? "Failed to create job."));
        },
      }
    );
  };

  const inputCls =
    "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white";

  return (
    <div className="fixed inset-0 z-[99999] bg-black/40 backdrop-blur-sm flex items-start justify-center pt-[72px] px-4 pb-4 admin-modal-backdrop" onClick={onClose}>
      <div
        className="bg-white rounded-xl max-w-2xl w-full shadow-2xl flex flex-col admin-modal-box overflow-x-hidden"
        style={{ maxHeight: "calc(100vh - 80px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 rounded-t-xl flex items-center justify-between shrink-0">
          <div className="text-white">
            <h3 className="text-lg font-bold flex items-center gap-2"><Wrench size={18} /> Create Job for Dispatch</h3>
            <p className="text-blue-200 text-xs mt-0.5">Job will appear in the unassigned queue for scheduling</p>
          </div>
          <button onClick={onClose} className="text-blue-200 hover:text-white p-1 rounded bg-transparent border-0 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {/* Customer selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase">Customer *</label>
            <input
              type="text"
              placeholder="Search customers…"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className={`${inputCls} mb-1.5`}
            />
            <select
              value={form.customerId}
              onChange={(e) => handleCustomerSelect(e.target.value)}
              className={inputCls}
            >
              <option value="">-- Select Customer --</option>
              {customers.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}{c.email ? ` (${c.email})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Title & Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase">Job Title *</label>
              <input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. AC Maintenance — Residence"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Brief description of the work…"
                rows={2}
                className={`${inputCls} resize-none`}
              />
            </div>
          </div>

          {/* Priority, Job Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
                className={inputCls}
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="EMERGENCY">Emergency</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase">Job Type</label>
              <select
                value={form.jobTypeId}
                onChange={(e) => setForm((p) => ({ ...p, jobTypeId: e.target.value }))}
                className={inputCls}
              >
                <option value="">-- None --</option>
                {jobTypes.map((jt) => (
                  <option key={jt.id} value={jt.id}>{jt.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1"><Calendar size={12} /> Schedule</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                className={inputCls}
              />
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>

          {/* Service Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase">Service Address *</label>
            <input
              value={form.serviceAddress}
              onChange={(e) => setForm((p) => ({ ...p, serviceAddress: e.target.value }))}
              placeholder="123 Main St, City, State"
              className={inputCls}
            />
          </div>

          {/* Map GPS */}
          <MapPicker
            label="Service Location (GPS for Dispatch) *"
            lat={form.lat}
            lng={form.lng}
            onChange={(lat, lng) => setForm((p) => ({ ...p, lat, lng }))}
            height="250px"
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end gap-2 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border bg-white text-gray-600 text-sm font-medium cursor-pointer hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={createJob.isPending}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold cursor-pointer border-0 disabled:opacity-50 flex items-center gap-1.5"
          >
            {createJob.isPending ? <Loader2 size={12} className="animate-spin" /> : <Wrench size={12} />}
            {createJob.isPending ? "Creating…" : "Create Job"}
          </button>
        </div>
      </div>
    </div>
  );
}
