# Docs

Short frontend notes for agents.

| Doc           | Scope                                                     |
| ------------- | --------------------------------------------------------- |
| `HOMEPAGE_TOKEN_SHELVES.md` | Public homepage token shelf queries and curation-order rule. |
| `WORKBOOK.md` | Local agent notes and gotchas. Gitignored; do not commit. |

## Reward UI Notes

- Token UGC cards read payout estimates from `/remixes/:token/ugc/stats`.
- When `payout_window_is_late=true`, show the estimate as late/pending instead of counting down to the next cron schedule.
