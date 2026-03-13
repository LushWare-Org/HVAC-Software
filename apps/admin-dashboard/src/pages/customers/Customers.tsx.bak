import { useState } from "react";
import {
  Users,
  Target,
  FileText,
  Plus,
  Search,
  TrendingUp,
  Phone,
  Mail,
  MapPin,
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
} from "lucide-react";
import CustomerDetailsSidebar from "./CustomerDetailsSidebar";
import LeadDetailsSidebar from "./LeadDetailsSidebar";
import AddPersonModal from "./AddPersonModal";

const CUSTOMERS = [
  {
    id: "C-001",
    name: "Clifford Johnson",
    email: "clifford@email.com",
    phone: "(214) 555-0101",
    type: "RESIDENTIAL",
    city: "Dallas",
    ltv: 4280,
    jobs: 8,
    status: "active",
    color: "#3B82F6",
    since: "Mar 15, 2023",
  },
  {
    id: "C-002",
    name: "Sarah Williams",
    email: "sarah.w@biz.com",
    phone: "(214) 555-0198",
    type: "COMMERCIAL",
    city: "Plano",
    ltv: 18400,
    jobs: 14,
    status: "active",
    color: "#10B981",
    since: "Nov 08, 2022",
  },
  {
    id: "C-003",
    name: "Robert Chen",
    email: "r.chen@email.com",
    phone: "(972) 555-0234",
    type: "RESIDENTIAL",
    city: "Frisco",
    ltv: 1840,
    jobs: 3,
    status: "active",
    color: "#8B5CF6",
    since: "Jan 22, 2024",
  },
  {
    id: "C-004",
    name: "Maria Garcia",
    email: "maria.g@email.com",
    phone: "(469) 555-0167",
    type: "RESIDENTIAL",
    city: "Irving",
    ltv: 2100,
    jobs: 5,
    status: "active",
    color: "#F59E0B",
    since: "Jul 10, 2023",
  },
  {
    id: "C-005",
    name: "Tech Solutions Inc",
    email: "ops@techsolutions.com",
    phone: "(972) 555-0512",
    type: "COMMERCIAL",
    city: "Richardson",
    ltv: 38750,
    jobs: 22,
    status: "active",
    color: "#06B6D4",
    since: "Jun 04, 2022",
  },
  {
    id: "C-006",
    name: "David Kim",
    email: "david.kim@email.com",
    phone: "(214) 555-0399",
    type: "RESIDENTIAL",
    city: "Carrollton",
    ltv: 960,
    jobs: 2,
    status: "inactive",
    color: "#5A6882",
    since: "Aug 19, 2024",
  },
];

const LEADS = [
  {
    name: "Jennifer Adams",
    email: "j.adams@email.com",
    source: "Google",
    service: "HVAC Install",
    value: 3200,
    status: "PROPOSAL_SENT",
    assigned: "Sarah M.",
    color: "#3B82F6",
    date: "Oct 08, 2023",
  },
  {
    name: "Mark Thompson",
    email: "mark.t@email.com",
    source: "Referral",
    service: "Plumbing",
    value: 450,
    status: "CONTACTED",
    assigned: "Tom B.",
    color: "#10B981",
    date: "Oct 05, 2023",
  },
  {
    name: "Laura White",
    email: "l.white@email.com",
    source: "Website",
    service: "Electrical",
    value: 1800,
    status: "NEW",
    assigned: "—",
    color: "#8B5CF6",
    date: "Oct 11, 2023",
  },
  {
    name: "Carlos Rivera",
    email: "c.riv@email.com",
    source: "Google",
    service: "AC Maintenance",
    value: 280,
    status: "QUOTATION_SENT",
    assigned: "Sarah M.",
    color: "#F59E0B",
    date: "Oct 02, 2023",
  },
];

const LEAD_STATUS: Record<string, string> = {
  NEW: "badge-neutral",
  CONTACTED: "badge-blue",
  PROPOSAL_SENT: "badge-violet",
  QUOTATION_SENT: "badge-amber",
  WON: "badge-green",
  REJECTED: "badge-red",
};

const AGREEMENTS = [
  {
    id: "AG-001",
    customer: "Tech Solutions Inc",
    value: 1200,
    status: "ACTIVE",
    nextService: "Nov 15, 2023",
    renewal: "Jun 1, 2024",
  },
  {
    id: "AG-002",
    customer: "Sarah Williams",
    value: 800,
    status: "ACTIVE",
    nextService: "Dec 5, 2023",
    renewal: "Jan 15, 2024",
  },
  {
    id: "AG-003",
    customer: "Clifford Johnson",
    value: 350,
    status: "EXPIRING",
    nextService: "Oct 20, 2023",
    renewal: "Oct 31, 2023",
  },
  {
    id: "AG-004",
    customer: "Robert Chen",
    value: 600,
    status: "INACTIVE",
    nextService: "-",
    renewal: "Aug 1, 2023",
  },
  {
    id: "AG-005",
    customer: "Maria Garcia",
    value: 1200,
    status: "ACTIVE",
    nextService: "Nov 10, 2023",
    renewal: "May 20, 2024",
  },
];

const AGREEMENT_STATUS: Record<string, string> = {
  ACTIVE: "badge-green",
  EXPIRING: "badge-amber",
  INACTIVE: "badge-neutral",
};

function fmt(n: number) {
  return `$${n.toLocaleString()}`;
}

export default function Customers() {
  const [tab, setTab] = useState<"customers" | "leads" | "agreements">(
    "customers",
  );
  const [search, setSearch] = useState("");
  const [customerTypeFilter, setCustomerTypeFilter] = useState("All Types");
  const [customerStatusFilter, setCustomerStatusFilter] =
    useState("All Status");
  const [isExpanded, setIsExpanded] = useState(false);
  const [leadsSearch, setLeadsSearch] = useState("");
  const [leadServiceFilter, setLeadServiceFilter] = useState("All Services");
  const [leadStatusFilter, setLeadStatusFilter] = useState("All Status");
  const [agreementsSearch, setAgreementsSearch] = useState("");
  const [agreementStatusFilter, setAgreementStatusFilter] =
    useState("All Status");
  const [selectedPerson, setSelectedPerson] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isLeadDetailsOpen, setIsLeadDetailsOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addType, setAddType] = useState<"customer" | "lead">("customer");
  const [sidebarTab, setSidebarTab] = useState<any>("contact");

  const [customerPage, setCustomerPage] = useState(1);
  const [leadPage, setLeadPage] = useState(1);
  const [agreementPage, setAgreementPage] = useState(1);
  const itemsPerPage = 10;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCustomerPage(1);
  };

  const handleLeadsSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLeadsSearch(e.target.value);
    setLeadPage(1);
  };

  const handleAgreementsSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAgreementsSearch(e.target.value);
    setAgreementPage(1);
  };

  const filtered = CUSTOMERS.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchesType =
      customerTypeFilter === "All Types" ||
      c.type.toLowerCase() === customerTypeFilter.toLowerCase();
    const matchesStatus =
      customerStatusFilter === "All Status" ||
      c.status.toLowerCase() === customerStatusFilter.toLowerCase();
    return matchesSearch && matchesType && matchesStatus;
  });

  const filteredLeads = LEADS.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(leadsSearch.toLowerCase()) ||
      l.email.toLowerCase().includes(leadsSearch.toLowerCase()) ||
      l.service.toLowerCase().includes(leadsSearch.toLowerCase());
    const matchesService =
      leadServiceFilter === "All Services" ||
      l.service.toLowerCase() === leadServiceFilter.toLowerCase();
    const matchesStatus =
      leadStatusFilter === "All Status" ||
      l.status.toUpperCase() ===
        leadStatusFilter.replace(" ", "_").toUpperCase();
    return matchesSearch && matchesService && matchesStatus;
  });

  const totalCustomerPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedCustomers = filtered.slice(
    (customerPage - 1) * itemsPerPage,
    customerPage * itemsPerPage,
  );

  const totalLeadPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const paginatedLeads = filteredLeads.slice(
    (leadPage - 1) * itemsPerPage,
    leadPage * itemsPerPage,
  );

  const filteredAgreements = AGREEMENTS.filter((a) => {
    const matchesSearch = a.customer
      .toLowerCase()
      .includes(agreementsSearch.toLowerCase());
    const matchesStatus =
      agreementStatusFilter === "All Status" ||
      a.status.toLowerCase() === agreementStatusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const totalAgreementPages = Math.ceil(
    filteredAgreements.length / itemsPerPage,
  );
  const paginatedAgreements = filteredAgreements.slice(
    (agreementPage - 1) * itemsPerPage,
    agreementPage * itemsPerPage,
  );

  const handleViewClick = (
    person: any,
    type: "customer" | "lead" | "agreement" = "customer",
  ) => {
    if (type === "agreement") {
      const customer =
        CUSTOMERS.find((c) => c.name === person?.customer) || CUSTOMERS[0];
      setSelectedPerson(customer);
      setSidebarTab("agreements");
      setIsDetailsOpen(true);
    } else if (type === "lead") {
      setSelectedPerson(person);
      setIsLeadDetailsOpen(true);
    } else {
      setSelectedPerson(person);
      setSidebarTab("contact");
      setIsDetailsOpen(true);
    }
  };

  const handleAddCustomer = () => {
    setAddType("customer");
    setIsAddOpen(true);
  };

  const handleAddLead = () => {
    setAddType("lead");
    setIsAddOpen(true);
  };

  return (
    <>
      <div className="anim-fade-up">
        {/* KPIs */}
        {!isExpanded && (
          <div className="kpi-grid mb-5">
            {[
              {
                icon: Users,
                g: "kpi-grad-blue",
                v: "1,248",
                l: "Total Customers",
                sub: "1,201 active",
                delta: "+5.3%",
                up: true,
              },
              {
                icon: Target,
                g: "kpi-grad-violet",
                v: "34",
                l: "Active Leads",
                sub: "$42k pipeline",
                delta: "+12",
                up: true,
              },
              {
                icon: FileText,
                g: "kpi-grad-green",
                v: "89",
                l: "Service Agreements",
                sub: "12 renewing soon",
                delta: "+4",
                up: true,
              },
              {
                icon: TrendingUp,
                g: "kpi-grad-amber",
                v: "$1,131",
                l: "Avg. Revenue",
                sub: "per customer",
                delta: "+8.2%",
                up: true,
              },
            ].map((k) => (
              <div
                key={k.l}
                className="kpi-card"
                style={{ padding: "16px 20px", borderRadius: "var(--r-md)" }}
              >
                <div
                  className="kpi-card-top"
                  style={{
                    marginBottom: 12,
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    className="kpi-label"
                    style={{
                      fontSize: 13,
                      color: "var(--t3)",
                      fontWeight: 500,
                      margin: 0,
                    }}
                  >
                    {k.l}
                  </div>
                  <k.icon size={16} strokeWidth={1.5} color="var(--t3)" />
                </div>
                <div
                  className="kpi-value"
                  style={{ fontSize: 26, fontWeight: 700, color: "var(--t1)" }}
                >
                  {k.v}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="page-tabs">
          <button
            className={`tab-btn ${tab === "customers" ? "active" : ""}`}
            onClick={() => setTab("customers")}
          >
            <Users size={14} /> Customers{" "}
            <span className="tab-count">{CUSTOMERS.length}</span>
          </button>
          <button
            className={`tab-btn ${tab === "leads" ? "active" : ""}`}
            onClick={() => setTab("leads")}
          >
            <Target size={14} /> Leads <span className="tab-count">34</span>
          </button>
          <button
            className={`tab-btn ${tab === "agreements" ? "active" : ""}`}
            onClick={() => setTab("agreements")}
          >
            <FileText size={14} /> Agreements{" "}
            <span className="tab-count">89</span>
          </button>
        </div>

        {tab === "customers" && (
          <div className="card anim-fade-in">
            <div className="card-header">
              <div className="filter-bar w-full" style={{ margin: 0 }}>
                <div className="filter-search flex-1">
                  <Search size={13} color="var(--t4)" />
                  <input
                    placeholder="Search customers…"
                    value={search}
                    onChange={handleSearch}
                  />
                </div>
                <select
                  className="select"
                  style={{ width: 160 }}
                  value={customerTypeFilter}
                  onChange={(e) => {
                    setCustomerTypeFilter(e.target.value);
                    setCustomerPage(1);
                  }}
                >
                  <option>All Types</option>
                  <option>Residential</option>
                  <option>Commercial</option>
                </select>
                <select
                  className="select"
                  style={{ width: 140 }}
                  value={customerStatusFilter}
                  onChange={(e) => {
                    setCustomerStatusFilter(e.target.value);
                    setCustomerPage(1);
                  }}
                >
                  <option>All Status</option>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
                <button
                  className="btn btn-primary btn-sm ml-auto"
                  id="btn-add-customer"
                  onClick={handleAddCustomer}
                >
                  <Plus size={12} /> Add Customer
                </button>
                <button
                  className="btn btn-secondary btn-sm flex items-center gap-1.5"
                  style={{
                    marginLeft: "8px",
                    padding: "0 12px",
                    fontWeight: 600,
                  }}
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? "Collapse View" : "Expand View"}
                >
                  {isExpanded ? (
                    <>
                      <Minimize2 size={14} /> Collapse
                    </>
                  ) : (
                    <>
                      <Maximize2 size={14} /> Expand
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="card-body-flush mt-4">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Contact</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Type</th>
                      <th>Jobs</th>
                      <th>Revenue</th>
                      <th>Since</th>
                      <th>Last Service</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCustomers.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => handleViewClick(c, "customer")}
                        className="cursor-pointer hover:bg-[var(--bg-hover)] transition-colors group"
                      >
                        <td>
                          <div className="cell-user">
                            <div>
                              <div className="cell-name">{c.name}</div>
                              <div className="flex items-center gap-2">
                                <Mail size={12} className="text-[var(--t4)]" />{" "}
                                {c.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="flex flex-col gap-1 text-[13px] text-[var(--t2)] mt-1">
                            <div className="flex items-center gap-2">
                              <Phone size={12} className="text-[var(--t4)]" />{" "}
                              {c.phone}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5 text-sm text-[var(--t2)]">
                            <MapPin size={13} className="text-[var(--t4)]" />{" "}
                            {c.city}, TX
                          </div>
                        </td>
                        <td>
                          <span
                            className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${c.status === "active"
                                ? "bg-green-100 text-green-700 dark:bg-green-100 dark:text-green-700"
                                : "bg-gray-100 text-gray-600 dark:bg-gray-100 dark:text-gray-600"
                            }`}
                          >
                            {c.status.charAt(0).toUpperCase() +
                              c.status.slice(1)}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${c.type === "COMMERCIAL" ? "badge-violet" : "badge-blue"}`}
                          >
                            {c.type === "COMMERCIAL"
                              ? "Commercial"
                              : "Residential"}
                          </span>
                        </td>
                        <td className="font-600">{c.jobs}</td>
                        <td className="font-600">{fmt(c.ltv)}</td>
                        <td className="text-sm text-[var(--t3)]">{c.since}</td>
                        <td className="text-sm text-[var(--t3)]">
                          Oct 12, 2023
                        </td>
                        <td>
                          <div className="flex items-center gap-1">
                            <button
                              className="flex items-center justify-center p-1.5 text-[var(--blue)] hover:bg-blue-50 rounded-md transition-colors border-0 bg-transparent cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewClick(c, "customer");
                              }}
                              title="View Details"
                            >
                              <Edit size={15} />
                            </button>
                            <button
                              className="flex items-center justify-center p-1.5 text-[var(--green)] hover:bg-green-50 rounded-md transition-colors border-0 bg-transparent cursor-pointer"
                              title="Call Customer"
                            >
                              <Phone size={15} />
                            </button>
                            <button
                              className="flex items-center justify-center p-1.5 text-[var(--t2)] hover:bg-gray-100 rounded-md transition-colors border-0 bg-transparent cursor-pointer"
                              title="Send Email"
                            >
                              <Mail size={15} />
                            </button>
                            <button
                              className="flex items-center justify-center p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors border-0 bg-transparent cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div
              className="card-footer"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderTop: "1px solid var(--border)",
              }}
            >
              <span className="text-[13px] text-[var(--t3)]">
                Showing{" "}
                {filtered.length > 0
                  ? (customerPage - 1) * itemsPerPage + 1
                  : 0}{" "}
                to {Math.min(customerPage * itemsPerPage, filtered.length)} of{" "}
                {filtered.length} customers
              </span>

              <div className="flex items-center gap-2">
                <button
                  className="btn btn-secondary btn-sm flex items-center justify-center p-1"
                  style={{ width: 32, height: 32 }}
                  onClick={() => setCustomerPage((p) => Math.max(1, p - 1))}
                  disabled={customerPage === 1}
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-[13px] text-[var(--t2)] mx-2">
                  Page {customerPage} of {Math.max(1, totalCustomerPages)}
                </span>
                <button
                  className="btn btn-secondary btn-sm flex items-center justify-center p-1"
                  style={{ width: 32, height: 32 }}
                  onClick={() =>
                    setCustomerPage((p) => Math.min(totalCustomerPages, p + 1))
                  }
                  disabled={
                    customerPage === totalCustomerPages ||
                    totalCustomerPages === 0
                  }
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Leads */}
        {tab === "leads" && (
          <div className="anim-fade-in card">
            <div className="card-header">
              <div className="filter-bar w-full" style={{ margin: 0 }}>
                <div className="filter-search flex-1">
                  <Search size={13} color="var(--t4)" />
                  <input
                    placeholder="Search leads…"
                    value={leadsSearch}
                    onChange={handleLeadsSearch}
                  />
                </div>
                <select
                  className="select"
                  style={{ width: 160 }}
                  value={leadServiceFilter}
                  onChange={(e) => {
                    setLeadServiceFilter(e.target.value);
                    setLeadPage(1);
                  }}
                >
                  <option>All Services</option>
                  <option>HVAC Install</option>
                  <option>AC Maintenance</option>
                  <option>Plumbing</option>
                  <option>Electrical</option>
                </select>
                <select
                  className="select"
                  style={{ width: 140 }}
                  value={leadStatusFilter}
                  onChange={(e) => {
                    setLeadStatusFilter(e.target.value);
                    setLeadPage(1);
                  }}
                >
                  <option>All Status</option>
                  <option>New</option>
                  <option>Contacted</option>
                  <option>Proposal Sent</option>
                  <option>Quotation Sent</option>
                  <option>Won</option>
                  <option>Rejected</option>
                </select>
                <button
                  className="btn btn-primary btn-sm ml-auto"
                  id="btn-add-lead"
                  onClick={handleAddLead}
                >
                  <Plus size={12} /> Add Lead
                </button>
                <button
                  className="btn btn-secondary btn-sm flex items-center gap-1.5"
                  style={{
                    marginLeft: "8px",
                    padding: "0 12px",
                    fontWeight: 600,
                  }}
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? "Collapse View" : "Expand View"}
                >
                  {isExpanded ? (
                    <>
                      <Minimize2 size={14} /> Collapse
                    </>
                  ) : (
                    <>
                      <Maximize2 size={14} /> Expand
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="card-body-flush mt-4">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Lead</th>
                      <th>Service Interest</th>
                      <th>Source</th>
                      <th>Est.Revenue</th>
                      <th>Status</th>
                      <th>Assigned To</th>
                      <th>Created Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedLeads.map((l) => (
                      <tr
                        key={l.name}
                        onClick={() => handleViewClick(l, "lead")}
                        className="cursor-pointer hover:bg-[var(--bg-hover)] transition-colors group"
                      >
                        <td>
                          <div className="cell-user">
                            <div>
                              <div className="cell-name">{l.name}</div>
                              <div className="cell-email">{l.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>{l.service}</td>
                        <td>
                          <span className="badge badge-neutral">
                            {l.source}
                          </span>
                        </td>
                        <td className="td-primary font-600">{fmt(l.value)}</td>
                        <td>
                          <span className={`badge ${LEAD_STATUS[l.status]}`}>
                            {l.status.replace("_", " ")}
                          </span>
                        </td>
                        <td>{l.assigned}</td>
                        <td className="text-sm text-3">{l.date}</td>
                        <td>
                          <div className="flex items-center gap-1">
                            <button
                              className="flex items-center justify-center p-1.5 text-[var(--blue)] hover:bg-blue-50 rounded-md transition-colors border-0 bg-transparent cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewClick(l, "lead");
                              }}
                              title="View Details"
                            >
                              <Edit size={15} />
                            </button>
                            <button
                              className="flex items-center justify-center p-1.5 text-[var(--green)] hover:bg-green-50 rounded-md transition-colors border-0 bg-transparent cursor-pointer"
                              title="Call Lead"
                            >
                              <Phone size={15} />
                            </button>
                            <button
                              className="flex items-center justify-center p-1.5 text-[var(--t2)] hover:bg-gray-100 rounded-md transition-colors border-0 bg-transparent cursor-pointer"
                              title="Send Email"
                            >
                              <Mail size={15} />
                            </button>
                            <button
                              className="flex items-center justify-center p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors border-0 bg-transparent cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div
              className="card-footer"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderTop: "1px solid var(--border)",
              }}
            >
              <span className="text-[13px] text-[var(--t3)]">
                Showing{" "}
                {filteredLeads.length > 0
                  ? (leadPage - 1) * itemsPerPage + 1
                  : 0}{" "}
                to {Math.min(leadPage * itemsPerPage, filteredLeads.length)} of{" "}
                {filteredLeads.length} leads
              </span>

              <div className="flex items-center gap-2">
                <button
                  className="btn btn-secondary btn-sm flex items-center justify-center p-1"
                  style={{ width: 32, height: 32 }}
                  onClick={() => setLeadPage((p) => Math.max(1, p - 1))}
                  disabled={leadPage === 1}
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-[13px] text-[var(--t2)] mx-2">
                  Page {leadPage} of {Math.max(1, totalLeadPages)}
                </span>
                <button
                  className="btn btn-secondary btn-sm flex items-center justify-center p-1"
                  style={{ width: 32, height: 32 }}
                  onClick={() =>
                    setLeadPage((p) => Math.min(totalLeadPages, p + 1))
                  }
                  disabled={leadPage === totalLeadPages || totalLeadPages === 0}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Agreements */}
        {tab === "agreements" && (
          <div className="anim-fade-in card">
            <div className="card-header">
              <div className="filter-bar w-full" style={{ margin: 0 }}>
                <div className="filter-search flex-1">
                  <Search size={13} color="var(--t4)" />
                  <input
                    placeholder="Search agreements…"
                    value={agreementsSearch}
                    onChange={handleAgreementsSearch}
                  />
                </div>
                <select
                  className="select"
                  style={{ width: 140 }}
                  value={agreementStatusFilter}
                  onChange={(e) => {
                    setAgreementStatusFilter(e.target.value);
                    setAgreementPage(1);
                  }}
                >
                  <option>All Status</option>
                  <option>Active</option>
                  <option>Expiring</option>
                  <option>Inactive</option>
                </select>
                <button
                  className="btn btn-primary btn-sm ml-auto"
                  onClick={() => handleViewClick(null, "agreement")}
                >
                  <Plus size={12} /> New Agreement
                </button>
                <button
                  className="btn btn-secondary btn-sm flex items-center gap-1.5"
                  style={{
                    marginLeft: "8px",
                    padding: "0 12px",
                    fontWeight: 600,
                  }}
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? "Collapse View" : "Expand View"}
                >
                  {isExpanded ? (
                    <>
                      <Minimize2 size={14} /> Collapse
                    </>
                  ) : (
                    <>
                      <Maximize2 size={14} /> Expand
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="card-body-flush mt-4">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Agreement ID</th>
                      <th>Customer</th>
                      <th>Value</th>
                      <th>Status</th>
                      <th>Next Service</th>
                      <th>Renewal Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedAgreements.map((a) => (
                      <tr
                        key={a.id}
                        onClick={() => handleViewClick(a, "agreement")}
                        className="cursor-pointer hover:bg-[var(--bg-hover)] transition-colors group"
                      >
                        <td className="font-500 text-[13px]">{a.id}</td>
                        <td>
                          <div className="cell-name">{a.customer}</div>
                        </td>
                        <td className="td-primary font-600">
                          {fmt(a.value)}/yr
                        </td>
                        <td>
                          <span
                            className={`badge ${AGREEMENT_STATUS[a.status]}`}
                          >
                            {a.status.charAt(0) +
                              a.status.slice(1).toLowerCase()}
                          </span>
                        </td>
                        <td className="text-sm text-3">{a.nextService}</td>
                        <td className="text-sm text-3">{a.renewal}</td>
                        <td>
                          <div className="flex items-center gap-1">
                            <button
                              className="flex items-center justify-center p-1.5 text-[var(--blue)] hover:bg-blue-50 rounded-md transition-colors border-0 bg-transparent cursor-pointer"
                              title="View Details"
                              onClick={() => handleViewClick(a, "agreement")}
                            >
                              <Edit size={15} />
                            </button>
                            <button
                              className="flex items-center justify-center p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors border-0 bg-transparent cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div
              className="card-footer"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderTop: "1px solid var(--border)",
              }}
            >
              <span className="text-[13px] text-[var(--t3)]">
                Showing{" "}
                {filteredAgreements.length > 0
                  ? (agreementPage - 1) * itemsPerPage + 1
                  : 0}{" "}
                to{" "}
                {Math.min(
                  agreementPage * itemsPerPage,
                  filteredAgreements.length,
                )}{" "}
                of {filteredAgreements.length} agreements
              </span>

              <div className="flex items-center gap-2">
                <button
                  className="btn btn-secondary btn-sm flex items-center justify-center p-1"
                  style={{ width: 32, height: 32 }}
                  onClick={() => setAgreementPage((p) => Math.max(1, p - 1))}
                  disabled={agreementPage === 1}
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-[13px] text-[var(--t2)] mx-2">
                  Page {agreementPage} of {Math.max(1, totalAgreementPages)}
                </span>
                <button
                  className="btn btn-secondary btn-sm flex items-center justify-center p-1"
                  style={{ width: 32, height: 32 }}
                  onClick={() =>
                    setAgreementPage((p) =>
                      Math.min(totalAgreementPages, p + 1),
                    )
                  }
                  disabled={
                    agreementPage === totalAgreementPages ||
                    totalAgreementPages === 0
                  }
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <CustomerDetailsSidebar
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        person={selectedPerson}
        initialTab={sidebarTab}
      />

      <LeadDetailsSidebar
        isOpen={isLeadDetailsOpen}
        onClose={() => setIsLeadDetailsOpen(false)}
        person={selectedPerson}
      />

      <AddPersonModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        type={addType}
      />
    </>
  );
}
