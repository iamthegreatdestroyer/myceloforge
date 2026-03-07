# MYCELOFORGE Disaster Recovery Plan

## Recovery Objectives

### Recovery Time Objective (RTO)
- **Critical Services:** 15 minutes
- **Non-critical Services:** 1 hour
- **Full System Restore:** 4 hours

### Recovery Point Objective (RPO)
- **Database:** < 1 minute (continuous replication)
- **File Storage:** < 1 hour (daily snapshots)
- **Configuration:** < 10 minutes (git history)

---

## Backup Strategy

### Database Backups (Supabase)

**Frequency:**
- Continuous replication to standby
- Daily snapshots (30-day retention)
- Weekly full backups (90-day retention)
- Monthly snapshots (1-year retention)

**Verification:**
```bash
# Test restore from latest backup (weekly)
pg_restore -d test_db backup_latest.sql

# Verify data integrity
SELECT COUNT(*) FROM empires;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM transactions;
```

**Restore Procedure:**
```bash
# 1. Create new database from backup
pg_restore -d myceloforge_restore backup_file.sql

# 2. Verify integrity
psql -d myceloforge_restore -c "SELECT COUNT(*) FROM empires;"

# 3. Test application connectivity
npm run test:db-connection

# 4. Switch application if verified
# Update DATABASE_URL to point to restored database
# Restart services
kubectl rollout restart deployment/ryzanstein -n myceloforge-prod
```

### File Storage Backups (Supabase Storage)

**Frequency:**
- Daily snapshots at 02:00 UTC
- Incremental backups every 6 hours
- 30-day retention

**Restore Procedure:**
```bash
# Restore from date
supabase storage download --bucket empires-data --date 2026-03-07

# Verify file integrity
md5sum -c empire-checksums.txt
```

### Configuration Backups (Git)

**Strategy:**
- All configuration in version control
- Environment secrets in secure vault
- Automatic backups on every push

**Restore Procedure:**
```bash
# Recover configuration from git
git clone https://github.com/iamthegreatdestroyer/myceloforge.git
git checkout v1.0.0  # or specific tag

# Restore secrets from vault
vault kv get myceloforge/production > .env.production
```

---

## Failure Scenarios & Recovery

### Scenario 1: Single Service Failure

**Detection:** Health check fails for 1 minute

**Automatic Recovery (< 2 minutes):**
1. Kubernetes detects unhealthy pod
2. Pod is automatically restarted
3. New instance joins service mesh
4. Traffic reroutes to healthy pods

**Manual Recovery (if automatic fails):**
```bash
# Restart service
kubectl rollout restart deployment/ryzanstein -n myceloforge-prod

# Monitor recovery
kubectl get pods -n myceloforge-prod
kubectl logs -f deployment/ryzanstein -n myceloforge-prod
```

### Scenario 2: Database Failure

**Detection:** Connection pool exhaustion or query timeout

**Recovery Procedure (< 10 minutes):**
```bash
# 1. Check database status
pg_isready -h prod-db.c.myceloforge.com

# 2. Attempt connection reset
kubectl exec -it deployment/ryzanstein -n myceloforge-prod \
  -- pg_connection_reset

# 3. If failed, failover to replica
# Update DATABASE_URL to replica endpoint
kubectl set env deployment/ryzanstein \
  DATABASE_URL=postgresql://replica.c.myceloforge.com:5432/myceloforge \
  -n myceloforge-prod

# 4. Promote replica to primary (if needed)
# Contact database provider or execute:
pg_promote

# 5. Update configuration
kubectl apply -f k8s/configmap.yaml
```

### Scenario 3: Complete Data Center Failure

**Detection:** All services down for > 5 minutes

**Recovery Procedure (< 15 minutes):**
```bash
# 1. Activate standby data center
# Switch DNS to DR cluster
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch file://dr-failover.json

# 2. Restore database from backup
# Use Supabase DR replica (automatic)
# Or manually restore:
pg_restore -d myceloforge \
  -h dr-backup.c.myceloforge.com \
  backup_latest.sql

# 3. Deploy services to DR cluster
kubectl apply -f k8s/ -n myceloforge-prod \
  --kubeconfig=kubeconfig-dr.yaml

# 4. Update external configuration
# Stripe webhooks -> new IP
# Auth provider redirects -> new domain
# CDN -> new origin

# 5. Verify services
curl -f https://myceloforge.com/api/health
curl -f https://myceloforge.com/api/metrics
```

### Scenario 4: Data Corruption

**Detection:** Integrity checks fail or users report issues

**Recovery Procedure (< 30 minutes):**
```bash
# 1. Pause all write operations
kubectl scale deployment/ryzanstein --replicas=0 -n myceloforge-prod

# 2. Restore database from pre-corruption backup
# Identify last good backup timestamp
supabase backups list

# 3. Restore to specific point-in-time
pg_restore -d myceloforge \
  backup_before_corruption.sql

# 4. Verify integrity
psql -d myceloforge << EOF
SELECT COUNT(*) FROM empires;
SELECT SUM(amount) FROM transactions;
-- Compare against expected values
EOF

# 5. Resume operations
kubectl scale deployment/ryzanstein --replicas=3 -n myceloforge-prod
kubectl rollout status deployment/ryzanstein -n myceloforge-prod
```

### Scenario 5: Security Incident

**Detection:** Unauthorized access detected

**Immediate Response (< 5 minutes):**
```bash
# 1. Isolate affected service
kubectl delete pod -l app=ryzanstein -n myceloforge-prod

# 2. Revoke compromised credentials
vault kv delete myceloforge/production/api-keys/ryzanstein

# 3. Generate new credentials
vault kv put myceloforge/production/api-keys/ryzanstein \
  key=$(openssl rand -hex 32)

# 4. Update service configuration
kubectl set env deployment/ryzanstein \
  API_KEY=$(vault kv get -field=key myceloforge/production/api-keys/ryzanstein) \
  -n myceloforge-prod

# 5. Restart service
kubectl rollout restart deployment/ryzanstein -n myceloforge-prod
```

---

## Testing & Validation

### Monthly Disaster Recovery Drill

**Procedure:**
```bash
# 1. Announce DR drill (notify team)
echo "🚨 DR DRILL: $(date)" | slack-notify

# 2. Create test environment
kubectl create namespace myceloforge-dr-test

# 3. Restore from backup to test cluster
pg_restore -d myceloforge_test \
  backup_latest.sql

# 4. Deploy services to test cluster
kubectl apply -f k8s/ -n myceloforge-dr-test

# 5. Run smoke tests
npm run test:smoke --baseURL=http://test-cluster:3000

# 6. Measure RTO
echo "RTO: $(date - start_time)"

# 7. Cleanup
kubectl delete namespace myceloforge-dr-test
```

### Quarterly Failover Test

**Procedure:**
1. Announce 1-hour maintenance window
2. Failover to DR site
3. Monitor error rates (target: < 0.1%)
4. Failback to primary
5. Document lessons learned

---

## Contact & Escalation

### On-Call Rotation

**Level 1 (Incident Triage):**
- Name: [To be assigned]
- Phone: [Emergency contact]
- Escalate if: Unresolved > 15 min

**Level 2 (Engineering Lead):**
- Name: [To be assigned]
- Phone: [Emergency contact]
- Escalate if: Unresolved > 30 min or customer-impacting

**Level 3 (CTO/Director):**
- Name: [To be assigned]
- Phone: [Emergency contact]

### Incident Communication

**During Incident:**
1. Post to #incidents Slack channel
2. Update status page every 15 minutes
3. Notify major customers directly if > 30 min outage

**Post-Incident:**
1. Document root cause
2. Create post-mortem within 24 hours
3. Implement preventive measures
4. Share learnings with team

---

## SLA Commitments

| Metric | Target | Maximum Downtime |
|--------|--------|------------------|
| Uptime | 99.9% | 43 minutes/month |
| RTO | < 15 min | 15 minutes |
| RPO | < 1 min | 1 minute |
| Backup Test | Monthly | - |

---

## Runbooks

### Database Recovery Runbook

See: [docs/RUNBOOKS.md#database-recovery](./RUNBOOKS.md#database-recovery)

### Service Restart Runbook

See: [docs/RUNBOOKS.md#service-restart](./RUNBOOKS.md#service-restart)

### Failover Runbook

See: [docs/RUNBOOKS.md#failover](./RUNBOOKS.md#failover)

---

## Compliance & Audit

**Last Updated:** 2026-03-07
**Next Review:** 2026-04-07
**Last Test:** 2026-02-07
**Next Test:** 2026-04-07

Approved by: [CTO/Director]
