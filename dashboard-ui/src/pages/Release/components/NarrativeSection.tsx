import { Card } from "../../../components/Card";

type Props = {
  title: string;
  paragraphs: string[];
};

export function NarrativeSection({ title, paragraphs }: Props) {
  return (
    <Card>
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-slate-100">
        {title}
      </h2>
      <div className="space-y-3 text-sm text-gray-700 dark:text-slate-200 leading-relaxed">
        {paragraphs.map((p, idx) => (
          <p key={idx}>{p}</p>
        ))}
      </div>
    </Card>
  );
}
