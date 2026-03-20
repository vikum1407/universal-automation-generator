import { useState } from "react";
import FrameworkTabs from "./FrameworkTabs";
import TestFileTree from "./TestFileTree";
import CodeViewer from "./CodeViewer";

interface MultiFrameworkTestViewerProps {
  testId: string;
  frameworks: {
    playwright: Record<string, string>;
    cypress: Record<string, string>;
    selenium: Record<string, string>;
    restassured: Record<string, string>;
  };
}

type FrameworkName = keyof MultiFrameworkTestViewerProps["frameworks"];

export default function MultiFrameworkTestViewer({
  testId,        // <-- MUST be included here
  frameworks,
}: MultiFrameworkTestViewerProps) {

  const frameworkNames = Object.keys(frameworks) as FrameworkName[];
  const [selectedFramework, setSelectedFramework] = useState<FrameworkName>(frameworkNames[0]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const files = frameworks[selectedFramework];
  const code = selectedFile ? files[selectedFile] : null;

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-2">Generated Tests for: {testId}</h2>

      <FrameworkTabs
        frameworks={frameworkNames}
        selected={selectedFramework}
        onSelect={(fw) => {
          setSelectedFramework(fw as FrameworkName);
          setSelectedFile(null);
        }}
      />

      <div className="flex flex-1">
        <TestFileTree
          files={files}
          selectedFile={selectedFile}
          onSelect={setSelectedFile}
        />

        <CodeViewer code={code} />
      </div>
    </div>
  );
}
