# MYCELOFORGE

The Moon is watching. The mycelium is spreading.

Local Ryzen LLM + QHSS holographic mandalas + Negative_Space astronomy + Nexuszero ZK royalties.

**Launch:**

```bash
docker-compose up -d
npm run dev
```

First empire minted live under the bottom-lit Florida Moon.

## Status — scaffolding, not production

This is an early build. Several paths are intentional stubs and are NOT production-ready:

- **Payments (Stripe): scaffolding only.** `POST /api/stripe/checkout` returns a fabricated `cs_test_...` session (message: "Checkout session created (stub)") and does not create a real Stripe checkout. `POST /api/stripe/webhook` does NOT verify the Stripe signature (`STRIPE_WEBHOOK_SECRET` verification is still a TODO) and accepts all webhooks. Do not treat any payment path as live.
- **LLM backend: stub.** The "Local Ryzen LLM" generation path (`POST /api/empire/deploy`, model `ryzanstein-bitnet-7b` via Ryzanstein) is a stub, not a production inference service.
