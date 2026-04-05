import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/form/Input";
import { Button } from "../../components/ui/form/Button";
import { FormField } from "../../components/ui/form/FormField";

export default function NewUIProject() {
  const navigate = useNavigate();

  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [crawlDepth, setCrawlDepth] = useState(2);
  const [env, setEnv] = useState("production");

  function handleContinue() {
    navigate("/projects/new/summary", {
      state: {
        type: "ui",
        url,
        username,
        password,
        crawlDepth,
        env
      }
    });
  }

  return (
    <div className="max-w-3xl mx-auto py-12 space-y-10">
      <h1 className="text-h1 font-semibold text-neutral-dark dark:text-neutral-light">
        UI Automation — Website Setup
      </h1>

      <Card className="space-y-6 p-8">

        <FormField label="Website URL">
          <Input
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Login Username (optional)">
            <Input
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </FormField>

          <FormField label="Login Password (optional)">
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormField>
        </div>

        <FormField label={`Crawl Depth: ${crawlDepth}`}>
          <input
            type="range"
            min={1}
            max={5}
            value={crawlDepth}
            onChange={(e) => setCrawlDepth(Number(e.target.value))}
            className="w-full"
          />
        </FormField>

        <FormField label="Environment">
          <select
            value={env}
            onChange={(e) => setEnv(e.target.value)}
            className="
              w-full px-3 py-2 rounded border border-[var(--card-border)]
              bg-[var(--card-bg)] text-[var(--fg)]
              focus:outline-none focus:ring-2 focus:ring-brand-primary
            "
          >
            <option value="production">Production</option>
            <option value="staging">Staging</option>
            <option value="dev">Development</option>
          </select>
        </FormField>

        <div className="pt-4">
          <Button
            disabled={!url}
            onClick={handleContinue}
            className="w-full"
          >
            Continue
          </Button>
        </div>

      </Card>
    </div>
  );
}
