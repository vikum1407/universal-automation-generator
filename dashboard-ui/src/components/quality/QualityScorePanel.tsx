import { Section } from "../ui/Section";
import { Card } from "../ui/Card";
import { useQualityScore } from "../../hooks/useQualityScore";

export function QualityScorePanel({ testId }: { testId: string }) {
  const { data } = useQualityScore(testId);

  if (!data) return null;

  return (
    <Section title="Quality Score">
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <div className="text-caption text-neutral-mid">Stability Index</div>
          <div className="text-h2 font-bold text-brand-primary">
            {data.stability_index}
          </div>
        </Card>

        <Card>
          <div className="text-caption text-neutral-mid">Coverage Score</div>
          <div className="text-h2 font-bold text-brand-primary">
            {data.coverage_score}
          </div>
        </Card>

        <Card>
          <div className="text-caption text-neutral-mid">Risk Score</div>
          <div className="text-h2 font-bold text-brand-primary">
            {data.risk_score}
          </div>
        </Card>

        <Card>
          <div className="text-caption text-neutral-mid">Release Readiness</div>
          <div className="text-h2 font-bold text-brand-primary">
            {data.release_readiness}
          </div>
        </Card>
      </div>

      <Card>
        <div className="text-body text-neutral-dark whitespace-pre-line">
          {data.rationale}
        </div>
      </Card>
    </Section>
  );
}
