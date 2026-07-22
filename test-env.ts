/**
 * Dummy-but-schema-valid environment values for test/e2e runs.
 *
 * Production secrets are never committed (`.env*` is gitignored), and the app's
 * `config/index.ts` validates env with zod at import time — so unit tests that
 * transitively import config, and the hermetic Playwright app boot, both need a
 * set of values that pass validation. The backend is mocked in both contexts,
 * so these point at non-existent hosts on purpose.
 */
const addr = (n: string) => `0x${n.repeat(40)}`

export const TEST_ENV: Record<string, string> = {
  NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID: "00000000-0000-0000-0000-000000000000",
  NEXT_PUBLIC_CHAIN_NAME: "story-aeneid-testnet",
  NEXT_PUBLIC_CHAIN_ID: "1315",
  NEXT_PUBLIC_V3_FEE: "3000",
  NEXT_PUBLIC_API_BASE_URL: "https://api.test.ip.world/api/v1",
  NEXT_PUBLIC_JSON_RPC_URL: "https://rpc.test.ip.world",
  NEXT_PUBLIC_EXPLORER_URL: "https://explorer.test.ip.world",
  NEXT_PUBLIC_METRICS_SYNC_CLOUDFLARE_URL: "https://metrics.test.ip.world",
  NEXT_PUBLIC_STORYHUNT_V3_FACTORY: addr("1"),
  NEXT_PUBLIC_STORYHUNT_SWAP_ROUTER: addr("2"),
  NEXT_PUBLIC_IP_WORLD_ADDRESS: addr("3"),
  NEXT_PUBLIC_OPERATOR_ADDRESS: addr("4"),
  NEXT_PUBLIC_WRAPPED_IP_TOKEN_ADDRESS: addr("5"),
  NEXT_PUBLIC_QUOTER_ADDRESS: addr("6"),
  // Marks the runtime as an e2e/test boot so client code can stub external SDKs.
  NEXT_PUBLIC_E2E: "true",
}
