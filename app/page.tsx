"use client";

import {
  Bell,
  Bot,
  Building2,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  LayoutDashboard,
  ListFilter,
  MessageSquareText,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  UsersRound,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { qualifyLead } from "../lib/scoring";
import { hasSupabaseConfig, supabase } from "../lib/supabase";

type Lead = {
  id?: string;
  initials: string;
  name: string;
  source: "WhatsApp" | "Facebook" | "Website";
  interest: string;
  budget: string;
  score: number;
  status: "New" | "Qualified" | "Viewing" | "Negotiation";
  owner: string;
  next: string;
  tone: "mint" | "blue" | "violet" | "amber" | "rose";
};

const seedLeads: Lead[] = [
  { initials: "AK", name: "Ahmed Khan", source: "WhatsApp", interest: "2BR · Dubai Marina", budget: "AED 1.4M", score: 94, status: "Qualified", owner: "Sara M.", next: "Call in 12 min", tone: "mint" },
  { initials: "LM", name: "Laura Martinez", source: "Facebook", interest: "Villa · Arabian Ranches", budget: "AED 3.8M", score: 87, status: "Viewing", owner: "Omar R.", next: "Viewing · 3:30 PM", tone: "violet" },
  { initials: "RS", name: "Rohan Shah", source: "Website", interest: "Studio · JVC", budget: "AED 720K", score: 82, status: "New", owner: "You", next: "Follow-up due", tone: "blue" },
  { initials: "FA", name: "Fatima Al Nuaimi", source: "WhatsApp", interest: "Penthouse · Downtown", budget: "AED 7.2M", score: 78, status: "Negotiation", owner: "Sara M.", next: "Proposal · Tomorrow", tone: "rose" },
  { initials: "JT", name: "James Taylor", source: "Facebook", interest: "1BR · Business Bay", budget: "AED 1.1M", score: 69, status: "Qualified", owner: "You", next: "Email in 2h", tone: "amber" },
];

const nav = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Leads", icon: UsersRound, count: 24 },
  { label: "Pipeline", icon: Target },
  { label: "Follow-ups", icon: CalendarClock, count: 7 },
  { label: "Approvals", icon: MessageSquareText, count: 3 },
  { label: "Automations", icon: Workflow },
];

const stages = [
  { label: "New leads", value: 24, color: "#93a7c2" },
  { label: "Qualified", value: 16, color: "#81d4b8" },
  { label: "Viewings", value: 9, color: "#65a5ff" },
  { label: "Proposals", value: 5, color: "#a98cf5" },
  { label: "Won", value: 3, color: "#e7bc59" },
];

function Metric({ icon: Icon, label, value, note, up, accent }: { icon: typeof TrendingUp; label: string; value: string; note: string; up?: boolean; accent: string }) {
  return (
    <article className="metric-card">
      <div className="metric-top">
        <span className="metric-label">{label}</span>
        <span className="metric-icon" style={{ color: accent, background: `${accent}16` }}><Icon size={18} /></span>
      </div>
      <strong>{value}</strong>
      <div className={up ? "metric-note positive" : "metric-note"}>{up && <TrendingUp size={13} />} {note}</div>
    </article>
  );
}

export default function Home() {
  const [active, setActive] = useState("Overview");
  const [query, setQuery] = useState("");
  const [approvalOpen, setApprovalOpen] = useState(true);
  const [approved, setApproved] = useState(false);
  const [notice, setNotice] = useState("");
  const [leadRows, setLeadRows] = useState<Lead[]>(seedLeads);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  const filtered = useMemo(
    () => leadRows.filter((lead) => `${lead.name} ${lead.interest} ${lead.source}`.toLowerCase().includes(query.toLowerCase())),
    [leadRows, query],
  );

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !user) return;
    let cancelled = false;
    supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!cancelled && data && !error) {
          setLeadRows(
            data.map((lead) => ({
              id: lead.id,
              initials: lead.full_name.split(/\s+/).map((part: string) => part[0]).join("").slice(0, 2).toUpperCase(),
              name: lead.full_name,
              source: ({ whatsapp: "WhatsApp", facebook: "Facebook", website: "Website", manual: "Website" } as const)[lead.source as "whatsapp" | "facebook" | "website" | "manual"],
              interest: `${lead.property_type || "Property"} · ${lead.preferred_area || "Dubai"}`,
              budget: lead.budget_max ? `AED ${Number(lead.budget_max).toLocaleString()}` : "Budget pending",
              score: lead.score,
              status: ({ new: "New", qualified: "Qualified", viewing: "Viewing", negotiation: "Negotiation" } as const)[lead.status as "new" | "qualified" | "viewing" | "negotiation"] ?? "New",
              owner: lead.assigned_agent_id === user.id ? "You" : "Unassigned",
              next: lead.next_follow_up_at ? new Date(lead.next_follow_up_at).toLocaleString() : "Follow-up due",
              tone: lead.score >= 80 ? "mint" : lead.score >= 60 ? "violet" : "amber",
            })),
          );
        }
        if (!cancelled) setLoadingData(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  };

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark"><Building2 size={22} /></span>
          <span><strong>EstateFlow</strong><small>AI Sales CRM</small></span>
        </div>
        <nav>
          <p>Workspace</p>
          {nav.map(({ label, icon: Icon, count }) => (
            <button key={label} className={active === label ? "nav-item active" : "nav-item"} onClick={() => setActive(label)}>
              <Icon size={18} /><span>{label}</span>{count ? <em>{count}</em> : null}
            </button>
          ))}
          <p className="team-label">Team</p>
          <button className="nav-item"><UserRound size={18} /><span>Sales agents</span></button>
          <button className="nav-item"><Settings size={18} /><span>Settings</span></button>
        </nav>
        <div className="ai-status">
          <span className="pulse"><Sparkles size={16} /></span>
          <div><strong>AI assistant</strong><small>Online · 8 leads scored</small></div>
          <ChevronRight size={16} />
        </div>
        <div className="profile">
          <span className="avatar dark">ZM</span>
          <div><strong>Zain Malik</strong><small>Administrator</small></div>
          <MoreHorizontal size={17} />
        </div>
      </aside>

      <section className="main-panel">
        <header className="topbar">
          <div className="search">
            <Search size={17} />
            <input aria-label="Search leads" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search leads, properties..." />
            <kbd>⌘ K</kbd>
          </div>
          <div className="header-actions">
            <button className="icon-button" aria-label="Notifications"><Bell size={19} /><i /></button>
            <button className="add-lead" onClick={() => setShowLeadForm(true)}><Plus size={17} /> Add lead</button>
          </div>
        </header>

        <div className="content">
          <div className="welcome">
            <div><p>Wednesday, 29 July</p><h1>Good afternoon, Zain <span>👋</span></h1><p className="subtitle">Here&apos;s what&apos;s happening with your sales pipeline.</p></div>
            <button className="period">Last 30 days <ChevronDown size={15} /></button>
          </div>

          <section className="metrics">
            <Metric icon={UsersRound} label="New leads" value="124" note="+18.2% vs last month" up accent="#54c7a1" />
            <Metric icon={Zap} label="Qualified by AI" value="86" note="69% qualification rate" accent="#8a72e8" />
            <Metric icon={Clock3} label="Avg. response time" value="4m 12s" note="2m 08s faster" up accent="#5b9df0" />
            <Metric icon={CircleDollarSign} label="Pipeline value" value="AED 18.4M" note="+12.4% vs last month" up accent="#dda83a" />
          </section>

          {active === "Overview" && <><section className="dashboard-grid">
            <article className="panel pipeline">
              <div className="panel-heading">
                <div><h2>Sales pipeline</h2><p>Lead progression this month</p></div>
                <button>View pipeline <ChevronRight size={15} /></button>
              </div>
              <div className="funnel">
                {stages.map((stage, index) => (
                  <div className="funnel-stage" key={stage.label}>
                    <div className="bar-track"><span style={{ width: `${100 - index * 14}%`, background: stage.color }} /></div>
                    <strong>{stage.value}</strong><small>{stage.label}</small>
                  </div>
                ))}
              </div>
              <div className="conversion"><span><TrendingUp size={15} /> 12.5%</span><p>Lead-to-close conversion</p><strong>+2.3%</strong><small>vs last month</small></div>
            </article>

            <article className="panel approval">
              <div className="panel-heading">
                <div><h2>Needs your approval</h2><p>AI-generated follow-up</p></div>
                <span className="pending-pill">3 pending</span>
              </div>
              {approvalOpen ? (
                <div className="approval-body">
                  <div className="lead-mini"><span className="avatar mint">AK</span><div><strong>Ahmed Khan</strong><small>WhatsApp · 2 mins ago</small></div><span className="hot">94 · Hot</span></div>
                  <div className="ai-draft">
                    <div><Bot size={16} /><strong>AI suggested reply</strong><span>Confident</span></div>
                    <p>Hi Ahmed! Thanks for your interest in a 2-bedroom apartment in Dubai Marina. I&apos;ve shortlisted three options within your AED 1.4M budget. Would you be available for a quick call today?</p>
                  </div>
                  <div className="approval-actions">
                    <button className="reject" onClick={() => setApprovalOpen(false)}><X size={16} /> Reject</button>
                    <button className="edit" onClick={() => flash("Draft ready to edit")}>Edit draft</button>
                    <button className="approve" onClick={() => { setApproved(true); flash("Message approved and queued"); }}><Check size={16} /> {approved ? "Approved" : "Approve & send"}</button>
                  </div>
                </div>
              ) : <div className="empty-approval"><Check size={22} /><strong>Draft reviewed</strong><button onClick={() => setApprovalOpen(true)}>Undo</button></div>}
            </article>
          </section>

          <section className="panel leads-panel">
            <div className="panel-heading leads-heading">
              <div><h2>Priority leads</h2><p>AI-ranked by likelihood to convert</p></div>
              <div><button className="filter"><ListFilter size={15} /> Filter</button><button>View all leads <ChevronRight size={15} /></button></div>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Lead</th><th>Interest</th><th>AI score</th><th>Status</th><th>Owner</th><th>Next action</th><th /></tr></thead>
                <tbody>
                  {filtered.map((lead) => (
                    <tr key={lead.name}>
                      <td><div className="person"><span className={`avatar ${lead.tone}`}>{lead.initials}</span><div><strong>{lead.name}</strong><small>{lead.source}</small></div></div></td>
                      <td><strong className="interest">{lead.interest}</strong><small>{lead.budget}</small></td>
                      <td><span className={`score ${lead.score >= 85 ? "high" : lead.score >= 75 ? "medium" : "warm"}`}><Sparkles size={13} /> {lead.score}</span></td>
                      <td><span className={`status ${lead.status.toLowerCase()}`}>{lead.status}</span></td>
                      <td><span className="owner-dot">{lead.owner.slice(0, 1)}</span>{lead.owner}</td>
                      <td><span className={lead.next.includes("due") ? "due" : ""}>{lead.next}</span></td>
                      <td><button className="row-menu" aria-label={`Open ${lead.name}`}><MoreHorizontal size={17} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filtered.length && <div className="no-results">No matching leads found.</div>}
            </div>
          </section>

          <section className="bottom-grid">
            <article className="panel activity">
              <div className="panel-heading"><div><h2>Live activity</h2><p>Updates across your team</p></div><button>View timeline</button></div>
              <ul>
                <li><span className="activity-icon green"><Zap size={15} /></span><p><strong>AI qualified a new lead</strong><small>Rohan Shah scored 82 · Website</small></p><time>2m</time></li>
                <li><span className="activity-icon blue"><CalendarClock size={15} /></span><p><strong>Viewing scheduled</strong><small>Laura Martinez · Arabian Ranches</small></p><time>18m</time></li>
                <li><span className="activity-icon violet"><MessageSquareText size={15} /></span><p><strong>Follow-up approved</strong><small>James Taylor · Sent on WhatsApp</small></p><time>34m</time></li>
              </ul>
            </article>
            <article className="panel automation">
              <div className="panel-heading"><div><h2>Automation health</h2><p>Powered by n8n workflows</p></div><span className="healthy"><i /> All systems healthy</span></div>
              <div className="automation-stats"><div><strong>1,284</strong><small>Runs this month</small></div><div><strong>99.6%</strong><small>Success rate</small></div><div><strong>1.8s</strong><small>Avg. runtime</small></div></div>
              <div className="workflow-row"><span><Workflow size={17} /></span><div><strong>Lead qualification</strong><small>Last run 2 mins ago</small></div><em>Active</em></div>
              <div className="workflow-row"><span><CalendarClock size={17} /></span><div><strong>Follow-up reminders</strong><small>Next run in 8 mins</small></div><em>Active</em></div>
            </article>
          </section></>}
          {active !== "Overview" && (
            <WorkspaceView
              active={active}
              leads={filtered}
              loading={loadingData}
              onAddLead={() => setShowLeadForm(true)}
              flash={flash}
            />
          )}
        </div>
      </section>
      <button className="connection-pill" onClick={() => user ? supabase?.auth.signOut() : setShowAuth(true)}>
        <i className={user ? "connected" : ""} />
        {user ? `Connected · ${user.email}` : hasSupabaseConfig ? "Connect account" : "Demo mode"}
      </button>
      {showLeadForm && (
        <LeadFormModal
          user={user}
          onClose={() => setShowLeadForm(false)}
          onCreated={(lead) => {
            setLeadRows((rows) => [lead, ...rows]);
            setShowLeadForm(false);
            flash("Lead created and qualified");
          }}
        />
      )}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} flash={flash} />}
      {notice && <div className="toast"><Check size={16} />{notice}</div>}
    </main>
  );
}

function WorkspaceView({
  active,
  leads,
  loading,
  onAddLead,
  flash,
}: {
  active: string;
  leads: Lead[];
  loading: boolean;
  onAddLead: () => void;
  flash: (message: string) => void;
}) {
  const columns = ["New", "Qualified", "Viewing", "Negotiation"] as const;

  if (active === "Leads") {
    return (
      <section className="panel workspace-panel">
        <div className="workspace-title">
          <div><h2>Lead management</h2><p>{loading ? "Syncing Supabase…" : `${leads.length} visible leads`}</p></div>
          <button className="add-lead" onClick={onAddLead}><Plus size={16} /> Add lead</button>
        </div>
        <div className="lead-directory">
          {leads.map((lead) => (
            <article key={lead.id ?? lead.name}>
              <span className={`avatar ${lead.tone}`}>{lead.initials}</span>
              <div><strong>{lead.name}</strong><small>{lead.interest} · {lead.budget}</small></div>
              <span className={`score ${lead.score >= 80 ? "high" : "medium"}`}><Sparkles size={13} />{lead.score}</span>
              <span className={`status ${lead.status.toLowerCase()}`}>{lead.status}</span>
              <button onClick={() => flash(`${lead.name} timeline opened`)}>Open timeline</button>
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (active === "Pipeline") {
    return (
      <section className="workspace-panel kanban">
        {columns.map((column) => (
          <div className="kanban-column" key={column}>
            <header><strong>{column}</strong><span>{leads.filter((lead) => lead.status === column).length}</span></header>
            {leads.filter((lead) => lead.status === column).map((lead) => (
              <article key={lead.id ?? lead.name}>
                <div><span className={`avatar ${lead.tone}`}>{lead.initials}</span><span className={`score ${lead.score >= 80 ? "high" : "medium"}`}>{lead.score}</span></div>
                <strong>{lead.name}</strong><small>{lead.interest}</small><p>{lead.next}</p>
              </article>
            ))}
          </div>
        ))}
      </section>
    );
  }

  if (active === "Follow-ups") {
    return (
      <section className="panel workspace-panel">
        <div className="workspace-title"><div><h2>Follow-up queue</h2><p>Prioritized by lead score and due time</p></div></div>
        <div className="task-list">
          {leads.slice(0, 4).map((lead, index) => (
            <article key={lead.id ?? lead.name}>
              <button className="task-check" onClick={(event) => event.currentTarget.classList.toggle("done")}><Check size={15} /></button>
              <div><strong>{index === 0 ? "Call" : "Send follow-up to"} {lead.name}</strong><small>{lead.interest} · {lead.next}</small></div>
              <span className={index < 2 ? "priority high" : "priority"}>{index < 2 ? "High" : "Medium"}</span>
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (active === "Approvals") {
    return (
      <section className="workspace-panel approval-grid">
        {leads.slice(0, 3).map((lead) => (
          <article className="panel" key={lead.id ?? lead.name}>
            <div className="lead-mini"><span className={`avatar ${lead.tone}`}>{lead.initials}</span><div><strong>{lead.name}</strong><small>{lead.source} · Score {lead.score}</small></div></div>
            <div className="ai-draft"><div><Bot size={16} /><strong>AI follow-up draft</strong></div><p>Hi {lead.name.split(" ")[0]}, I&apos;ve shortlisted matching properties for your {lead.interest} requirement. Would you be available for a quick call today?</p></div>
            <div className="approval-actions"><button className="reject" onClick={() => flash("Draft rejected")}>Reject</button><button className="edit" onClick={() => flash("Draft editor opened")}>Edit</button><button className="approve" onClick={() => flash("Approved and queued")}>Approve</button></div>
          </article>
        ))}
      </section>
    );
  }

  if (active === "Automations") {
    return (
      <section className="workspace-panel automation-page">
        {["Lead qualification", "Duplicate detection", "Follow-up reminders", "Failed workflow retry"].map((name, index) => (
          <article className="panel" key={name}>
            <span><Workflow size={20} /></span><div><strong>{name}</strong><small>{index === 3 ? "Retries with 1m · 5m · 30m backoff" : "Last run 2 minutes ago"}</small></div>
            <em><i /> Active</em><button onClick={() => flash(`${name} test queued`)}>Run test</button>
          </article>
        ))}
      </section>
    );
  }

  if (active === "Sales agents") {
    return (
      <section className="workspace-panel agent-grid">
        {[
          ["Sara Mahmood", "Dubai Marina · English, Urdu", "14 leads"],
          ["Omar Rahman", "Villas · English, Arabic", "11 leads"],
          ["Zain Malik", "Business Bay · English, Urdu", "9 leads"],
        ].map(([name, specialty, load]) => (
          <article className="panel" key={name}><span className="avatar violet">{name.split(" ").map((p) => p[0]).join("")}</span><strong>{name}</strong><small>{specialty}</small><p>{load} assigned</p></article>
        ))}
      </section>
    );
  }

  return (
    <section className="panel workspace-panel settings-page">
      <div className="workspace-title"><div><h2>Workspace settings</h2><p>Connections and safety controls</p></div></div>
      {[
        ["Supabase", hasSupabaseConfig ? "Configured" : "Not configured", true],
        ["Human approval", "Required before every outbound message", true],
        ["n8n", "Self-hosted workflow URL pending", false],
        ["WhatsApp Cloud API", "Meta test credentials pending", false],
      ].map(([name, description, connected]) => (
        <article key={String(name)}><div><strong>{name}</strong><small>{description}</small></div><span className={connected ? "integration-status connected" : "integration-status"}>{connected ? "Connected" : "Setup required"}</span></article>
      ))}
    </section>
  );
}

function AuthModal({ onClose, flash }: { onClose: () => void; flash: (message: string) => void }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) return setError("Supabase configuration is missing.");
    setBusy(true);
    setError("");
    const result = mode === "signin"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { data: { full_name: email.split("@")[0] } } });
    setBusy(false);
    if (result.error) return setError(result.error.message);
    flash(mode === "signin" ? "Signed in successfully" : "Account created. Check your email if confirmation is enabled.");
    onClose();
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <form className="modal-card auth-card" onSubmit={submit}>
        <button type="button" className="modal-close" onClick={onClose}><X size={18} /></button>
        <span className="brand-mark"><Building2 size={22} /></span>
        <h2>{mode === "signin" ? "Sign in to EstateFlow" : "Create your EstateFlow account"}</h2>
        <p>The first registered user becomes the workspace administrator.</p>
        <label>Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@agency.com" /></label>
        <label>Password<input type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 8 characters" /></label>
        {error && <div className="form-error">{error}</div>}
        <button className="submit-button" disabled={busy}>{busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}</button>
        <button type="button" className="text-button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
          {mode === "signin" ? "Need an account? Sign up" : "Already registered? Sign in"}
        </button>
      </form>
    </div>
  );
}

function LeadFormModal({ user, onClose, onCreated }: { user: User | null; onClose: () => void; onCreated: (lead: Lead) => void }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", source: "website", propertyType: "", area: "", budget: "", timeline: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const setField = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const qualification = qualifyLead({
      budget: Number(form.budget),
      timeline: form.timeline,
      preferredArea: form.area,
      propertyType: form.propertyType,
      email: form.email,
      phone: form.phone,
    });
    const viewLead: Lead = {
      initials: form.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
      name: form.name,
      source: ({ website: "Website", whatsapp: "WhatsApp", facebook: "Facebook" } as const)[form.source as "website" | "whatsapp" | "facebook"],
      interest: `${form.propertyType || "Property"} · ${form.area || "Dubai"}`,
      budget: form.budget ? `AED ${Number(form.budget).toLocaleString()}` : "Budget pending",
      score: qualification.score,
      status: qualification.score >= 70 ? "Qualified" : "New",
      owner: user ? "You" : "Demo",
      next: qualification.recommendedAction,
      tone: qualification.score >= 80 ? "mint" : qualification.score >= 55 ? "violet" : "amber",
    };
    if (supabase && user) {
      setBusy(true);
      const { data, error: insertError } = await supabase.from("leads").insert({
        full_name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        normalized_phone: form.phone.replace(/\D/g, "") || null,
        source: form.source,
        status: viewLead.status.toLowerCase(),
        temperature: qualification.temperature,
        score: qualification.score,
        score_reason: qualification.reason,
        budget_max: Number(form.budget) || null,
        preferred_area: form.area || null,
        property_type: form.propertyType || null,
        purchase_timeline: form.timeline || null,
        assigned_agent_id: user.id,
      }).select("id").single();
      setBusy(false);
      if (insertError) return setError(insertError.message);
      viewLead.id = data.id;
    }
    onCreated(viewLead);
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <form className="modal-card lead-form" onSubmit={submit}>
        <button type="button" className="modal-close" onClick={onClose}><X size={18} /></button>
        <div><span className="modal-icon"><Sparkles size={18} /></span><h2>Capture a new lead</h2><p>EstateFlow will qualify and score the lead instantly.</p></div>
        <div className="form-grid">
          <label>Full name<input required value={form.name} onChange={(e) => setField("name", e.target.value)} /></label>
          <label>Source<select value={form.source} onChange={(e) => setField("source", e.target.value)}><option value="website">Website</option><option value="whatsapp">WhatsApp</option><option value="facebook">Facebook</option></select></label>
          <label>Email<input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} /></label>
          <label>Phone<input value={form.phone} onChange={(e) => setField("phone", e.target.value)} placeholder="+971…" /></label>
          <label>Property type<input value={form.propertyType} onChange={(e) => setField("propertyType", e.target.value)} placeholder="2 bedroom apartment" /></label>
          <label>Preferred area<input value={form.area} onChange={(e) => setField("area", e.target.value)} placeholder="Dubai Marina" /></label>
          <label>Budget (AED)<input type="number" value={form.budget} onChange={(e) => setField("budget", e.target.value)} /></label>
          <label>Purchase timeline<input value={form.timeline} onChange={(e) => setField("timeline", e.target.value)} placeholder="Within 30 days" /></label>
        </div>
        {error && <div className="form-error">{error}</div>}
        {!user && <div className="form-hint">Demo mode: sign in to persist this lead in Supabase.</div>}
        <div className="modal-actions"><button type="button" onClick={onClose}>Cancel</button><button className="submit-button" disabled={busy}>{busy ? "Saving…" : "Create & qualify lead"}</button></div>
      </form>
    </div>
  );
}
