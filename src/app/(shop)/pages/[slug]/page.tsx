import { notFound } from "next/navigation";

// Policy / content pages: /pages/shipping-policy, /pages/refund-policy, ...
// TODO: move the text from the old sites into files or a database table.
const pages: Record<string, string> = {
  "shipping-policy": "Shipping Policy",
  "refund-policy": "Refund & Exchange Policy",
  "privacy-policy": "Privacy Policy",
  terms: "Terms of Service",
};

export function generateStaticParams() {
  return Object.keys(pages).map((slug) => ({ slug }));
}

export default async function ContentPage({ params }: PageProps<"/pages/[slug]">) {
  const { slug } = await params;
  const title = pages[slug];
  if (!title) notFound();
  return (
    <article className="py-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-muted-foreground">Content coming soon.</p>
    </article>
  );
}
