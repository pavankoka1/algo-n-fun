// src/lib/JsonLd.tsx
//
// Tiny server-component helper for emitting JSON-LD structured data.
//
// JSON is rendered as a text child of <script type="application/ld+json">.
// Browsers do NOT execute this script type — the contents are treated as a
// pure data island that SEO crawlers and knowledge-graph builders parse.
//
// React's text escaping (`<` → `&lt;`) is safe for valid JSON because a
// conforming JSON document never contains a raw `<` outside of a string.
// As a defence-in-depth measure we also escape any `</` sequence that
// could appear inside an arbitrary string value (e.g. a problem title),
// so a stray closing tag can't terminate the script element early.
//
// Use one <JsonLd> per logical entity (WebSite, BreadcrumbList, etc.) —
// Google's structured-data guidelines recommend this over a single mega
// @graph for clarity and easier de-duplication.

interface JsonLdProps {
  data: Record<string, unknown> | Array<Record<string, unknown>>
  /** Optional id — useful if you want to inspect or replace the tag later. */
  id?: string
}

export function JsonLd({ data, id }: JsonLdProps) {
  const serialised = JSON.stringify(data).replace(/<\/script/gi, '<\\/script')
  return (
    <script
      id={id}
      type="application/ld+json"
      suppressHydrationWarning
    >
      {serialised}
    </script>
  )
}
