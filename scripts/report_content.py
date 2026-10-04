"""LinkPulse investor concept report - content module (English).
Block types consumed by build_report.py:
  ('p', text)                      paragraph (supports <b> <i>)
  ('h2', text)                     sub-heading
  ('bullets', [items])             bullet list
  ('stats', [(value, label), ...]) stat callout row (max 4)
  ('quote', text)                  pull quote
  ('table', dict)                  table: title, header[], rows[][], ratios[]
  ('chart', dict)                  figure: path, caption, max_h
"""

C = []

# ------------------------------------------------------------------ Ch 1
C.append(dict(id="ch1", title="1. Executive Summary", blocks=[
    ("p", "LinkPulse (working name) is a web-first progressive web app (PWA) that turns the "
          "lesson of the open-source Starlink monitor <b>Dishylink</b> into a universal product: a single, "
          "private, local-first dashboard for every network a household or small business touches. "
          "In markets like Kenya, a typical connected family already juggles Safaricom mobile data, a "
          "Zuku, Faiba, Airtel or Poa home fiber plan, opportunistic public WiFi and, increasingly, "
          "satellite options. Each of these comes with its own bundle logic, billing cycle, USSD menu "
          "and app. LinkPulse answers three questions no existing product answers together: "
          "<b>which network am I on, how is it actually performing, and what is it really costing me?</b>"),
    ("p", "The opportunity is grounded in measurable momentum. Kenya's fixed internet market grew "
          "32.4 percent year-on-year to 2.84 million subscriptions by June 2026 according to regulator "
          "data, mobile money rails led by M-Pesa reach roughly 38 million monthly active users, and a "
          "wave of challenger ISPs is actively competing on price and quality. Meanwhile Starlink, the "
          "original inspiration for Dishylink, serves fewer than twenty thousand Kenyan subscribers. "
          "The monitoring problem that matters is therefore not satellite-specific: it is the "
          "fragmented, multi-operator reality of everyday connectivity."),
    ("stats", [("2.84M", "Kenya fixed internet subs, Jun 2026 (CA data)"),
               ("+32.4%", "fixed-market growth, year-on-year"),
               ("37.9M", "M-Pesa monthly active users (H1 FY2026)"),
               ("~19.5K", "Starlink Kenya subs, Sep 2025 (universality gap)")]),
    ("p", "This document makes the case that the Dishylink architecture pattern - on-device "
          "measurement, honest history, zero forced cloud, optional account linking for billing - can "
          "be generalized into a category-defining consumer utility for East Africa and, later, other "
          "multi-operator markets. It details the product concept, a staged and technically honest "
          "data-collection architecture, market sizing, an indicative four-stream revenue model, "
          "competitive positioning and an 18-month roadmap. We are seeking indicative pre-seed "
          "funding of USD 400,000 to ship the MVP, reach 50,000 monthly active users and open the "
          "first revenue streams within one year."),
]))

# ------------------------------------------------------------------ Ch 2
C.append(dict(id="ch2", title="2. Origin: What Dishylink Proves", blocks=[
    ("p", "Dishylink is an open-source desktop and browser application, written primarily in "
          "TypeScript, that monitors the performance and health of a Starlink connection. It reads "
          "the dish and router directly over the local network, which means it keeps working during "
          "an outage - exactly when the user most needs answers. It renders live throughput, latency, "
          "power draw and obstruction telemetry; it records honest day, week and month history from "
          "its own measurements rather than from whatever the vendor's cloud chooses to expose; and "
          "it attributes per-device usage through router client counters. Connecting a Starlink "
          "account is strictly optional and unlocks plan and billing figures."),
    ("p", "Three architectural decisions make Dishylink more than a hobby dashboard, and each one "
          "ports cleanly to a universal product. First, <b>local-first measurement</b>: the data "
          "lives on the user's machine, which builds trust, survives vendor API changes and costs "
          "the developer almost nothing in infrastructure. Second, <b>privacy as a feature</b>: no "
          "account, no cloud and no telemetry are required for the core experience, which is a "
          "genuine differentiator when the product must ask for sensitive permissions later. Third, "
          "<b>openness as distribution</b>: an MIT-licensed core with a browser extension turns "
          "satisfied users into installers and contributors, keeping acquisition costs near zero."),
    ("table", dict(
        title="Table 1: Generalizing the Dishylink pattern",
        header=["Dishylink capability", "What it proves", "LinkPulse generalization"],
        ratios=[0.30, 0.33, 0.37],
        rows=[
            ["Reads dish/router directly over LAN; works during outages",
             "Measurement does not need the vendor cloud",
             "Browser probes plus a thin Android shell plus an optional router agent, across any ISP"],
            ["No account, no cloud, no telemetry; local storage",
             "Privacy is a trust moat, not a constraint",
             "Local-first IndexedDB; cloud sync is opt-in and end-to-end encrypted"],
            ["Stat tiles; 15m/1h/6h and day/week/month history",
             "Consumers adopt dashboards that stay honest",
             "Same tile language applied to latency, outages and money"],
            ["Per-device usage from router client counters",
             "Household attribution matters on shared links",
             "Per-device and per-network spend attribution"],
            ["Optional account link for plan and billing",
             "Billing context multiplies the value of telemetry",
             "SMS, M-Pesa statement and e-invoice ingestion across operators"],
            ["Outage and event logs with severity alerts",
             "Evidence changes the consumer-ISP conversation",
             "Timestamped evidence exports for complaints and refunds"],
            ["Open-source core, desktop plus browser extension",
             "OSS keeps acquisition cost near zero",
             "OSS core plus installable PWA tuned for Android-first markets"],
        ])),
]))

# ------------------------------------------------------------------ Ch 3
C.append(dict(id="ch3", title="3. The Problem: Fragmented Networks, Opaque Spend", blocks=[
    ("p", "East African connectivity is a portfolio, not a product. A Nairobi household may hold a "
          "monthly home fiber plan around KES 3,000-4,000, buy Safaricom data bundles weekly, hop "
          "onto office or campus WiFi by day, and top up an Airtel line when the primary network "
          "throttles. Small businesses stack a fiber line with a mobile failover. Each layer has its "
          "own price per gigabyte, expiry clock and failure mode, and the information about all of "
          "it is scattered across SMS confirmations, M-Pesa messages, USSD menus and carrier apps. "
          "No single screen tells the user what they spend, where it goes, or what they get."),
    ("quote", "Connectivity is not one product here - it is a portfolio of bundles, bills and "
              "workarounds, and nobody is keeping score."),
    ("bullets", [
        "<b>Invisible spend.</b> Bundle purchases arrive as transient SMS notifications; by the end of the month the total is guesswork, and cost per gigabyte across networks is unknowable without a spreadsheet.",
        "<b>Unprovable quality.</b> When the line drops or crawls, users have no timestamped evidence, so complaints to ISP support desks collapse into their word against ours, and compensation clauses go unused.",
        "<b>Advertised versus realized speed.</b> Marketing quotes a headline number; nobody independently tracks what the household actually received at 8 p.m. in their own estate.",
        "<b>Blind switching.</b> Choosing between Safaricom, Airtel's newly aggressive fixed tiers, Zuku, Faiba, Poa or Mawingu happens on rumor, because there is no personal data to compare against.",
        "<b>No per-device truth.</b> Parents, landlords and SME owners cannot see which phone, TV or workstation is consuming the shared bundle.",
    ]),
    ("p", "The scale of the blind spot is growing, not shrinking. Fixed subscriptions in Kenya grew "
          "by roughly 700,000 lines in a single year while Airtel entered the fixed market with "
          "tiers from KES 1,999 and Zuku pushed discounted prepaid bundles; Uganda counts 44.3 "
          "million active mobile subscriptions and Rwanda passed 5.5 million internet users. More "
          "competition means more choices, more switching and more bookkeeping - precisely the "
          "conditions under which a trusted, neutral monitoring layer becomes valuable."),
]))

# ------------------------------------------------------------------ Ch 4
C.append(dict(id="ch4", title="4. Product Concept: LinkPulse", blocks=[
    ("p", "LinkPulse is an installable progressive web app: one codebase that runs in the browser, "
          "installs to the Android home screen, works offline and stores its history locally in "
          "IndexedDB, inheriting Dishylink's privacy posture. The product is organized around three "
          "pillars that turn raw connectivity into decisions."),
    ("h2", "Pillar 1 - Measure"),
    ("p", "The app continuously runs lightweight latency and throughput probes, records "
          "online-offline transitions into an outage log, and offers on-demand speed tests. Users "
          "see the same honest stat-tile language Dishylink popularized - live downlink, latency, "
          "ping success and, on supported setups, per-device usage - generalized across every "
          "network the device touches. History is bucketed by day, week and month and is never "
          "averaged in a way that hides spikes, because the evidence value of the data depends on "
          "its honesty."),
    ("h2", "Pillar 2 - Track"),
    ("p", "Spend tracking meets users where billing already lives. In the installed experience, "
          "LinkPulse parses billing SMS notifications - bundle confirmations, expiry warnings, "
          "M-Pesa paybill receipts - using a community-maintained adapter registry per operator, and "
          "accepts imported M-Pesa statements or manual entries as fallbacks. Everything is "
          "normalized into cost per gigabyte, cost per day and per network, with alerts before "
          "bundles expire or run dry. The output is a single monthly connectivity bill across all "
          "operators, something no carrier app will ever show honestly."),
    ("h2", "Pillar 3 - Act"),
    ("p", "Measurement and tracking convert into leverage. Users can export a timestamped outage "
          "evidence report when demanding refunds or SLA credits; consult a switching advisor that "
          "ranks the networks they actually use by realized quality and cost; and purchase bundles "
          "in-app through mobile money rails, with LinkPulse earning a commission. An opt-in, "
          "anonymized contribution builds the estate-level quality map that powers all three."),
    ("table", dict(
        title="Table 2: Primary personas",
        header=["Persona", "Context", "Primary value"],
        ratios=[0.24, 0.40, 0.36],
        rows=[
            ["Urban household manager", "Zuku fiber plus Safaricom data plus landlord WiFi",
             "One bill view; bundle expiry and depletion alerts"],
            ["SME owner (cafe, shop, clinic)", "Business fiber with mobile hotspot failover",
             "Downtime evidence for SLA claims; per-branch view"],
            ["Campus student", "Shared hostel WiFi plus daily bundles",
             "Cost per GB; cheapest top-up path; speed checks"],
            ["Remote worker / nomad", "Fiber or Starlink with mobile failover",
             "Outage log; failover guidance; proof for home-office SLAs"],
        ])),
]))

# ------------------------------------------------------------------ Ch 5
C.append(dict(id="ch5", title="5. Technical Feasibility and Architecture", blocks=[
    ("p", "The central engineering question is: how much truth can a PWA gather without fighting "
          "the platform? The honest answer defines a three-tier architecture, shipped in order of "
          "increasing capability and increasing permission sensitivity. Each tier is independently "
          "valuable, so the product is never blocked on a platform concession to deliver utility."),
    ("chart", dict(path="/home/z/my-project/scripts/assets/diagram_architecture.png",
                   caption="Figure 1: LinkPulse three-layer architecture - sense, understand, act, with optional sync and router agent",
                   max_h=330)),
    ("table", dict(
        title="Table 3: Data collection tiers",
        header=["Tier", "Capability set", "Permissions and requirements", "Data unlocked"],
        ratios=[0.16, 0.30, 0.26, 0.28],
        rows=[
            ["Tier 1 - Browser core (PWA)",
             "Latency and throughput probes; online/offline event log; Network Information API hints; on-demand speed tests; manual spend entries",
             "Standard web APIs; installable PWA; no sensitive permissions",
             "Connection-quality timeline; realized versus advertised speed; self-reported spend"],
            ["Tier 2 - Installed intelligence",
             "WiFi SSID/BSSID identity; SMS billing notification parsing; M-Pesa statement import",
             "Android companion shell (Capacitor/TWA) with location and SMS-read permissions, user-consented",
             "Which network am I on; what each network costs; cost per GB; bundle expiry alerts"],
            ["Tier 3 - Network depth",
             "Encrypted cross-device sync; anonymized QoS map; community ISP adapter registry; optional OpenWrt router agent",
             "Opt-in consent for sync and map contribution; router-side install for the agent",
             "Household per-device usage; estate-level ISP rankings; market-grade QoS corpus"],
        ])),
    ("p", "Tier 1 is unambiguous: modern browsers expose connection-change events, "
          "Network Information hints and the ability to run periodic probes against lightweight "
          "endpoints, which is sufficient for a credible MVP. Tier 2 acknowledges the real "
          "constraint - a browser cannot read SSIDs or SMS - and solves it the way successful "
          "African utilities (banking apps, Truecaller) already do: a thin, trusted companion shell "
          "that unlocks the sensitive sensors, wrapped around the same PWA codebase. Android's "
          "SMS and location permission model is mature, and the value exchange - your billing "
          "messages become your dashboard - is concrete and legible. Tier 3 mirrors Dishylink's "
          "router-direct philosophy for the household and creates the proprietary dataset: "
          "estate-level, per-operator realized-quality measurements that no incumbent owns."),
    ("p", "Risks are managed by design rather than by hope. Permission policy drift is hedged by "
          "the tier ladder and by a SMS-forwarding fallback path; parsing fragility is contained by "
          "keeping the adapter registry community-owned, versioned and test-covered like Dishylink's "
          "firmware adapters; and privacy exposure is minimized by keeping raw SMS on-device, "
          "uploading only opt-in, aggregated, anonymized quality statistics."),
]))

# ------------------------------------------------------------------ Ch 6
C.append(dict(id="ch6", title="6. Market: East Africa Connectivity", blocks=[
    ("p", "LinkPulse targets the East African Community core of Kenya, Uganda, Tanzania and Rwanda, "
          "beginning with Kenya as the design market. The region combines smartphone-led internet "
          "growth, hyper-competitive operator behavior and the world's most mature mobile money "
          "rails. Kenya alone counts roughly 2.84 million fixed internet subscriptions growing above "
          "30 percent annually, a mobile market dominated by Safaricom's roughly 37.5 million "
          "connectivity customers, and an operator set - Airtel, Telkom, Faiba, Zuku, Poa, Mawingu, "
          "Starlink - that now competes aggressively on both price and quality."),
    ("stats", [("44.3M", "Uganda active mobile subscriptions (2025)"),
               ("5.5M", "Rwanda internet users (2025)"),
               ("KES 161B", "M-Pesa revenue FY2025, 41% of group"),
               ("$20M", "Mawingu Series C, Oct 2025")]),
    ("chart", dict(path="/home/z/my-project/scripts/assets/chart_tamsamsom.png",
                   caption="Figure 2: Indicative market funnel - TAM, SAM and Year-3 SOM (assumptions labeled indicative)",
                   max_h=250)),
    ("p", "Sizing is intentionally conservative and labeled indicative. The top of the funnel - "
          "every internet connection in the four core markets - is on the order of 110 million "
          "mobile and fixed connections combined. The serviceable segment is the smartphone user "
          "who personally pays for data and manages at least one other connection, estimated around "
          "40 million people. The Year-3 obtainable goal of 1.5-2.0 million monthly active users "
          "represents under five percent of that segment, achievable through the frictionless PWA "
          "distribution, open-source community channels and campus and estate ambassador programs "
          "described in the go-to-market plan. Even at conservative monetization (detailed in "
          "Chapter 8), that user base supports a multi-million-dollar annual revenue mix."),
    ("p", "The investor context matters as much as the user math. Mawingu's USD 20 million Series C "
          "in October 2025 confirms deep capital appetite for East African connectivity; M-Pesa's "
          "162 billion shilling annual revenue proves the payment rails on which commissions can "
          "flow; and the regulator's own publication of quality-of-service statistics legitimizes "
          "independent measurement as a public good."),
]))

# ------------------------------------------------------------------ Ch 7
C.append(dict(id="ch7", title="7. Competition and Differentiation", blocks=[
    ("p", "Every adjacent player solves one slice of the problem; none combines cross-operator "
          "coverage with spend intelligence and independent quality evidence. Carrier apps are "
          "authoritative about their own billing but structurally cannot be neutral about a "
          "competitor's bundle or their own realized performance. Speedtest owns the one-shot "
          "measurement moment but keeps no honest history the user owns, and knows nothing about "
          "money. Network toolkits like Fing and GlassWire serve enthusiasts on desktops rather "
          "than households on Android. Truecaller demonstrates the pattern this product borrows: "
          "a permission-gated utility that converts a sensitive inbox into indispensable value."),
    ("table", dict(
        title="Table 4: Competitive landscape",
        header=["Player", "Category", "Strength", "Gap LinkPulse fills"],
        ratios=[0.20, 0.18, 0.30, 0.32],
        rows=[
            ["MySafaricom app", "Carrier self-care", "Authoritative billing and payments for one operator",
             "Single-carrier view; no independent quality evidence"],
            ["Airtel / Telkom / Faiba apps", "Carrier self-care", "Per-operator bundles and support",
             "Cannot compare rivals; no cross-ISP spend view"],
            ["Ookla Speedtest", "Measurement", "Trusted one-shot speed test brand",
             "No billing, no owned history, no advocacy"],
            ["Fing / GlassWire", "Network tooling", "Deep device-level visibility",
             "Desktop, enthusiast-oriented; zero spend intelligence"],
            ["Truecaller", "SMS utility", "400M-user proof of permission-based value exchange",
             "Not connectivity-focused; no measurement layer"],
            ["Plan comparison sites", "Content", "Static awareness of tariffs",
             "No personal usage data; no live quality signal"],
        ])),
    ("p", "Defensibility compounds along three axes. The <b>billing corpus</b> - anonymized, "
          "operator-normalized spend and quality measurements - grows more predictive with every "
          "user and cannot be retrofitted by an incumbent without admitting rivals' data into their "
          "apps. The <b>adapter registry</b>, maintained as open source, becomes the community's "
          "canonical parser library for East African billing formats, raising imitation costs. And "
          "the <b>consumer-advocate brand</b>, inherited from Dishylink's open, privacy-first DNA, is "
          "the one position a carrier-owned product can never occupy."),
]))

# ------------------------------------------------------------------ Ch 8
C.append(dict(id="ch8", title="8. Business Model (Indicative)", blocks=[
    ("p", "The model layers four revenue streams on top of a single free utility, sequenced so that "
          "revenue begins before marketplace scale arrives. Pricing is indicative for the Kenyan "
          "launch market and deliberately anchored to what connectivity already costs users, not "
          "to Western SaaS benchmarks: a household spending KES 3,000-6,000 per month across "
          "networks will happily pay KES 100-200 for the tool that saves a bundle's worth of value "
          "every month."),
    ("table", dict(
        title="Table 5: Revenue streams and indicative assumptions",
        header=["Stream", "Indicative pricing", "Key assumption", "Margin profile"],
        ratios=[0.26, 0.24, 0.28, 0.22],
        rows=[
            ["Consumer Pro subscriptions", "KES 100-200 per month",
             "3-6% of monthly actives convert for history depth, family mode and evidence reports",
             "High; digital delivery"],
            ["Bundle and top-up commissions", "3-7% of transaction value",
             "In-app purchase share of tracked spend via mobile money rails",
             "Medium; rail fees apply"],
            ["SME multi-branch monitoring", "KES 1,500-5,000 per month per business",
             "1-2% of urban SMEs adopt SLA evidence and branch dashboards",
             "High; seats expand per branch"],
            ["Anonymized QoS insights", "Licensing and report sales (opt-in corpus)",
             "Operators and regulators value independent estate-level quality data",
             "Very high; requires scale"],
        ])),
    ("chart", dict(path="/home/z/my-project/scripts/assets/chart_revmix.png",
                   caption="Figure 3: Indicative Year-3 revenue mix by stream (concept assumption)",
                   max_h=235)),
    ("p", "Unit economics sketch as follows. Acquisition through the open-source community, PWA "
          "word-of-mouth and campus ambassadors carries a near-zero marginal CAC; the blended "
          "revenue per monthly active user across all four streams is indicatively KES 60-120 per "
          "month at maturity; and the cost base is dominated by a compact engineering team plus "
          "modest probe-endpoint infrastructure, since storage and computation live on user "
          "devices by design. The subscription and SME streams alone carry the company to "
          "sustainability; commissions and insights are the upside optionality that makes the "
          "category venture-scale."),
]))

# ------------------------------------------------------------------ Ch 9
C.append(dict(id="ch9", title="9. Why Now, Go-to-Market and Investor Hooks", blocks=[
    ("p", "Three forces converge to make this the moment. First, competition has broken the "
          "incumbent's calm: Starlink's arrival and Airtel's fixed-market entry at KES 1,999 tiers "
          "triggered visible price moves from every operator, and consumers suddenly face real "
          "choices without real data. Second, the rails are ready: with 37.9 million M-Pesa users "
          "and mature smartphone penetration, both the commission revenue and the permission-based "
          "onboarding flow have working precedents. Third, the regulatory climate legitimizes the "
          "product: the Communications Authority already publishes quality-of-service statistics, "
          "and an independent, consumer-held measurement layer aligns with rather than fights the "
          "policy direction."),
    ("h2", "Go-to-market"),
    ("bullets", [
        "<b>Open-source core.</b> Ship the measurement engine and adapter registry on GitHub, Dishylink-style, converting developer credibility into free distribution and community-parsed operators.",
        "<b>Frictionless PWA entry.</b> No store gate for Tier 1; the install prompt and the Android companion shell arrive only when the user wants Tier 2 intelligence.",
        "<b>Estate and campus ambassadors.</b> Deploy in dense housing estates and universities where shared connections make the pain sharpest and word-of-mouth fastest.",
        "<b>Challenger ISP partnerships.</b> Poa, Mawingu and similar operators win when independent data proves their quality; early B2B pilots fund credibility before consumer scale.",
        "<b>Evidence-led virality.</b> Shareable monthly connectivity reports - what you spent, what you got - are designed to be posted, not just read.",
    ]),
    ("h2", "Comparable trajectories"),
    ("p", "Truecaller scaled a permission-based SMS utility to roughly 400 million users and "
          "monetized identity on top of the inbox; Fing evolved from a free network scanner into a "
          "router-adjacent platform with device-security subscriptions; Ookla built a defensible "
          "measurement-data franchise that Ziff Davis acquired. Mawingu's USD 20 million round "
          "shows investors already underwrite East African connectivity infrastructure. LinkPulse "
          "sits at the intersection: consumer utility economics, infrastructure-grade data, and "
          "fintech-adjacent monetization on existing rails."),
]))

# ------------------------------------------------------------------ Ch 10
C.append(dict(id="ch10", title="10. Roadmap, Risks and the Ask", blocks=[
    ("p", "The 18-month plan sequences capability, proof and monetization. Each phase has a "
          "kill-or-commit metric, and each phase's output is independently fundable evidence of "
          "traction. The architecture tiering from Chapter 5 maps directly onto this schedule: "
          "Tier 1 ships in months zero to three, Tier 2 intelligence in months four to six, and "
          "the marketplace plus expansion phases follow."),
    ("table", dict(
        title="Table 6: 18-month roadmap",
        header=["Phase", "Months", "Milestones", "Success metric"],
        ratios=[0.16, 0.10, 0.46, 0.28],
        rows=[
            ["Foundation", "M0-3", "PWA MVP: probes, outage log, honest history, manual spend entry, OSS repo public",
             "5,000 installs; 40% week-4 retention"],
            ["Intelligence", "M4-6", "Android shell beta: SSID identity, SMS billing parsing, M-Pesa import, expiry alerts",
             "25,000 MAU; 1M billing events parsed"],
            ["Marketplace", "M7-9", "In-app bundle purchase with commissions; switching advisor v1",
             "50,000 MAU; first commission revenue"],
            ["Expansion", "M10-12", "SME tier launch; Uganda entry; anonymized QoS map v1",
             "150,000 MAU; 100 paying SMEs"],
            ["Depth", "M13-18", "Tanzania and Rwanda; router agent; ISP insights API",
             "400,000 MAU; breakeven trajectory"],
        ])),
    ("table", dict(
        title="Table 7: Principal risks and mitigations",
        header=["Risk", "Likelihood", "Impact", "Mitigation"],
        ratios=[0.30, 0.13, 0.12, 0.45],
        rows=[
            ["Platform permission policy changes (Android SMS/location)", "Medium", "High",
             "Tier ladder decouples value from any single permission; SMS-forwarding fallback; router-agent path"],
            ["Carrier resistance to independent measurement", "Medium", "Medium",
             "Consumer-advocate positioning; insights product sold to, not weaponized against, operators"],
            ["Copycats from incumbent apps", "High", "Medium",
             "Cross-ISP corpus, adapter registry and OSS community compound faster than internal tools"],
            ["Commission revenue needs scale", "Medium", "Medium",
             "Subscription and SME revenue reach sustainability before marketplace maturity"],
        ])),
    ("h2", "The ask"),
    ("p", "We are raising an indicative USD 400,000 pre-seed to execute the Foundation and "
          "Intelligence phases: roughly 60 percent into engineering (a four-person team across "
          "PWA, Android and adapters), 25 percent into growth and community programs, and 15 "
          "percent into operations and compliance. The round buys 18 months of runway, the 50,000 "
          "MAU proof point, and the first two revenue streams live - the evidence base for a seed "
          "round priced on a category, not a feature."),
]))

# ------------------------------------------------------------------ Ch 11
C.append(dict(id="ch11", title="11. Conclusion", blocks=[
    ("p", "Dishylink demonstrates that people will adopt a monitoring tool when it is honest, "
          "private and built at their own edge of the network. East Africa demonstrates that the "
          "need extends far beyond satellite dishes: a fast-growing, fiercely competitive, "
          "multi-operator connectivity market where consumers pay in shillings for quality they "
          "cannot see and spend they cannot total. LinkPulse connects those proofs with a "
          "deliberately staged architecture that earns the right to ask for sensitive permissions "
          "by delivering value without them first."),
    ("p", "The wedge is narrow enough to execute with a small team and wide enough to matter: "
          "measurement first, spend intelligence second, marketplace and data products third. The "
          "rails, the competitive dynamics and the regulatory climate are aligned now, and the "
          "open-source heritage of the inspiration keeps trust - the scarcest asset in this "
          "category - at the center of the product. The invitation to investors is to fund the "
          "12 months that convert a proven pattern into a category-defining utility for one "
          "hundred million connections."),
]))
