import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFramework } from "../context/FrameworkContext";
import { useBuilderState } from "../builder/useBuilderState";
import { useBlueprint } from "../blueprint/useBlueprint";
import { generateFramework, getDownloadUrl, registerFramework, type RegisteredFramework } from "../api/framework";
import { DARK_TOKENS, LIGHT_TOKENS, CATEGORY_META } from "../nodes/types";
import { AISafeModeToggle }    from "../ai/AISafeModeToggle";
import { AIExplainPanel }      from "../ai/AIExplainPanel";
import { AIDocsPreviewPanel }  from "../ai/AIDocsPreviewPanel";

// ─── Dark mode ────────────────────────────────────────────────────────────────

function useDarkMode() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  useEffect(() => {
    const obs = new MutationObserver(() => setDark(document.documentElement.classList.contains("dark")));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type GenerateStatus = "idle" | "generating" | "done" | "error";

interface GenerateResult {
  jobId: string;
  projectName: string;
  fileCount: number;
  downloadUrl: string;
  projectStructure: string[];
  aiDocs:    boolean;
  aiHeaders: boolean;
}

// ─── Framework colour maps ────────────────────────────────────────────────────

const FW_COLORS:   Record<string, string> = { selenium: "#E25C1D", playwright: "#7B5FFF", cypress: "#17B26A", webdriverio: "#E8A000", appium: "#2563EB" };
const LANG_COLORS: Record<string, string> = { java: "#E76F00", typescript: "#3178C6", javascript: "#C4A000", python: "#3B82F6", csharp: "#9B59B6" };

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FrameworkReview() {
  const navigate = useNavigate();
  const dark     = useDarkMode();
  const S        = dark ? DARK_TOKENS : LIGHT_TOKENS;

  const { selection, result } = useFramework();
  const { architecture, components } = useBuilderState();
  const blueprint = useBlueprint();

  // Finalize config overrides (editable on this page)
  const [projectName,  setProjectName]  = useState<string>("");
  const [baseUrl,      setBaseUrl]      = useState<string>("https://example.com");
  const [browser,      setBrowser]      = useState<string>("chrome");
  const [headless,     setHeadless]     = useState<boolean>(false);
  // Distributed overrides (only shown when relevant nodes are placed)
  const [dockerImage,  setDockerImage]  = useState<string>("");
  const [dockerTag,    setDockerTag]    = useState<string>("latest");
  const [gridHubUrl,   setGridHubUrl]   = useState<string>("http://selenium-hub:4444");
  const [k8sNamespace, setK8sNamespace] = useState<string>("qa-automation");

  const [status,  setStatus]  = useState<GenerateStatus>("idle");
  const [result2, setResult2] = useState<GenerateResult | null>(null);
  const [error,   setError]   = useState<string | null>(null);

  // Framework Registry integration
  const [registering,        setRegistering]        = useState(false);
  const [registeredFramework, setRegisteredFramework] = useState<RegisteredFramework | null>(null);
  const [enableRTM,          setEnableRTM]          = useState(false);

  // AI generation config
  const [aiEnabled,  setAiEnabled]  = useState<boolean>(true);
  const [aiSafeMode, setAiSafeMode] = useState<boolean>(true);

  // Sample tests config (Phase 7)
  const [sampleUI,     setSampleUI]     = useState<boolean>(false);
  const [sampleAPI,    setSampleAPI]    = useState<boolean>(false);
  const [sampleHybrid, setSampleHybrid] = useState<boolean>(false);

  useEffect(() => {
    if (!result) navigate("/framework/start", { replace: true });
  }, [result, navigate]);

  useEffect(() => {
    if (!blueprint) return;
    setProjectName(blueprint.metadata.name);
    // Pre-populate distributed fields from placed node configs
    const distNodes = components.filter(c => c.category === "distributed");
    const dockerNode = distNodes.find(n =>
      n.nodeId.includes("docker") && !n.nodeId.includes("compose")
    );
    const composeNode = distNodes.find(n => n.nodeId === "distributed-docker-compose-grid");
    const k8sNode     = distNodes.find(n => n.nodeId === "distributed-k8s-grid");
    const gridNode    = distNodes.find(n => n.nodeId === "selenium-java-grid4");

    const anyDocker = dockerNode ?? composeNode;
    if (anyDocker?.config?.imageName) setDockerImage(anyDocker.config.imageName as string);
    if (anyDocker?.config?.imageTag)  setDockerTag(anyDocker.config.imageTag as string);
    if (composeNode?.config?.gridHubUrl || gridNode?.config?.hubUrl) {
      setGridHubUrl((composeNode?.config?.gridHubUrl ?? gridNode?.config?.hubUrl) as string);
    }
    if (k8sNode?.config?.namespace) setK8sNamespace(k8sNode.config.namespace as string);
  }, [blueprint, components]);

  if (!blueprint || !selection) return null;

  // Distributed node detection for conditional UI
  const distNodes     = components.filter(c => c.category === "distributed");
  const hasDocker     = distNodes.some(n => n.nodeId.includes("docker"));
  const hasGrid       = distNodes.some(n => n.nodeId.includes("grid") || n.nodeId === "selenium-java-grid4");
  const hasK8s        = distNodes.some(n => n.nodeId.includes("k8s"));
  const hasDistributed = hasDocker || hasGrid || hasK8s;

  const fwColor   = FW_COLORS[selection.framework]  ?? S.accent;
  const langColor = LANG_COLORS[selection.language] ?? S.accent;

  const groupedNodes: Record<string, typeof components> = {};
  if (architecture) {
    groupedNodes["architecture"] = [architecture];
  }
  for (const c of components) {
    if (!groupedNodes[c.category]) groupedNodes[c.category] = [];
    groupedNodes[c.category].push(c);
  }

  const handleGenerate = async () => {
    setStatus("generating");
    setError(null);
    try {
      const payload = {
        ...blueprint,
        metadata: { ...blueprint.metadata, name: projectName },
        executionConfig: {
          ...blueprint.executionConfig,
          baseUrl,
          browser,
          headless,
          // distributed overrides fed into placeholder engine via executionConfig
          dockerImageName: dockerImage || projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
          dockerImageTag:  dockerTag,
          gridHubUrl,
          k8sNamespace,
        },
        ai: {
          enabled:  aiEnabled,
          docs:     aiEnabled,
          headers:  aiEnabled,
          safeMode: aiSafeMode,
        },
        samples: {
          uiTests:     sampleUI,
          apiTests:    sampleAPI,
          hybridFlows: sampleHybrid,
        },
      };
      const res = await generateFramework(payload);
      if (!res.success) {
        setStatus("error");
        setError(res.validation?.summary ?? "Generation failed.");
        return;
      }
      setResult2(res as GenerateResult);
      setStatus("done");
    } catch (err: any) {
      setStatus("error");
      setError(err?.message ?? "Unexpected error during generation.");
    }
  };

  // Extract projectId from URL search params (passed when navigating from a project)
  const projectId = new URLSearchParams(window.location.search).get("projectId") ?? "";

  const handleRegister = async () => {
    if (!result2 || !projectId) return;
    setRegistering(true);
    try {
      const fw = await registerFramework({
        projectId,
        name:          result2.projectName,
        frameworkType: selection!.framework,
        language:      selection!.language,
        blueprintId:   result2.jobId,
        isRTMEnabled:  enableRTM,
      });
      setRegisteredFramework(fw);
    } catch {
      // silently ignored — non-blocking
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100vh", overflow: "hidden",
      background: S.bg,
    }}>

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "0 20px", height: 56, flexShrink: 0,
        background: S.card, borderBottom: `1px solid ${S.border}`, zIndex: 10,
      }}>
        <button
          onClick={() => navigate("/framework/builder")}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "none", border: "none", cursor: "pointer",
            color: S.textMuted, fontSize: 13, fontWeight: 500, padding: 0,
          }}
        >
          ← Builder
        </button>

        <div style={{ width: 1, height: 18, background: S.border }} />

        <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: `${fwColor}18`, color: fwColor, border: `1px solid ${fwColor}30`, textTransform: "capitalize" }}>
          {selection.framework}
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: `${langColor}18`, color: langColor, border: `1px solid ${langColor}30`, textTransform: "capitalize" }}>
          {selection.language}
        </span>

        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 10, background: `${S.accent}14`, color: S.accent, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Step 3 of 5
        </span>

        <div style={{ flex: 1 }} />

        <AISafeModeToggle
          enabled={aiEnabled}
          safeMode={aiSafeMode}
          onToggleEnabled={setAiEnabled}
          onToggleSafeMode={setAiSafeMode}
        />

        <button
          onClick={handleGenerate}
          disabled={status === "generating" || status === "done"}
          style={{
            fontSize: 13, fontWeight: 700, padding: "7px 20px", borderRadius: 8,
            background: status === "done" ? "#10B981" : status === "generating" ? S.border : S.accent,
            color: status === "generating" ? S.textMuted : "#fff",
            border: "none",
            cursor: (status === "generating" || status === "done") ? "not-allowed" : "pointer",
            transition: "all 0.15s",
          }}
        >
          {status === "generating" ? "Generating…" : status === "done" ? "✓ Generated" : "⚡ Generate Framework"}
        </button>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>

          {/* ── AI Explain ────────────────────────────────────────────── */}
          {aiEnabled && (
            <AIExplainPanel blueprint={blueprint as Record<string, any>} />
          )}

          {/* ── Section: Finalize settings ─────────────────────────────── */}
          <Section title="Finalize Settings" S={S}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Project Name" S={S}>
                <input
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  style={inputStyle(S)}
                />
              </Field>
              <Field label="Base URL" S={S}>
                <input
                  value={baseUrl}
                  onChange={e => setBaseUrl(e.target.value)}
                  style={inputStyle(S)}
                  placeholder="https://example.com"
                />
              </Field>
              <Field label="Browser" S={S}>
                <select value={browser} onChange={e => setBrowser(e.target.value)} style={inputStyle(S)}>
                  <option value="chrome">Chrome</option>
                  <option value="firefox">Firefox</option>
                  <option value="edge">Edge</option>
                  <option value="safari">Safari</option>
                </select>
              </Field>
              <Field label="Run Headless" S={S}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={headless}
                    onChange={e => setHeadless(e.target.checked)}
                    style={{ width: 14, height: 14, accentColor: S.accent, cursor: "pointer" }}
                  />
                  <span style={{ fontSize: 12, color: S.textMuted }}>Headless mode</span>
                </label>
              </Field>
            </div>
          </Section>

          {/* ── Section: Distributed config (conditional) ─────────────── */}
          {hasDistributed && (
            <Section title="Distributed Configuration" S={S}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {hasDocker && (
                  <>
                    <Field label="Docker Image Name" S={S}>
                      <input
                        value={dockerImage}
                        onChange={e => setDockerImage(e.target.value)}
                        style={inputStyle(S)}
                        placeholder="qlitz-tests"
                      />
                    </Field>
                    <Field label="Image Tag" S={S}>
                      <input
                        value={dockerTag}
                        onChange={e => setDockerTag(e.target.value)}
                        style={inputStyle(S)}
                        placeholder="latest"
                      />
                    </Field>
                  </>
                )}
                {hasGrid && (
                  <Field label="Grid Hub URL" S={S}>
                    <input
                      value={gridHubUrl}
                      onChange={e => setGridHubUrl(e.target.value)}
                      style={inputStyle(S)}
                      placeholder="http://selenium-hub:4444"
                    />
                  </Field>
                )}
                {hasK8s && (
                  <Field label="Kubernetes Namespace" S={S}>
                    <input
                      value={k8sNamespace}
                      onChange={e => setK8sNamespace(e.target.value)}
                      style={inputStyle(S)}
                      placeholder="qa-automation"
                    />
                  </Field>
                )}
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: S.textDim }}>
                {distNodes.map(n => (
                  <span key={n.instanceId} style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    marginRight: 8, padding: "2px 8px", borderRadius: 4,
                    background: "#6366F114", border: "1px solid #6366F130",
                    color: "#6366F1", fontWeight: 600,
                  }}>
                    ◈ {n.nodeLabel}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* ── Section: Sample tests ─────────────────────────────────── */}
          <Section title="Seed Sample Tests" S={S}>
            <p style={{ fontSize: 11, color: S.textMuted, marginBottom: 14, lineHeight: 1.6 }}>
              Optionally seed the generated project with working sample tests.
              These are ready-to-run examples that demonstrate the framework patterns.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { id: "ui",     label: "Sample UI Tests",     desc: "Login, navigation, and form interaction flows", value: sampleUI,     set: setSampleUI },
                { id: "api",    label: "Sample API Tests",    desc: "GET / POST endpoint tests using REST clients",   value: sampleAPI,    set: setSampleAPI },
                { id: "hybrid", label: "Sample Hybrid Flows", desc: "API setup → UI verification end-to-end flows",  value: sampleHybrid, set: setSampleHybrid },
              ].map(({ id, label, desc, value, set }) => (
                <label key={id} style={{
                  display: "flex", alignItems: "flex-start", gap: 12,
                  padding: "10px 14px", borderRadius: 8,
                  background: value ? `${S.accent}0e` : S.bg,
                  border: `1px solid ${value ? S.accent + "40" : S.border}`,
                  cursor: "pointer", transition: "all 0.15s",
                }}>
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={e => set(e.target.checked)}
                    style={{ marginTop: 2, accentColor: S.accent, cursor: "pointer", flexShrink: 0 }}
                  />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: S.text }}>{label}</div>
                    <div style={{ fontSize: 11, color: S.textMuted, marginTop: 2 }}>{desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </Section>

          {/* ── Section: Architecture summary ──────────────────────────── */}
          <Section title="Architecture Summary" S={S}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {Object.entries(groupedNodes).map(([cat, nodes]) => {
                const meta  = CATEGORY_META[cat];
                const color = meta?.color ?? "#6B7280";
                return (
                  <div key={cat} style={{
                    display: "flex", alignItems: "flex-start", gap: 12,
                    padding: "12px 14px", borderRadius: 10,
                    background: S.bg, border: `1px solid ${S.border}`,
                  }}>
                    <div style={{ width: 3, alignSelf: "stretch", borderRadius: 3, background: color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                        {meta?.label ?? cat}
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {nodes.map(n => (
                          <span key={n.instanceId} style={{
                            fontSize: 12, fontWeight: 600, color: S.text,
                            padding: "3px 10px", borderRadius: 6,
                            background: `${color}14`, border: `1px solid ${color}28`,
                          }}>
                            {n.nodeLabel}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* ── Section: Error / success ───────────────────────────────── */}
          {status === "error" && error && (
            <div style={{
              padding: "14px 18px", borderRadius: 10,
              background: "#EF444412", border: "1px solid #EF444440",
              fontSize: 13, color: "#EF4444",
            }}>
              ⚠ {error}
            </div>
          )}

          {/* ── AI Docs Preview ────────────────────────────────────────── */}
          <AIDocsPreviewPanel jobId={result2?.jobId ?? null} aiEnabled={aiEnabled} />

          {status === "done" && result2 && (
            <Section title="Generated Framework" S={S}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Sample tests indicator badges */}
              {(result2.samples.uiTests.length > 0 || result2.samples.apiTests.length > 0 || result2.samples.hybridTests.length > 0) && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {result2.samples.uiTests.length > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 12, background: "#10B98120", color: "#10B981", border: "1px solid #10B98130" }}>
                      ✓ {result2.samples.uiTests.length} UI sample{result2.samples.uiTests.length > 1 ? "s" : ""}
                    </span>
                  )}
                  {result2.samples.apiTests.length > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 12, background: "#F59E0B20", color: "#F59E0B", border: "1px solid #F59E0B30" }}>
                      ✓ {result2.samples.apiTests.length} API sample{result2.samples.apiTests.length > 1 ? "s" : ""}
                    </span>
                  )}
                  {result2.samples.hybridTests.length > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 12, background: "#EC489920", color: "#EC4899", border: "1px solid #EC489930" }}>
                      ✓ {result2.samples.hybridTests.length} hybrid sample{result2.samples.hybridTests.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              )}

              {/* AI docs/headers indicator badges */}
              {(result2.aiDocs || result2.aiHeaders) && (
                <div style={{ display: "flex", gap: 8 }}>
                  {result2.aiHeaders && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 12, background: "#8B5CF620", color: "#8B5CF6", border: "1px solid #8B5CF630" }}>
                      ✦ AI headers injected
                    </span>
                  )}
                  {result2.aiDocs && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 12, background: "#0EA5E920", color: "#0EA5E9", border: "1px solid #0EA5E930" }}>
                      ✦ AI docs generated
                    </span>
                  )}
                </div>
              )}
                {/* Stats row */}
                <div style={{ display: "flex", gap: 16 }}>
                  {[
                    { label: "Project",    value: result2.projectName },
                    { label: "Files",      value: `${result2.fileCount} files` },
                    { label: "Job ID",     value: result2.jobId.split("-")[0] + "…" },
                  ].map(({ label, value }) => (
                    <div key={label} style={{
                      flex: 1, padding: "12px 16px", borderRadius: 10,
                      background: `${S.accent}10`, border: `1px solid ${S.accent}20`,
                      textAlign: "center",
                    }}>
                      <div style={{ fontSize: 10, color: S.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: S.text, marginTop: 4 }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Download button */}
                <a
                  href={getDownloadUrl(result2.jobId)}
                  download={`${result2.projectName}.zip`}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    padding: "12px 24px", borderRadius: 10,
                    background: "#10B981", color: "#fff",
                    fontWeight: 700, fontSize: 14, textDecoration: "none",
                    transition: "opacity 0.15s",
                  }}
                >
                  ↓ Download {result2.projectName}.zip
                </a>

                {/* File tree */}
                <div style={{
                  background: S.bg, border: `1px solid ${S.border}`, borderRadius: 10,
                  padding: "12px 16px", maxHeight: 280, overflowY: "auto",
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: S.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                    Project Structure
                  </div>
                  {result2.projectStructure.map(f => (
                    <div key={f} style={{
                      fontSize: 11, color: S.text, fontFamily: "'JetBrains Mono', monospace",
                      padding: "2px 0", borderBottom: `1px solid ${S.border}`,
                    }}>
                      {f}
                    </div>
                  ))}
                </div>

                {/* ── Registry + RTM integration ─────────────────────────── */}
                {projectId && !registeredFramework && (
                  <div style={{
                    padding: "16px 18px", borderRadius: 10,
                    background: `${S.accent}0a`, border: `1px solid ${S.accent}30`,
                    display: "flex", flexDirection: "column", gap: 12,
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: S.text }}>
                      Save to Framework Registry
                    </div>
                    <div style={{ fontSize: 11, color: S.textMuted, lineHeight: 1.6 }}>
                      Register this framework so it can be selected when generating RTM tests.
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={enableRTM}
                        onChange={e => setEnableRTM(e.target.checked)}
                        style={{ accentColor: S.accent, cursor: "pointer" }}
                      />
                      <span style={{ fontSize: 12, color: S.text, fontWeight: 600 }}>
                        Enable RTM integration (use this framework for test generation)
                      </span>
                    </label>
                    <button
                      onClick={handleRegister}
                      disabled={registering}
                      style={{
                        alignSelf: "flex-start", padding: "8px 18px", borderRadius: 8,
                        background: S.accent, color: "#fff", border: "none",
                        fontSize: 12, fontWeight: 700,
                        cursor: registering ? "wait" : "pointer", opacity: registering ? 0.7 : 1,
                      }}
                    >
                      {registering ? "Registering…" : "Register Framework"}
                    </button>
                  </div>
                )}

                {registeredFramework && (
                  <div style={{
                    padding: "14px 18px", borderRadius: 10,
                    background: "#10B98112", border: "1px solid #10B98140",
                    display: "flex", flexDirection: "column", gap: 10,
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#10B981" }}>
                      ✓ Registered: {registeredFramework.name}
                    </div>
                    {registeredFramework.isRTMEnabled && (
                      <div style={{ fontSize: 11, color: S.textMuted }}>
                        RTM integration enabled — open a project and go to{" "}
                        <span style={{ fontWeight: 700, color: S.text }}>RTM › Coverage</span>{" "}
                        to generate tests using this framework.
                      </div>
                    )}
                    <div style={{ fontSize: 10, color: S.textDim, fontFamily: "monospace" }}>
                      ID: {registeredFramework.id}
                    </div>
                  </div>
                )}
              </div>
            </Section>
          )}

        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, children, S }: { title: string; children: React.ReactNode; S: typeof DARK_TOKENS }) {
  return (
    <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 12 }}>
      <div style={{
        padding: "12px 18px 10px",
        borderBottom: `1px solid ${S.border}`,
        fontSize: 10, fontWeight: 800, color: S.textMuted,
        textTransform: "uppercase", letterSpacing: "0.1em",
      }}>
        {title}
      </div>
      <div style={{ padding: "18px 18px" }}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children, S }: { label: string; children: React.ReactNode; S: typeof DARK_TOKENS }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: S.textMuted, marginBottom: 5 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function inputStyle(S: typeof DARK_TOKENS): React.CSSProperties {
  return {
    width: "100%", padding: "7px 10px", borderRadius: 8,
    border: `1px solid ${S.border}`, background: S.bg,
    color: S.text, fontSize: 12, boxSizing: "border-box",
  };
}
