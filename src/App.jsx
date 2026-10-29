import { useEffect, useMemo, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const categories = ["Hostel", "Classroom", "Cleanliness", "IT / Wi-Fi", "Maintenance", "Safety", "Other"];
const statuses = ["Submitted", "In Review", "In Progress", "Resolved", "Rejected"];

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("cc_token") || "");
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("cc_user") || "null"));
  const [mode, setMode] = useState("login");
  const [page, setPage] = useState("overview");
  const [dark, setDark] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [categoryFilter, setCategoryFilter] = useState("All categories");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [form, setForm] = useState({ title: "", category: "Hostel", location: "", priority: "Medium", description: "" });
  const [auth, setAuth] = useState({ name: "", email: "", password: "", role: "student" });
  const [profile, setProfile] = useState({ name: "", phone: "", department: "", studentId: "", designation: "", hostelBlock: "", bio: "" });

  const headers = useMemo(() => ({ "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }), [token]);
  async function request(path, options = {}) {
    const res = await fetch(`${API}${path}`, { ...options, headers: { ...headers, ...(options.headers || {}) } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Request failed");
    return data;
  }
  async function loadComplaints() {
    try { const data = await request("/complaints"); setComplaints(data.complaints || []); }
    catch (e) { setMessage(e.message); }
  }
  useEffect(() => { if (token && user) loadComplaints(); }, [token, user]);
  useEffect(() => { if (user) setProfile({ name: user.name || "", phone: user.phone || "", department: user.department || "", studentId: user.studentId || "", designation: user.designation || "", hostelBlock: user.hostelBlock || "", bio: user.bio || "" }); }, []);

  function saveSession(data) {
    localStorage.setItem("cc_token", data.token);
    localStorage.setItem("cc_user", JSON.stringify(data.user));
    setToken(data.token); setUser(data.user); setProfile({ name: data.user.name || "", phone: data.user.phone || "", department: data.user.department || "", studentId: data.user.studentId || "", designation: data.user.designation || "", hostelBlock: data.user.hostelBlock || "", bio: data.user.bio || "" }); setMessage("");
  }
  async function submitAuth(e) {
    e.preventDefault(); setBusy(true); setMessage("");
    try {
      const endpoint = mode === "register" ? "/auth/register" : "/auth/login";
      const payload = mode === "register" ? { ...auth, role: "student" } : auth;
      const data = await request(endpoint, { method: "POST", body: JSON.stringify(payload) });
      saveSession(data);
    } catch (e) { setMessage(e.message); }
    finally { setBusy(false); }
  }
  function logout() {
    localStorage.removeItem("cc_token"); localStorage.removeItem("cc_user");
    setToken(""); setUser(null); setComplaints([]); setMessage(""); setAuth({ name: "", email: "", password: "", role: "student" }); setPage("overview");
  }
  async function submitComplaint(e) {
    e.preventDefault(); setBusy(true); setMessage("");
    try {
      await request("/complaints", { method: "POST", body: JSON.stringify(form) });
      setForm({ title: "", category: "Hostel", location: "", priority: "Medium", description: "" });
      setMessage("Complaint submitted successfully."); await loadComplaints();
    } catch (e) { setMessage(e.message); }
    finally { setBusy(false); }
  }
  async function updateStatus(id, status) {
    try { await request(`/complaints/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }); await loadComplaints(); setMessage("Complaint status updated."); }
    catch (e) { setMessage(e.message); }
  }
  const counts = statuses.map(status => ({ status, count: complaints.filter(c => c.status === status).length }));
  const visibleComplaints = complaints.filter(c => {
    const q = search.toLowerCase();
    const matchesSearch = !q || [c.title, c.category, c.location, c.description, c.student?.name, c.student?.email].some(v => String(v || "").toLowerCase().includes(q));
    return matchesSearch && (statusFilter === "All statuses" || c.status === statusFilter) && (categoryFilter === "All categories" || c.category === categoryFilter);
  });
  async function saveProfile(e) {
    e.preventDefault(); setBusy(true); setMessage("");
    try { const data = await request("/auth/profile", { method: "PATCH", body: JSON.stringify(profile) }); setUser(data.user); localStorage.setItem("cc_user", JSON.stringify(data.user)); setMessage("Profile updated successfully."); setPage("profile"); }
    catch (e) { setMessage(e.message); } finally { setBusy(false); }
  }
  function exportCsv() {
    const rows = [["Title","Category","Location","Priority","Status","Reported By","Created"], ...visibleComplaints.map(c => [c.title,c.category,c.location,c.priority,c.status,c.student?.name || user.name,new Date(c.createdAt).toLocaleDateString()])];
    const csv = rows.map(row => row.map(v => `"${String(v ?? "").replaceAll('"','""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" })); const a = document.createElement("a"); a.href = url; a.download = "campuscare-complaints.csv"; a.click(); URL.revokeObjectURL(url);
  }

  if (!token || !user) return <main className="auth-shell">
    <section className="hero-panel">
      <div className="brand"><span className="brand-mark">C</span> CampusCare</div>
      <div className="hero-copy"><p className="eyebrow">A BETTER CAMPUS STARTS HERE</p><h1>Your voice.<br/><em>Your campus.</em><br/>Your care.</h1><p>Report campus and hostel issues, track progress, and help build a safer, better place to learn.</p>
        <div className="hero-stats"><div><strong>01</strong><span>Report an issue</span></div><div><strong>02</strong><span>Track progress</span></div><div><strong>03</strong><span>Make change</span></div></div>
      </div><div className="hero-foot">STUDENT SUPPORT PLATFORM <span>● LIVE WORKSPACE</span></div>
    </section>
    <section className="auth-panel"><div className="auth-card">
      <div className="mobile-brand"><span className="brand-mark">C</span> CampusCare</div>
      <p className="eyebrow">{mode === "login" ? "WELCOME BACK" : "JOIN YOUR CAMPUS"}</p>
      <h2>{mode === "login" ? "Sign in to continue" : "Create your account"}</h2>
      <p className="muted">{mode === "login" ? "Choose your account type to open the right workspace." : "Create a student account to report and track issues."}</p>
      {mode === "login" && <div className="role-picker" role="group" aria-label="Choose login role">{[{id:"student",icon:"♙",label:"Student"},{id:"staff",icon:"✦",label:"Staff"},{id:"admin",icon:"⌘",label:"Admin"}].map(r=><button type="button" key={r.id} className={auth.role===r.id?"role-option selected":"role-option"} onClick={()=>setAuth({...auth,role:r.id})}><span>{r.icon}</span>{r.label}</button>)}</div>}
      {message && <div className="notice error">{message}</div>}
      <form onSubmit={submitAuth} className="stack">
        {mode === "register" && <label>Full name<input value={auth.name} onChange={e=>setAuth({...auth,name:e.target.value})} placeholder="Your full name" required /></label>}
        <label>Email address<input type="email" value={auth.email} onChange={e=>setAuth({...auth,email:e.target.value})} placeholder="you@college.edu" required /></label>
        <label>Password<input type="password" value={auth.password} onChange={e=>setAuth({...auth,password:e.target.value})} placeholder="At least 8 characters" minLength={mode==="register"?8:1} required /></label>
        <button className="primary full" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in →" : "Create account →"}</button>
      </form>
      <p className="switch-mode">{mode === "login" ? "New to CampusCare?" : "Already have an account?"} <button className="text-button" onClick={()=>{setMode(mode==="login"?"register":"login");setMessage("");}}>{mode==="login"?"Create account":"Sign in"}</button></p>
      <div className="security-note"><span>✦</span> Your account and complaint details are protected.</div>
    </div></section>
  </main>;

  return <div className={`app-shell ${dark ? "dark-mode" : ""}`}>
    <aside className="sidebar"><div className="brand"><span className="brand-mark">C</span> CampusCare</div><div className="side-label">WORKSPACE</div><button className={`nav-item ${page === "overview" ? "active" : ""}`} onClick={()=>setPage("overview")}><span>▦</span> Overview</button><button className={`nav-item ${page === "complaints" ? "active" : ""}`} onClick={()=>setPage("complaints")}><span>◈</span> {user.role === "student" ? "My complaints" : "All complaints"}</button><button className={`nav-item ${page === "profile" ? "active" : ""}`} onClick={()=>setPage("profile")}><span>◎</span> My profile</button><div className="side-bottom"><div className="help-card"><div className="help-icon">✦</div><strong>Need a hand?</strong><p>Every report helps make campus life better.</p></div><div className="profile"><div className="avatar">{user.name?.slice(0,1).toUpperCase()}</div><div className="profile-info"><strong>{user.name}</strong><span>{user.role === "admin" ? "Administrator" : user.role === "staff" ? "Campus staff" : "Student account"}</span></div><button className="logout" onClick={logout} title="Sign out">↗</button></div></div></aside>
    <main className="dashboard"><header className="topbar"><div><span className="breadcrumb">Workspace /</span> <strong>{page === "profile" ? "My profile" : page === "complaints" ? "Complaints" : "Overview"}</strong></div><div className="top-right"><button className="icon-button" onClick={()=>setDark(!dark)} title="Toggle appearance">{dark ? "☀" : "☾"}</button><span className="live-dot"></span><span>Workspace active</span><div className="avatar small">{user.name?.slice(0,1).toUpperCase()}</div></div></header>
      {message && <div className="notice"><span>{message}</span><button onClick={()=>setMessage("")}>×</button></div>}
      {page === "profile" ? <section className="panel profile-page"><div className="panel-heading"><div><p className="eyebrow">YOUR ACCOUNT</p><h2>Personal profile</h2><p className="muted">Keep your campus contact details up to date.</p></div><div className="avatar profile-avatar">{user.name?.slice(0,1).toUpperCase()}</div></div><form className="stack profile-form" onSubmit={saveProfile}><div className="two-col"><label>Full name<input required value={profile.name} onChange={e=>setProfile({...profile,name:e.target.value})}/></label><label>Email address<input value={user.email} disabled/></label><label>Phone number<input value={profile.phone} onChange={e=>setProfile({...profile,phone:e.target.value})} placeholder="Contact number"/></label><label>Department<input value={profile.department} onChange={e=>setProfile({...profile,department:e.target.value})} placeholder="e.g. Computer Engineering"/></label>{user.role === "student" ? <><label>Student / Roll ID<input value={profile.studentId} onChange={e=>setProfile({...profile,studentId:e.target.value})} placeholder="Your college ID"/></label><label>Hostel / Block<input value={profile.hostelBlock} onChange={e=>setProfile({...profile,hostelBlock:e.target.value})} placeholder="e.g. Hostel B"/></label></> : <label>Designation<input value={profile.designation} onChange={e=>setProfile({...profile,designation:e.target.value})} placeholder="e.g. Warden / Faculty"/></label>}</div><label>About me<textarea rows="4" maxLength="300" value={profile.bio} onChange={e=>setProfile({...profile,bio:e.target.value})} placeholder="A short introduction (up to 300 characters)"/></label><button className="primary" disabled={busy}>{busy ? "Saving…" : "Save profile changes →"}</button></form><div className="profile-security"><span>✦</span><div><strong>Account security</strong><p>Your role is <b>{user.role}</b>. Role permissions are managed by CampusCare administrators.</p></div></div></section> : (<><section className="welcome"><div><p className="eyebrow">{user.role === "admin" ? "ADMIN CONTROL CENTER" : user.role === "staff" ? "STAFF OPERATIONS" : "STUDENT PORTAL"}</p><h1>{user.role === "admin" ? "Welcome back, Admin." : `Hello, ${user.name.split(" ")[0]}.`}</h1><p className="muted">{user.role === "admin" ? "Review reports, spot trends, and keep campus operations moving." : user.role === "staff" ? "Review campus reports and help move each issue toward resolution." : "Have an issue? Let us know. We’ll help get it to the right people."}</p></div><div className="welcome-icon">✧</div></section>
      <section className="metric-grid">
        <div className="metric-card"><div className="metric-top"><span>Total complaints</span><span className="metric-icon purple">▤</span></div><strong>{complaints.length}</strong><small>Reports in your workspace</small></div>
        <div className="metric-card"><div className="metric-top"><span>In progress</span><span className="metric-icon blue">◷</span></div><strong>{complaints.filter(c=>["In Review","In Progress"].includes(c.status)).length}</strong><small>Being reviewed or worked on</small></div>
        <div className="metric-card"><div className="metric-top"><span>Resolved</span><span className="metric-icon green">✓</span></div><strong>{complaints.filter(c=>c.status==="Resolved").length}</strong><small>Successfully closed reports</small></div>
      </section>
      {page === "overview" && <section className="quick-actions"><div><span className="quick-icon">✦</span><div><strong>Campus pulse</strong><p>{complaints.filter(c=>c.status === "Submitted").length} new submissions waiting for review · {complaints.filter(c=>c.status === "Resolved").length} issues resolved</p></div></div><button className="secondary" onClick={()=>setPage("complaints")}>Explore reports →</button></section>}
      {page !== "profile" && <div className="content-grid">
        {user.role !== "admin" && <section className="panel"><div className="panel-heading"><div><p className="eyebrow">RAISE A CONCERN</p><h2>Submit a complaint</h2></div><span className="panel-symbol">＋</span></div><form className="stack complaint-form" onSubmit={submitComplaint}>
          <label>Complaint title<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. Water cooler not working" required maxLength={120}/></label>
          <div className="two-col"><label>Category<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{categories.map(c=><option key={c}>{c}</option>)}</select></label><label>Priority<select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}><option>Low</option><option>Medium</option><option>High</option></select></label></div>
          <label>Location<input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} placeholder="Hostel block, room, building…" required maxLength={120}/></label>
          <label>Description<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Tell us what happened and any details that may help…" rows="4" required maxLength={2000}/></label>
          <button className="primary" disabled={busy}>{busy?"Submitting…":"Submit complaint  →"}</button>
        </form></section>}
        <section className="panel complaints-panel"><div className="panel-heading"><div><p className="eyebrow">{user.role==="admin"?"CAMPUS-WIDE VIEW":"YOUR ACTIVITY"}</p><h2>{user.role==="admin"?"All complaints":"Recent complaints"}</h2></div><span className="count-pill">{complaints.length} total</span></div>
          <div className="filter-bar"><input aria-label="Search complaints" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search title, location, reporter…"/><select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option>All statuses</option>{statuses.map(s=><option key={s}>{s}</option>)}</select><select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)}><option>All categories</option>{categories.map(c=><option key={c}>{c}</option>)}</select>{user.role !== "student" && <button className="secondary export-button" onClick={exportCsv}>↓ Export CSV</button>}</div>
          <div className="status-summary">{counts.slice(0,4).map(c=><div key={c.status}><span className={`status-dot ${c.status.toLowerCase().replaceAll(" ","-")}`}></span><span>{c.status}</span><strong>{c.count}</strong></div>)}</div>
          {visibleComplaints.length===0 ? <div className="empty-state"><div>◌</div><strong>No complaints yet</strong><p>{user.role==="admin"?"New student reports will appear here.":"Your submitted complaints will appear here so you can track them."}</p></div> :
            <div className="complaint-list">{visibleComplaints.map(c=><article className="complaint-row" key={c._id}><div className="complaint-symbol">{c.category==="Hostel"?"⌂":c.category==="IT / Wi-Fi"?"⌁":"▧"}</div><div className="complaint-main"><div className="complaint-title">{c.title}</div><div className="complaint-meta">{c.category} · {c.location} · {new Date(c.createdAt).toLocaleDateString()}</div>{user.role!=="student"&&<div className="complaint-meta">Reported by {c.student?.name || "Student"} ({c.student?.email || "—"})</div>}<div className="row-bottom"><span className={`priority ${c.priority.toLowerCase()}`}>{c.priority} priority</span><span className={`status-tag ${c.status.toLowerCase().replaceAll(" ","-")}`}>{c.status}</span></div>{user.role!=="student"&&<label className="status-control">Update status<select value={c.status} onChange={e=>updateStatus(c._id,e.target.value)}>{statuses.map(s=><option key={s}>{s}</option>)}</select></label>}</div></article>)}</div>}
        </section>
      </div>}
      </>)}
      <footer>CampusCare <span>·</span> Making campus life better, one report at a time.</footer>
    </main>
  </div>;
}
