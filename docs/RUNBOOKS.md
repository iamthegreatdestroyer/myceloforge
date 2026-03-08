# MYCELOFORGE On-Call Runbooks

Quick reference guides for handling common production incidents.

---

## Service Down Alert

**Alert:** `ServiceDown` - Service unavailable for > 1 minute

### Diagnosis

```bash
# 1. Check pod status
kubectl get pods -n myceloforge-prod

# 2. Check service events
kubectl describe svc ryzanstein -n myceloforge-prod

# 3. Check recent logs
kubectl logs -f deployment/ryzanstein -n myceloforge-prod --tail=50

# 4. Check metrics
curl -s http://prometheus:24400/api/v1/query?query=up | jq

# 5. Check health endpoint
curl -v http://ryzanstein:8000/health
```

### Recovery

**If Pod is Crashing:**
```bash
# 1. Scale to 0 (stop service)
kubectl scale deployment/ryzanstein --replicas=0 -n myceloforge-prod

# 2. Check logs for errors
kubectl logs -p deployment/ryzanstein -n myceloforge-prod

# 3. Fix issue (config, image, etc.)
kubectl set env deployment/ryzanstein KEY=value -n myceloforge-prod

# 4. Scale back to 3
kubectl scale deployment/ryzanstein --replicas=3 -n myceloforge-prod

# 5. Verify recovery
kubectl rollout status deployment/ryzanstein -n myceloforge-prod
```

**If Image is Bad:**
```bash
# Rollback to previous version
kubectl rollout undo deployment/ryzanstein -n myceloforge-prod
kubectl rollout status deployment/ryzanstein -n myceloforge-prod
```

**If Node is Down:**
```bash
# Check node status
kubectl get nodes -n myceloforge-prod

# Drain node (move pods to other nodes)
kubectl drain <node-name> --ignore-daemonsets --delete-emptydir-data

# Check pod redistribution
kubectl get pods -n myceloforge-prod
```

---

## High Error Rate Alert

**Alert:** `HighErrorRate` - > 0.1% requests return errors

### Diagnosis

```bash
# 1. Check error rate in metrics
curl -s 'http://prometheus:24400/api/v1/query?query=rate(http_requests_total{status=~"5.."}[5m])'

# 2. Get top errors
kubectl logs -f deployment/ryzanstein -n myceloforge-prod | grep ERROR

# 3. Check database connectivity
kubectl exec -it pod/ryzanstein-xyz -n myceloforge-prod -- \
  psql -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME -c "SELECT 1"

# 4. Check third-party service status
curl -s https://api.stripe.com/health
curl -s https://api.supabase.co/health
```

### Recovery

**If Database is Down:**
```bash
# Check database status
pg_isready -h $DATABASE_HOST -p 5432

# Test connection
psql -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME -c "SELECT 1"

# If replica is available, update connection string
kubectl set env deployment/ryzanstein \
  DATABASE_URL=postgresql://replica.c.myceloforge.com:5432/myceloforge \
  -n myceloforge-prod

# Restart pods to pick up new environment
kubectl rollout restart deployment/ryzanstein -n myceloforge-prod
```

**If Third-Party Service Down:**
```bash
# Check Stripe status
curl -I https://api.stripe.com/v1/health

# Check Supabase status
curl -I https://api.supabase.co/health

# If unavailable, may need to queue requests
# Update fallback strategy in code

# Notify customers of issue
# Refer to customer communication template
```

**If Code Bug:**
```bash
# 1. Identify the issue from logs
kubectl logs -f deployment/ryzanstein -n myceloforge-prod | grep -A 10 "ERROR"

# 2. Deploy fix
git commit -m "fix: [description of fix]"
git push origin main
# GitHub Actions will build and deploy

# 3. Monitor error rate drop
watch -n 5 'curl -s http://prometheus:24400/api/v1/query?query=rate(http_requests_total{status=~"5.."}[5m]) | jq'
```

---

## High Latency Alert

**Alert:** `HighLatency` - p99 latency > 200ms

### Diagnosis

```bash
# 1. Check latency distribution
curl -s 'http://prometheus:24400/api/v1/query?query=histogram_quantile(0.99,http_request_duration_seconds_bucket)'

# 2. Identify slow endpoints
curl -s 'http://prometheus:24400/api/v1/query?query=topk(5,max by (endpoint) (http_request_duration_seconds))'

# 3. Check database query performance
kubectl exec -it pod/ryzanstein-xyz -n myceloforge-prod -- \
  psql -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME << EOF
SELECT query, mean_exec_time, calls FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 10;
EOF

# 4. Check system resources
kubectl top nodes
kubectl top pods -n myceloforge-prod

# 5. Check network performance
kubectl exec -it pod/ryzanstein-xyz -n myceloforge-prod -- \
  ping -c 5 database-host
```

### Recovery

**If Database Slow:**
```bash
# 1. Check for long-running queries
kubectl exec -it pod/ryzanstein-xyz -n myceloforge-prod -- \
  psql -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME << EOF
SELECT query, state, query_start FROM pg_stat_activity
WHERE state = 'active'
AND query_start < now() - interval '5 minutes';
EOF

# 2. Kill long-running queries
SELECT pg_terminate_backend(pid) FROM pg_stat_activity
WHERE query_start < now() - interval '10 minutes';

# 3. Analyze slow queries
EXPLAIN ANALYZE SELECT * FROM empires WHERE user_id = 'xyz';

# 4. Add indexes if needed
CREATE INDEX idx_empires_user_id ON empires(user_id);

# 5. Vacuum and analyze
VACUUM ANALYZE;
```

**If CPU/Memory High:**
```bash
# 1. Check pod resource usage
kubectl top pod <pod-name> -n myceloforge-prod

# 2. Increase resources if needed
kubectl set resources deployment/ryzanstein \
  --limits=cpu=1000m,memory=1Gi \
  --requests=cpu=500m,memory=512Mi \
  -n myceloforge-prod

# 3. If memory leak suspected, restart pods
kubectl rollout restart deployment/ryzanstein -n myceloforge-prod

# 4. Monitor after restart
watch -n 5 'kubectl top pod -l app=ryzanstein -n myceloforge-prod'
```

---

## Database Disk Space Alert

**Alert:** `DiskSpaceRunningLow` - < 10% free space

### Diagnosis

```bash
# Check disk usage
kubectl exec -it pod/ryzanstein-xyz -n myceloforge-prod -- \
  df -h

# Check largest tables
psql -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME << EOF
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
EOF

# Check for bloat
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema') ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Recovery

```bash
# 1. Clean up old data if applicable
DELETE FROM audit_logs WHERE created_at < now() - interval '1 year';
DELETE FROM old_sessions WHERE expires_at < now();

# 2. Vacuum to reclaim space
VACUUM FULL ANALYZE;

# 3. Monitor disk after cleanup
watch -n 5 'kubectl exec -it pod/ryzanstein-xyz -- df -h'

# 4. If still low, request disk expansion from provider
# Contact AWS/GCP/Azure or Supabase support

# 5. Consider archiving old data
# Export to S3 and delete locally
pg_dump myceloforge | aws s3 cp - s3://backups/archive-2026-03-07.sql.gz
```

---

## Memory Leak Suspected

**Alert:** Gradual memory increase without plateau

### Diagnosis

```bash
# 1. Monitor memory over time
watch -n 10 'kubectl top pod ryzanstein-xyz -n myceloforge-prod'

# 2. Check for connection leaks
psql -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME << EOF
SELECT count(*) FROM pg_stat_activity;
EOF

# 3. Review recent code changes
git log --oneline -20

# 4. Check for open file descriptors
kubectl exec pod/ryzanstein-xyz -n myceloforge-prod -- \
  lsof | wc -l
```

### Recovery

```bash
# 1. Restart pod to clear memory
kubectl delete pod ryzanstein-xyz -n myceloforge-prod
# New pod will be automatically created

# 2. If memory returns, it's likely a leak
# Implement gradual restart (chaos engineering)

# 3. Review code for:
# - Unbounded cache growth
# - Event listener leaks
# - Connection pool growth
# - Array/string concatenation in loops

# 4. Deploy fix and monitor
git commit -m "fix: memory leak in [component]"
kubectl rollout status deployment/ryzanstein -n myceloforge-prod
watch -n 10 'kubectl top pod -l app=ryzanstein -n myceloforge-prod'
```

---

## Deployment Failure

**Alert:** Rolling update stuck or failing

### Diagnosis

```bash
# 1. Check rollout status
kubectl rollout status deployment/ryzanstein -n myceloforge-prod

# 2. Check pod events
kubectl describe pod <pod-name> -n myceloforge-prod | tail -20

# 3. Check logs
kubectl logs <pod-name> -n myceloforge-prod --previous

# 4. Check image availability
docker pull ghcr.io/iamthegreatdestroyer/myceloforge/ryzanstein:latest
```

### Recovery

```bash
# 1. Pause rollout if needed
kubectl rollout pause deployment/ryzanstein -n myceloforge-prod

# 2. Check what's running
kubectl get pods -n myceloforge-prod -o wide

# 3. If old version is stuck, force delete pod
kubectl delete pod <pod-name> -n myceloforge-prod --grace-period=0 --force

# 4. Rollback if new version is bad
kubectl rollout undo deployment/ryzanstein -n myceloforge-prod

# 5. Resume rollout
kubectl rollout resume deployment/ryzanstein -n myceloforge-prod

# 6. Monitor
kubectl rollout status deployment/ryzanstein -n myceloforge-prod
```

---

## Certificate Expiration Alert

**Alert:** SSL certificate expiring in < 7 days

### Diagnosis

```bash
# Check certificate expiration
echo | openssl s_client -servername myceloforge.com -connect myceloforge.com:443 2>/dev/null | \
  openssl x509 -noout -dates
```

### Recovery

**If Using Vercel:**
```bash
# Vercel automatically renews certificates
# No action needed
# Verify in Vercel dashboard under SSL settings
```

**If Self-Hosted:**
```bash
# Renew certificate with Let's Encrypt
certbot renew --force-renewal

# Update Kubernetes secret
kubectl create secret tls tls-secret \
  --cert=path/to/cert.pem \
  --key=path/to/key.pem \
  -n myceloforge-prod \
  --dry-run=client -o yaml | kubectl apply -f -

# Verify update
kubectl describe secret tls-secret -n myceloforge-prod
```

---

## Escalation Guide

**When to escalate:**

| Scenario | Action |
|----------|--------|
| Issue unresolved > 15 min | → Level 2 (Engineering Lead) |
| Issue unresolved > 30 min | → Level 3 (CTO) |
| Customer impact confirmed | → Level 2 immediately |
| Unknown root cause | → Level 2 for consultation |
| Multiple systems down | → Level 3 immediately |

---

## Quick Command Reference

```bash
# View all pods
kubectl get pods -n myceloforge-prod

# View pod details
kubectl describe pod <pod-name> -n myceloforge-prod

# View logs
kubectl logs deployment/ryzanstein -n myceloforge-prod
kubectl logs -f deployment/ryzanstein -n myceloforge-prod  # follow
kubectl logs <pod-name> -n myceloforge-prod --previous     # previous container

# Scale replicas
kubectl scale deployment/ryzanstein --replicas=5 -n myceloforge-prod

# Restart deployment
kubectl rollout restart deployment/ryzanstein -n myceloforge-prod

# Check rollout history
kubectl rollout history deployment/ryzanstein -n myceloforge-prod

# Rollback
kubectl rollout undo deployment/ryzanstein -n myceloforge-prod

# View metrics
kubectl top nodes
kubectl top pods -n myceloforge-prod

# Execute command in pod
kubectl exec -it <pod-name> -n myceloforge-prod -- bash

# Port forward for debugging
kubectl port-forward pod/<pod-name> 8000:8000 -n myceloforge-prod

# Update environment variable
kubectl set env deployment/ryzanstein KEY=value -n myceloforge-prod

# Apply configuration
kubectl apply -f k8s/ -n myceloforge-prod
```

---

**Last Updated:** 2026-03-07
**Review Frequency:** Quarterly
**Owner:** Engineering Lead
