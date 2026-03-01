# MYCELOFORGE Docker Port Isolation

**Status:** ✅ Fully Isolated
**Port Range:** 24000-24999 (Unique to MYCELOFORGE)
**Network:** myceloforge-net (Custom bridge)

---

## Port Allocation Strategy

MYCELOFORGE uses a **dedicated 5-digit port range (24000-24999)** to ensure complete isolation from other Docker projects in shared environments.

### Why This Matters
- **Multi-Project Safety:** Prevents port conflicts with other services
- **Network Isolation:** Custom bridge network separates traffic
- **Unique Identification:** 24xxx prefix clearly identifies MYCELOFORGE
- **Scalability:** 1000 ports available for future services

---

## Service Port Mapping

| Service | External Port | Container Port | Purpose |
|---------|---------------|-----------------|---------|
| **Ryzanstein** | 24000 | 8000 | BitNet-7B LLM Service |
| **Negative-Space** | 24001 | 8001 | Astronomy & Lunar Calculations |
| **QHSS** | 24002 | 8002 | Holographic Sphere Visualization |
| **NexusZero** | 24003 | 8003 | Service Orchestrator |
| **Doppelganger** | 24004 | 8004 | Creative AI Transformation |
| **Elite-Agents** | 24005 | 8005 | Agent Management System |
| **Qdrant** | 24333 | 6333 | Vector Database |

---

## Environment Variables

All services are configured via environment variables with new port references:

```bash
# Service URLs (use these in .env.local)
RYZANSTEIN_API_URL=http://localhost:24000
NEGATIVE_SPACE_API_URL=http://localhost:24001
QHSS_API_URL=http://localhost:24002
NEXUSZERO_API_URL=http://localhost:24003
DOPPELGANGER_API_URL=http://localhost:24004
ELITE_AGENTS_API_URL=http://localhost:24005
QDRANT_URL=http://localhost:24333
```

---

## Docker Compose Configuration

### Custom Bridge Network
```yaml
networks:
  myceloforge-net:
    driver: bridge
```

**Benefits:**
- Services communicate internally via container names (no port exposure)
- Isolated from host network
- External access only through published ports
- DNS resolution within network

### Service Configuration Example
```yaml
service:
  build: ./path/to/service
  ports: ["24xxx:8000"]  # Host:Container
  networks:
    - myceloforge-net
  environment:
    - SERVICE_NAME=service-name
```

---

## Internal Communication (Docker Network)

When services communicate **inside the network**, they use **container names and internal ports**:

```python
# From NexusZero (inside Docker)
SERVICE_REGISTRY = {
    "ryzanstein": "http://ryzanstein:8000",      # Internal hostname
    "negative-space": "http://negative-space:8001",
    "qhss": "http://qhss:8002",
}
```

When accessing **from host machine**, use **localhost:24xxx**:

```bash
# From host machine
curl http://localhost:24000/v1/chat/completions
curl http://localhost:24001/lunar-phase
curl http://localhost:24333/collections
```

---

## API Route Defaults

All Next.js API routes use the new isolated ports:

### `/api/lunar-phase`
```typescript
const ryzansteinUrl = process.env.RYZANSTEIN_API_URL || "http://localhost:24000";
```

### `/api/empire/deploy`
```typescript
const ryzansteinUrl = process.env.RYZANSTEIN_API_URL || "http://localhost:24000";
```

### `/api/health`
```typescript
const ryzansteinUrl = process.env.RYZANSTEIN_API_URL || "http://localhost:24000";
const qdrantUrl = process.env.QDRANT_URL || "http://localhost:24333";
```

---

## Development Workflow

### Starting Services
```bash
# Build all images
docker-compose build

# Start all services (uses myceloforge-net)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Verifying Port Isolation
```bash
# Check if ports are in use
netstat -an | grep 24

# Test service connectivity
curl http://localhost:24000/health        # Ryzanstein
curl http://localhost:24001/health        # Negative-Space
curl http://localhost:24002/health        # QHSS
curl http://localhost:24003/health        # NexusZero
curl http://localhost:24004/health        # Doppelganger
curl http://localhost:24005/health        # Elite-Agents
curl http://localhost:24333/health        # Qdrant
```

---

## Coexistence with Other Projects

MYCELOFORGE can safely run alongside other Docker projects:

```
Project Alpha:    Ports 5000-5099   ✅ No conflict
Project Beta:     Ports 8000-8999   ✅ No conflict (MYCELOFORGE uses 24xxx)
Project Gamma:    Ports 3000-3999   ✅ No conflict
MYCELOFORGE:      Ports 24000-24999 ✅ Completely isolated
```

---

## Network Isolation Details

### What's Inside myceloforge-net
- All 7 MYCELOFORGE services
- Private Docker network (bridge mode)
- Automatic DNS resolution
- No exposure to other Docker networks

### Port Publishing
Only the specified ports are exposed to the host:
- 24000-24005 (Services)
- 24333 (Qdrant)

**All other ports remain internal.**

---

## Troubleshooting

### Port Already in Use
```bash
# Find what's using the port
lsof -i :24000

# Resolve conflict
# Option 1: Stop other Docker services
docker-compose down

# Option 2: Change MYCELOFORGE ports in docker-compose.yml
# Then update .env files accordingly
```

### Services Can't Communicate
```bash
# Verify network
docker network inspect myceloforge_myceloforge-net

# Check service connectivity inside container
docker-compose exec ryzanstein curl http://negative-space:8001/health
```

### Connection Refused
```bash
# Verify services are running
docker-compose ps

# Check logs
docker-compose logs ryzanstein

# Ensure .env files have correct URLs
cat .env.local | grep RYZANSTEIN_API_URL
```

---

## Migration Notes

If you previously ran MYCELOFORGE with ports 8000-8005, 6333:

1. **Update .env.local**
   ```bash
   # Old
   RYZANSTEIN_API_URL=http://localhost:8000
   QDRANT_URL=http://localhost:6333

   # New
   RYZANSTEIN_API_URL=http://localhost:24000
   QDRANT_URL=http://localhost:24333
   ```

2. **Stop old containers**
   ```bash
   docker-compose down
   ```

3. **Rebuild with new configuration**
   ```bash
   docker-compose build
   docker-compose up -d
   ```

4. **Verify new ports**
   ```bash
   curl http://localhost:24000/health
   ```

---

## Best Practices

✅ **DO:**
- Use `MYCELOFORGE_*` environment variable prefix for consistency
- Document any custom port overrides in your setup
- Use docker network names for inter-service communication
- Keep `.env.local` with correct port mappings

❌ **DON'T:**
- Hardcode ports in code (use environment variables)
- Change docker-compose.yml ports without updating .env.example
- Use ports outside 24000-24999 range for MYCELOFORGE
- Share myceloforge-net with other projects

---

## Future Expansion

The 24000-24999 range accommodates up to 1000 services:

```
Reserved for Phase 10-12:
- 24006-24099: New microservices
- 24100-24199: Cache/store services
- 24200-24299: Monitoring/logging
- 24300-24332: Additional support services
- 24334-24999: Future expansion
```

---

## References

- **Docker Compose:** `docker-compose.yml`
- **Environment Config:** `.env.example`, `.env.local`
- **API Routes:** `app/api/**/route.ts`
- **Backend Services:** `backend/*/main.py`

---

**Status:** Port isolation complete and verified ✅
**Last Updated:** February 28, 2026
**Isolation Level:** Complete (24000-24999 range)
