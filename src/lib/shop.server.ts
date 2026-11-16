const CATALOG_URL = "https://catalog.shopify.com/api/ucp/mcp";
const PROFILE = "https://shopify.dev/ucp/agent-profiles/examples/2026-08-25/valid-with-capabilities.json";

export type ShopProduct = {
  id: string;
  title: string;
  image: string | null;
  price: string | null;
  url: string;
  seller: string;
};

type Money = { amount: number; currency: string };
type RawVariant = { url?: string; price?: Money; seller?: { name?: string }; media?: Array<{ url: string }> };
type RawProduct = { id: string; title: string; media?: Array<{ url: string }>; variants?: RawVariant[] };

function formatMoney(m?: Money) {
  if (!m) return null;
  try {
    const digits = new Intl.NumberFormat("en", { style: "currency", currency: m.currency }).resolvedOptions().maximumFractionDigits ?? 2;
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: m.currency }).format(m.amount / 10 ** digits);
  } catch {
    return `${m.amount} ${m.currency}`;
  }
}

export async function searchCatalog(query: string, limit = 8): Promise<ShopProduct[]> {
  const res = await fetch(CATALOG_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "search_catalog",
        arguments: {
          meta: { "ucp-agent": { profile: PROFILE } },
          catalog: {
            query,
            context: { address_country: "IN", intent: "fashion shopping" },
            filters: { available: true },
            pagination: { limit },
          },
        },
      },
    }),
  });
  if (!res.ok) {
    console.error("Catalog request failed", res.status);
    throw new Error("The shopping catalog is unavailable right now.");
  }
  const json = (await res.json()) as {
    error?: { message: string };
    result?: { structuredContent?: { products?: RawProduct[] } };
  };
  if (json.error) {
    console.error("Catalog error", json.error.message);
    throw new Error("The shopping catalog returned an error.");
  }
  const products = json.result?.structuredContent?.products ?? [];
  return products
    .map((p) => {
      const v = p.variants?.find((x) => x.url) ?? p.variants?.[0];
      if (!v?.url) return null;
      return {
        id: p.id,
        title: p.title,
        image: p.media?.[0]?.url ?? v.media?.[0]?.url ?? null,
        price: formatMoney(v.price),
        url: v.url,
        seller: v.seller?.name ?? "Online store",
      } satisfies ShopProduct;
    })
    .filter((x): x is ShopProduct => x !== null);
}
