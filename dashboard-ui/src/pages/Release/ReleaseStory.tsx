import { useReleaseStory } from "./hooks/useReleaseStory";
import { NarrativeSection } from "./components/NarrativeSection";
import { HighlightList } from "./components/HighlightList";
import { VerdictCard } from "./components/VerdictCard";

export default function ReleaseStory() {
  const project = "qlitz-demo";
  const { data, loading } = useReleaseStory(project);

  if (loading) return <p>Loading...</p>;
  if (!data) return <p>No release story available.</p>;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-slate-100">
        Release Story
      </h1>

      <NarrativeSection
        title={data.summary.title}
        paragraphs={data.summary.narrative}
      />

      <div className="my-6">
        <HighlightList {...data.highlights} />
      </div>

      <div className="my-6">
        <VerdictCard {...data.verdict} />
      </div>
    </div>
  );
}
