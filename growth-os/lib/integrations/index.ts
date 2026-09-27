// Future data sources. Each provider reports whether it is configured
// (presence of env vars only; values never leave the server) and exposes the
// same fetch shape so Analytics can merge API values with manual ones.
// Nothing here calls an external API yet.

export interface MetricPoint { metric: string; date: string; value: number; source: string }

export interface MetricsProvider {
  id: string;
  label: string;
  metrics: string[]; // KPI ids it could fill
  env: string[];
  isConfigured(): boolean;
  fetch(range: { from: string; to: string }): Promise<MetricPoint[]>;
}

class NotImplemented extends Error {}

function provider(id: string, label: string, env: string[], metrics: string[]): MetricsProvider {
  return {
    id, label, env, metrics,
    isConfigured: () => env.every((k) => Boolean(process.env[k])),
    fetch: async () => { throw new NotImplemented(`${label} integration is not implemented yet. Enter values manually or import a CSV.`); },
  };
}

export const PROVIDERS: MetricsProvider[] = [
  provider("ga4", "Google Analytics 4", ["GA4_PROPERTY_ID", "GOOGLE_APPLICATION_CREDENTIALS"], ["K01", "K05", "K06", "K11", "K12", "K26"]),
  provider("gsc", "Google Search Console", ["GSC_SITE_URL", "GOOGLE_APPLICATION_CREDENTIALS"], ["K02", "K03", "K25"]),
  provider("meta", "Meta Ads", ["META_ADS_ACCESS_TOKEN", "META_AD_ACCOUNT_ID"], ["K17", "K18"]),
  provider("youtube", "YouTube Analytics", ["YOUTUBE_API_KEY"], ["K16"]),
  provider("tiktok", "TikTok Ads / Business", ["TIKTOK_ADS_ACCESS_TOKEN"], ["K16", "K17"]),
  provider("newsletter", "Newsletter provider / TechPlay mail desk", ["NEWSLETTER_API_URL", "NEWSLETTER_API_TOKEN"], ["K09", "K19", "K20"]),
];

export function integrationStatus() {
  return PROVIDERS.map((p) => ({ id: p.id, label: p.label, env: p.env, metrics: p.metrics, configured: p.isConfigured() }));
}
