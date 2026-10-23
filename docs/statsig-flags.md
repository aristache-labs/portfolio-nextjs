# Statsig and Flags SDK

The browser provider is in `src/app/my-statsig.tsx`. Server flag definitions live in `src/lib/flags.ts`, using the Statsig adapter for Flags SDK. Both currently use the anonymous example user ID `a-user`; replace this shared example identity before running visitor-specific experiments.

`myFeatureGate` maps to the Statsig gate `my_feature_gate` and defaults to false. It is available for server components and route handlers but does not currently change any section. Do not add per-visitor flag evaluation directly to the ISR homepage without choosing a compatible caching or precompute strategy.

The protected discovery endpoint at `/.well-known/vercel/flags` exposes local definitions to Vercel Flags Explorer. When a Console API key is configured, it also loads Statsig project metadata.

## Environment variables

- `NEXT_PUBLIC_STATSIG_CLIENT_KEY`: public browser SDK key.
- `STATSIG_SERVER_API_KEY`: private server SDK key used by the adapter.
- `FLAGS_SECRET`: private random 32-byte base64url secret used to authenticate Flags Explorer.
- `STATSIG_CONSOLE_API_KEY`: optional private Console API key for discovering Statsig project flags.
- `STATSIG_PROJECT_ID`: optional project ID for project metadata and console links.

Configure the variables for each Vercel environment before redeploying. Keep server keys and the Flags secret out of client components and source control.

Reference: https://flags-sdk.dev/docs/providers/statsig
