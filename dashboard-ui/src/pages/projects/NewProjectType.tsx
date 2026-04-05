import { Link } from "react-router-dom";
import { Card } from "../../components/ui/Card";

export default function NewProjectType() {
  return (
    <div className="max-w-4xl mx-auto py-12 space-y-10">
      <h1 className="text-h1 font-semibold text-neutral-dark dark:text-neutral-light">
        Create New Project
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* UI Automation */}
        <Link to="/projects/new/ui">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow p-8 text-center space-y-4">
            <div className="text-5xl">🖥️</div>
            <h2 className="text-h2 font-semibold">UI Automation</h2>
            <p className="text-neutral-mid dark:text-slate-400 text-body">
              Generate UI tests by scanning your website and detecting flows.
            </p>
          </Card>
        </Link>

        {/* API Automation */}
        <Link to="/projects/new/api">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow p-8 text-center space-y-4">
            <div className="text-5xl">🔌</div>
            <h2 className="text-h2 font-semibold">API Automation</h2>
            <p className="text-neutral-mid dark:text-slate-400 text-body">
              Generate API tests from your Swagger specification or OpenAPI file.
            </p>
          </Card>
        </Link>

      </div>
    </div>
  );
}
