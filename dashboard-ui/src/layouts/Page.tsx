export function Page({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <h1 className="text-h1 font-semibold text-neutral-dark">{title}</h1>
      {children}
    </div>
  );
}
