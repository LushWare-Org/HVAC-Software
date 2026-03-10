import React, { useState, useEffect } from "react";
import {
  X,
  Edit2,
  Save,
  Phone,
} from "lucide-react";

interface TechnicianDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  technician: any | null;
}

const inputView =
  "w-full px-3 py-2.5 rounded-lg border bg-gray-100 border-transparent text-gray-600 text-sm font-medium";
const inputEdit =
  "w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none";

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

const STATUS_BADGE: Record<string, string> = {
  available: "badge-green",
  "on-job": "badge-blue",
  "en-route": "badge-amber",
};

export default function TechnicianDetailModal({
  isOpen,
  onClose,
  technician,
}: TechnicianDetailModalProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (technician) {
      setFormData({ ...technician });
      setIsEditMode(false);
    }
  }, [technician]);

  if (!isOpen || !technician) return null;

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

  const statusBadge =
    STATUS_BADGE[technician.status] || "badge-neutral";

  return (
    <div
      className="fixed inset-0 z-[99999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-2xl w-full flex flex-col shadow-2xl"
        style={{ height: 520 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-5 flex items-center justify-between shadow-lg">
          <div className="text-white flex-1">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-blue-200 text-sm font-semibold tracking-wider">
                TECH
              </span>
              <span
                className={`badge ${statusBadge} text-xs`}
                style={{ fontSize: 11 }}
              >
                <span style={{ background: "currentColor" }} />
                {technician.statusLabel}
              </span>
            </div>
            <h2 className="text-xl font-bold leading-tight">
              {technician.name}
            </h2>
            <p className="text-blue-100 text-sm mt-0.5">
              {technician.role}
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
                    setFormData({ ...technician });
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleChange}
                  disabled={!isEditMode}
                  className={!isEditMode ? inputView : inputEdit}
                />
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
                  Current Status
                </label>
                <select
                  name="status"
                  value={formData.status || "available"}
                  onChange={handleChange}
                  disabled={!isEditMode}
                  className={!isEditMode ? inputView : inputEdit}
                >
                  <option value="available">Available</option>
                  <option value="on-job">On Job</option>
                  <option value="en-route">En Route</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Service Area
                </label>
                {!isEditMode ? (
                  <input
                    type="text"
                    value={formData.area || ""}
                    disabled
                    className={inputView}
                  />
                ) : (
                  <select
                    name="area"
                    value={formData.area || ""}
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
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Jobs Count
                </label>
                <input
                  type="number"
                  name="jobs"
                  value={formData.jobs || 0}
                  onChange={handleChange}
                  disabled={!isEditMode}
                  className={!isEditMode ? inputView : inputEdit}
                />
              </div>
            </div>
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
