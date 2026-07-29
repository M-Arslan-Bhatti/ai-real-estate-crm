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
import { useMemo, useState } from "react";

type Lead = {
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

const leads: Lead[] = [
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

  const filtered = useMemo(
    () => leads.filter((lead) => `${lead.name} ${lead.interest} ${lead.source}`.toLowerCase().includes(query.toLowerCase())),
    [query],
  );

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
            <button className="add-lead" onClick={() => flash("Lead capture simulator opened")}><Plus size={17} /> Add lead</button>
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

          <section className="dashboard-grid">
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
          </section>
        </div>
      </section>
      {notice && <div className="toast"><Check size={16} />{notice}</div>}
    </main>
  );
}
