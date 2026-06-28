/**
 * Seeds the Apex Commerce Slack workspace with synthetic PM data.
 * Requires a bot token with: chat:write, channels:manage, channels:join
 *
 * Usage: BOT_TOKEN=xoxb-... node --input-type=module < scripts/seed-slack.mjs
 */

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN?.startsWith("xoxb-")) {
  console.error("Set BOT_TOKEN=xoxb-... before running");
  process.exit(1);
}

async function slack(method, body) {
  const res = await fetch(`https://slack.com/api/${method}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${BOT_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`${method} failed: ${data.error}`);
  return data;
}

async function ensureChannel(name) {
  // Try to create; if already exists, find it
  try {
    const r = await slack("conversations.create", { name, is_private: false });
    console.log(`  Created #${name}`);
    return r.channel.id;
  } catch (e) {
    if (!e.message.includes("name_taken")) throw e;
    const list = await slack("conversations.list", { limit: 200 });
    const ch = list.channels.find(c => c.name === name);
    if (!ch) throw new Error(`Channel #${name} not found`);
    console.log(`  Found   #${name}`);
    return ch.id;
  }
}

async function post(channelId, text) {
  await slack("chat.postMessage", { channel: channelId, text, mrkdwn: true });
  // Small delay to preserve message order
  await new Promise(r => setTimeout(r, 400));
}

// ── Channel messages ───────────────────────────────────────────────────────────

const CHANNELS = {
  "strategy-decisions": [
    `*Vikram Nair (CEO)* — January 15, 2026\n\nSharing the FY2026 strategy theme aligned in today's board session: *From Feature Provider to Commerce Intelligence Platform.*\n\nCore shift: we stop selling point solutions and start selling the platform. Analytics Dashboard is the upsell anchor — every enterprise contract now includes it by default.\n\nFive strategic bets:\n1. Analytics Dashboard as upsell anchor → ₹8 Cr new ARR\n2. Video UGC expansion → ₹5 Cr new ARR (Nykaa + boAt pre-committed)\n3. API Developer Portal → ₹3 Cr via channel partners\n4. Southeast Asia entry (Singapore-first) → ₹2 Cr\n5. Enterprise SSO GA → unblocks ₹6.5 Cr stalled expansion\n\nWhat we're NOT doing this year: Shopify plugin, mobile consumer app, social listening. If you get asked — the answer is "FY2027 at earliest."`,

    `*Priya Mehta (CPO)* — February 3, 2026\n\nFollowing up on the strategy session — three product-level decisions I'm locking in for H1:\n\n1. *SSO is P0.* Tanvi Bhatt's team gets whatever engineering they need. Deepa is reallocating 2 engineers from Sampling.\n\n2. *Analytics Dashboard paid tier pricing approved* — ₹2.5 L/year standalone, ₹4 L/year bundled. Ananya signed off. Ravi — launch target is Q3, not Q2. We need the competitive benchmarking data feed from Retail Intelligence ready first.\n\n3. *LLM cost OKR is real.* Swati — Haiku switch for moderation Layer 1 by May 1. Ankit — A/B test FPR numbers before we fully commit. If FPR goes above 3%, we pause.\n\nFull OKRs doc is in Notion — search "H1 2026 OKRs" in Seam.`,

    `*Rahul Sharma (CTO)* — May 22, 2026\n\nLLM cost update: Haiku migration for Layer 1 moderation complete as of May 20.\n\nNumbers:\n• Cost per review: ₹0.22 → ₹0.09 (59% reduction, target was 65%)\n• False positive rate: 1.2% → 1.8% (within Priya's 3% threshold)\n• Zero impact on Layer 2/3 pipeline\n\nStill not at ₹0.08/review target. Remaining gap is in video moderation pipeline — Swati is splitting transcription (Sonnet) from moderation (Haiku). Gets us to ~₹0.065/review.\n\nRisk: LLM volume growing 11% MoM. Even at Haiku pricing, 3x volume in 12 months puts us back to same cost.`,

    `*Vikram Nair (CEO)* — June 10, 2026\n\nBoard update on H1 performance (mid-year):\n\nARR: ₹38 Cr vs ₹42 Cr target. Behind by ₹4 Cr.\nRoot cause: Analytics Dashboard paid tier slipped Q2 → Q3. SSO delay held back Nykaa and Walmart India expansion.\n\nWhat's on track:\n• Video UGC: boAt pilot July 1, Q3 GA on track\n• API Developer Portal: 3 channel partners signed LOIs\n• Checkout Optimization: Meesho pilot converting at 22% lift\n\nDecision: we're not cutting any FY2026 bets. We're adding 2 engineers to SSO and pulling Retail Intelligence roadmap 6 weeks forward to unblock Analytics Dashboard paid tier.`,

    `*Priya Mehta (CPO)* — June 25, 2026\n\nH2 planning decisions:\n\n1. *TikTok Shop integration is paused.* Legal flagged ToS violation risk — only Apex network data is in scope. Rajesh Tiwari to document the decision.\n\n2. *Southeast Asia pilot delayed to Q4.* We don't have bandwidth until SSO ships. Vikram has communicated this to the Singapore distributor.\n\n3. *Video UGC is now core, not pilot.* Pooja's Influencer Hub is being merged into the Video UGC workstream. Manish takes full ownership of the Social Commerce + Video UGC cluster.\n\nNext product review: July 8.`,
  ],

  "product-roadmap": [
    `*Ravi Krishnan (PM — Analytics Dashboard)* — March 10, 2026\n\nAnalytics Dashboard paid tier update:\n\nWe've been blocked on the competitive benchmarking data feed from Priyanka's Retail Intelligence team. ETA was March 31 — now confirmed May 15 due to data provider API changes.\n\nImpact: paid tier launch moves from Q2 to Q3. Revenue impact: ~₹1.2 Cr ARR shift.\n\nWhat's moving forward on schedule:\n• Free tier API usage dashboard — ships March 28\n• Brand-level sentiment view — ships April 15\n• Enterprise SSO dependency — Tanvi confirmed integration specs sent\n\nPriya has been informed. No change to the Q3 commitment.`,

    `*Tanvi Bhatt (PM — Enterprise SSO)* — April 2, 2026\n\nSSO milestone update:\n\n✅ Google Workspace integration — DONE (March 29)\n🔄 Okta integration — in progress, ETA April 25\n📋 Azure AD — starts May 1, ETA June 15\n\nGating items for GA:\n• Deepa's team: security audit needs 2-week window post-Azure AD\n• Legal: DPA templates for EU customers need sign-off (Ananya is chasing)\n• Sales: Nykaa and Walmart India deals are in "pending SSO" status — both committed to sign within 30 days of GA\n\nIf Azure AD slips, we ship GA with Google + Okta only and add Azure AD in a fast-follow. Priya has signed off on this contingency.`,

    `*Divya Sharma (PM — Loyalty & Rewards)* — April 18, 2026\n\nLoyalty & Rewards beta → GA plan:\n\nCurrent: 4 brand pilots (Nykaa, Mamaearth, Boat, Purplle). Conversion rate in pilots: 34% of shoppers who see a loyalty prompt complete a review. Industry benchmark: 12-18%.\n\nGA target: Q1 2027. What needs to happen:\n• Cashback fulfillment API: currently manual, needs automation (Deepa's team, 6 weeks)\n• Fraud detection for loyalty abuse: ML model training starts May 1 (Ankit)\n• Brand portal self-serve for loyalty config: Amit's Brand Portal team dependency\n\nBig risk: if Cashback API automation slips, we can't GA. I've flagged this as a P0 dependency.`,

    `*Ishaan Chandra (PM — API Developer Portal)* — May 5, 2026\n\nDeveloper Portal Q2 progress:\n\nLaunched: sandbox with test data, API key management, usage dashboard, interactive API explorer.\n\nPipeline: 3 channel partners in LOI stage (Fynd, Unicommerce, GoKwik). Each is ₹80-100 L/year potential.\n\nBlockers:\n• SDK generation (Node.js, Python, Java) — Rahul's eng team has deprioritised; back on roadmap Q3\n• Webhook documentation — needs content from each PM; chasing Ravi, Divya, Manish\n• Enterprise auth (API keys + SSO) — dependency on Tanvi's SSO GA\n\nAsk: can we get 1 eng assigned to SDK generation? Without it, channel partners can't self-integrate.`,

    `*Manish Kumar (PM — Social Commerce)* — June 1, 2026\n\nSocial Commerce + TikTok Shop update:\n\nTikTok Shop integration: *officially paused*. Legal decision — see strategy-decisions channel. We're redirecting that engineering to Instagram Shopping (less revenue upside but zero legal risk).\n\nInstagram Shopping timeline: integration spec complete June 15, build starts June 22, pilot with boAt + Nykaa Beauty July 15.\n\nVideo UGC (now under my ownership):\n• boAt pilot on track for July 1\n• 15 brands in waitlist for Video UGC access\n• Conversion rate from pilot: video reviews convert 2.3x vs photo reviews\n\nThe merger of Influencer Hub into Social Commerce is complete. Pooja is now supporting as IC.`,
  ],

  "stakeholder-updates": [
    `*Neha Joshi (PM — Ratings & Reviews API)* — February 20, 2026\n\nNykaa account update:\n\nNykaa is our largest customer at ₹3.2 Cr ARR. Three active conversations:\n\n1. *SSO expansion* — Nykaa IT has approved Enterprise SSO in principle. Deal value: ₹1.1 Cr additional ARR. Blocked on our SSO GA (Tanvi's team).\n\n2. *Video UGC pilot* — Nykaa Beauty CMO is personally excited. Pilot scoped for 50 SKUs starting Q3. If pilot converts, this is a ₹80 L/year add-on.\n\n3. *API rate limit complaint* — Nykaa's data team is hitting rate limits on the Ratings API (bulk export). Rahul has approved a temporary 5x limit increase. Permanent fix in Q3 roadmap.\n\nRisk: if SSO slips past July, Nykaa's IT cycle resets and we lose the Q3 window.`,

    `*Arjun Kapoor (Group PM — Commerce Products)* — March 25, 2026\n\nWalmart India situation:\n\nWalmart India has been in evaluation for 8 months. Current status: *commercial terms agreed, legal hold.*\n\nThe hold: Walmart's global procurement requires SOC 2 Type II certification. We have SOC 2 Type I (completed January). Type II audit window is September-November 2026, report available December.\n\nOptions Vikram has discussed with Walmart India GM:\n1. Sign now with Type II as a contractual commitment by December 31 → Walmart legal said no\n2. Sign a pilot agreement (≤₹50 L) now, expand post-Type II → Walmart is evaluating\n3. Wait for Type II → lose the Q3 budget cycle\n\nPriya's call: pursue option 2. Ananya is drafting the pilot agreement.`,

    `*Karan Mehta (PM — Sampling & Advocacy)* — April 30, 2026\n\nMeesho pilot results — Checkout Optimization:\n\nWe ran a 6-week A/B test on Meesho's checkout flow with our social proof widgets (star ratings, review count, recent purchase signal).\n\nResults:\n• Conversion rate: +22% in treatment vs control (p < 0.01)\n• AOV: +8% (shoppers who see reviews buy more premium items)\n• Return rate: -4% (reviewed products have fewer returns)\n\nMeesho's category lead wants to expand to full catalog (currently 12% of SKUs). That's a 3x revenue expansion from ₹35 L/year to ~₹1 Cr/year.\n\nAsk: Priya, can we prioritize the self-serve integration flow for Checkout Optimization? Currently it takes 6 weeks of manual setup. If we get to 2 weeks, Meesho can self-expand.`,

    `*Priya Mehta (CPO)* — June 15, 2026\n\nEnterprise customer risk register (Q3 review):\n\n*High risk:*\n• Walmart India — SOC 2 Type II blocker. Pilot agreement in progress (Ananya).\n• Tata CLiQ — contract renewal August 31. No executive sponsor since their CPO left. Neha is rebuilding the relationship.\n\n*Medium risk:*\n• Puma India — SSO dependency. If GA slips past August, they've indicated a competitive evaluation.\n• FirstCry — Analytics Dashboard paid tier timing. They want it live before their Diwali campaign (October 1).\n\n*Healthy:*\n• Nykaa, Mamaearth, boAt, Purplle — all expanding. No churn signals.\n• Meesho — pilot converting well, expansion in progress.\n\nAction: Tanvi — SSO GA by August 15 is the single most important date for enterprise retention.`,
  ],

  "leadership-asks": [
    `*Vikram Nair (CEO)* — January 28, 2026\n\nTeam — a few asks coming out of the board meeting:\n\n1. *Priya* — I need the H1 OKR doc in Notion by February 7. Board wants to see measurable KRs, not directional goals.\n\n2. *Rahul* — SOC 2 Type II timeline. Can we pull the audit window forward to July-September instead of September-November? This is blocking Walmart India.\n\n3. *Ananya* — the Analytics Dashboard pricing deck needs competitive context. Who are we benchmarking against? Bazaarvoice, PowerReviews, Yotpo. I need their list pricing.\n\n4. *Arjun* — enterprise pipeline report by end of week. I'm presenting to the board in 10 days and need the current state of the top 10 deals.\n\nThese are not suggestions.`,

    `*Priya Mehta (CPO)* — March 12, 2026\n\nProduct team asks for Q2:\n\n*Ravi* — Analytics Dashboard: I need a slide by March 20 showing what's in paid tier vs free tier. Sales is getting inconsistent answers.\n\n*Tanvi* — SSO: daily standup updates in this channel starting April 1. I want visibility without scheduling a call.\n\n*Divya* — Loyalty: get me the cashback fulfillment automation spec by April 10. This is the gate for GA.\n\n*Ishaan* — Developer Portal: the SDK ask to Rahul needs to go through me first. I'll prioritize it in the engineering allocation meeting next week.\n\n*All PMs* — weekly product updates in #product-team every Friday by 5 PM. I'm reading them.`,

    `*Rahul Sharma (CTO)* — April 15, 2026\n\nEngineering capacity update and asks:\n\nWe're at 94% eng utilization. Three things need PM decisions to unblock:\n\n1. *SDK generation (Developer Portal)* — Ishaan, I need a formal prioritization request from Priya. Otherwise it stays Q3.\n\n2. *Cashback API automation (Loyalty)* — Divya, the spec is vague on fraud edge cases. Ankit needs a decision: do we block cashback for accounts <30 days old? Default yes, but confirm.\n\n3. *Video moderation pipeline split* — Swati has a proposal to split transcription (Sonnet) and moderation (Haiku). Priya — this is a cost optimization that also touches accuracy. Need your sign-off before Swati proceeds.\n\nResponses needed by April 22.`,

    `*Vikram Nair (CEO)* — June 20, 2026\n\nH2 budget reallocation — decisions made:\n\n• +2 engineers to SSO team (from API Developer Portal backlog)\n• Retail Intelligence roadmap pulled forward 6 weeks (unblocks Analytics Dashboard paid tier)\n• TikTok Shop budget reallocated to Instagram Shopping\n• Southeast Asia pilot budget frozen until Q4\n\n*What this means for each team:*\n- Tanvi: you now have the headcount. August 15 GA is non-negotiable.\n- Ravi: paid tier Q3 is back on. Coordinate with Priyanka on the Retail Intelligence data feed.\n- Manish: Instagram Shopping is now H2 P1. Deliver the boAt pilot.\n- Arjun: Singapore — communicate the Q4 timeline to the distributor. No more ambiguity.\n\nFY2026 is salvageable. But only if SSO ships.`,
  ],

  "product-team": [
    `*Ravi Krishnan* — May 9, 2026\n\n*Weekly Update — Analytics Dashboard*\n\n✅ Done this week:\n• Free tier API dashboard shipped (May 7) — 23 brands already using it\n• Retail Intelligence data feed spec received from Priyanka — looks feasible\n\n🔄 In progress:\n• Brand-level sentiment view (85% done, ships next week)\n• Paid tier feature spec — will share draft Monday\n\n⚠️ Blockers:\n• Data feed integration needs 1 BE engineer for 3 weeks — in the queue for Rahul's allocation meeting\n\n📊 Metric: 847 brands on Analytics Dashboard free tier (+34 this week)`,

    `*Tanvi Bhatt* — May 9, 2026\n\n*Weekly Update — Enterprise SSO*\n\n✅ Done this week:\n• Okta integration shipped May 7 🎉 — 3 beta customers already connected\n• Security audit for Google + Okta complete — zero findings\n\n🔄 In progress:\n• Azure AD: build 60% complete, ETA June 15\n• DPA templates: legal review in progress (Ananya)\n\n⚠️ Blockers:\n• Azure AD test environment: need Walmart India IT team to set one up. They've been slow. Arjun — can you push?\n\n🎯 GA confidence: 80% for July 15. Risk is Azure AD + DPA timing.`,

    `*Divya Sharma* — May 9, 2026\n\n*Weekly Update — Loyalty & Rewards*\n\n✅ Done:\n• Pilot report for Nykaa and Mamaearth delivered — both want to expand to full catalog\n• Fraud detection model: Ankit completed training, FPR = 0.3% (excellent)\n\n🔄 In progress:\n• Cashback fulfillment automation: Deepa's team starts build June 1\n• Brand Portal self-serve config: dependency on Amit — ETA June 30\n\n⚠️ Risk:\n• If Cashback automation slips past June 30, GA moves from Q1 2027 to Q2 2027\n\n📊 Pilot NPS: 71 (Nykaa pilot users). Industry average for loyalty programs: 34.`,

    `*Ishaan Chandra* — May 9, 2026\n\n*Weekly Update — API Developer Portal*\n\n✅ Done:\n• Fynd LOI signed — ₹85 L/year, integration starts June 1\n• Interactive API explorer v2 shipped — 40% increase in time-on-page\n\n🔄 In progress:\n• Unicommerce integration: their eng team started, estimated 8 weeks\n• GoKwik: legal review ongoing (they have complex data residency requirements)\n\n⚠️ Blockers:\n• SDK generation still not prioritized — this is blocking Fynd's self-serve integration\n• Webhook documentation: still chasing Ravi and Manish for their payload specs\n\n💡 Insight: 73% of API portal signups are from brands that are already Apex customers. Upsell motion is working.`,

    `*Arjun Kapoor* — May 9, 2026\n\n*Weekly Update — Enterprise & Commerce Products*\n\n📊 Pipeline snapshot:\n• Nykaa SSO deal: signed LOI, awaiting GA (July 15 target)\n• Walmart India: pilot agreement draft sent to legal — 10 business days for review\n• Tata CLiQ: renewal call scheduled May 20 (Neha leading)\n• Puma India: evaluation paused — they're waiting for SSO GA before deciding\n\n🔴 Risk I want visibility on:\n• FirstCry needs Analytics Dashboard paid tier live by October 1 (Diwali). That's 5 months. Ravi — is Q3 still realistic?\n• Tata CLiQ has no executive sponsor since their CPO left. If we lose this renewal it's ₹95 L ARR.\n\n✅ Win: Meesho expansion deal verbal confirmed — ₹1 Cr ARR from ₹35 L. Karan's pilot numbers sold it.`,
  ],
};

// ── Run ────────────────────────────────────────────────────────────────────────
console.log("Creating channels and seeding messages...\n");

for (const [channelName, messages] of Object.entries(CHANNELS)) {
  console.log(`#${channelName} (${messages.length} messages)`);
  const channelId = await ensureChannel(channelName);

  // Join the channel as bot
  try { await slack("conversations.join", { channel: channelId }); } catch {}

  for (let i = 0; i < messages.length; i++) {
    await post(channelId, messages[i]);
    console.log(`  Posted ${i + 1}/${messages.length}`);
  }
  console.log();
}

console.log("✓ Slack seeding complete!");
console.log("\nChannels created:");
Object.keys(CHANNELS).forEach(ch => console.log(`  #${ch}`));
console.log("\nNext: Connect Slack in Seam Integrations, then run the sync.");
