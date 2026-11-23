import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shop/page-header";
import { getPolicy, policies } from "@/content/policies";
import { cn } from "@/lib/utils";

// Policy pages: /pages/shipping-policy, /pages/refund-policy, /pages/privacy-policy, /pages/terms.
// The text lives in src/content/policies.ts.

export function generateStaticParams() {
  return policies.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/pages/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const policy = getPolicy(slug);
  return policy ? { title: policy.title, description: policy.description } : {};
}

export default async function PolicyPage({ params }: PageProps<"/pages/[slug]">) {
  const { slug } = await params;
  const policy = getPolicy(slug);
  if (!policy) notFound();

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_260px]">
      <article className="min-w-0 max-w-3xl space-y-8">
        <PageHeader title={policy.title} intro={policy.description} />
        <div className="space-y-6 leading-relaxed text-muted-foreground">
          {policy.sections.map((s, i) => (
            <section key={i} className="space-y-3">
              {s.heading && <h2 className="pt-2 text-lg font-bold">{s.heading}</h2>}
              {s.paragraphs?.map((p) => <p key={p}>{p}</p>)}
              {s.bullets && (
                <ul className="space-y-1.5 pl-5 marker:text-brand [list-style:disc]">
                  {s.bullets.map((b) => <li key={b}>{b}</li>)}
                </ul>
              )}
            </section>
          ))}
        </div>
      </article>

      <aside className="h-fit space-y-1 rounded-2xl bg-muted p-4 lg:sticky lg:top-6">
        <p className="px-2 pb-2 text-sm font-semibold text-heading">Policies</p>
        {policies.map((p) => (
          <Link
            key={p.slug}
            href={`/pages/${p.slug}`}
            aria-current={p.slug === policy.slug ? "page" : undefined}
            className={cn("block rounded-lg px-2 py-1.5 text-sm", p.slug === policy.slug ? "bg-background font-semibold text-brand" : "text-heading hover:text-brand")}
          >
            {p.title}
          </Link>
        ))}
      </aside>
    </div>
  );
}
