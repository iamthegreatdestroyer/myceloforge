# MYCELOFORGE — Next Steps Master Action Plan

> **Objective:** Maximize Autonomy and Automation for continued development  
> **Strategy:** Phased execution with clear gates, leveraging the 48-agent Elite Agent Collective  
> **Timeline:** 12 phases, each independently deployable

---

## Guiding Principles

1. **Automate First** — Every repeatable task gets a script or CI job
2. **Commit Often** — Every phase ends with a committed, buildable state
3. **Fail Fast** — Validate at every gate before proceeding
4. **Agent-Driven** — Delegate to specialized agents from the Collective
5. **No Manual Steps** — If a human has to remember it, it's a bug in the process

---

## Phase 0: EMERGENCY — Secure Current Work

**Priority:** 🔴 IMMEDIATE  
**Estimated Time:** 5 minutes  
**Agent Lead:** ARBITER (Git & Merge Strategies)

### Actions

```bash
# 0.1 — Commit all Phase 1 work
cd S:\myceloforge
git add -A
git commit -m "feat(scaffold): Phase 1 complete — Next.js 14, Three.js scene, docker-compose, all deps

- Initialize Next.js 14.2.35 (TypeScript, Tailwind, App Router)
- Install all 12 dependencies (three, r3f, supabase, stripe, solana, etc.)
- Create MYCELOFORGE empire forge UI (app/page.tsx)
- Create SSR-safe Three.js Scene component (components/Scene.tsx)
- Custom dark theme CSS with glow-cyan and mycelium-glow
- Lunar phase utility (lib/lunarPhase.ts)
- Docker Compose for ryzanstein + qdrant
- Update package.json with dev:full script
- Update .gitignore for backend models
- Preserve COPILOT_AUTONOMOUS_DEPLOY.md spec

Build: PASSING ✅"

# 0.2 — Push to remote
git push origin main
```

### Gate

- [x] `git status` shows clean working tree
- [x] `git log` shows new commit on remote

---

## Phase 1: Foundation Hardening

**Priority:** 🔴 HIGH  
**Estimated Time:** 30 minutes  
**Agent Lead:** FLUX (DevOps & Infrastructure)

### 1.1 — Upgrade Node.js Runtime

```bash
# Install Node.js 22 LTS (resolves ALL engine warnings)
# Option A: nvm-windows
nvm install 22
nvm use 22

# Option B: Direct download from nodejs.org

# Verify
node --version  # Should be v22.x.x
```

**Impact:** Eliminates engine warnings from @supabase/supabase-js, @solana/web3.js, camera-controls, and 10+ other packages.

### 1.2 — Customize Root Layout

**File:** `app/layout.tsx`

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MYCELOFORGE — Empire Forge",
  description: "AI-powered empire deployment through the mycelial network",
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: "MYCELOFORGE",
    description: "Forge your empire across the mycelial network",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-black text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
```

### 1.3 — Create Environment Configuration

**File:** `.env.local`

```env
# === RYZANSTEIN ===
RYZANSTEIN_API_URL=http://localhost:8000

# === SUPABASE ===
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# === STRIPE ===
STRIPE_SECRET_KEY=sk_test_your-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-key
STRIPE_WEBHOOK_SECRET=whsec_your-secret

# === SOLANA ===
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=devnet

# === QDRANT ===
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=

# === APP ===
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**File:** `.env.example` (committed version without secrets)

### 1.4 — Configure `next.config.mjs`

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["localhost"],
  },
  webpack: (config) => {
    config.externals.push({
      "utf-8-validate": "commonjs utf-8-validate",
      bufferutil: "commonjs bufferutil",
    });
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ["@solana/web3.js"],
  },
};

export default nextConfig;
```

### Gate

- [ ] `npm run build` still passes
- [ ] `node --version` ≥ 20
- [ ] `.env.local` exists with all placeholders
- [ ] Layout shows "MYCELOFORGE" in browser tab
- [ ] Committed & pushed

---

## Phase 2: Backend Infrastructure

**Priority:** 🔴 HIGH  
**Estimated Time:** 2–4 hours  
**Agent Lead:** ARCHITECT (Systems Architecture) + FLUX (DevOps)

### 2.1 — Create Backend Directory Structure

```
backend/
├── ryzanstein/          # BitNet-7B LLM service
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py          # FastAPI app
│   ├── config.py
│   └── models/          # .gitignored — model weights
├── qhss/                # Quantum Holographic Sphere
│   ├── Dockerfile
│   └── src/
├── negative-space/      # Lunar phase engine
│   ├── Dockerfile
│   └── src/
├── nexuszero/           # Orchestrator
│   ├── Dockerfile
│   └── src/
├── doppelganger/        # Creative AI
│   ├── Dockerfile
│   └── src/
└── elite-agents/        # Agent system
    ├── Dockerfile
    └── src/
```

### 2.2 — Ryzanstein Stub Service (Minimum Viable)

**File:** `backend/ryzanstein/main.py`

```python
"""Ryzanstein API — BitNet-7B LLM Service (Stub)"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn

app = FastAPI(title="Ryzanstein", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    model: str = "ryzanstein-bitnet-7b"
    messages: List[Message]

class ChatResponse(BaseModel):
    choices: List[dict]

@app.get("/negative-space/lunar-phase")
async def lunar_phase():
    return {"phase": "Waxing Gibbous", "illumination": 0.75}

@app.post("/v1/chat/completions")
async def chat_completions(request: ChatRequest):
    seed = request.messages[-1].content if request.messages else "unknown"
    return {
        "choices": [{
            "message": {
                "content": f"Empire '{seed}' has been forged in the mycelial network. "
                           f"Neural pathways established. Awaiting full model deployment."
            }
        }]
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

**File:** `backend/ryzanstein/Dockerfile`

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**File:** `backend/ryzanstein/requirements.txt`

```
fastapi==0.115.0
uvicorn[standard]==0.30.0
pydantic==2.9.0
```

### 2.3 — Validate Docker Compose

```bash
docker-compose build
docker-compose up -d
curl http://localhost:8000/negative-space/lunar-phase
curl http://localhost:6333/collections
docker-compose down
```

### Gate

- [ ] `docker-compose build` succeeds
- [ ] `docker-compose up -d` starts both services
- [ ] Lunar phase endpoint responds
- [ ] Chat completions endpoint responds
- [ ] Qdrant health check passes
- [ ] `npm run dev:full` works end-to-end
- [ ] Committed & pushed

---

## Phase 3: API Layer & Error Handling

**Priority:** 🟡 HIGH  
**Estimated Time:** 1–2 hours  
**Agent Lead:** SYNAPSE (API Design) + APEX (Engineering)

### 3.1 — Create Next.js API Routes

```
app/api/
├── empire/
│   └── deploy/route.ts       # POST — proxy to ryzanstein
├── lunar-phase/
│   └── route.ts              # GET — proxy to negative-space
├── health/
│   └── route.ts              # GET — system health check
└── stripe/
    └── webhook/route.ts      # POST — Stripe webhook handler (stub)
```

### 3.2 — Implement Server-Side Proxy

```typescript
// app/api/empire/deploy/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await fetch(
      `${process.env.RYZANSTEIN_API_URL}/v1/chat/completions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "ryzanstein-bitnet-7b",
          messages: [{ role: "user", content: body.seed }],
        }),
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Ryzanstein service unavailable" },
        { status: 502 },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

### 3.3 — Refactor page.tsx

- Replace direct `localhost:8000` calls with `/api/empire/deploy` and `/api/lunar-phase`
- Add loading states, error boundaries, user-friendly error messages
- Remove hardcoded URLs

### Gate

- [ ] All API routes respond correctly
- [ ] Frontend calls API routes (not backend directly)
- [ ] Error states handled gracefully in UI
- [ ] Build passes
- [ ] Committed & pushed

---

## Phase 4: UI Enhancement & Animation

**Priority:** 🟡 MEDIUM  
**Estimated Time:** 2–3 hours  
**Agent Lead:** CANVAS (UI/UX) + TENSOR (if ML visualization needed)

### 4.1 — Integrate framer-motion

- Page entrance animations (fade-in, slide-up)
- Empire card deploy animation (scale + glow)
- Button press feedback (spring animation)
- Loading state pulse animation
- Staggered list rendering for empire cards

### 4.2 — Integrate lucide-react Icons

- Navigation icons, action button icons
- Status indicators (check, alert, spinner)
- Empire card metadata icons

### 4.3 — HolographicSphere Component

Create `components/HolographicSphere.tsx` — the QHSS visualization:

- Animated sphere with iridescent shader
- Responsive to empire deployment state
- Particle system representing mycelial connections

### 4.4 — Responsive Design

- Mobile-optimized layout
- Touch-friendly 3D controls
- Breakpoint system (sm/md/lg/xl)

### Gate

- [ ] All installed packages actively used
- [ ] Animations smooth at 60fps
- [ ] Mobile responsive (test 375px, 768px, 1440px)
- [ ] Lighthouse performance score ≥ 80
- [ ] Committed & pushed

---

## Phase 5: Data Layer

**Priority:** 🟡 MEDIUM  
**Estimated Time:** 2–3 hours  
**Agent Lead:** PRISM (Data) + SYNAPSE (Integration)

### 5.1 — Supabase Integration

```typescript
// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
```

**Tables:**

| Table          | Columns                                            | Purpose                |
| -------------- | -------------------------------------------------- | ---------------------- |
| `empires`      | id, seed, result, lunar_phase, created_at, user_id | Store deployed empires |
| `users`        | id, email, wallet_address, created_at              | User accounts          |
| `transactions` | id, user_id, empire_id, amount, status             | Payment records        |

### 5.2 — Qdrant Vector Search

Replace `qdrant-js` with `@qdrant/js-client-rest`:

```bash
npm uninstall qdrant-js
npm install @qdrant/js-client-rest
```

- Create empire embedding collection
- Semantic search for similar empires
- Recommendation engine foundation

### 5.3 — Replace Deprecated Metaplex

```bash
npm uninstall @metaplex-foundation/js
npm install @metaplex-foundation/umi @metaplex-foundation/umi-bundle-defaults
```

### Gate

- [ ] Supabase client connects
- [ ] Empire deployment persists to database
- [ ] Qdrant collection created
- [ ] No deprecated packages remain
- [ ] Committed & pushed

---

## Phase 6: Authentication & Payments

**Priority:** 🟡 MEDIUM  
**Estimated Time:** 3–4 hours  
**Agent Lead:** CIPHER (Security) + FORTRESS (Security Audit)

### 6.1 — Supabase Auth

- Email/password authentication
- OAuth providers (GitHub, Google)
- Session management
- Protected routes middleware

### 6.2 — Solana Wallet Connection

- Phantom wallet adapter
- Wallet connect button component
- Transaction signing for empire NFTs

### 6.3 — Stripe Checkout

- Empire deployment payment flow
- Subscription tiers (if applicable)
- Webhook handler for payment confirmation

### Gate

- [ ] Login/logout flow works
- [ ] Wallet connects and shows address
- [ ] Test payment completes
- [ ] Security audit passes (CIPHER review)
- [ ] Committed & pushed

---

## Phase 7: CI/CD Pipeline

**Priority:** 🟡 MEDIUM  
**Estimated Time:** 1–2 hours  
**Agent Lead:** FLUX (DevOps) + ECLIPSE (Testing)

### 7.1 — GitHub Actions Workflow

**File:** `.github/workflows/ci.yml`

```yaml
name: MYCELOFORGE CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint-and-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: "npm"
      - run: npm ci --legacy-peer-deps
      - run: npm run lint
      - run: npm run build

  test:
    runs-on: ubuntu-latest
    needs: lint-and-build
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: "npm"
      - run: npm ci --legacy-peer-deps
      - run: npm test

  docker:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - run: docker-compose build
```

### 7.2 — Pre-commit Hooks

```bash
npx husky init
npx husky add .husky/pre-commit "npm run lint && npm run build"
```

### 7.3 — Testing Framework

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

### Gate

- [ ] CI pipeline passes on push
- [ ] Pre-commit hooks prevent bad commits
- [ ] Test suite runs (even if minimal)
- [ ] Committed & pushed

---

## Phase 8: Backend Service Expansion

**Priority:** 🟢 MEDIUM-LOW  
**Estimated Time:** 4–8 hours  
**Agent Lead:** ARCHITECT (Systems) + TENSOR (ML Services)

### 8.1 — Implement Remaining Services

| Service        | Function                                | Endpoint                          |
| -------------- | --------------------------------------- | --------------------------------- |
| negative-space | Astronomical calculations, lunar phases | `/lunar-phase`, `/solar-position` |
| qhss           | Holographic data visualization          | `/render`, `/sphere-state`        |
| nexuszero      | Service orchestration, routing          | `/orchestrate`, `/health`         |
| doppelganger   | Creative AI transformations             | `/transform`, `/generate`         |
| elite-agents   | Agent management and dispatch           | `/agents`, `/dispatch`            |

### 8.2 — Inter-Service Communication

- Message queue (Redis pub/sub or RabbitMQ)
- Service discovery
- Health check aggregation
- Centralized logging

### Gate

- [ ] All 6 backend services start
- [ ] Health check passes for each
- [ ] Services communicate correctly
- [ ] Docker Compose brings up full stack
- [ ] Committed & pushed

---

## Phase 9: Testing & Quality

**Priority:** 🟢 MEDIUM-LOW  
**Estimated Time:** 3–4 hours  
**Agent Lead:** ECLIPSE (Testing & Verification)

### 9.1 — Test Coverage Targets

| Layer           | Target         | Framework             |
| --------------- | -------------- | --------------------- |
| Unit tests      | 80%            | Jest                  |
| Component tests | Key components | React Testing Library |
| API route tests | All routes     | Supertest             |
| E2E tests       | Critical flows | Playwright            |
| Backend tests   | All endpoints  | pytest                |

### 9.2 — Property-Based Testing

Use Hypothesis-style testing for:

- Lunar phase calculations
- Empire name generation
- Input sanitization

### Gate

- [ ] 80%+ code coverage
- [ ] E2E tests pass for core flow
- [ ] No critical security findings
- [ ] Committed & pushed

---

## Phase 10: Observability & Monitoring

**Priority:** 🟢 LOW  
**Estimated Time:** 2–3 hours  
**Agent Lead:** SENTRY (Observability)

### 10.1 — Logging

- Structured JSON logging (all services)
- Request/response logging (API routes)
- Error tracking (Sentry or equivalent)

### 10.2 — Metrics

- Prometheus metrics endpoint
- Request latency, error rates
- Empire deployment success rate
- Docker container health

### 10.3 — Dashboards

- Grafana dashboard for system overview
- Real-time empire deployment tracker

### Gate

- [ ] Logs aggregated and searchable
- [ ] Metrics collecting
- [ ] Alert for service down
- [ ] Committed & pushed

---

## Phase 11: Performance Optimization

**Priority:** 🟢 LOW  
**Estimated Time:** 2–3 hours  
**Agent Lead:** VELOCITY (Performance)

### 11.1 — Frontend

- Three.js scene optimization (instanced meshes, LOD)
- Code splitting and lazy loading
- Image optimization (next/image)
- Bundle size analysis and reduction

### 11.2 — Backend

- Response caching (Redis)
- Model inference optimization
- Connection pooling
- Rate limiting

### Gate

- [ ] Lighthouse performance ≥ 90
- [ ] First Load JS < 80 kB
- [ ] API response time < 200ms (p99)
- [ ] Committed & pushed

---

## Phase 12: Production Deployment

**Priority:** 🟢 LOW (defer until Phases 0–8 complete)  
**Estimated Time:** 4–6 hours  
**Agent Lead:** ATLAS (Cloud) + FLUX (DevOps) + AEGIS (Compliance)

### 12.1 — Infrastructure

- Vercel deployment for Next.js frontend
- Docker Compose → Kubernetes migration for backend
- Managed Qdrant instance
- Supabase production project

### 12.2 — Domain & SSL

- Custom domain configuration
- SSL certificates (automatic via Vercel/Let's Encrypt)
- CDN configuration

### 12.3 — Security Hardening

- Environment variable encryption
- API rate limiting
- CORS restriction (remove `allow_origins=["*"]`)
- Input validation on all endpoints
- CSP headers

### Gate

- [ ] Production deploy accessible
- [ ] SSL valid
- [ ] Security audit passed
- [ ] Monitoring active
- [ ] Final commit & tag (v1.0.0)

---

## Automation Scripts

### `scripts/setup.sh` — Full Environment Bootstrap

```bash
#!/bin/bash
echo "🍄 MYCELOFORGE — Environment Setup"

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "❌ Node.js >= 20 required (found v$NODE_VERSION)"
  exit 1
fi

# Install dependencies
npm ci --legacy-peer-deps

# Create .env.local from template
if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "📝 Created .env.local — fill in your API keys"
fi

# Build frontend
npm run build

# Build backend
docker-compose build

echo "✅ Setup complete. Run 'npm run dev:full' to start."
```

### `scripts/validate.sh` — Pre-Commit Validation

```bash
#!/bin/bash
echo "🔍 MYCELOFORGE — Validation"

npm run lint || exit 1
npm run build || exit 1
npm test || exit 1
docker-compose build || exit 1

echo "✅ All checks passed."
```

---

## Agent Delegation Map

Each phase maps to agents from the Elite Agent Collective for autonomous execution:

| Phase                | Primary Agent | Supporting Agents   |
| -------------------- | ------------- | ------------------- |
| 0. Secure Work       | ARBITER       | —                   |
| 1. Foundation        | FLUX          | APEX                |
| 2. Backend           | ARCHITECT     | FLUX, TENSOR        |
| 3. API Layer         | SYNAPSE       | APEX, FORTRESS      |
| 4. UI Enhancement    | CANVAS        | TENSOR              |
| 5. Data Layer        | PRISM         | SYNAPSE, VERTEX     |
| 6. Auth & Payments   | CIPHER        | FORTRESS, LEDGER    |
| 7. CI/CD             | FLUX          | ECLIPSE             |
| 8. Backend Expansion | ARCHITECT     | TENSOR, STREAM      |
| 9. Testing           | ECLIPSE       | APEX                |
| 10. Observability    | SENTRY        | FLUX                |
| 11. Performance      | VELOCITY      | APEX                |
| 12. Production       | ATLAS         | FLUX, AEGIS, CIPHER |

---

## Execution Priority Matrix

```
NOW (Do Today):
  ├── Phase 0: Commit & push ← 🔴 5 MINUTES
  └── Phase 1: Layout, .env, config ← 🔴 30 MINUTES

THIS WEEK:
  ├── Phase 2: Backend stubs + Docker ← 🟡 2-4 HOURS
  ├── Phase 3: API routes + error handling ← 🟡 1-2 HOURS
  └── Phase 7: CI/CD pipeline ← 🟡 1-2 HOURS

NEXT WEEK:
  ├── Phase 4: Animations + icons ← 🟡 2-3 HOURS
  ├── Phase 5: Supabase + Qdrant ← 🟡 2-3 HOURS
  └── Phase 6: Auth + payments ← 🟡 3-4 HOURS

FOLLOWING WEEKS:
  ├── Phase 8: Full backend services ← 🟢 4-8 HOURS
  ├── Phase 9: Testing suite ← 🟢 3-4 HOURS
  ├── Phase 10: Monitoring ← 🟢 2-3 HOURS
  ├── Phase 11: Performance ← 🟢 2-3 HOURS
  └── Phase 12: Production deploy ← 🟢 4-6 HOURS
```

**Total Estimated Effort:** 30–50 hours across all phases

---

## Autonomous Execution Command

To execute the next phase autonomously, invoke:

```
@OMNISCIENT coordinate Phase [N] of the MYCELOFORGE Next Steps Master Action Plan.
Delegate to the designated agent leads and execute all actions through to the gate criteria.
Commit and push upon completion.
```

---

_This Master Action Plan is a living document. Update phase status as work completes. Each phase is designed to be independently executable by the Elite Agent Collective with maximum autonomy._
