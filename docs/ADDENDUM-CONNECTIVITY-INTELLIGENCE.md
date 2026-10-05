# ADDENDUM — GLOBAL CONNECTIVITY INTELLIGENCE, PWA & DEVICE MEASUREMENT

**Status:** Mandatory. Extends `docs/MASTER-ENGINEERING-DIRECTIVE.md`.
**Strategic shift:** *speed-test app → connectivity intelligence network.* A phone, laptop, PWA, future mobile app, desktop agent and router agent are all **sensors**; the intelligence engine is the product.

InternetYangu must be designed as a **global connectivity intelligence platform**, not a website containing a speed-test page. It must work exceptionally well on smartphones, tablets, laptops, desktops, installed PWAs — and eventually native mobile apps, desktop agents and router agents — turning distributed measurements into geographic and provider intelligence.

---

## 1. Core Product Principle

The platform must answer:

> **"How good is connectivity here, right now and historically?"**
> **"Which provider is actually performing best in this area?"**

This must work at global scale. Resolution chain:

```text
User location → Area intelligence → Provider measurements → Historical performance
→ Current conditions → Confidence → Recommendation
```

The system must **never** assume a provider performs equally everywhere. Two areas can produce completely different rankings for the same provider.

## 2. PWA-First Product

The web application must be engineered as a high-quality Progressive Web App:

```text
Visit → Install → Open from home screen → Use like an application
```

The experience must not feel like "visiting a website"; it must feel like "this is my internet intelligence app."

## 3. PWA Requirements

Audit and implement where missing:

- Web App Manifest, installability, service worker, app icons, splash experience
- Offline shell and offline-capable UI where appropriate; cache strategy
- Background synchronization where browser capabilities permit; push notifications where supported
- Install prompts, update mechanism, version management
- Network-aware UI, mobile navigation, safe-area support, responsive layouts

Must work across modern Android, iOS/iPadOS, Chrome, Safari, Edge, Firefox (where supported) and desktop Chromium. **Never assume identical capabilities; degrade gracefully.**

## 4. Mobile-First Experience

The primary mobile experience serves users with slow, expensive or intermittent internet, small screens, low-end devices, limited storage and battery. **Never build a desktop UI and simply shrink it.** Design mobile intentionally. Priority flow:

```text
Current connection → Run test → Internet score → Area intelligence → Provider recommendation
```

The most important actions must be reachable within one or two taps.

## 5. Laptop / Desktop Experience

Laptop/desktop users receive a richer dashboard (persistent navigation rail, score panel, detailed metrics). Responsive behavior must be **deliberately designed**, never accidental CSS wrapping.

## 6. Connection Test Center

A dedicated **Test My Internet** experience supporting *Test Wi-Fi*, *Test Mobile Data* and *Test Current Connection*. It must clearly explain what is being tested and present download, upload, latency, jitter and packet loss before and after the run.

## 7. Mobile Data Testing

Before starting, state: *"This test may use mobile data."* Where the estimate is available, show **estimated data usage (~X MB)** and always allow cancellation. Record where technically permitted: provider, connection type, approximate geographic area, speeds, latency, jitter, packet loss, timestamp, test server, measurement quality. **Never silently consume significant mobile data.**

## 8. Wi-Fi Testing

Distinguish **testing the internet connection over Wi-Fi** from **scanning nearby Wi-Fi networks**. These are not the same capability. The web/PWA must never claim a browser can enumerate nearby SSIDs.

## 9. Native Device Intelligence

Leave architectural room for future native companions (Android: Wi-Fi/carrier/signal/background measurement where OS permissions allow; iOS: only APIs Apple actually provides; desktop agent: full network observability). **Do not pretend browser APIs provide capabilities they do not.**

## 10. Global Connectivity Intelligence Engine

Every measurement contributes to a structured intelligence model:

```text
DEVICE → MEASUREMENT → PROVIDER → NETWORK TYPE → GEOGRAPHIC CELL
→ TIME → QUALITY → AGGREGATION → INTELLIGENCE
```

The engine must answer: *"How is Provider X performing in this area?"*

## 11. Geographic Intelligence

Never tie public results to an exact address. Use privacy-preserving geographic cells:

```text
Country → Region → County/State/Province → City → Neighborhood → Geographic Cell
```

When local data is insufficient, fall back upward (cell → neighborhood → city → regional) explicitly.

## 12. Provider Performance By Area

Provider scores are geographically contextual. Example shapes (illustrative only — **never fabricate production data**; values must come from the intelligence dataset):

```text
NAIROBI      Safaricom 84 · Airtel 87 · Faiba 91
KILELESHWA   Safaricom 71 · Airtel 88 · Faiba 94
WESTLANDS    Safaricom 93 · Airtel 89 · Faiba 86
```

## 13. Time-Aware Intelligence

Connectivity quality changes over time. Support current, last hour, today, last 7 days, last 30 days and historical trends; analyze morning/afternoon/evening/night, peak hours, weekday vs weekend. A provider may look excellent at 3 AM and terrible at 8 PM — the engine must detect that.

## 14. "Poor Here, Good There" Intelligence

Detect spatial differences and explain them against the baseline:

> Provider X: overall city performance **Good**, your area **Poor** — observed latency is significantly higher than the city baseline in this area, with elevated peak-hour packet loss.

This is far more useful than a generic provider rating.

## 15. "Which Network Is Best Here?"

A dedicated **best connectivity around you** experience: ranked providers with scores, statuses and the *why* — recent performance, latency, reliability, peak-hour consistency, measurement count, contributor count, confidence.

## 16. Mobile Network Comparison

Per-area mobile comparison (download / latency / reliability per carrier). Illustrative values only; the real system must use measured data.

## 17. Home Internet Comparison

Same for fixed connectivity across fiber, fixed wireless, cable, DSL, satellite, mobile broadband and other technologies.

## 18. Connection Type Matters

Never compare all measurements blindly. Separate mobile, Wi-Fi, fiber, Ethernet, fixed wireless, satellite, cable, DSL and other. A mobile measurement must not distort a fiber provider's score. Where possible, distinguish **ISP/network performance** from **local Wi-Fi performance**.

## 19. Wi-Fi vs Internet Diagnosis

The platform should eventually answer *"Is my Wi-Fi bad or is my internet provider bad?"* with two clear verdicts: local link healthy vs external connection degraded (and the reverse). This is a major product differentiator.

## 20. Measurement Quality

Every measurement carries quality metadata (connection type, test kind, stability, background activity, confidence). Poor-quality tests must not carry the same statistical weight as controlled tests.

## 21. Contributor Intelligence

Contributions are opt-in and explicit:

```text
Shared:     provider · approximate area · network type · speed · latency · packet loss · timestamp
Not shared: name · phone · email · exact address · raw SMS · account credentials · exact personal history
```

## 22. Data Flywheel

The system must intentionally create and protect the core defensibility loop:

```text
User → Measurement → Privacy filter → Aggregation → Area intelligence
→ Provider intelligence → Recommendation → New user → More measurements
```

The product becomes better as the network grows.

## 23. Global Provider Model

Do not hardcode the architecture around Kenyan providers. The domain model must support country, provider, provider type, network technology, plans, coverage, measurements, performance and pricing. A provider is represented independently from geography and may operate across multiple countries.

## 24. Global Provider Identity

Provider records need stable identifiers: global identity, country operations, brands, technologies, plans, coverage, performance. Never create duplicate providers simply because plans differ by country.

## 25. Intelligence API

Expose the intelligence layer as an API (eventually):

```text
GET /v1/intelligence/areas/{area}
GET /v1/intelligence/providers
GET /v1/intelligence/providers/{provider}
GET /v1/intelligence/providers/{provider}/areas/{area}
GET /v1/intelligence/recommendations
GET /v1/intelligence/mobile
GET /v1/intelligence/fixed
GET /v1/intelligence/outages
```

Responses include score, measurements, confidence, time window, provider, geography, methodology version and data freshness.

## 26. Intelligence Versioning

Scores and algorithms will change. Store algorithm version, score version, aggregation version and data window so any historical score remains reproducible (e.g. `Provider score: 87 · Algorithm v2.4 · 30-day window · Generated 2026-10-05`). This is critical for auditability.

## 27. Anomaly Detection

The engine must detect suspicious measurements: impossible speeds, repeated identical values, abnormal frequency, automated abuse, measurement flooding, device manipulation, location anomalies, provider spoofing, sudden statistical anomalies. **No single device may manipulate public rankings.**

## 28. Internet Outage Intelligence

When many independent users degrade in the same area/provider/time window: measurements → anomaly detection → spatial clustering → provider correlation → incident. Confidence-gated language only: **possible degradation / likely incident / confirmed incident**. Never call an outage without sufficient evidence.

## 29. User Alerts

Support provider degradation, outage, recovery, performance-drop, spending, plan-expiry and recommendation-change alerts. PWA push where the platform allows; users always control notification preferences.

## 30. Low-Bandwidth Design

InternetYangu itself must remain usable on poor connections. Optimize JS bundle size, images, fonts, API payloads, caching, hydration, route loading, chart data and polling. Prefer small payload + cached shell + progressive loading. **Do not make a good connection a requirement for diagnosing a bad one.**

## 31. Offline Experience

Provide useful offline functionality: last known connection status, last measurement time, last known area status, retry affordance. Never display stale information as current — always mark "last updated X minutes ago."

## 32. PWA Installation Promotion

No aggressive install prompts. After meaningful engagement, present the value (faster access, monitoring, alerts, offline dashboard, quick tests) with Install / Not now. The product must work perfectly without installation.

## 33. Mobile Quick Actions

On mobile, prioritize: Test Internet · Find Internet · My Internet · Area Intelligence · Provider Comparison — with an extremely fast **"Check my area"** action.

## 34. "Check This Area" Experience

Search an area and immediately receive its connectivity intelligence summary (overall status, best mobile, best fixed, best value, peak-hour risk, data confidence). **No account may be required merely to explore public intelligence.**

## 35. Location Privacy

Location access is optional wherever possible ("Use my location" **or** "Search an area"). Never force precise GPS. For measurements requiring location: obtain consent, minimize precision, use geographic cells, avoid exposing exact coordinates, document retention.

## 36. Location Permission UX

Explain the benefit — *"We use your approximate location to understand connectivity performance in your area"* — never "We need your location."

## 37. Global Intelligence Dashboard

Eventually publish country/region/city/provider trends, outages and indexes (Global Connectivity, Reliability, Affordability, Provider Performance, Mobile, Fixed Broadband) — all with transparent methodologies.

## 38. No False Global Claims

Distinguish `measured / observed / reported / estimated / provider-supplied / unknown`. Never present incomplete data as global truth. "InternetYangu has limited data in this area" is always better than an invented ranking.

## 39. Product Architecture

```text
                    INTERNETYANGU
                          │
          ┌───────────────┼────────────────┐
       CONSUMER        INTELLIGENCE       PLATFORM
       PWA/Web         Measurements        APIs
       Mobile          Aggregation         Providers
       Desktop         Scoring             Integrations
                       Detection           Data
                       Recommendations     Identity
                          │
                    DATA PLATFORM
               ┌──────────┼──────────┐
           Private     Aggregate    Public
             Data        Data       Data
```

## 40. Engineering Requirement — Capability Audit

During every audit, classify each capability as `COMPLETE / PARTIAL / BROKEN / UI ONLY / BACKEND ONLY / UNTESTED / MISSING`:

PWA · service worker · offline shell · installability · responsive mobile UI · mobile navigation · connection testing · mobile data testing · Wi-Fi testing · provider detection · location intelligence · geographic aggregation · provider comparison · area intelligence · measurement ingestion · measurement validation · recommendation engine · confidence scoring · outage detection · privacy controls · anonymous contribution · notification infrastructure.

**Create a GitHub issue for every material gap.**

## 41. Priority

**P0/P1:** mobile usability · responsive desktop usability · PWA foundation · connection testing · measurement ingestion · measurement validation · geographic aggregation · provider intelligence · area intelligence · recommendation engine · privacy boundary · confidence system.

**P1/P2:** offline experience · push notifications · mobile network comparison · Wi-Fi diagnosis · outage intelligence · historical intelligence · provider comparison · public connectivity maps · global provider model · intelligence API.

## 42. Final Engineering Principle

The engineering team must optimize not only for application functionality, but for the **quality, integrity, privacy, geographic accuracy, statistical confidence and freshness** of the underlying intelligence:

```text
DEVICES (phone · laptop · router …) → MEASUREMENTS → PRIVACY PROCESSING
→ AGGREGATION → INTELLIGENCE ENGINE
→ PROVIDER / AREA / TIME INTELLIGENCE → RECOMMENDATIONS → USER EXPERIENCE
```

The intelligence dataset — and the system that produces it — is one of InternetYangu's primary long-term assets.
