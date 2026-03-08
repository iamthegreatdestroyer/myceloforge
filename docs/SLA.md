# MYCELOFORGE Service Level Agreement

**Effective Date:** 2026-03-07
**Last Updated:** 2026-03-07
**Version:** 1.0

---

## Service Description

MYCELOFORGE is an AI-powered empire deployment platform providing real-time empire creation through mycelial networks with blockchain integration.

**Covered Services:**
- Empire deployment API
- Lunar phase calculations
- Holographic visualization
- User authentication and authorization
- Payment processing
- Vector search capabilities

---

## SLA Commitments

### Availability

**Target:** 99.9% monthly uptime
**Maximum Downtime:** 43 minutes per calendar month
**Measurement:** Percentage of successful API requests

```
99.9% Uptime Calculation:
Minutes per month: 30 days × 24 hours × 60 min = 43,200 minutes
Maximum downtime: 43,200 × 0.001 = 43.2 minutes
```

**Availability Tiers:**

| Tier | Uptime | Downtime/Month | Credit |
|------|--------|----------------|--------|
| Tier 1 | ≥ 99.99% | 0-4.3 min | None |
| Tier 2 | 99.9%-99.99% | 4.3-43 min | 10% |
| Tier 3 | 99%-99.9% | 43-432 min | 25% |
| Tier 4 | < 99% | > 432 min | 50% |

### Performance

**API Response Latency:**
- **p50 (median):** < 100ms
- **p95:** < 150ms
- **p99:** < 200ms

**Frontend Performance:**
- **Largest Contentful Paint (LCP):** < 2.5 seconds
- **First Input Delay (FID):** < 100 milliseconds
- **Cumulative Layout Shift (CLS):** < 0.1

**Lighthouse Score:** ≥ 90 (desktop and mobile)

### Error Rate

**Target:** < 0.1% of requests return errors
**Definition:** 5xx or timeout errors / total requests

**Tolerance by Severity:**
- **5xx Errors:** < 0.05%
- **Timeouts:** < 0.05%
- **4xx Errors:** Unlimited (client error)

### Recovery Objectives

**Recovery Time Objective (RTO):**
- Critical services: 15 minutes
- Non-critical services: 1 hour
- Full system restore: 4 hours

**Recovery Point Objective (RPO):**
- Database: < 1 minute (continuous replication)
- Configuration: < 10 minutes (git history)
- User data: < 1 minute

---

## Exclusions (Service Not Available)

Service credits do NOT apply to unavailability caused by:

1. **Scheduled Maintenance**
   - Announced > 24 hours in advance
   - Weekend maintenance (Friday 22:00 - Monday 08:00 UTC)
   - Maximum 2 hours per month

2. **Force Majeure**
   - Natural disasters
   - War, terrorism, civil unrest
   - Government actions
   - Internet infrastructure failures outside our control

3. **Third-Party Services**
   - Supabase database outages
   - Stripe payment processing failures
   - Solana blockchain issues
   - Qdrant vector database outages
   - GitHub or Docker registry outages
   - Internet service provider failures

4. **Customer Issues**
   - DDoS attacks targeting customer infrastructure
   - Incorrect customer configuration
   - Customer abuse or policy violations
   - Customer-provided dependencies or data

5. **Beta or Preview Services**
   - Features marked as "Beta", "Preview", or "Experimental"
   - Early access features

---

## Measurement & Reporting

### Uptime Calculation

**Formula:**
```
Uptime % = (Total Minutes - Downtime Minutes) / Total Minutes × 100%

Where:
- Total Minutes = 43,200 (30 days × 24 hours × 60 min)
- Downtime Minutes = Consecutive 5-minute periods with > 10% error rate
```

### Monitoring

**Uptime Monitoring:**
- Global synthetic monitoring (5-minute intervals)
- Real user monitoring (RUM)
- Multi-region checks (US, EU, APAC)

**Performance Monitoring:**
- Prometheus metrics (15-second intervals)
- Grafana dashboards (real-time)
- Client-side Web Vitals tracking

**Incident Detection:**
- Automated alerting (< 1 minute)
- Manual verification (< 5 minutes)
- Customer notification (< 15 minutes)

### Reporting

**Monthly SLA Report:**
- Published by 5th of following month
- Available at: https://status.myceloforge.com
- Includes:
  - Uptime percentage
  - Incident summary
  - Performance metrics
  - Service credits issued

**Service Credits:**
- Automatically applied to next month's invoice
- No claim required
- Cannot be transferred or refunded
- Maximum 50% of monthly fees per month

---

## Incident Response

### Incident Severity Levels

**P1 (Critical):** Complete service outage
- Target response: 5 minutes
- Target resolution: 15 minutes
- Escalation: Immediate

**P2 (High):** Service degradation (> 10% error rate)
- Target response: 15 minutes
- Target resolution: 1 hour
- Escalation: 30 minutes

**P3 (Medium):** Minor issue (< 10% error rate)
- Target response: 1 hour
- Target resolution: 4 hours
- Escalation: 2 hours

**P4 (Low):** Non-critical issue
- Target response: 4 hours
- Target resolution: 24 hours
- Escalation: 8 hours

### Incident Communication

**During Incident:**
- Status page updated every 15 minutes
- High-priority customers notified directly
- Slack/email notifications to subscribers

**Post-Incident:**
- Post-mortem published within 24 hours
- Root cause analysis within 48 hours
- Preventive measures documented

---

## Support

### Support Channels

- **Email:** support@myceloforge.com (24/7)
- **Chat:** Discord community (business hours)
- **Status Page:** https://status.myceloforge.com
- **Incident Hotline:** +1-[phone] (P1 only)

### Support Hours

- **Tier 1 (Chat):** Mon-Fri 09:00-17:00 UTC
- **Tier 2 (Email):** 24/7
- **Tier 3 (Phone):** Mon-Fri 09:00-17:00 UTC
- **P1 Hotline:** 24/7/365

### First Response Times

| Severity | Email | Chat | Phone |
|----------|-------|------|-------|
| P1 | 5 min | N/A | 5 min |
| P2 | 15 min | 15 min | 30 min |
| P3 | 1 hour | 30 min | 2 hours |
| P4 | 4 hours | 2 hours | 4 hours |

---

## Maintenance Windows

### Planned Maintenance

- **Frequency:** Maximum 2 hours per month
- **Announcement:** > 24 hours in advance
- **Preferred Time:** Weekends (Friday 22:00 - Monday 08:00 UTC)
- **Service Impact:** Minimal (rolling updates, zero-downtime)

### Emergency Maintenance

- **Announcement:** > 1 hour in advance (if possible)
- **Duration:** < 30 minutes target
- **Frequency:** < 2 times per quarter

### Maintenance Window Format

```
[SCHEDULED MAINTENANCE]
Service: MYCELOFORGE API
Start: 2026-03-15 22:00 UTC
Duration: 1 hour
Impact: Minimal (< 1% users)
Reason: Database optimization and backup
```

---

## Customer Responsibilities

Customers agree to:

1. **Follow Usage Guidelines**
   - Maximum 1000 requests per minute per API key
   - Maximum 10GB data transfer per month
   - Reasonable use of compute resources

2. **Secure Credentials**
   - Never expose API keys in code
   - Rotate keys every 90 days
   - Report compromised keys immediately

3. **Report Issues**
   - Use proper support channels
   - Provide reproduction steps for bugs
   - Test in staging before production

4. **Comply with Terms**
   - No abuse or DDoS attacks
   - No data scraping
   - No reverse engineering
   - No unlawful use

---

## Service Level Credits

### Credit Request Process

1. **Submit Claim**
   - Email: support@myceloforge.com
   - Subject: "SLA Credit Request - [Date]"
   - Include: Incident details, impact timeline, documentation

2. **Verification**
   - Team verifies incident occurred
   - Confirms SLA exclusions don't apply
   - Calculates applicable credit

3. **Credit Issue**
   - Applied to next month's invoice
   - Email confirmation sent
   - Credit receipt provided

### Credit Calculation

```
Monthly Fee = $X
Uptime %:
- 99.9% to 99.99% = 10% credit
- 99% to 99.9% = 25% credit
- < 99% = 50% credit

Credit = Monthly Fee × Credit %
Maximum = 50% of Monthly Fee
```

### Credit Example

```
Scenario:
- Monthly fee: $1,000
- Uptime: 99.2% (43 minutes downtime)
- Falls in 99% to 99.9% tier

Credit = $1,000 × 25% = $250
```

---

## Limitation of Liability

MYCELOFORGE is provided "as is" without warranties. Maximum liability is limited to:

- **Service Credits Only** for performance/availability issues
- **Refund of Services** for non-provision of service
- **No Liability** for:
  - Loss of data or revenue
  - Business interruption
  - Indirect or consequential damages
  - Third-party claims

---

## SLA Reviews & Updates

This SLA is reviewed quarterly and updated annually.

**Next Review:** 2026-06-07
**Last Review:** 2026-03-07
**Approved By:** CTO

---

## Contact & Questions

**SLA Questions:** sla@myceloforge.com
**Support:** support@myceloforge.com
**Status Page:** https://status.myceloforge.com

---

**Effective Until:** 2027-03-07 (renewable annually)
