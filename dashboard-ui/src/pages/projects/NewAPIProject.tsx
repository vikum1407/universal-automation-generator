import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/form/Input";
import { Button } from "../../components/ui/form/Button";
import { FileUpload } from "../../components/ui/form/FileUpload";
import { FormField } from "../../components/ui/form/FormField";

export default function NewAPIProject() {
  const navigate = useNavigate();

  const [swaggerUrl, setSwaggerUrl] = useState("");
  const [swaggerFile, setSwaggerFile] = useState<File | null>(null);
  const [authToken, setAuthToken] = useState("");
  const [env, setEnv] = useState("production");

  function handleContinue() {
    navigate("/projects/new/summary", {
      state: {
        type: "api",
        swaggerUrl,
        swaggerFile,
        authToken,
        env
      }
    });
  }

  return (
    <div className="max-w-3xl mx-auto py-12 space-y-10">
      <h1 className="text-h1 font-semibold text-neutral-dark dark:text-neutral-light">
        API Automation — Swagger Setup
      </h1>

      <Card className="space-y-8 p-8">

        {/* Swagger URL */}
        <FormField label="Swagger URL (optional)">
          <Input
            placeholder="https://example.com/swagger.json"
            value={swaggerUrl}
            onChange={(e) => setSwaggerUrl(e.target.value)}
          />
        </FormField>

        {/* OR File Upload */}
        <FormField label="Upload Swagger File (optional)">
          <FileUpload
            accept=".json,.yaml,.yml"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setSwaggerFile(file);
            }}
          />
          {swaggerFile && (
            <div className="text-sm text-neutral-mid dark:text-slate-400 mt-1">
              Selected: {swaggerFile.name}
            </div>
          )}
        </FormField>

        {/* Auth Token */}
        <FormField label="Auth Token (optional)">
          <Input
            placeholder="Bearer abc123..."
            value={authToken}
            onChange={(e) => setAuthToken(e.target.value)}
          />
        </FormField>

        {/* Environment */}
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

        {/* Continue Button */}
        <div className="pt-4">
          <Button
            onClick={handleContinue}
            disabled={!swaggerUrl && !swaggerFile}
            className="w-full"
          >
            Continue
          </Button>
        </div>

      </Card>
    </div>
  );
}
