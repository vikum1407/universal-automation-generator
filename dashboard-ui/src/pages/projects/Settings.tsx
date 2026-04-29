import { theme } from "@/theme";
import { useColors } from "@/hooks/useColors";
import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  fetchSettings, patchSettings,
  addEnvironment, updateEnvironment, deleteEnvironment,
  addRole, updateRole, deleteRole,
  addWebhook, deleteWebhook,
  ROLE_LABEL, ROLE_COLOR, ENV_TYPE_COLOR, RISK_COLOR, NOTIFICATION_EVENTS,
  type ProjectSettings, type EnvironmentConfig, type AccessRole,
} from "@/api/settings";
import { useNavigate } from "react-router-dom";

// ─── Shared primitives ────────────────────────────────────────────────────────

function makeInputStyle(TXT: string, BDR: string): React.CSSProperties {
  return {
    width: "100%", padding: "8px 12px", fontSize: 13, color: TXT,
    background: "transparent", border: `1px solid ${BDR}`, borderRadius: theme.radii.md,
    outline: "none", boxSizing: "border-box",
  };
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const { BG, BDR } = useColors();
  return (
    <div style={{
      background: BG, border: `1px solid ${BDR}`,
      borderRadius: theme.radii.lg, padding: theme.spacing.lg,
      marginBottom: theme.spacing.md, ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  const { P } = useColors();
  return <h3 style={{ color: P, margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>{children}</h3>;
}

function Label({ children }: { children: React.ReactNode }) {
  const { TXT2 } = useColors();
  return <div style={{ fontSize: 12, color: TXT2, fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{children}</div>;
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  const { TXT2 } = useColors();
  return (
    <div style={{ marginBottom: 18 }}>
      <Label>{label}</Label>
      {children}
      {hint && <div style={{ fontSize: 11, color: TXT2, marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  const { TXT, BDR } = useColors();
  return <input style={makeInputStyle(TXT, BDR)} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={type} />;
}

function NumberInput({ value, onChange, min, max }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  const { TXT, BDR } = useColors();
  return <input style={{ ...makeInputStyle(TXT, BDR), width: 120 }} type="number" value={value} onChange={e => onChange(Number(e.target.value))} min={min} max={max} />;
}

function Textarea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  const { TXT, BDR } = useColors();
  return <textarea style={{ ...makeInputStyle(TXT, BDR), resize: "vertical" }} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} />;
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  const { TXT, BDR } = useColors();
  return (
    <select style={{ ...makeInputStyle(TXT, BDR), cursor: "pointer" }} value={value} onChange={e => onChange(e.target.value)}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  const { P, TXT } = useColors();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
          background: value ? P : "#CBD5E0", position: "relative", transition: "background 0.2s",
          flexShrink: 0,
        }}
      >
        <span style={{
          position: "absolute", top: 2, left: value ? 22 : 2,
          width: 20, height: 20, borderRadius: "50%", background: "#fff",
          transition: "left 0.2s", display: "block",
        }} />
      </button>
      <span style={{ fontSize: 13, color: TXT }}>{label}</span>
    </div>
  );
}

function SaveButton({ onClick, saving }: { onClick: () => void; saving: boolean }) {
  const { P } = useColors();
  return (
    <button
      onClick={onClick}
      disabled={saving}
      style={{
        padding: "8px 20px", background: P, color: "#fff", border: "none",
        borderRadius: theme.radii.md, cursor: saving ? "not-allowed" : "pointer",
        fontWeight: 600, fontSize: 13, opacity: saving ? 0.7 : 1,
      }}
    >
      {saving ? "Saving…" : "Save Changes"}
    </button>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  const { P } = useColors();
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: `${P}18`, color: P, borderRadius: 4, padding: "2px 8px", fontSize: 12,
    }}>
      {label}
      <button onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", color: P, padding: 0, lineHeight: 1, fontSize: 14 }}>×</button>
    </span>
  );
}

// ─── Sub-sections ─────────────────────────────────────────────────────────────

type SettingsSection =
  | "general" | "environments" | "scanning" | "testing"
  | "ai" | "integrations" | "access" | "data" | "notifications" | "appearance";

const NAV_ITEMS: { id: SettingsSection; label: string; icon: string }[] = [
  { id: "general",       label: "General",              icon: "⚙️" },
  { id: "environments",  label: "Environments",          icon: "🌐" },
  { id: "scanning",      label: "Scanning & Pipelines",  icon: "🔍" },
  { id: "testing",       label: "Testing & Execution",   icon: "▶️" },
  { id: "ai",            label: "AI & Automation",       icon: "🤖" },
  { id: "integrations",  label: "Integrations",          icon: "🔗" },
  { id: "access",        label: "Access Control",        icon: "🔒" },
  { id: "data",          label: "Data & Privacy",        icon: "🛡️" },
  { id: "notifications", label: "Notifications",         icon: "🔔" },
  { id: "appearance",    label: "Appearance",            icon: "🎨" },
];

// ─── Section: General ─────────────────────────────────────────────────────────

function GeneralSection({ settings, projectId, onChange }: { settings: ProjectSettings; projectId: string; onChange: (s: ProjectSettings) => void }) {
  const { P, BDR, BG, TXT, TXT2 } = useColors();
  const inputStyle = makeInputStyle(TXT, BDR);
  const [saving, setSaving] = useState(false);
  const g = settings.general;
  const [tagInput, setTagInput] = useState("");

  function set(patch: Partial<typeof g>) {
    onChange({ ...settings, general: { ...g, ...patch } });
  }

  async function save() {
    setSaving(true);
    try {
      const updated = await patchSettings(projectId, { general: settings.general });
      onChange(updated);
      toast.success("General settings saved");
    } catch { toast.error("Failed to save"); }
    setSaving(false);
  }

  function addTag() {
    const t = tagInput.trim();
    if (t && !g.tags.includes(t)) {
      set({ tags: [...g.tags, t] });
      setTagInput("");
    }
  }

  return (
    <div>
      <Card>
        <SectionTitle>Project Identity</SectionTitle>
        <Field label="Project Name">
          <Input value={g.name} onChange={v => set({ name: v })} placeholder="My Project" />
        </Field>
        <Field label="Description">
          <Textarea value={g.description} onChange={v => set({ description: v })} placeholder="What does this project test?" rows={2} />
        </Field>
        <Field label="Tags">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            {g.tags.map(t => <Chip key={t} label={t} onRemove={() => set({ tags: g.tags.filter(x => x !== t) })} />)}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input style={{ ...inputStyle, flex: 1 }} value={tagInput} onChange={e => setTagInput(e.target.value)}
              placeholder="Add tag…" onKeyDown={e => e.key === "Enter" && addTag()} />
            <button onClick={addTag} style={{ padding: "8px 14px", background: `${P}18`, color: P, border: `1px solid ${P}40`, borderRadius: theme.radii.md, cursor: "pointer", fontSize: 13 }}>Add</button>
          </div>
        </Field>
        <Field label="Owner Email">
          <Input value={g.ownerEmail} onChange={v => set({ ownerEmail: v })} placeholder="qa-lead@company.com" type="email" />
        </Field>
        <Field label="External ID" hint="Optional identifier for syncing with external systems (Jira project, GitHub repo…)">
          <Input value={g.externalId} onChange={v => set({ externalId: v })} placeholder="PROJ-001" />
        </Field>
      </Card>

      <Card>
        <SectionTitle>Risk & Testing Defaults</SectionTitle>
        <Field label="Risk Profile" hint="Controls alert thresholds and AI recommendations">
          <Select value={g.riskProfile} onChange={v => set({ riskProfile: v as any })} options={[
            { value: "low", label: "Low — Minimal risk tolerance" },
            { value: "medium", label: "Medium — Balanced approach" },
            { value: "high", label: "High — Aggressive coverage targets" },
            { value: "critical", label: "Critical — Zero-tolerance quality gate" },
          ]} />
          <div style={{ marginTop: 8, display: "inline-flex", padding: "3px 10px", borderRadius: 4, fontSize: 12, fontWeight: 600, background: `${RISK_COLOR[g.riskProfile]}20`, color: RISK_COLOR[g.riskProfile] }}>
            {g.riskProfile.toUpperCase()}
          </div>
        </Field>
        <Field label="Default Test Types">
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {(["ui", "api", "e2e", "regression"] as const).map(t => {
              const active = g.defaultTestTypes.includes(t);
              return (
                <button key={t} onClick={() => set({ defaultTestTypes: active ? g.defaultTestTypes.filter(x => x !== t) : [...g.defaultTestTypes, t] })}
                  style={{ padding: "6px 14px", borderRadius: theme.radii.md, border: `1px solid ${active ? P : BDR}`, background: active ? `${P}18` : "transparent", color: active ? P : TXT2, cursor: "pointer", fontSize: 13, fontWeight: active ? 600 : 400 }}>
                  {t.toUpperCase()}
                </button>
              );
            })}
          </div>
        </Field>
      </Card>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <SaveButton onClick={save} saving={saving} />
      </div>
    </div>
  );
}

// ─── Section: Environments ────────────────────────────────────────────────────

function EnvironmentsSection({ settings, projectId, onChange }: { settings: ProjectSettings; projectId: string; onChange: (s: ProjectSettings) => void }) {
  const { P, BDR, BG, TXT, TXT2 } = useColors();
  const inputStyle = makeInputStyle(TXT, BDR);
  const selectStyle = { ...inputStyle, cursor: "pointer" } as React.CSSProperties;
  const [editing, setEditing] = useState<EnvironmentConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);

  const envs = settings.environments;

  async function handleAdd() {
    setSaving(true);
    try {
      const env = await addEnvironment(projectId, { name: "New Environment", type: "dev", url: "" });
      onChange({ ...settings, environments: [...envs, env] });
      setEditing(env);
      toast.success("Environment added");
    } catch { toast.error("Failed to add"); }
    setSaving(false);
  }

  async function handleSaveEdit() {
    if (!editing) return;
    setSaving(true);
    try {
      const updated = await updateEnvironment(projectId, editing.id, editing);
      onChange({ ...settings, environments: envs.map(e => e.id === editing.id ? updated : e) });
      setEditing(null);
      toast.success("Environment saved");
    } catch { toast.error("Failed to save"); }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this environment?")) return;
    try {
      await deleteEnvironment(projectId, id);
      onChange({ ...settings, environments: envs.filter(e => e.id !== id) });
      toast.success("Environment deleted");
    } catch { toast.error("Failed to delete"); }
  }

  function setEnv(patch: Partial<EnvironmentConfig>) {
    if (!editing) return;
    setEditing({ ...editing, ...patch });
  }

  return (
    <div>
      {/* Environment list */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <SectionTitle>Environments</SectionTitle>
        <button onClick={handleAdd} disabled={saving}
          style={{ padding: "6px 14px", background: P, color: "#fff", border: "none", borderRadius: theme.radii.md, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
          + Add Environment
        </button>
      </div>

      {envs.map(env => (
        <Card key={env.id} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <strong style={{ fontSize: 14, color: TXT }}>{env.name}</strong>
                <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 4, fontWeight: 600, background: `${ENV_TYPE_COLOR[env.type]}20`, color: ENV_TYPE_COLOR[env.type] }}>
                  {env.type.toUpperCase()}
                </span>
                {env.isDefault && <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 4, background: `${P}20`, color: P, fontWeight: 600 }}>DEFAULT</span>}
              </div>
              <div style={{ fontSize: 13, color: TXT2 }}>{env.url || "No URL set"}</div>
              <div style={{ fontSize: 12, color: TXT2, marginTop: 2 }}>Auth: {env.auth.type} · {env.variables.length} variable{env.variables.length !== 1 ? "s" : ""}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setEditing(env)} style={{ padding: "5px 12px", border: `1px solid ${BDR}`, borderRadius: theme.radii.md, background: BG, cursor: "pointer", fontSize: 13, color: TXT }}>Edit</button>
              <button onClick={() => handleDelete(env.id)} style={{ padding: "5px 12px", border: `1px solid ${"#EF5350"}40`, borderRadius: theme.radii.md, background: "transparent", cursor: "pointer", fontSize: 13, color: "#EF5350" }}>Delete</button>
            </div>
          </div>
        </Card>
      ))}

      {/* Edit drawer */}
      {editing && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}>
          <div onClick={() => setEditing(null)} style={{ flex: 1, background: "rgba(0,0,0,0.3)" }} />
          <div style={{ width: 480, background: "#fff", overflowY: "auto", padding: 24, boxShadow: "-4px 0 20px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: P, fontSize: 16 }}>Edit Environment</h3>
              <button onClick={() => setEditing(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: TXT2 }}>×</button>
            </div>
            <Field label="Name"><Input value={editing.name} onChange={v => setEnv({ name: v })} /></Field>
            <Field label="Type">
              <Select value={editing.type} onChange={v => setEnv({ type: v as any })} options={[
                { value: "dev", label: "Development" },
                { value: "staging", label: "Staging" },
                { value: "prod", label: "Production" },
                { value: "custom", label: "Custom" },
              ]} />
            </Field>
            <Field label="Base URL"><Input value={editing.url} onChange={v => setEnv({ url: v })} placeholder="https://app.example.com" /></Field>
            <Field label="Authentication">
              <Select value={editing.auth.type} onChange={v => setEnv({ auth: { ...editing.auth, type: v as any } })} options={[
                { value: "none", label: "None" },
                { value: "basic", label: "Basic Auth" },
                { value: "bearer", label: "Bearer Token" },
                { value: "oauth2", label: "OAuth 2.0" },
              ]} />
            </Field>
            {editing.auth.type === "basic" && (
              <>
                <Field label="Username"><Input value={editing.auth.username ?? ""} onChange={v => setEnv({ auth: { ...editing.auth, username: v } })} /></Field>
                <Field label="Password"><Input value={editing.auth.password ?? ""} onChange={v => setEnv({ auth: { ...editing.auth, password: v } })} type="password" /></Field>
              </>
            )}
            {editing.auth.type === "bearer" && (
              <Field label="Token"><Input value={editing.auth.token ?? ""} onChange={v => setEnv({ auth: { ...editing.auth, token: v } })} type="password" /></Field>
            )}
            {editing.auth.type === "oauth2" && (
              <>
                <Field label="Token URL"><Input value={editing.auth.tokenUrl ?? ""} onChange={v => setEnv({ auth: { ...editing.auth, tokenUrl: v } })} /></Field>
                <Field label="Client ID"><Input value={editing.auth.clientId ?? ""} onChange={v => setEnv({ auth: { ...editing.auth, clientId: v } })} /></Field>
                <Field label="Client Secret"><Input value={editing.auth.clientSecret ?? ""} onChange={v => setEnv({ auth: { ...editing.auth, clientSecret: v } })} type="password" /></Field>
              </>
            )}
            <Field label="Variables" hint="KEY=VALUE pairs, one per line">
              <Textarea
                value={editing.variables.map(v => `${v.key}=${v.value}`).join("\n")}
                onChange={v => setEnv({ variables: v.split("\n").filter(Boolean).map(line => { const [key, ...rest] = line.split("="); return { key: key.trim(), value: rest.join("=").trim() }; }) })}
                placeholder="BASE_URL=https://...\nAUTH_TOKEN=..."
                rows={4}
              />
            </Field>
            <Toggle value={editing.isDefault} onChange={v => setEnv({ isDefault: v })} label="Set as default environment" />
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button onClick={handleSaveEdit} disabled={saving}
                style={{ padding: "8px 20px", background: P, color: "#fff", border: "none", borderRadius: theme.radii.md, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
                {saving ? "Saving…" : "Save"}
              </button>
              <button onClick={() => setEditing(null)} style={{ padding: "8px 16px", border: `1px solid ${BDR}`, borderRadius: theme.radii.md, background: "transparent", cursor: "pointer", fontSize: 13 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Section: Scanning & Pipelines ───────────────────────────────────────────

function ScanningSection({ settings, projectId, onChange }: { settings: ProjectSettings; projectId: string; onChange: (s: ProjectSettings) => void }) {
  const { P, BDR, BG, TXT, TXT2 } = useColors();
  const [saving, setSaving] = useState(false);
  const sc = settings.scanning;

  function setUI(patch: Partial<typeof sc.ui>) { onChange({ ...settings, scanning: { ...sc, ui: { ...sc.ui, ...patch } } }); }
  function setAPI(patch: Partial<typeof sc.api>) { onChange({ ...settings, scanning: { ...sc, api: { ...sc.api, ...patch } } }); }
  function setPipe(patch: Partial<typeof sc.pipeline>) { onChange({ ...settings, scanning: { ...sc, pipeline: { ...sc.pipeline, ...patch } } }); }

  async function save() {
    setSaving(true);
    try { const u = await patchSettings(projectId, { scanning: sc }); onChange(u); toast.success("Scanning settings saved"); }
    catch { toast.error("Failed to save"); }
    setSaving(false);
  }

  function listField(label: string, values: string[], onChange: (v: string[]) => void, placeholder: string) {
    return (
      <Field label={label} hint="One per line">
        <Textarea value={values.join("\n")} onChange={v => onChange(v.split("\n").map(s => s.trim()).filter(Boolean))} placeholder={placeholder} rows={3} />
      </Field>
    );
  }

  return (
    <div>
      <Card>
        <SectionTitle>UI Scan Settings</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Max Depth"><NumberInput value={sc.ui.maxDepth} onChange={v => setUI({ maxDepth: v })} min={1} max={20} /></Field>
          <Field label="Max Pages"><NumberInput value={sc.ui.maxPages} onChange={v => setUI({ maxPages: v })} min={1} max={5000} /></Field>
        </div>
        {listField("Allowed Domains", sc.ui.allowedDomains, v => setUI({ allowedDomains: v }), "example.com\nstaging.example.com")}
        {listField("Excluded Paths", sc.ui.excludedPaths, v => setUI({ excludedPaths: v }), "/logout\n/admin/delete")}
        <Toggle value={sc.ui.clickableElements} onChange={v => setUI({ clickableElements: v })} label="Record clickable elements" />
        <Toggle value={sc.ui.waitForNetwork} onChange={v => setUI({ waitForNetwork: v })} label="Wait for network idle before capturing" />
      </Card>

      <Card>
        <SectionTitle>API Scan Settings</SectionTitle>
        {listField("Swagger / OpenAPI URLs", sc.api.swaggerUrls, v => setAPI({ swaggerUrls: v }), "https://api.example.com/swagger.json")}
        {listField("Excluded Endpoints", sc.api.excludedEndpoints, v => setAPI({ excludedEndpoints: v }), "DELETE /admin/*\nGET /internal/*")}
        <Toggle value={sc.api.includeDeprecated} onChange={v => setAPI({ includeDeprecated: v })} label="Include deprecated endpoints" />
        <Toggle value={sc.api.followRedirects} onChange={v => setAPI({ followRedirects: v })} label="Follow redirects" />
      </Card>

      <Card>
        <SectionTitle>Pipeline Behavior</SectionTitle>
        <Toggle value={sc.pipeline.autoGenerateTests} onChange={v => setPipe({ autoGenerateTests: v })} label="Auto-generate tests after every scan" />
        <Toggle value={sc.pipeline.autoUpdateRTM} onChange={v => setPipe({ autoUpdateRTM: v })} label="Auto-update RTM after scan" />
        <Toggle value={sc.pipeline.notifyOnCompletion} onChange={v => setPipe({ notifyOnCompletion: v })} label="Notify on pipeline completion" />
        <Field label="Schedule Cron" hint="Leave blank to disable scheduled scans (e.g. 0 2 * * 1 for every Monday at 2am)">
          <Input value={sc.pipeline.scheduleCron} onChange={v => setPipe({ scheduleCron: v })} placeholder="0 2 * * 1" />
        </Field>
      </Card>

      <div style={{ display: "flex", justifyContent: "flex-end" }}><SaveButton onClick={save} saving={saving} /></div>
    </div>
  );
}

// ─── Section: Testing & Execution ────────────────────────────────────────────

function TestingSection({ settings, projectId, onChange }: { settings: ProjectSettings; projectId: string; onChange: (s: ProjectSettings) => void }) {
  const { P, BDR, BG, TXT, TXT2 } = useColors();
  const [saving, setSaving] = useState(false);
  const t = settings.testing;
  function set(patch: Partial<typeof t>) { onChange({ ...settings, testing: { ...t, ...patch } }); }

  async function save() {
    setSaving(true);
    try { const u = await patchSettings(projectId, { testing: t }); onChange(u); toast.success("Testing settings saved"); }
    catch { toast.error("Failed to save"); }
    setSaving(false);
  }

  return (
    <div>
      <Card>
        <SectionTitle>Execution Parameters</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <Field label="Concurrency"><NumberInput value={t.concurrency} onChange={v => set({ concurrency: v })} min={1} max={20} /></Field>
          <Field label="Retries"><NumberInput value={t.retries} onChange={v => set({ retries: v })} min={0} max={5} /></Field>
          <Field label="Parallel Workers"><NumberInput value={t.parallelWorkers} onChange={v => set({ parallelWorkers: v })} min={1} max={16} /></Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Timeout (ms)"><NumberInput value={t.timeoutMs} onChange={v => set({ timeoutMs: v })} min={1000} max={300000} /></Field>
          <Field label="Slow-Mo Delay (ms)" hint="Delays actions to debug tests"><NumberInput value={t.slowMoMs} onChange={v => set({ slowMoMs: v })} min={0} max={5000} /></Field>
        </div>
      </Card>

      <Card>
        <SectionTitle>Browser & Runner</SectionTitle>
        <Field label="Default Browser">
          <Select value={t.defaultBrowser} onChange={v => set({ defaultBrowser: v as any })} options={[
            { value: "chromium", label: "Chromium (recommended)" },
            { value: "firefox", label: "Firefox" },
            { value: "webkit", label: "WebKit / Safari" },
          ]} />
        </Field>
        <Toggle value={t.headless} onChange={v => set({ headless: v })} label="Run in headless mode" />
        <Toggle value={t.captureScreenshots} onChange={v => set({ captureScreenshots: v })} label="Capture screenshots on failure" />
        <Toggle value={t.captureVideo} onChange={v => set({ captureVideo: v })} label="Record video (increases storage usage)" />
      </Card>

      <Card>
        <SectionTitle>Test Selection Strategy</SectionTitle>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {([
            { value: "all", label: "All Tests", desc: "Run everything every time" },
            { value: "changed", label: "Changed Only", desc: "Tests for changed components" },
            { value: "failed", label: "Previously Failed", desc: "Rerun last failures first" },
            { value: "critical", label: "Critical Path", desc: "High-priority tests only" },
          ] as const).map(opt => (
            <div key={opt.value} onClick={() => set({ testSelectionStrategy: opt.value })}
              style={{ padding: "10px 16px", borderRadius: theme.radii.md, border: `2px solid ${t.testSelectionStrategy === opt.value ? P : BDR}`, background: t.testSelectionStrategy === opt.value ? `${P}10` : "transparent", cursor: "pointer", flex: "1 0 160px" }}>
              <div style={{ fontWeight: 600, color: t.testSelectionStrategy === opt.value ? P : TXT, fontSize: 13 }}>{opt.label}</div>
              <div style={{ fontSize: 11, color: TXT2, marginTop: 2 }}>{opt.desc}</div>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: "flex", justifyContent: "flex-end" }}><SaveButton onClick={save} saving={saving} /></div>
    </div>
  );
}

// ─── Section: AI & Automation ─────────────────────────────────────────────────

function AISection({ settings, projectId, onChange }: { settings: ProjectSettings; projectId: string; onChange: (s: ProjectSettings) => void }) {
  const { P, BDR, BG, TXT, TXT2 } = useColors();
  const [saving, setSaving] = useState(false);
  const ai = settings.ai;
  function set(patch: Partial<typeof ai>) { onChange({ ...settings, ai: { ...ai, ...patch } }); }

  async function save() {
    setSaving(true);
    try { const u = await patchSettings(projectId, { ai }); onChange(u); toast.success("AI settings saved"); }
    catch { toast.error("Failed to save"); }
    setSaving(false);
  }

  return (
    <div>
      <Card>
        <SectionTitle>AI Feature Toggles</SectionTitle>
        <Toggle value={ai.enableSuggestions} onChange={v => set({ enableSuggestions: v })} label="Enable AI test suggestions" />
        <Toggle value={ai.enableAutoHeal} onChange={v => set({ enableAutoHeal: v })} label="Enable Auto-Heal for broken selectors" />
        <Toggle value={ai.enableTestGeneration} onChange={v => set({ enableTestGeneration: v })} label="Enable AI test generation from scans" />
        <Toggle value={ai.enableRequirementRewrite} onChange={v => set({ enableRequirementRewrite: v })} label="Enable AI requirement rewriting" />
      </Card>

      <Card>
        <SectionTitle>Auto-Apply Policy</SectionTitle>
        <p style={{ fontSize: 13, color: TXT2, marginBottom: 12 }}>Controls when AI changes are applied without human review.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {([
            { value: "manual", label: "Manual Review", desc: "All AI suggestions require approval before applying" },
            { value: "low-risk", label: "Low-Risk Auto", desc: "Auto-apply only when confidence > threshold and change is minor" },
            { value: "aggressive", label: "Aggressive Auto", desc: "Apply all suggestions meeting confidence threshold automatically" },
          ] as const).map(opt => (
            <div key={opt.value} onClick={() => set({ autoApplyPolicy: opt.value })}
              style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 14px", borderRadius: theme.radii.md, border: `2px solid ${ai.autoApplyPolicy === opt.value ? P : BDR}`, background: ai.autoApplyPolicy === opt.value ? `${P}10` : "transparent", cursor: "pointer" }}>
              <span style={{ width: 16, height: 16, marginTop: 1, borderRadius: "50%", border: `2px solid ${ai.autoApplyPolicy === opt.value ? P : BDR}`, background: ai.autoApplyPolicy === opt.value ? P : "transparent", flexShrink: 0, display: "block" }} />
              <div>
                <div style={{ fontWeight: 600, color: ai.autoApplyPolicy === opt.value ? P : TXT, fontSize: 13 }}>{opt.label}</div>
                <div style={{ fontSize: 11, color: TXT2 }}>{opt.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16 }}>
          <Field label="Auto-Heal Confidence Threshold" hint={`Only auto-heal when AI confidence ≥ ${ai.healConfidenceThreshold}%`}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input type="range" min={50} max={99} value={ai.healConfidenceThreshold} onChange={e => set({ healConfidenceThreshold: Number(e.target.value) })} style={{ flex: 1 }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: P, minWidth: 36 }}>{ai.healConfidenceThreshold}%</span>
            </div>
          </Field>
        </div>
      </Card>

      <Card>
        <SectionTitle>Data Usage & Privacy</SectionTitle>
        <div style={{ padding: "10px 14px", background: "#FFF9C4", border: "1px solid #F9A825", borderRadius: theme.radii.md, fontSize: 13, color: "#5D4037", marginBottom: 12 }}>
          Data usage settings affect how AI models improve over time. Review your privacy policy before enabling training data sharing.
        </div>
        <Toggle value={ai.dataUsageConsent} onChange={v => set({ dataUsageConsent: v })} label="Allow anonymized usage data for AI improvement" />
        <Toggle value={ai.includeInTraining} onChange={v => set({ includeInTraining: v })} label="Include project tests in AI training dataset" />
      </Card>

      <div style={{ display: "flex", justifyContent: "flex-end" }}><SaveButton onClick={save} saving={saving} /></div>
    </div>
  );
}

// ─── Section: Integrations ────────────────────────────────────────────────────

function IntegrationsSection({ settings, projectId, onChange }: { settings: ProjectSettings; projectId: string; onChange: (s: ProjectSettings) => void }) {
  const { P, BDR, BG, TXT, TXT2 } = useColors();
  const inputStyle = makeInputStyle(TXT, BDR);
  const [saving, setSaving] = useState(false);
  const intg = settings.integrations;
  const [whName, setWhName] = useState(""); const [whUrl, setWhUrl] = useState("");

  function setJira(p: any) { onChange({ ...settings, integrations: { ...intg, jira: { ...intg.jira, ...p } } }); }
  function setGH(p: any) { onChange({ ...settings, integrations: { ...intg, github: { ...intg.github, ...p } } }); }
  function setSlack(p: any) { onChange({ ...settings, integrations: { ...intg, slack: { ...intg.slack, ...p } } }); }
  function setTeams(p: any) { onChange({ ...settings, integrations: { ...intg, teams: { ...intg.teams, ...p } } }); }

  async function save() {
    setSaving(true);
    try { const u = await patchSettings(projectId, { integrations: intg }); onChange(u); toast.success("Integration settings saved"); }
    catch { toast.error("Failed to save"); }
    setSaving(false);
  }

  async function handleAddWebhook() {
    if (!whUrl) return;
    try {
      const wh = await addWebhook(projectId, { name: whName || "Webhook", url: whUrl, events: [] });
      onChange({ ...settings, integrations: { ...intg, webhooks: [...intg.webhooks, wh] } });
      setWhName(""); setWhUrl(""); toast.success("Webhook added");
    } catch { toast.error("Failed to add webhook"); }
  }

  async function handleDeleteWebhook(id: string) {
    try {
      await deleteWebhook(projectId, id);
      onChange({ ...settings, integrations: { ...intg, webhooks: intg.webhooks.filter(w => w.id !== id) } });
      toast.success("Webhook deleted");
    } catch { toast.error("Failed to delete"); }
  }

  function IntegCard({ title, enabled, onToggle, children }: { title: string; enabled: boolean; onToggle: (v: boolean) => void; children: React.ReactNode }) {
    return (
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: enabled ? 16 : 0 }}>
          <strong style={{ fontSize: 14, color: TXT }}>{title}</strong>
          <Toggle value={enabled} onChange={onToggle} label="" />
        </div>
        {enabled && children}
      </Card>
    );
  }

  return (
    <div>
      <IntegCard title="Jira" enabled={intg.jira.enabled} onToggle={v => setJira({ enabled: v })}>
        <Field label="Jira Host"><Input value={intg.jira.host} onChange={v => setJira({ host: v })} placeholder="https://company.atlassian.net" /></Field>
        <Field label="Project Key"><Input value={intg.jira.projectKey} onChange={v => setJira({ projectKey: v })} placeholder="PROJ" /></Field>
        <Field label="API Token"><Input value={intg.jira.token} onChange={v => setJira({ token: v })} type="password" placeholder="Token" /></Field>
        <Toggle value={intg.jira.createIssueOnFailure} onChange={v => setJira({ createIssueOnFailure: v })} label="Auto-create Jira issues on test failure" />
        <Toggle value={intg.jira.linkRTMRequirements} onChange={v => setJira({ linkRTMRequirements: v })} label="Link RTM requirements to Jira stories" />
      </IntegCard>

      <IntegCard title="GitHub" enabled={intg.github.enabled} onToggle={v => setGH({ enabled: v })}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Owner"><Input value={intg.github.owner} onChange={v => setGH({ owner: v })} placeholder="org-name" /></Field>
          <Field label="Repository"><Input value={intg.github.repo} onChange={v => setGH({ repo: v })} placeholder="repo-name" /></Field>
        </div>
        <Field label="Personal Access Token"><Input value={intg.github.token} onChange={v => setGH({ token: v })} type="password" placeholder="ghp_..." /></Field>
        <Toggle value={intg.github.createPROnGenerate} onChange={v => setGH({ createPROnGenerate: v })} label="Create PR when tests are generated" />
        <Toggle value={intg.github.statusChecks} onChange={v => setGH({ statusChecks: v })} label="Report test results as GitHub status checks" />
      </IntegCard>

      <IntegCard title="Slack" enabled={intg.slack.enabled} onToggle={v => setSlack({ enabled: v })}>
        <Field label="Webhook URL"><Input value={intg.slack.webhookUrl} onChange={v => setSlack({ webhookUrl: v })} placeholder="https://hooks.slack.com/services/..." /></Field>
        <Field label="Default Channel"><Input value={intg.slack.channel} onChange={v => setSlack({ channel: v })} placeholder="#qa-alerts" /></Field>
        <Toggle value={intg.slack.notifyOnFailure} onChange={v => setSlack({ notifyOnFailure: v })} label="Notify on test failures" />
        <Toggle value={intg.slack.notifyOnHeal} onChange={v => setSlack({ notifyOnHeal: v })} label="Notify on auto-heals" />
      </IntegCard>

      <IntegCard title="Microsoft Teams" enabled={intg.teams.enabled} onToggle={v => setTeams({ enabled: v })}>
        <Field label="Incoming Webhook URL"><Input value={intg.teams.webhookUrl} onChange={v => setTeams({ webhookUrl: v })} placeholder="https://company.webhook.office.com/..." /></Field>
      </IntegCard>

      <Card>
        <SectionTitle>Custom Webhooks</SectionTitle>
        {intg.webhooks.map(wh => (
          <div key={wh.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${BDR}` }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: TXT }}>{wh.name}</div>
              <div style={{ fontSize: 12, color: TXT2 }}>{wh.url}</div>
            </div>
            <button onClick={() => handleDeleteWebhook(wh.id)} style={{ padding: "4px 10px", border: `1px solid ${"#EF5350"}40`, borderRadius: theme.radii.md, background: "transparent", color: "#EF5350", cursor: "pointer", fontSize: 12 }}>Remove</button>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <input style={{ ...inputStyle, flex: "0 0 140px" }} value={whName} onChange={e => setWhName(e.target.value)} placeholder="Name" />
          <input style={{ ...inputStyle, flex: 1 }} value={whUrl} onChange={e => setWhUrl(e.target.value)} placeholder="https://..." />
          <button onClick={handleAddWebhook} style={{ padding: "8px 14px", background: `${P}18`, color: P, border: `1px solid ${P}40`, borderRadius: theme.radii.md, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}>+ Add</button>
        </div>
      </Card>

      <div style={{ display: "flex", justifyContent: "flex-end" }}><SaveButton onClick={save} saving={saving} /></div>
    </div>
  );
}

// ─── Section: Access Control ──────────────────────────────────────────────────

function AccessSection({ settings, projectId, onChange }: { settings: ProjectSettings; projectId: string; onChange: (s: ProjectSettings) => void }) {
  const { P, BDR, BG, TXT, TXT2 } = useColors();
  const inputStyle = makeInputStyle(TXT, BDR);
  const selectStyle = { ...inputStyle, cursor: "pointer" } as React.CSSProperties;
  const [saving, setSaving] = useState(false);
  const ac = settings.access;
  const [email, setEmail] = useState(""); const [role, setRole] = useState<AccessRole["role"]>("developer");

  async function handleAdd() {
    if (!email) return;
    try {
      const r = await addRole(projectId, { email, role, name: email });
      onChange({ ...settings, access: { ...ac, roles: [...ac.roles, r] } });
      setEmail(""); toast.success("Member added");
    } catch { toast.error("Failed to add member"); }
  }

  async function handleRoleChange(id: string, newRole: AccessRole["role"]) {
    try {
      const updated = await updateRole(projectId, id, { role: newRole });
      onChange({ ...settings, access: { ...ac, roles: ac.roles.map(r => r.id === id ? updated : r) } });
    } catch { toast.error("Failed to update role"); }
  }

  async function handleRemove(id: string) {
    try {
      await deleteRole(projectId, id);
      onChange({ ...settings, access: { ...ac, roles: ac.roles.filter(r => r.id !== id) } });
      toast.success("Member removed");
    } catch { toast.error("Failed to remove"); }
  }

  async function saveGlobal() {
    setSaving(true);
    try { const u = await patchSettings(projectId, { access: { roles: ac.roles, allowSelfAssign: ac.allowSelfAssign, requireApprovalForAI: ac.requireApprovalForAI } }); onChange(u); toast.success("Access settings saved"); }
    catch { toast.error("Failed to save"); }
    setSaving(false);
  }

  return (
    <div>
      <Card>
        <SectionTitle>Team Members</SectionTitle>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input style={{ ...inputStyle, flex: 1 }} value={email} onChange={e => setEmail(e.target.value)} placeholder="colleague@company.com" type="email" />
          <select style={{ ...selectStyle, width: 160 }} value={role} onChange={e => setRole(e.target.value as any)}>
            {(Object.keys(ROLE_LABEL) as AccessRole["role"][]).map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select>
          <button onClick={handleAdd} style={{ padding: "8px 14px", background: P, color: "#fff", border: "none", borderRadius: theme.radii.md, cursor: "pointer", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>+ Invite</button>
        </div>
        {ac.roles.length === 0 && <div style={{ color: TXT2, fontSize: 13, textAlign: "center", padding: "12px 0" }}>No members yet — invite your team above.</div>}
        {ac.roles.map(r => (
          <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${BDR}` }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: TXT }}>{r.name || r.email}</div>
              <div style={{ fontSize: 12, color: TXT2 }}>{r.email} · Added {new Date(r.addedAt).toLocaleDateString()}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, fontWeight: 700, background: `${ROLE_COLOR[r.role]}18`, color: ROLE_COLOR[r.role] }}>{ROLE_LABEL[r.role]}</span>
              <select style={{ ...selectStyle, width: 130, fontSize: 12, padding: "4px 8px" }} value={r.role} onChange={e => handleRoleChange(r.id, e.target.value as any)}>
                {(Object.keys(ROLE_LABEL) as AccessRole["role"][]).map(rl => <option key={rl} value={rl}>{ROLE_LABEL[rl]}</option>)}
              </select>
              <button onClick={() => handleRemove(r.id)} style={{ padding: "4px 10px", border: `1px solid ${"#EF5350"}40`, borderRadius: theme.radii.md, background: "transparent", color: "#EF5350", cursor: "pointer", fontSize: 12 }}>Remove</button>
            </div>
          </div>
        ))}
      </Card>

      <Card>
        <SectionTitle>Governance</SectionTitle>
        <Toggle value={ac.allowSelfAssign} onChange={v => onChange({ ...settings, access: { ...ac, allowSelfAssign: v } })} label="Allow members to assign themselves to this project" />
        <Toggle value={ac.requireApprovalForAI} onChange={v => onChange({ ...settings, access: { ...ac, requireApprovalForAI: v } })} label="Require project-admin approval before AI auto-applies changes" />
      </Card>

      <div style={{ display: "flex", justifyContent: "flex-end" }}><SaveButton onClick={saveGlobal} saving={saving} /></div>
    </div>
  );
}

// ─── Section: Data & Privacy ──────────────────────────────────────────────────

function DataSection({ settings, projectId, onChange }: { settings: ProjectSettings; projectId: string; onChange: (s: ProjectSettings) => void }) {
  const { P, BDR, BG, TXT, TXT2 } = useColors();
  const inputStyle = makeInputStyle(TXT, BDR);
  const [saving, setSaving] = useState(false);
  const d = settings.data;
  const [ruleInput, setRuleInput] = useState("");
  function set(p: Partial<typeof d>) { onChange({ ...settings, data: { ...d, ...p } }); }

  async function save() {
    setSaving(true);
    try { const u = await patchSettings(projectId, { data: d }); onChange(u); toast.success("Data settings saved"); }
    catch { toast.error("Failed to save"); }
    setSaving(false);
  }

  return (
    <div>
      <Card>
        <SectionTitle>Retention Policies</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Test Runs (days)"><NumberInput value={d.runsRetentionDays} onChange={v => set({ runsRetentionDays: v })} min={1} max={3650} /></Field>
          <Field label="Artifacts (days)"><NumberInput value={d.artifactsRetentionDays} onChange={v => set({ artifactsRetentionDays: v })} min={1} max={3650} /></Field>
          <Field label="History (days)"><NumberInput value={d.historyRetentionDays} onChange={v => set({ historyRetentionDays: v })} min={1} max={3650} /></Field>
          <Field label="Timeline (days)"><NumberInput value={d.timelineRetentionDays} onChange={v => set({ timelineRetentionDays: v })} min={1} max={3650} /></Field>
        </div>
        <Toggle value={d.autoDeleteOnRetentionExpiry} onChange={v => set({ autoDeleteOnRetentionExpiry: v })} label="Auto-delete data when retention period expires" />
      </Card>

      <Card>
        <SectionTitle>PII Handling</SectionTitle>
        <Field label="PII Strategy" hint="How personally identifiable information is handled in captured data">
          <Select value={d.piiHandling} onChange={v => set({ piiHandling: v as any })} options={[
            { value: "none", label: "None — capture everything as-is" },
            { value: "redact", label: "Redact — replace PII with [REDACTED]" },
            { value: "hash", label: "Hash — one-way hash PII values" },
          ]} />
        </Field>
        <Field label="Custom Redaction Rules" hint="Regex patterns for sensitive field names, one per line">
          <div style={{ marginBottom: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
            {d.redactionRules.map(r => <Chip key={r} label={r} onRemove={() => set({ redactionRules: d.redactionRules.filter(x => x !== r) })} />)}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input style={{ ...inputStyle, flex: 1 }} value={ruleInput} onChange={e => setRuleInput(e.target.value)} placeholder="password|token|ssn" onKeyDown={e => { if (e.key === "Enter" && ruleInput.trim()) { set({ redactionRules: [...d.redactionRules, ruleInput.trim()] }); setRuleInput(""); } }} />
            <button onClick={() => { if (ruleInput.trim()) { set({ redactionRules: [...d.redactionRules, ruleInput.trim()] }); setRuleInput(""); } }}
              style={{ padding: "8px 14px", background: `${P}18`, color: P, border: `1px solid ${P}40`, borderRadius: theme.radii.md, cursor: "pointer", fontSize: 13 }}>Add</button>
          </div>
        </Field>
      </Card>

      <div style={{ display: "flex", justifyContent: "flex-end" }}><SaveButton onClick={save} saving={saving} /></div>
    </div>
  );
}

// ─── Section: Notifications ───────────────────────────────────────────────────

function NotificationsSection({ settings, projectId, onChange }: { settings: ProjectSettings; projectId: string; onChange: (s: ProjectSettings) => void }) {
  const { P, BDR, BG, TXT, TXT2 } = useColors();
  const [saving, setSaving] = useState(false);
  const n = settings.notifications;
  function set(p: Partial<typeof n>) { onChange({ ...settings, notifications: { ...n, ...p } }); }
  function updateRule(id: string, patch: any) {
    set({ rules: n.rules.map(r => r.id === id ? { ...r, ...patch } : r) });
  }

  async function save() {
    setSaving(true);
    try { const u = await patchSettings(projectId, { notifications: n }); onChange(u); toast.success("Notification settings saved"); }
    catch { toast.error("Failed to save"); }
    setSaving(false);
  }

  const CHANNELS = ["email", "slack", "teams", "webhook"] as const;

  return (
    <div>
      <Card>
        <SectionTitle>Global Settings</SectionTitle>
        <Field label="Global Notification Email" hint="Used as a fallback for email channel">
          <Input value={n.globalEmail} onChange={v => set({ globalEmail: v })} placeholder="qa@company.com" type="email" />
        </Field>
        <Toggle value={n.digestEnabled} onChange={v => set({ digestEnabled: v })} label="Enable weekly digest email" />
        {n.digestEnabled && (
          <Field label="Digest Schedule (cron)" hint="e.g. 0 9 * * 1 = every Monday at 9am">
            <Input value={n.digestCron} onChange={v => set({ digestCron: v })} placeholder="0 9 * * 1" />
          </Field>
        )}
      </Card>

      <Card>
        <SectionTitle>Notification Rules</SectionTitle>
        {n.rules.map(rule => (
          <div key={rule.id} style={{ padding: "12px 0", borderBottom: `1px solid ${BDR}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Select value={rule.eventType} onChange={v => updateRule(rule.id, { eventType: v })}
                options={NOTIFICATION_EVENTS} />
              <Toggle value={rule.enabled} onChange={v => updateRule(rule.id, { enabled: v })} label="Active" />
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <Select value={rule.condition} onChange={v => updateRule(rule.id, { condition: v })} options={[
                { value: "always", label: "Always" },
                { value: "on-failure", label: "On Failure" },
                { value: "on-threshold", label: "On Threshold" },
              ]} />
              <div style={{ display: "flex", gap: 6 }}>
                {CHANNELS.map(ch => {
                  const active = rule.channels.includes(ch);
                  return (
                    <button key={ch} onClick={() => updateRule(rule.id, { channels: active ? rule.channels.filter(c => c !== ch) : [...rule.channels, ch] })}
                      style={{ padding: "4px 10px", borderRadius: theme.radii.sm, border: `1px solid ${active ? P : BDR}`, background: active ? `${P}18` : "transparent", color: active ? P : TXT2, cursor: "pointer", fontSize: 12, fontWeight: active ? 600 : 400 }}>
                      {ch}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </Card>

      <div style={{ display: "flex", justifyContent: "flex-end" }}><SaveButton onClick={save} saving={saving} /></div>
    </div>
  );
}

// ─── Section: Appearance ──────────────────────────────────────────────────────

function AppearanceSection({ settings, projectId, onChange }: { settings: ProjectSettings; projectId: string; onChange: (s: ProjectSettings) => void }) {
  const { P, BDR, BG, TXT, TXT2 } = useColors();
  const [saving, setSaving] = useState(false);
  const ap = settings.appearance;
  function set(p: Partial<typeof ap>) { onChange({ ...settings, appearance: { ...ap, ...p } }); }

  async function save() {
    setSaving(true);
    try { const u = await patchSettings(projectId, { appearance: ap }); onChange(u); toast.success("Appearance settings saved"); }
    catch { toast.error("Failed to save"); }
    setSaving(false);
  }

  const TABS = [
    { value: "overview", label: "Overview" }, { value: "flows", label: "Flows" },
    { value: "rtm", label: "RTM" }, { value: "coverage", label: "Coverage" },
    { value: "tests", label: "Tests" }, { value: "history", label: "History" },
  ];

  return (
    <div>
      <Card>
        <SectionTitle>Theme</SectionTitle>
        <div style={{ display: "flex", gap: 12 }}>
          {(["auto", "light", "dark"] as const).map(t => (
            <div key={t} onClick={() => set({ theme: t })}
              style={{ flex: 1, padding: "14px", borderRadius: theme.radii.md, border: `2px solid ${ap.theme === t ? P : BDR}`, background: t === "dark" ? "#1A1A1A" : t === "light" ? "#fff" : `linear-gradient(135deg, #fff 50%, #1A1A1A 50%)`, cursor: "pointer", textAlign: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: ap.theme === t ? P : TXT, textTransform: "capitalize" }}>{t === "auto" ? "System" : t}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>Layout</SectionTitle>
        <Field label="Density">
          <div style={{ display: "flex", gap: 10 }}>
            {(["comfortable", "compact", "spacious"] as const).map(d => (
              <button key={d} onClick={() => set({ density: d })}
                style={{ padding: "6px 14px", borderRadius: theme.radii.md, border: `1px solid ${ap.density === d ? P : BDR}`, background: ap.density === d ? `${P}18` : "transparent", color: ap.density === d ? P : TXT2, cursor: "pointer", fontSize: 13, fontWeight: ap.density === d ? 600 : 400, textTransform: "capitalize" }}>
                {d}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Default Landing Tab" hint="Tab shown when opening a project">
          <Select value={ap.defaultLandingTab} onChange={v => set({ defaultLandingTab: v })} options={TABS} />
        </Field>
        <Toggle value={ap.showMetricsOnSidebar} onChange={v => set({ showMetricsOnSidebar: v })} label="Show live metrics on project sidebar" />
      </Card>

      <Card>
        <SectionTitle>Accent Color</SectionTitle>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {["#7B2FF7", "#2196F3", "#00897B", "#F4511E", "#E91E63", "#FF9800"].map(c => (
            <div key={c} onClick={() => set({ accentColor: c })}
              style={{ width: 28, height: 28, borderRadius: "50%", background: c, cursor: "pointer", border: `3px solid ${ap.accentColor === c ? "#333" : "transparent"}`, transition: "border 0.15s" }} />
          ))}
          <input type="color" value={ap.accentColor} onChange={e => set({ accentColor: e.target.value })}
            style={{ width: 28, height: 28, border: "none", padding: 0, cursor: "pointer", borderRadius: "50%", background: "none" }} title="Custom color" />
        </div>
      </Card>

      <div style={{ display: "flex", justifyContent: "flex-end" }}><SaveButton onClick={save} saving={saving} /></div>
    </div>
  );
}

// ─── Danger Zone ──────────────────────────────────────────────────────────────

function DangerZone({ projectId }: { projectId: string }) {
  const { TXT, TXT2 } = useColors();
  const navigate = useNavigate();

  async function handleDelete() {
    if (!confirm("Permanently delete this project and all its data? This cannot be undone.")) return;
    try {
      await fetch(`http://localhost:3000/projects/${projectId}`, { method: "DELETE" });
      navigate("/projects");
    } catch { toast.error("Failed to delete project"); }
  }

  return (
    <Card style={{ border: `1px solid ${"#EF5350"}40` }}>
      <SectionTitle>Danger Zone</SectionTitle>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: TXT, marginBottom: 2 }}>Delete Project</div>
          <div style={{ fontSize: 12, color: TXT2 }}>Permanently remove this project, all its tests, history, and settings.</div>
        </div>
        <button onClick={handleDelete}
          style={{ padding: "8px 18px", background: "#EF5350", color: "#fff", border: "none", borderRadius: theme.radii.md, cursor: "pointer", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap" }}>
          Delete Project
        </button>
      </div>
    </Card>
  );
}

// ─── Main Settings component ──────────────────────────────────────────────────

interface SettingsProps {
  project: any;
  navigate: (path: string) => void;
}

export default function Settings({ project }: SettingsProps) {
  const { P, BDR, BG, TXT, TXT2 } = useColors();
  const [active, setActive] = useState<SettingsSection>("general");
  const [settings, setSettings] = useState<ProjectSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchSettings(project.id)
      .then(s => {
        if (!s.general.name) s.general.name = project.name ?? "";
        setSettings(s);
      })
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false));
  }, [project.id]);

  const renderSection = useCallback(() => {
    if (!settings) return null;
    const props = { settings, projectId: project.id, onChange: setSettings };
    switch (active) {
      case "general":       return <GeneralSection       {...props} />;
      case "environments":  return <EnvironmentsSection  {...props} />;
      case "scanning":      return <ScanningSection      {...props} />;
      case "testing":       return <TestingSection       {...props} />;
      case "ai":            return <AISection            {...props} />;
      case "integrations":  return <IntegrationsSection  {...props} />;
      case "access":        return <AccessSection        {...props} />;
      case "data":          return <DataSection          {...props} />;
      case "notifications": return <NotificationsSection {...props} />;
      case "appearance":    return <AppearanceSection    {...props} />;
      default:              return null;
    }
  }, [active, settings, project.id]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Main row: nav + content */}
      <div style={{ display: "flex", gap: 24, minHeight: 500 }}>
        {/* Left nav */}
        <nav style={{ width: 200, flexShrink: 0 }}>
          <div style={{ background: BG, border: `1px solid ${BDR}`, borderRadius: theme.radii.lg, overflow: "hidden" }}>
            {NAV_ITEMS.map(item => (
              <button key={item.id} onClick={() => setActive(item.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%",
                  padding: "11px 14px", border: "none", background: active === item.id ? `${P}12` : "transparent",
                  borderLeft: `3px solid ${active === item.id ? P : "transparent"}`,
                  color: active === item.id ? P : TXT, cursor: "pointer", fontSize: 13,
                  fontWeight: active === item.id ? 600 : 400, textAlign: "left",
                  transition: "background 0.15s",
                }}>
                <span style={{ fontSize: 14 }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 60, color: TXT2, fontSize: 14 }}>Loading settings…</div>
          ) : (
            renderSection()
          )}
        </div>
      </div>

      {/* Danger Zone — full width below both columns */}
      <DangerZone projectId={project.id} />
    </div>
  );
}
