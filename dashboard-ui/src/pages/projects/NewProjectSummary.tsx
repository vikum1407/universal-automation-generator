import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/form/Button";

const API_BASE = "http://localhost:3000";

export default function NewProjectSummary() {
  const navigate = useNavigate();
  const { state } = useLocation() as any;

  if (!state) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <Card className="p-8 text-center">
          <p className="text-neutral-mid dark:text-slate-400">
            Missing project setup data.
          </p>
          <Button className="mt-4" onClick={() => navigate("/projects/new")}>
            Start Over
          </Button>
        </Card>
      </div>
    );
  }

  const {
    type,
    url,
    username,
    password,
    crawlDepth,
    swaggerUrl,
    swaggerFile,
    authToken,
    env
  } = state;

  async function handleCreate() {
    const payload: any = {
      type,
      env
    };

    if (type === "ui") {
      payload.url = url;
      payload.username = username;
      payload.password = password;
      payload.crawlDepth = crawlDepth;
    }

    if (type === "api") {
      payload.swaggerUrl = swaggerUrl;
      payload.authToken = authToken;
    }

    const res = await fetch(`${API_BASE}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    const projectId = data.id;

    navigate(`/projects/${projectId}/initializing`, {
      state
    });
  }

  return (
    <div className="max-w-3xl mx-auto py-12 space-y-10">
      <h1 className="text-h1 font-semibold text-neutral-dark dark:text-neutral-light">
        Review Project Details
      </h1>

      <Card className="p-8 space-y-6">

        <div className="space-y-2">
          <h2 className="text-h2 font-semibold">Project Type</h2>
          <p className="text-neutral-mid dark:text-slate-400 capitalize">
            {type === "ui" ? "UI Automation" : "API Automation"}
          </p>
        </div>

        {type === "ui" && (
          <>
            <div className="space-y-2">
              <h3 className="font-semibold">Website URL</h3>
              <p className="text-neutral-mid dark:text-slate-400">{url}</p>
            </div>

            {username && (
              <div className="space-y-2">
                <h3 className="font-semibold">Login Username</h3>
                <p className="text-neutral-mid dark:text-slate-400">{username}</p>
              </div>
            )}

            {password && (
              <div className="space-y-2">
                <h3 className="font-semibold">Login Password</h3>
                <p className="text-neutral-mid dark:text-slate-400">••••••••</p>
              </div>
            )}

            <div className="space-y-2">
              <h3 className="font-semibold">Crawl Depth</h3>
              <p className="text-neutral-mid dark:text-slate-400">{crawlDepth}</p>
            </div>
          </>
        )}

        {type === "api" && (
          <>
            {swaggerUrl && (
              <div className="space-y-2">
                <h3 className="font-semibold">Swagger URL</h3>
                <p className="text-neutral-mid dark:text-slate-400">{swaggerUrl}</p>
              </div>
            )}

            {swaggerFile && (
              <div className="space-y-2">
                <h3 className="font-semibold">Swagger File</h3>
                <p className="text-neutral-mid dark:text-slate-400">
                  {swaggerFile.name}
                </p>
              </div>
            )}

            {authToken && (
              <div className="space-y-2">
                <h3 className="font-semibold">Auth Token</h3>
                <p className="text-neutral-mid dark:text-slate-400">••••••••</p>
              </div>
            )}
          </>
        )}

        <div className="space-y-2">
          <h3 className="font-semibold">Environment</h3>
          <p className="text-neutral-mid dark:text-slate-400 capitalize">{env}</p>
        </div>

        <div className="pt-6 flex gap-4">
          <Button
            className="flex-1 bg-neutral-light dark:bg-slate-700 text-neutral-dark dark:text-neutral-light"
            onClick={() => navigate(-1)}
          >
            Back
          </Button>

          <Button className="flex-1" onClick={handleCreate}>
            Create Project
          </Button>
        </div>

      </Card>
    </div>
  );
}
