# Homepage Token Shelves

The homepage gets the three top shelves from backend `/remixes` queries:

- Trending Coins: `sort_by=trending_score_<timeframe>&sort_order=desc`
- About To Graduate: `is_graduated=false&sort_by=graduation_progress&sort_order=desc`
- Trending On TikTok: `is_tiktok=true&sort_by=daily_volume&sort_order=desc`

The backend may apply moderator curation overrides before returning results. The frontend must keep the backend result order for these shelves. Do not re-sort Trending Coins client-side from Electric metrics, because that hides moderator pin/hide order.

Trending Coins timeframe changes fetch the matching backend query through `/api/remixes`, so the same backend curation path is used for `24h`, `6h`, `1h`, and `5m`.
