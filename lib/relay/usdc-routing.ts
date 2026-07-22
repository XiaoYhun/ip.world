/**
 * USDC → IP Routing Planner
 *
 * Pure, stateless function that determines the optimal source order for
 * converting USDC to native IP based on available balances and gas.
 *
 * Reusable across creation, trade, and any future flow that needs
 * multi-source USDC → IP conversion.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * All paths go directly to IP — NO intermediate USDC→USDC bridging.
 *
 * The executor processes the returned steps sequentially using EXACT_INPUT
 * (Relay doesn't support EXPECTED_OUTPUT for USDC → IP):
 *   1. Calculate required USDC from the current rate, quote as EXACT_INPUT.
 *   2. If the quote falls short, re-quote with a corrected amount using
 *      the actual rate from the first quote.
 *   3. If the source can't cover it → spend all, subtract the IP received,
 *      continue to the next step for the remainder.
 *   4. Repeat until target is fully covered or steps are exhausted.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * Decision table — every combination of Story USDC, IP gas, Solana USDC,
 * and SOL gas mapped to the correct routing action:
 *
 * ┌────┬──────────────┬───────────┬──────────────────────┬───────────┬──────────────────────────────────────────────────────────────┬────────┐
 * │ #  │ Story USDC   │ Story Gas │ Sol USDC             │ Sol Gas   │ Action                                                       │ Result │
 * │    │              │ (IP)      │                      │ (SOL)     │                                                              │        │
 * ├────┼──────────────┼───────────┼──────────────────────┼───────────┼──────────────────────────────────────────────────────────────┼────────┤
 * │  1 │ ≥ cost + gas │ ✅        │ any                  │ any       │ Swap Story USDC → IP → purchase                              │ ✅     │
 * │  2 │ ≥ cost + gas │ ❌        │ ❌                    │ any       │ No way to pay Story gas                                      │ ❌     │
 * │  3 │ ≥ cost + gas │ ❌        │ any                  │ ❌         │ Has Sol USDC but no SOL to pay Sol gas                        │ ❌     │
 * │  4 │ ≥ cost + gas │ ❌        │ ≥ gas equivalent     │ ✅        │ Sol USDC → IP (gas top-up), then Story USDC → IP → purchase   │ ✅     │
 * │  5 │ partial > 0  │ ❌        │ Story+Sol ≥ cost+gas │ ✅        │ Sol USDC → IP (gas + remainder), Story USDC → IP → purchase   │ ✅     │
 * │  6 │ partial > 0  │ ✅        │ Story+Sol ≥ cost     │ ✅        │ Story USDC → IP (partial), Sol USDC → IP (remainder)          │ ✅     │
 * │  7 │ partial > 0  │ ✅        │ Story+Sol < cost     │ any       │ Total USDC insufficient                                      │ ❌     │
 * │  8 │ 0            │ ❌        │ ≥ cost + gas         │ ✅        │ Sol USDC → IP (all needed)                                    │ ✅     │
 * │  9 │ 0            │ ❌        │ < cost + gas         │ any       │ Insufficient                                                 │ ❌     │
 * │ 10 │ 0            │ ✅        │ ≥ cost               │ ✅        │ Sol USDC → IP (all needed)                                    │ ✅     │
 * │ 11 │ 0            │ ✅        │ < cost               │ any       │ Insufficient                                                 │ ❌     │
 * └────┴──────────────┴───────────┴──────────────────────┴───────────┴──────────────────────────────────────────────────────────────┴────────┘
 *
 * Key routing principles:
 *   - When the user HAS IP for gas → prefer Story USDC first (same-chain = cheaper, faster).
 *   - When the user has NO IP for gas → Solana USDC MUST go first because Relay covers
 *     the destination gas on cross-chain swaps, which bootstraps IP for subsequent Story txs.
 *   - Solana transactions require SOL for gas. If `hasSolGas` is false, Solana USDC is unusable.
 */

export type UsdcSource = "story" | "solana"

export interface UsdcRouteInput {
  /** Story USDC balance (raw, 6 decimals) */
  storyUsdcRaw: bigint
  /** Solana USDC balance (raw, 6 decimals) */
  solanaUsdcRaw: bigint
  /** Whether the user has enough native IP on Story for EVM gas (~0.01 IP) */
  hasIpGas: boolean
  /** Whether the user has enough SOL on Solana to sign a Solana transaction */
  hasSolGas: boolean
}

export interface UsdcRouteStep {
  /** Which chain's USDC to use */
  source: UsdcSource
  /**
   * "target" — calculate the required USDC from the rate and use EXACT_INPUT.
   *            Re-quote with a corrected amount if the first quote undershoots.
   * "all"    — use EXACT_INPUT with the full source balance.
   *            Used when this source can't fully cover the target
   *            and we need to drain it before moving to the next.
   */
  strategy: "target" | "all"
}

export type UsdcRoutePlan =
  | { feasible: true; steps: UsdcRouteStep[] }
  | { feasible: false; reason: string }

/**
 * Determines the optimal USDC → IP routing plan.
 *
 * Returns an ordered list of steps for the executor. Each step specifies
 * which USDC source to use and what Relay trade type to request.
 *
 * The executor should:
 *   1. Process steps in order, tracking `remainingIpWei`.
 *   2. For each step: calculate the required USDC from the rate, quote as
 *      EXACT_INPUT. If the quote undershoots, re-quote with a corrected amount.
 *   3. If the source balance can't cover the calculated amount, spend all
 *      available balance and continue to the next step for the remainder.
 *
 * This function is pure and side-effect-free — safe for use in useMemo,
 * tests, or server-side logic.
 */
export function planUsdcToIpRoute(input: UsdcRouteInput): UsdcRoutePlan {
  const { storyUsdcRaw, solanaUsdcRaw, hasIpGas, hasSolGas } = input

  const hasStory = storyUsdcRaw > BigInt(0)
  const hasSolana = solanaUsdcRaw > BigInt(0)

  // ── No USDC anywhere ──
  if (!hasStory && !hasSolana) {
    return { feasible: false, reason: "Not enough USDC balance available" }
  }

  // ── Has IP gas → Story is preferred (same-chain, cheaper) ──
  if (hasIpGas) {
    if (hasStory && hasSolana && hasSolGas) {
      // Cases #1, #6: Story first, Solana for any remainder
      return {
        feasible: true,
        steps: [
          { source: "story", strategy: "target" },
          { source: "solana", strategy: "target" },
        ],
      }
    }

    if (hasStory && !hasSolana) {
      // Case #1 (solo): Story only — must be enough or executor errors
      return {
        feasible: true,
        steps: [{ source: "story", strategy: "target" }],
      }
    }

    if (hasStory && hasSolana && !hasSolGas) {
      // Case #7 variant: have Solana USDC but can't sign Solana txs
      // Best effort with Story only
      return {
        feasible: true,
        steps: [{ source: "story", strategy: "target" }],
      }
    }

    if (!hasStory && hasSolana && hasSolGas) {
      // Case #10: no Story USDC, go direct from Solana
      return {
        feasible: true,
        steps: [{ source: "solana", strategy: "target" }],
      }
    }

    if (!hasStory && hasSolana && !hasSolGas) {
      // Case #11 variant: Solana USDC exists but no SOL for gas
      return { feasible: false, reason: "Insufficient SOL for Solana transaction fee" }
    }

    // Shouldn't reach here, but guard
    return { feasible: false, reason: "No usable USDC source" }
  }

  // ── No IP gas → Solana MUST go first (Relay covers destination gas) ──
  if (!hasSolana) {
    // Cases #2: have Story USDC but can't execute EVM txs without gas
    return { feasible: false, reason: "No IP for gas and no Solana USDC to bootstrap it" }
  }

  if (!hasSolGas) {
    // Case #3: have Solana USDC but no SOL to sign the deposit
    return { feasible: false, reason: "Insufficient SOL for Solana transaction fee" }
  }

  if (hasStory) {
    // Cases #4, #5: Solana first (bootstraps gas), then Story for remainder
    return {
      feasible: true,
      steps: [
        { source: "solana", strategy: "target" },
        { source: "story", strategy: "target" },
      ],
    }
  }

  // Cases #8: Solana only (no Story USDC at all)
  return {
    feasible: true,
    steps: [{ source: "solana", strategy: "target" }],
  }
}
