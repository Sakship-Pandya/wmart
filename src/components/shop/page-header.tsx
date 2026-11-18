import { Breadcrumbs, type Crumb } from "./breadcrumbs";

// Breadcrumbs + page title + optional intro, used at the top of content pages.
export function PageHeader({
  title,
  intro,
  crumbs,
}: {
  title: string;
  intro?: string;
  crumbs?: Crumb[];
}) {
  return (
    <div className="space-y-3">
      <Breadcrumbs items={crumbs ?? [{ label: "Home", href: "/" }, { label: title }]} />
      <h1 className="text-3xl font-bold">{title}</h1>
      {intro && <p className="max-w-2xl text-muted-foreground">{intro}</p>}
    </div>
  );
}
