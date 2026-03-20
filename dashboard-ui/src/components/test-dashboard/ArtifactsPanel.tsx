import { Card } from "@/components/Card";

export function ArtifactsPanel({
  artifacts,
}: {
  artifacts: {
    id: string;
    type: "screenshot" | "video" | "snapshot" | "diff";
    url: string;
  }[];
}) {
  return (
    <div className="p-4">
      <Card>
        <h2 className="text-lg font-semibold mb-4">Artifacts</h2>

        {artifacts.length === 0 && <div>No artifacts found</div>}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {artifacts.map((a) => (
            <div key={a.id} className="border rounded-md p-2 text-center">
              <div className="text-xs text-gray-500 mb-2">{a.type}</div>

              {a.type === "screenshot" && (
                <img src={a.url} alt="screenshot" className="rounded-md" />
              )}

              {a.type === "video" && (
                <video src={a.url} controls className="rounded-md" />
              )}

              {a.type === "snapshot" && (
                <img src={a.url} alt="snapshot" className="rounded-md" />
              )}

              {a.type === "diff" && (
                <img src={a.url} alt="diff" className="rounded-md" />
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
