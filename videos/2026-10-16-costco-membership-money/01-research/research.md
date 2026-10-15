# Research notes: How Costco Actually Makes Money

Retrieved 2026-10-16. Main source: Costco Form 10-K for fiscal 2026 (year ended August 30, 2026), filed
2026-10-07. Copy saved in `raw/cost-10k-fy2026.htm` (text version `raw/cost-10k-fy2026.txt`).

## Facts the story needs (and where they came from)

| Need | Fact ID(s) | Source |
|---|---|---|
| How big Costco is | cost-total-rev-fy2026, cost-net-sales-fy2026, cost-warehouses-2026 | 10-K p. 37, p. 3 |
| What the goods cost it | cost-merch-costs-fy2026, cost-gross-margin-fy2026 (derived) | 10-K p. 37 |
| Running costs | cost-sga-fy2026, cost-sga-share-sales-fy2026 (derived) | 10-K p. 37 |
| Profit | cost-op-income-fy2026, cost-net-income-fy2026 | 10-K p. 37 (net income cross-checked with SEC XBRL) |
| Membership fees, 3 years | cost-member-fees-fy2024/2025/2026, cost-fee-growth-fy2026 | 10-K p. 37, p. 26 |
| Fees vs profit (the core idea) | cost-fee-share-rev-fy2026, cost-fee-share-opinc-fy2026, cost-opinc-ex-fees-fy2026, cost-goods-profit-per-100-fy2026 | derived |
| Members, renewals | cost-paid-members-2026, cost-cardholders-2026, cost-exec-members-2026, cost-renewal-usca-2026, cost-renewal-world-2026 | 10-K p. 5 |
| Fee prices and the 2024 increase | cost-fee-goldstar-us, cost-fee-goldstar-increase, cost-fee-exec-us, cost-fee-exec-us-old, cost-exec-reward-max, cost-fee-incr-share-2026 | 8-K press release 2024-07-10; 10-K p. 27 |
| Executive members drive sales | cost-exec-sales-share-2026, cost-exec-rewards-2026 | 10-K p. 5, p. 48 |
| Money paid before it's earned | cost-deferred-fees-2026, cost-fees-deferred | 10-K p. 39, p. 27 |
| Business model in Costco's words | cost-low-margin-model, cost-sell-before-pay, cost-membership-format | 10-K p. 3, p. 25 |
| Hot dog promise | cost-hotdog-1985 (Tier 3, two outlets) | CNN via KSL (2024), ABC News (2022) |

## Finding that changes the angle (tell the owner)

The pitch's cold-open lead was "almost all of Costco's profit comes from the membership card". **The numbers
don't support "almost all".** What they do show, and it's still striking:

- Membership fees are only **about 2%** of Costco's revenue (cost-fee-share-rev-fy2026, 1.95%).
- But they're equal to **about half of its operating profit** (cost-fee-share-opinc-fy2026, 50.6%).
- Remove the fees and Costco earns **under $2 of operating profit on every $100 of goods** it sells
  (cost-goods-profit-per-100-fy2026, 1.94).

New cold-open line (draft): "Two percent of Costco's money comes from the membership card. Half of its
profit does." The video's thesis stays the same: the card is the product.

Wording care: "fees equal about half of operating profit" is a comparison of sizes, not an accounting split
(Costco doesn't report profit by source). Narration should say "equal to" or "as big as", not "half the
profit comes from".

## Surprises worth using

- Costco often sells goods **before it has to pay suppliers** (cost-sell-before-pay).
- About **$3 billion** of fees were collected but not yet "earned" at year end (cost-deferred-fees-2026):
  members pay a year up front.
- Executive members are about half of paid members but make about **three quarters** of sales.
- Executive 2% rewards handed back: **$3.4 billion** in fiscal 2026 (cost-exec-rewards-2026). Costco pays
  people to stay.
- Only **about 30%** of fiscal 2026 fee growth came from the 2024 price rise; the rest from more members and
  upgrades (cost-fee-incr-share-2026).

## Rejected or not used

- **"Costco caps its markup at 14% (15% for Kirkland)."** Widely repeated, but only in Tier-3 articles and
  old interviews; not in the 10-K. Not used. The 10-K's own gross margin (about 11%) tells the story
  better.
- **Hot dog "never raised since 1985"**: kept as Tier 3 with two independent outlets, attributed aloud
  ("Costco's finance chief said…"). Not checked against an earnings-call transcript (no free primary copy
  found). Costco doesn't report hot dog sales or losses, so **no claim that the hot dog loses money**.
- **Rotisserie chicken price/loss claims**: no Tier-1 source. Not used.
- **Membership fee history beyond 3 years**: SEC's data feed has no membership-fee field for Costco
  (checked), so older years would need each old 10-K read by hand. Not needed for this story.

## Open questions

- Fee revenue per member (~$70) mixes countries and tiers; use only with "roughly".
- Net income vs fees comparison (64%) mixes pre-tax and after-tax; prefer the operating-income comparison.
