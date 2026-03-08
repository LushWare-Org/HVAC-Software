import React, { useState, useEffect } from "react";
import {
  X,
  Edit2,
  Save,
  Phone,
  Calendar,
  Wrench,
} from "lucide-react";

interface SchedulingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: any | null;
}

type TabType = "overview" | "details";

const inputView =
  "w-full px-3 py-2.5 rounded-lg border bg-gray-100 border-transparent text-gray-600 text-sm font-medium";
const inputEdit =
  "w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none";

const TECHNICIANS = [
  "Mike Davis",
  "Tom Baker",
  "Anna Smith",
  "James Lee",
  "Chris Park",
];

const ROLES = [
  "HVAC Lead",
  "HVAC Tech",
  "Electrician",
  "Plumber",
];

const SERVICE_AREAS = [
  "North Zone",
  "Central",
  "West End",
  "South Side",
  "East Side",
];

export default function SchedulingDetailModal({
  isOpen,
  onClose,
  schedule,
}: SchedulingDetailModalProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (schedule) {
      setFormData({ ...schedule });
      setIsEditMode(false);
      setActiveTab("overview");
    }
  }, [schedule]);

  if (!isOpen || !schedule) return null;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    setIsEditMode(false);
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <Wrench size={14} /> },
    { id: "details", label: "Schedule Details", icon: <Calendar size={14} /> },
  ];

  return (
    <div
      className="fixed inset-0 z-[99999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-3xl w-full flex flex-col shadow-2xl"
        style={{ height: 620 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-5 flex items-center justify-between shadow-lg">
          <div className="text-white flex-1">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-blue-200 text-sm font-semibold tracking-wider">
                {schedule.id || "SCHED-001"}
              </span>
              <span className="badge badge-blue text-xs" style={{ fontSize: 11 }}>
                <span style={{ background: "currentColor" }} />
                scheduled
              </span>
            </div>
            <h2 className="text-xl font-bold leading-tight">
              {schedule.label || schedule.name}
            </h2>
            <p className="text-blue-100 text-sm mt-0.5">
              Technician: {schedule.techName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isEditMode ? (
              <button
                onClick={() => setIsEditMode(true)}
                className="flex items-center gap-1.5 text-blue-100 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border-0"
              >
                <Edit2 size={13} /> Edit
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 text-white bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border-0"
                >
                  <Save size={13} /> Save
                </button>
                <button
                  onClick={() => {
                    setFormData({ ...schedule });
                    setIsEditMode(false);
                  }}
                  className="flex items-center gap-1.5 text-blue-100 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border-0"
                >
                  Cancel
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="text-blue-100 hover:text-white transition-colors p-1 hover:bg-blue-500 rounded-lg cursor-pointer bg-transparent border-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50 shrink-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 cursor-pointer bg-transparent ${
                activeTab === t.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-6">
            {activeTab === "overview" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Technician
                </label>
                {!isEditMode ? (
                  <input
                    type="text"
                    value={formData.techName || ""}
                    disabled
                    className={inputView}
                  />
                ) : (
                  <select
                    name="techName"
                    value={formData.techName || ""}
                    onChange={handleChange}
                    className={inputEdit}
                  >
                    <option value="">Select Technician</option>
                    {TECHNICIANS.map((tech) => (
                      <option key={tech} value={tech}>
                        {tech}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Job ID
                </label>
                <input
                  type="text"
                  name="id"
                  value={formData.id || ""}
                  onChange={handleChange}
                  disabled={!isEditMode}
                  className={!isEditMode ? inputView : inputEdit}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Service
                </label>
                <input
                  type="text"
                  name="label"
                  value={formData.label || ""}
                  onChange={handleChange}
                  disabled={!isEditMode}
                  className={!isEditMode ? inputView : inputEdit}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status || "scheduled"}
                  onChange={handleChange}
                  disabled={!isEditMode}
                  className={!isEditMode ? inputView : inputEdit}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="en-route">En Route</option>
                  <option value="on-job">On Job</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Role
                </label>
                {!isEditMode ? (
                  <input
                    type="text"
                    value={formData.role || ""}
                    disabled
                    className={inputView}
                  />
                ) : (
                  <select
                    name="role"
                    value={formData.role || ""}
                    onChange={handleChange}
                    className={inputEdit}
                  >
                    <option value="">Select Role</option>
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Service Area
                </label>
                {!isEditMode ? (
                  <input
                    type="text"
                    value={formData.serviceArea || ""}
                    disabled
                    className={inputView}
                  />
                ) : (
                  <select
                    name="serviceArea"
                    value={formData.serviceArea || ""}
                    onChange={handleChange}
                    className={inputEdit}
                  >
                    <option value="">Select Service Area</option>
                    {SERVICE_AREAS.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Next Available
                </label>
                <input
                  type="time"
                  name="nextAvailable"
                  value={formData.nextAvailable || ""}
                  onChange={handleChange}
                  disabled={!isEditMode}
                  className={!isEditMode ? inputView : inputEdit}
                />
              </div>
                </div>
              </>
            )}

            {activeTab === "details" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Start Time
                    </label>
                    <input
                      type="time"
                      name="startTime"
                      value={formData.startTime || ""}
                      onChange={handleChange}
                      disabled={!isEditMode}
                      className={!isEditMode ? inputView : inputEdit}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Estimated Duration
                    </label>
                    <input
                      type="text"
                      name="duration"
                      value={formData.duration || "2 hours"}
                      onChange={handleChange}
                      disabled={!isEditMode}
                      className={!isEditMode ? inputView : inputEdit}
                      placeholder="e.g. 2 hours"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location || ""}
                      onChange={handleChange}
                      disabled={!isEditMode}
                      className={!isEditMode ? inputView : inputEdit}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes || ""}
                      onChange={handleChange}
                      disabled={!isEditMode}
                      className={!isEditMode ? inputView : inputEdit}
                      rows={3}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 px-8 py-4 bg-gray-50 rounded-b-xl shrink-0 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Close
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
            <Phone size={14} className="inline mr-1" /> Contact Technician
          </button>
        </div>
      </div>
    </div>
  );
}
