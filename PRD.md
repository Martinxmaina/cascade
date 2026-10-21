Cascade: waterfall enrichment SaaS, build PRD
Oct 10, 2026 · @OB
Cascade is a Clay-style lead tool you can sell. Describe your business, and it reads your website, writes your ideal customer profile with Opus 5.5, finds matching companies and their decision makers, then pours each person through a waterfall of email providers via Treg, cheapest first, until one finds a verified email. Everything runs on localhost with a local SQLite database, and every action shows its price.
How to use this PRD
Open an empty folder in Claude Code, save this doc as PRD.md, connect the Treg MCP, and send the kickoff prompt. Claude builds one phase at a time and stops after each so you can test and film it.
Connect Treg to Claude Code first (this is for discovery while building; the app itself calls Treg over REST):
curl -fsSL https://treg.to/install.sh | sh -s -- --token YOUR_TREG_TOKEN
treg mcp install
Kickoff prompt:
Read PRD.md in full before writing any code. Build Cascade exactly as specified, one phase
at a time (see "Build phases"). After each phase, run it on localhost, show me what changed,
and wait for me to say "next".

Hard rules:
- All data lives in a local SQLite file. No Supabase, no external database.
- Every outside data call goes through Treg (POST https://treg.to/call/<endpoint-id>) with my
 Treg token. Never sign up for or use individual provider keys.
- Before writing code for any Treg endpoint, use the Treg MCP (catalog_get) to read its exact
 parameters, price and response shape, and record them in src/treg/registry.ts. Never guess
 parameter names. If an endpoint in this PRD doesn't exist or has changed, stop and tell me.
- Every Treg call sends X-Treg-Route-Max-Cost and an Idempotency-Key, and records the real
 cost from the X-Treg-Cost-Micro response header.
- Show a price before every action that spends money. Never run a paid action without an
 estimate on screen first.
- UI follows the design system literally: exact hex values, Geist only, no all-caps text,
 no monospace in the UI.
- Keys live in .env.local and are only used server-side. Never print or log them.
What we're building
The product: a lead-finding and enrichment SaaS for founders and small sales teams. You tell it what you sell. It works out who should buy it, finds those companies and their decision makers, and gets each one a verified work email by trying several providers in a waterfall, cheapest first. You pay per result, and you can see exactly what each one cost.
The user flow:
1. Sign up with email and password.
2. Tell Cascade about your business: your website, what you sell in one sentence, who you think buys it, where they are, and how many leads you want.
3. Cascade reads your website through Treg and hands the text to Opus 5.5.
4. Opus writes your ICP: for example, "I run a CRM SaaS for accountants" becomes accounting firms in the UK and US, 10 to 50 employees, targeting the managing partner or CEO. You see a free count of how many match before spending anything.
5. Cascade finds the leads: 50 matching companies, then the CEO or chosen role at each, then a verified email through the waterfall. The table fills in live, cell by cell.
6. A beautiful table with provider colours in every cell, a cost per cell and a running bill.
7. Export and import: CSV and Excel out, and CSV in with column mapping.
8. Clean your own list: import any leads and verify, refind or fully enrich them, with the price shown before every run.
9. Billing: customers buy credits, and the price of each result is the Treg cost plus your markup. The admin view shows Treg's cost against revenue and your margin.
The demo story for the video: "I run a CRM SaaS for accountants." Two minutes later there's a table of 50 UK and US accounting-firm CEOs with verified emails, and a receipt saying what it cost through Treg against what Cascade charged.
Done looks like:
* ☐ A new user goes from sign-up to an approved ICP in under 2 minutes, with no layout jumps between onboarding steps
* ☐ The free count shows how many companies match before any paid call
* ☐ 50 companies and decision makers are found, and the email waterfall runs with each cell showing the provider that hit and its cost
* ☐ Verified, catch-all and not-found states are clearly different
* ☐ Import a CSV, map its columns, see an estimate, run a clean, export the result
* ☐ Every paid button shows its price, and the receipt matches the sum of X-Treg-Cost-Micro headers
* ☐ The billing page shows credits, top-ups, the ledger and (for the admin) Treg cost vs revenue
* ☐ The provider lab runs the same leads through each provider alone and through the waterfall, and charts the difference
* ☐ Everything runs on localhost with a local SQLite file
The engine
Four stages find the people, then the waterfall finds their emails. Every box is a Treg call except the ICP, which is Opus 5.5.
Providers with free misses mean a lead only ever pays for the one provider that finds its email. That's the whole economic idea, and the receipt at the end proves it.
Treg integration
Two ways in:
* While building: Claude Code uses the Treg MCP (catalog_search, catalog_get, call, balance) to look up endpoints, read their parameters and test calls.
* In the app: the server calls Treg over REST. Never call Treg from the browser.
// src/treg/client.ts
const res = await fetch(`https://treg.to/call/${endpointId}`, {
 method: 'POST',
 headers: {
   'X-Treg-Token': process.env.TREG_TOKEN!,
   'Content-Type': 'application/json',
   'X-Treg-Route-Max-Cost': String(maxCostUsd),        // hard per-call cap, 402 if exceeded
   'Idempotency-Key': `${runId}:${rowId}:${step}:${endpointId}`,
   'X-Treg-Meta': `user=${userId},run=${runId},step=${step}`  // attribution for billing
 },
 body: JSON.stringify(params)
});
const costMicro = Number(res.headers.get('X-Treg-Cost-Micro') ?? 0); // real charge, micro-USD
const callId = res.headers.get('X-Treg-Call-Id');
const tregRefused = res.headers.get('X-Treg-Error') === '1';
Rules for the client:
* Record costMicro and callId on every call in the treg_calls table. The provider's response body is never the source of truth for cost.
* A missing X-Treg-Cost-Micro header means no charge.
* 402 means out of balance or over the max cost: stop the run, show "Top up your Treg balance" to the admin, and refund the customer's held credits.
* 429 codes (tag_spend_cap_reached, platform_daily_cap_reached) pause the run with a clear message.
* Retry once on network errors with the same Idempotency-Key, so a replay is never charged twice.
* Run at most 5 rows at a time with p-limit. Treg has no concurrency limit, but providers do.
* Failed upstream calls aren't billed, and the providers in the waterfall don't bill misses.
The endpoint registry. Prices and success rates are from the Treg catalog on 10 Oct 2026. "Success" in the catalog means the call completed, not that it found a result, which is why Cascade tracks its own hit rates.
Step
	Endpoint id
	Price
	Notes
	Read website
	branddev.web.scrape
	~$0.0025 a call
	Markdown of one page. Fallback: treg.web.extract ($0 to $0.01, routed, misses can bill)
	Brand for the workspace
	branddev.brand.retrieve
	~$0.025 a call
	Logo, colours, fonts, industry
	Count companies (free)
	icypeas.companies.search.count, companyenrich.companies.search.count
	Free
	Shown before any paid search
	Count people (free)
	icypeas.people.search.count, getleadsio.people.search.count
	Free
	

	Find companies
	tomba.companies.search.reveal
	~$0.000178 per up to 50
	Industry, country, size filters. Fallbacks: icypeas.companies.search (~$0.00038 a row), treg.companies.search
	Company name to domain
	crustdata.companies.identify
	Free
	For imported rows without a domain
	Decision maker at a company
	icypeas.people.search
	~$0.00038 a row
	Filter by company and title. Fallbacks: findymail.search.employees ($0.0198 a contact), leadmagic.people.search ($0.025 a person)
	Email waterfall 1
	quickenrich.people.email.find
	$0.0048 a hit, misses free
	Name + company, or LinkedIn URL
	Email waterfall 2
	trykitt.people.email.find
	$0.005 a hit, misses free
	Name + domain
	Email waterfall 3
	aiark.people.email.find
	$0.0053 a hit, misses free
	Needs a profile URL
	Email waterfall 4
	tomba.people.email.find
	$0.0089 a hit, misses free
	Name + domain
	Email waterfall 5
	leadsforge.people.email.find
	$0.0245 a hit, misses free
	

	Verify 1
	contactout.people.email.verify
	Free
	Deliverability and catch-all
	Verify 2 (catch-all or unknown)
	trykitt.people.email.verify
	$0.0015
	Handles catch-all domains
	Verify 3 (backup)
	millionverifier.people.email.verify
	$0.00178
	Catch-all, disposable and role flags
	Phone waterfall (opt-in)
	aiark.people.phone.find, dropleads.people.phone.find, leadmagic.people.phone.find
	$0.026, $0.054, $0.125
	Only with the phone box ticked and a per-row cap
	Phone live check
	hlrlookup.people.phone.network
	$0.0033
	

	Company data (optional column)
	prospeo.companies.enrich
	~$0.0245 per match
	Firmographics, funding, tech
	src/treg/registry.ts holds one entry per endpoint, filled from catalog_get: id, display name, provider colour, list price, required inputs, how to read a hit from the response, and whether misses bill. The waterfall and the estimator read from this file only.
Stack and local setup
Part
	Choice
	Why
	App
	Next.js (App Router) with TypeScript
	Pages and server routes in one project
	Database
	SQLite in ./data/cascade.db with better-sqlite3 and Drizzle ORM
	Local file, no Supabase, no server to run
	Auth
	bcryptjs hashes, random session tokens stored in SQLite, httpOnly cookie
	Fully local
	Long runs
	A job runner in the Node process with p-limit, writing progress to SQLite and streaming it over server-sent events
	Runs survive page refreshes
	AI
	Anthropic SDK, model claude-opus-5-5
	Reads the website and writes the ICP
	Table
	TanStack Table plus TanStack Virtual
	Smooth with 10,000 rows
	Motion
	Framer Motion
	Onboarding transitions, cell fills
	Drag and drop
	dnd-kit
	Reordering providers
	CSV and Excel
	Papa Parse for import, SheetJS for Excel export
	

	Charts
	Recharts
	Dashboard and provider lab
	Payments
	Stripe Checkout in test mode, or a mock top-up when STRIPE_SECRET_KEY is empty
	Works offline for filming
	Validation
	Zod on every route and every Opus response
	

	Setup:
npx create-next-app@latest cascade --ts --app --src-dir --eslint --no-tailwind
cd cascade
npm i better-sqlite3 drizzle-orm zod bcryptjs nanoid p-limit @anthropic-ai/sdk \
 @tanstack/react-table @tanstack/react-virtual framer-motion @dnd-kit/core @dnd-kit/sortable \
 papaparse xlsx recharts stripe
npm i -D drizzle-kit @types/better-sqlite3 @types/bcryptjs @types/papaparse
.env.local (never committed, never on screen):
TREG_TOKEN=
ANTHROPIC_API_KEY=
ICP_MODEL=claude-opus-5-5
SESSION_SECRET=              # 32+ random characters
DATABASE_PATH=./data/cascade.db
CREDIT_VALUE_USD=0.01        # what one customer credit is worth
DEFAULT_MARKUP=4             # customer price = Treg cost x markup, with floors (see Billing)
STRIPE_SECRET_KEY=           # empty = mock top-ups
APP_URL=http://localhost:3000
data/ is gitignored. The first account created becomes the admin, who sees costs and margins.
Design system
The Daygent system, adapted: the same rails, hairlines, square corners, CTA pair and motion curve, with four changes. There's no monospace, no all-caps text, watercolour washes instead of ASCII art, and a pastel water palette with one soft colour per provider. Every value is literal.
Core palette (unchanged from Daygent):
Token
	Hex
	Use
	--bg
	#f6f6f4
	Page and app background
	--panel
	#ffffff
	Cards, table, sidebar
	--panel-2
	#fbfbfa / #fcfcfb
	Secondary panels, table header
	--line
	#e7e7e3
	Structural borders and rails
	--line-soft
	#ededea / #f0f0ec / #f4f4f1
	Table rows, internal dividers
	--ink
	#141414
	Headings
	--ink-display
	#101010
	Big numbers (credits, totals)
	--ink-body
	#2c2c2a
	Body text
	--ink-muted
	#5f5f5a
	Supporting text
	--ink-label
	#8f8f89
	Labels and meta
	--ink-faint
	#bdbdb8
	Captions, corner labels
	--dark
	#121212
	Landing "engine" section
	Water palette (the accent family):
Token
	Hex
	Use
	--water-ink
	#2f6aa8
	Links, focus rings, primary accent, live dots
	--wash-50
	#eef5fb
	Selected rows, hover
	--wash-100
	#dcebf7
	Light wash
	--wash-200
	#c3dcf0
	Mid wash
	--wash-300
	#a3c7e6
	Deep wash
	--wash-400
	#7fadd8
	Pigment edges
	Status colours (muted): verified #1a7f4b on #e3f2e9, catch-all #b5801f on #f8eedb, not found #c0462e on #f8e4df, running --water-ink on --wash-50.
Provider colours. Every provider gets a pastel chip with a darker ink of the same hue for its text. They're used only on chips, cell dots and charts, never as large fills.
Provider
	Chip
	Ink
	QuickEnrich
	#dff3ea
	#2f7d5b
	Kitt
	#dcebfa
	#2f6aa8
	AI Ark
	#ece5f7
	#6a4fa3
	Tomba
	#fbe8dc
	#a65a2e
	LeadsForge
	#f8f0d2
	#8a6d16
	ContactOut
	#e6efe0
	#4f7a3a
	MillionVerifier
	#f7e2e6
	#a2445a
	Phone providers
	#f1ece4
	#7a6650
	Typography:
* Geist only (300 to 700) from Google Fonts. No monospace, no serif.
* Headings are weight 500, letter-spacing -.03em to -.045em. H1 clamp(33px,4.4vw,54px), H2 clamp(23px,2.8vw,35px).
* Body is 15 to 16px (app) or 15 to 17px (landing), letter-spacing -0.012em.
* Labels, eyebrows, badges and table headers: Geist 500, 12 to 13px, letter-spacing .01em, --ink-label, sentence case. text-transform: uppercase is banned.
* All numbers use font-variant-numeric: tabular-nums so costs and counts don't jitter as they update.
App shell (fixed dimensions, so nothing jumps):
* Sidebar: 248px wide, --panel, right border --line. Logo at top (a small watercolour drop + "Cascade"), then nav: Home, Leads, Clean a list, Provider lab, Billing, Settings. The credits balance card is pinned at the bottom.
* Top bar: 56px, holding the page title, the run status pill and the credits meter.
* Content: max 1280px wide, 32px padding.
* Table rows: exactly 44px. Header 40px. Cards 12px radius. Buttons and inputs square, 40px tall.
* Skeletons always match final sizes exactly, so loading never shifts layout.
Watercolour kit (src/components/watercolour/):
1. Bleed filter: inline SVG with feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="4", then feDisplacementMap scale="34", then feGaussianBlur stdDeviation="5". Applied to blob paths filled with --wash-100 to --wash-300 at 0.55 to 0.8 opacity.
2. Wet edge: a copy of each blob stroked in --wash-400, 1.5px at 0.35 opacity, so pigment pools at the rim.
3. Paper grain: a fixed overlay with feTurbulence baseFrequency="0.9" at 5% opacity, mix-blend-mode: multiply, pointer-events:none.
4. Where washes go: behind the hero, behind the onboarding card, empty states, the ICP card, the credits card and the run-complete moment. Never behind table text. At most 3 per viewport.
Motion:
* Everything eases with cubic-bezier(.22,.61,.21,1).
* Scroll reveals on the landing page: from opacity 0, translateY(26px) and blur(7px), staggered 80 to 140ms.
* App transitions: 240 to 320ms, transform and opacity only, never height.
* Pulse dots: scale(1) to scale(.82), opacity 1 to 0.4, over 1.5s.
* Respect prefers-reduced-motion everywhere.
Copy voice: short, literal, numbers over adjectives. No em-dashes, no exclamation marks, no emoji, and never "unlock", "leverage" or "seamless".
Landing page
Route /. Every section sits in the 1180px rail with hairline borders between sections.
#
	Section
	Layout
	Copy
	1
	Nav
	Hairline bottom border
	Logo. Links: How it works, Pricing, Questions. Buttons: "Log in" (secondary), "Start free" (primary)
	2
	Hero
	Dot-grid in #e9eef5 at 58px, a large wash top right. Text left, the waterfall canvas right, with corner labels [ 5 providers ] [ misses free ] [ verified ] [ 1 cent ]
	Pill: "live: emails pouring in". H1: "Tell us what you sell. Get the people who'll buy it." Sub: "Cascade reads your website, writes your ideal customer profile, and finds verified decision makers by trying five email providers until one hits." Buttons: "Start free" and "See a run"
	3
	The waterfall canvas
	Inside the hero, on a <canvas>
	Five pastel tiers stacked like rock ledges, one per provider. Droplets (leads) fall through. A droplet that hits on a tier turns green and pools at the bottom. Misses trickle on to the next tier. A small meter counts the cost up in cents. Respects reduced motion
	4
	How it works
	Eyebrow, H2, then 4 numbered rows
	Eyebrow [ how it works ]. H2: "From your website to a verified list." 01 Tell us your business. One sentence and your website. 02 Get your ICP. Opus reads your site and writes who buys. 03 We find the people. Matching companies and the decision maker at each. 04 The waterfall verifies them. Five providers, cheapest first, you only pay for hits
	5
	Features
	2x2 grid, 258px demo panels
	Eyebrow [ what it does ]. H2: "Everything a lead tool should do, priced per result." ICP from your website (panel: an ICP card writing itself). The waterfall (panel: a row trying 3 providers, then turning green). Clean any list (panel: a CSV filling with verified ticks). See every cent (panel: a receipt printing line by line)
	6
	The bake-off
	Full-width panel with a bar chart
	Eyebrow [ why a waterfall ]. H2: "One provider finds some. Five find most." A chart of each provider alone vs the waterfall on the same 100 leads. Use your real provider lab numbers; until then, show "run your own bake-off" with no fake numbers
	7
	Marquee
	Two rows of huge words, ink and --wash-300, separated by ///
	"pay per hit /// misses free /// verified /// your ICP /// five providers /// one bill"
	8
	Engine section
	Dark, 350vh scroll with a sticky 100vh viewport
	Phases: A website (text being read), An ICP (the card forms), Companies (logos appear), People (names attach to logos), Emails (droplets through tiers), A list (the table). Captions crossfade per phase
	9
	Pricing
	One card split in two, corner wash
	Eyebrow [ pricing ]. H2: "Pay for results, not seats." Left: "From 5 cents per verified email", "Start free", "50 free credits on sign up". Right, with green ticks: ICP from your website · Company and decision-maker search · Five-provider email waterfall · Verification included · CSV and Excel export · Clean your own lists
	10
	Questions
	FAQ accordion
	See below
	11
	Final call to action
	Dot-grid with a wash, centred
	H2: "Your next 50 customers are one sentence away." The same two buttons
	12
	Footer
	Columns with hairlines
	Product, Company, Legal (Terms, Privacy, Data and opt-out). Small line: "Data via Treg"
	FAQ copy:
* Where does the data come from? From licensed B2B data providers, reached through one connection. Each result shows which provider found it.
* What's a waterfall? We ask the cheapest provider first. If it doesn't find an email, we ask the next one. You only pay when one finds it.
* What does verified mean? The email was checked for deliverability. Catch-all domains are marked separately, because no one can fully confirm them.
* Do you guarantee results? No. You see a free count and a price estimate before every run, and you only pay for what's found.
* Can I clean my own list? Yes. Import a CSV, map the columns, see the price, and run.
* Can people opt out? Yes. Anyone can ask to be removed, and removed contacts are never returned again.
Sign up and onboarding
The goal is an onboarding that feels expensive: no jumps, no flicker, no layout shift. Every step lives inside one card of a fixed size and only the content inside moves.
Sign up
* /signup: name, email, password (10+ characters), and "I'll use Cascade for B2B outreach and respect opt-outs" (required). /login: email and password.
* Sessions last 30 days in an httpOnly, SameSite=Lax cookie.
* New accounts get 50 free credits (worth $0.50 at CREDIT_VALUE_USD=0.01), shown with a small wash animation on the credits card.
The onboarding card
* Centred, 640px wide and 560px tall, fixed, 12px radius, white, with a soft wash behind it.
* A 2px progress bar across the top that animates width between steps.
* Header area 88px: step label ("Step 2 of 5") and the question.
* Body area 400px: the inputs. If content is taller, the body scrolls internally. The card never grows.
* Footer 72px: Back (secondary) and Continue (primary), pinned. Enter continues.
* Transitions: the outgoing step slides 24px left and fades out, while the incoming step slides in from 24px right. 280ms with cubic-bezier(.22,.61,.21,1), transform and opacity only. Back reverses the direction.
* Validation: every input reserves a 20px line beneath it for its error message, so errors never push content down.
* Buttons keep a fixed width while loading, with the spinner replacing the label.
The steps
Step
	Question
	Inputs
	Notes
	1
	"What's your website?"
	URL field, auto-prefixed with https. Business name below, optional
	Validates the domain format on blur
	2
	"What do you sell, in one sentence?"
	Text, up to 140 characters, with rotating example placeholders ("A CRM for accounting firms", "Bookkeeping software for dentists"). Price point chips: under $50/mo, $50 to $500/mo, $500+/mo, one-off
	

	3
	"Who do you think buys it?"
	Optional free text. Region chips: UK, US, Canada, Australia, Ireland, EU. Company size chips: 1-10, 11-50, 51-200, 201-1,000
	"Not sure? Leave it, we'll work it out from your site"
	4
	"How many leads to start with?"
	Slider from 10 to 200, default 50. Phone numbers toggle (off by default, with its price shown)
	The estimate updates live under the slider
	5
	"Reading your website"
	No inputs: a live progress list
	See below. Continue appears when the ICP is ready
	Step 5: the live read
A checklist inside the card. Each line has a fixed height and swaps its icon from a pulsing blue dot to a green tick as it completes:
1. Reading your homepage, using branddev.web.scrape. Shows the page title when done.
2. Reading 3 more pages, choosing pricing, about and customers links from the homepage.
3. Pulling your brand, using branddev.brand.retrieve. When it lands, the logo appears in the sidebar, and the app's wash tint subtly shifts towards the brand's main colour (only if contrast stays above 4.5:1).
4. Writing your ideal customer profile, using Opus 5.5. The summary streams in, word by word, in a fixed 120px box.
Each line shows its cost on the right in small grey text ("$0.0025"), which is the first time the user sees that every call has a price. The website read is included free for the user and charged only to the admin's Treg balance.
Website read and ICP generation
POST /api/icp takes the onboarding answers plus the scraped pages (trimmed to about 15,000 words) and the brand record, and calls Opus 5.5. The response is Zod-validated, with one retry on invalid JSON.
System prompt:
You are a B2B go-to-market strategist. From a company's website and its own description,
define who is most likely to buy, in terms a data provider can search.
Use only the inputs. Be specific: real industries, real job titles, employee ranges,
countries. Prefer one tight segment over a broad one. If the user stated a segment, start
there and refine it. List your assumptions. Return only JSON matching the schema.
ICP schema:
{
 "summary": "Accounting firms that still run client work in spreadsheets and email.",
 "segments": [{
   "name": "Small UK and US accounting firms",
   "industries": ["Accounting"],
   "keywords": ["accounting", "bookkeeping", "tax advisory"],
   "excludeKeywords": ["software", "recruitment"],
   "countries": ["GB", "US"],
   "employeeRange": [10, 50],
   "targetTitles": ["CEO", "Managing Partner", "Founder", "Owner"],
   "seniority": ["owner", "partner", "c_suite"],
   "whyTheyBuy": "Partners lose hours chasing client documents across email.",
   "pains": ["", "", ""],
   "openingAngle": ""
 }],
 "primarySegment": 0,
 "assumptions": [""],
 "confidence": 0.8
}
The ICP card
After onboarding, the ICP appears as a card: a portrait card with a wash header, the segment name in large type, and editable chip rows for industries, countries, employee range (a dual slider), target titles, keywords and exclusions. Opus's "why they buy" and "opening angle" sit at the bottom in quiet text.
* Edit anything. Chips are add and remove. Changing a chip triggers a free re-count after 600ms.
* Regenerate reruns Opus with a one-line note ("smaller firms", "US only").
* Add a segment for a second ICP, shown as a second card behind the first.
Free count before spending
Under the card, a live line: "About 4,820 companies match. 2,960 have a matching title." The figures come from the free count endpoints (icypeas.companies.search.count, companyenrich.companies.search.count, icypeas.people.search.count, getleadsio.people.search.count). Show whichever answers first, with "about".
Turning the ICP into provider filters
Each provider uses its own filter values, so src/treg/filters.ts converts the ICP:
* Countries become ISO codes, or the provider's own location values using the free geo lookups (companyenrich.geo.country.get, companyenrich.geo.cities.search).
* Titles get normalised with the free title autocomplete (companyenrich.positions.autocomplete).
* Industries map through each provider's "list filter values" endpoint, which is free. Cache these lists in SQLite for 7 days.
* If a value can't be mapped, fall back to keyword search and flag it on the card ("matched by keyword").
The run button
"Find 50 leads · about 4.6 credits each · est. 230 credits (max 305)", with a breakdown on hover: companies, decision makers, emails found (estimated from your hit rates, or 70% by default), verification. The run can't start without enough credits, and it holds the maximum cost up front, refunding the unused part when it finishes.
Finding the leads and the waterfall engine
A run is one job: an ICP plus a target count (for example 50), or an imported list plus a clean mode. Runs are stored in SQLite and processed by the job runner, 5 rows at a time, with progress streamed to the table over server-sent events. Closing the tab doesn't stop a run.
Stage 1: companies
1. Call tomba.companies.search.reveal with the mapped filters (industry, country, size). One credit returns up to 50 companies (~$0.000178).
2. If it returns fewer than the target, top up with icypeas.companies.search (~$0.00038 a row), then treg.companies.search as a last resort.
3. De-duplicate by domain, and drop anything matching the exclusion keywords or the user's opt-out list.
4. Each company becomes a row immediately, so the table starts filling within seconds.
Stage 2: the decision maker at each company
1. icypeas.people.search filtered to the company and the ICP's target titles, in priority order (CEO, then Managing Partner, then Founder, then Owner). Take the most senior match (~$0.00038 a row).
2. If there's no match, try findymail.search.employees ($0.0198 a contact), then leadmagic.people.search ($0.025 a person).
3. No decision maker after all three: mark the row "No match for these titles" and charge nothing.
Stage 3: the email waterfall
// src/engine/waterfall.ts (simplified)
for (const provider of orderedProviders(user, 'email')) {   // cheapest first, or smart order
 if (!provider.canRunWith(row)) continue;                   // e.g. AI Ark needs a profile URL
 if (rowSpend + provider.maxPrice > row.capUsd) break;      // per-row cost cap
 emit(row, { step: 'email', provider: provider.id, state: 'trying' });
 const r = await treg.call(provider.endpoint, provider.toParams(row), {
   maxCostUsd: provider.maxPrice, idempotencyKey: key(run, row, 'email', provider.id)
 });
 rowSpend += r.costUsd;
 logAttempt(row, provider, r);                              // every attempt, hit or miss
 const email = provider.readEmail(r.body);
 if (email) { row.email = email; row.emailProvider = provider.id; break; }
 emit(row, { step: 'email', provider: provider.id, state: 'miss' });
}
Default order (cheapest first): QuickEnrich, Kitt, AI Ark, Tomba, LeadsForge. Every one has free misses, so a row only ever pays for the provider that hits.
Stage 4: the verification waterfall
1. contactout.people.email.verify (free). A result of "valid" means done and verified.
2. If the result is catch-all or unknown: trykitt.people.email.verify ($0.0015), which handles catch-all domains.
3. If it's still unknown: millionverifier.people.email.verify ($0.00178).
4. Final states: Verified, Catch-all (risky), Invalid (then run the email waterfall again with the next provider, once), or Unknown.
Stage 5 (opt-in): phone and company data
* Phone: only with the toggle on and within the per-row cap. Order: AI Ark ($0.026), Dropleads ($0.054), LeadMagic ($0.125), then hlrlookup.people.phone.network ($0.0033) to confirm the number is live.
* Company data column: prospeo.companies.enrich adds industry, headcount, funding and tech on demand.
Smart order
Every attempt is logged in provider_attempts: provider, step, hit or miss, and cost. Smart order ranks providers by expected cost per hit:
expected_cost_per_hit = price_per_hit + (miss_cost × (1 - hit_rate)) / hit_rate
hit_rate = (hits + 1) / (attempts + 2)     -- smoothed, so new providers aren't ignored
With free misses, that means cheap providers with decent hit rates go first, and expensive ones move to the back unless they're the only ones finding emails. Smart order turns on after 50 attempts per provider. Before that, the default order applies. Users can always override it by dragging.
Per-row caps and run safety
* Per-row cap: a setting (default $0.05 for email only, $0.25 with phone) passed to every call as X-Treg-Route-Max-Cost and enforced in the loop.
* Run budget: the maximum possible cost is held in credits at the start and the rest refunded at the end. When the user's held credits run out mid-run, the run pauses and asks to top up.
* Idempotency: the key is run:row:step:provider, so a crash or retry never double-charges.
* Opt-out list: a suppressions table of emails and domains is checked before every paid call, and matching rows are never processed or returned.
The table, import, cleaning and export
The leads table
Route /leads/[runId]. This is the screen people will screenshot, so it needs to feel alive while it fills and calm once it's done.
Columns: select box · Company (logo from branddev when available, with the domain beneath) · Person (name and title) · Email · Status · Found by · Phone (optional) · Cost · actions menu. Company data columns appear when added.
Cell states (each cell is exactly 44px tall, so nothing reflows):
State
	Look
	Queued
	A faint --line-soft bar shimmer
	Trying
	A small droplet icon falling through a tiny 5-step ladder, with the current provider's chip ("Kitt") in its pastel colour
	Miss, moving on
	The chip fades and slides down to the next provider in 200ms
	Found
	The email types in, with the provider dot beside it
	Verified
	A green tick and "Verified" on #e3f2e9
	Catch-all
	An amber "Catch-all" badge on #f8eedb, with a tooltip explaining the risk
	Not found
	A grey "Not found, no charge"
	Cost
	Tabular figures in credits ("5 credits"), with a hover receipt listing every attempt for that row. The admin also sees the Treg cost ("$0.0050 Treg")
	Above the table:
* Run title and ICP name, with a live status pill ("pouring · 32 of 50").
* Four live counters, in tabular figures: Found, Verified, Catch-all, Spent (credits and dollars).
* A waterfall summary bar: one stacked bar showing how many emails each provider found, in provider colours.
Interactions: sort, filter by status or provider, search, click to expand a row (the full attempt history, company details and opening angle), multi-select for bulk actions (re-verify, find phone, delete, export selected), keyboard up and down navigation. TanStack Virtual keeps 10,000 rows smooth.
Run complete: a soft ripple across the table, a single wash bloom behind the counters, and a receipt card that slides up (see "The fun layer").
Import
Route /clean. Drag in a CSV (up to 10,000 rows):
1. Parse with Papa Parse and show the first 5 rows.
2. Map columns by auto-detecting from header names (first name, last name, full name, company, domain, website, email, LinkedIn URL, title). Unmapped columns are kept and passed through to the export.
3. De-duplicate by email or by name plus domain, and show how many duplicates were removed.
4. Check suppressions, and show how many rows are skipped.
Clean modes, each with a price
Mode
	What it does
	Price shown
	Verify only
	Runs the verification waterfall on existing emails
	0.5 credits per email
	Verify and refind
	Verifies, then runs the email waterfall for invalid or missing emails
	0.5 per verify + 5 per new verified email
	Full enrich
	Finds the domain if missing, the email, verification, and optionally phone and company data
	Shown per column
	Before the run starts, the screen shows: "1,240 rows · est. 2,310 credits ($23.10) · max 3,100 credits", using your own hit rates where you have them.
Export
* CSV and Excel (.xlsx) with all columns, or only the ones selected.
* Options: verified only, include catch-all, include attempt history.
* Every export includes the provider that found each email and its verification status.
Pricing everywhere
One rule: no paid action without a visible price.
* Every paid button carries a price pill: "Find phones · ~40 credits each".
* The top bar holds a credits meter that ticks down live during a run, like a taxi meter.
* Every row has a cost, every run has a receipt, and every export shows the run's total.
* Estimates use the user's own hit rates when they exist, or defaults otherwise, and always show the maximum.
Billing, the dashboard and the provider lab
How Cascade makes money
Customers buy credits (1 credit = CREDIT_VALUE_USD, $0.01 by default). Every result costs a set number of credits, charged only on success, just as Treg only charges for hits. The admin pays Treg's real cost from the Treg balance. The difference is the margin.
Default price list (editable by the admin in Settings):
Result
	Credits
	Customer price
	Typical Treg cost
	Notes
	ICP from your website
	0
	Free
	~$0.03 (scrape and brand) plus the Opus call
	Paid by the admin as acquisition cost
	Company found
	0.1
	$0.001
	under $0.0004
	

	Decision maker found
	1
	$0.01
	$0.00038, up to $0.025 on fallbacks
	Blended margin, since most hits come from the cheapest provider
	Verified email
	5
	$0.05
	$0.0048 to $0.0245, plus up to $0.0033 to verify
	The headline price
	Catch-all email
	2
	$0.02
	Same as above
	Cheaper, because it's riskier
	Verify only (cleaning)
	0.5
	$0.005
	Free to $0.0033
	

	Phone found and live
	40
	$0.40
	$0.026 to $0.125, plus $0.0033
	Opt-in only
	Company data column
	5
	$0.05
	~$0.0245
	

	A 50-lead run with a 70% email hit rate comes to about 230 credits ($2.30) for the customer, against roughly $0.30 to $0.80 in Treg costs.
Alternative mode, cost-plus: price = max(floor, Treg cost × DEFAULT_MARKUP). The admin switches modes in Settings. The fixed price list is easier for customers to understand, so it's the default.
The billing page
Route /billing. Customers see:
* The credits balance as a big tabular number on a wash card, with a small sparkline of credits used over 30 days.
* Top-up packs: 1,000 credits for $10, 5,000 for $45 and 20,000 for $160. Stripe Checkout in test mode, or an instant mock top-up when no Stripe key is set.
* The ledger: every top-up, hold, charge and refund, with its run, in a 44px-row table.
* Receipts: one per run, showing results by type, credits charged and credits refunded from the hold.
The admin also sees a Margin tab:
* Revenue (credits charged × credit value) against Treg cost (the sum of X-Treg-Cost-Micro), and margin %, by day, by provider and by step.
* The Treg balance, with a low-balance warning below $10.
* A per-customer table: credits bought, credits used, Treg cost and margin.
Every Treg call is tagged with X-Treg-Meta: user=<id>,run=<id>,step=<step>, so Treg's own records line up with Cascade's. As a second safety net, Treg's per-customer budgets (PUT /orgs/<org_id>/budgets/<dim>/<value>) can cap each customer's spend. Confirm the exact request body in Treg's integration docs before building it.
The dashboard
Route /home:
* Five KPI tiles: credits balance, leads found this week, verified rate, average cost per verified email, and savings vs the best single provider.
* Your ICPs as small cards, with "Find more" on each.
* Recent runs: a table with status, counts, credits and a link.
* Quick actions: New ICP, Clean a list, Provider lab.
The provider lab (the video moment)
Route /lab. This is where Cascade proves the waterfall, with your own data.
1. Pick the rows: 100 from an existing run or an import.
2. Pick the providers to test, with the estimate shown: running each provider on every row costs more than a waterfall, so the price is clearly labelled.
3. Run the bake-off: every selected provider tries every row. Because every attempt is logged, the waterfall result is worked out from the same attempts at no extra cost. It's the first hit in your chosen order.
4. Results:
   * A bar chart in provider colours: emails found by each provider alone, then the waterfall.
   * A table with each provider's hit rate, cost per hit, unique finds (emails no other provider found) and agreement with the others.
   * The headline line: "The best single provider found 52. The waterfall found 81 for $1.10." Always use real numbers from the run.
5. Apply as my order saves the ranking as the user's waterfall order. Changing it with drag and drop reruns the waterfall calculation instantly from the logged attempts.
The fun layer
These details are what make people film their screen and share it. Every one respects prefers-reduced-motion.
1. The landing waterfall canvas. Five pastel ledges, one per provider. Droplets fall from the top, and a droplet that hits turns green and drops into a pool at the bottom while the rest trickle on to the next ledge. A cost meter ticks up in cents beside it.
2. The cell ladder. While a row is being worked on, the Found by cell shows a tiny 5-step ladder with a droplet moving down it, and the current provider's chip in its colour. When one hits, the droplet lands with a 120ms squash.
3. The ICP trading card. When Opus finishes, the card flips over (a 600ms 3D rotate) and reveals the ICP, with the brand's logo in the corner, a wash header and stats: "About 4,820 companies · 2,960 decision makers".
4. The taxi meter. The credits meter in the top bar rolls digits like an odometer as credits are spent, and briefly glows the provider's colour on each charge.
5. Run complete. A ripple runs down the table from the top, the counters land with a soft spring, a single wash blooms behind them, and the receipt card slides up from the bottom right.
6. Brand tint. After the website read, the app's washes shift slightly towards the customer's brand colour, so the workspace feels like theirs.
7. An optional drip sound (off by default, toggle in Settings): a soft water drop on each verified email, quieter and lower for catch-all.
8. Command palette. Cmd+K for: new ICP, clean a list, open a run, export, top up.
9. Empty states that teach. Each has a small watercolour illustration and one literal line, such as "No runs yet. Describe your business and Cascade finds the people who buy it."
10. Provider ribbons in the lab: small pastel ribbons ("most finds", "cheapest per hit", "most unique") on the winning providers. Drawn shapes, no emoji.
Data model, API routes and folders
SQLite tables (Drizzle; every table has id as a nanoid and created_at):
Table
	Key columns
	users
	email (unique), name, password_hash, role (admin or customer), agreed_terms_at
	sessions
	user_id, token_hash, expires_at
	businesses
	user_id, website, name, offer, price_point, regions (JSON), sizes (JSON), lead_target, brand (JSON: logo, colours)
	pages_read
	business_id, url, markdown, treg_call_id
	icps
	business_id, version, json, note, approved_at
	runs
	user_id, kind (find or clean), icp_id, target, mode, status (queued, running, paused, done, failed), held_credits, charged_credits, treg_cost_micro, started_at, finished_at
	rows
	run_id, company_name, domain, logo_url, person_name, title, linkedin_url, email, email_status (verified, catch_all, invalid, unknown, not_found), email_provider, phone, phone_provider, company_data (JSON), extra (JSON for passthrough columns), credits, state
	provider_attempts
	row_id, step (company, person, email, verify, phone), endpoint_id, hit (0/1), cost_micro, ms, treg_call_id, created_at
	treg_calls
	endpoint_id, params_hash, status, cost_micro, call_id, meta, created_at
	waterfall_orders
	user_id, step, endpoint_ids (JSON), mode (default, smart, custom)
	credit_ledger
	user_id, kind (grant, topup, hold, charge, refund), credits, run_id, stripe_session_id, note
	price_list
	result_type, credits, active
	suppressions
	value (email or domain), kind, reason, created_at
	filter_cache
	provider, filter_type, values (JSON), fetched_at
	API routes (Next.js route handlers, Zod-validated, session required unless noted):
Route
	Method
	Does
	/api/auth/signup, /login, /logout
	POST
	Auth (no session needed)
	/api/business
	GET, PUT
	Onboarding answers
	/api/business/read
	POST
	Scrape pages and brand through Treg (streams progress)
	/api/icp
	POST
	Opus writes the ICP (streams)
	/api/icp/[id]
	PUT
	Save edits, approve
	/api/icp/[id]/count
	POST
	Free counts
	/api/estimate
	POST
	Estimate for any run or action: min, expected, max in credits
	/api/runs
	GET, POST
	List runs, start a find or clean run (holds credits)
	/api/runs/[id]
	GET
	Run with rows (paged)
	/api/runs/[id]/stream
	GET (SSE)
	Live row and counter updates
	/api/runs/[id]/pause, /resume, /cancel
	POST
	Run control
	/api/runs/[id]/export
	GET
	CSV or xlsx
	/api/rows/bulk
	POST
	Re-verify, find phone, delete, for selected rows
	/api/import
	POST (multipart)
	Parse, map and de-dupe a CSV, returning a preview
	/api/waterfall
	GET, PUT
	The user's order per step
	/api/lab
	POST
	Start a bake-off
	/api/lab/[id]
	GET
	Bake-off results
	/api/billing/checkout
	POST
	Stripe Checkout session, or a mock top-up
	/api/billing/webhook
	POST
	Stripe webhook adds credits (verified signature, no session)
	/api/billing/ledger
	GET
	Ledger and receipts
	/api/admin/margin
	GET
	Admin only: revenue vs Treg cost
	/api/suppressions
	GET, POST, DELETE
	Opt-out list
	Folders:
cascade/
 PRD.md  .env.local
 data/cascade.db                 gitignored
 src/
   app/
     page.tsx                    landing
     (auth)/signup, login
     onboarding/                 the fixed-height card flow
     (app)/home, leads/[runId], clean, lab, billing, settings
     api/...
   components/
     landing/                    Hero, WaterfallCanvas, HowItWorks, Features, BakeOff, Marquee, Engine, Pricing, Faq
     onboarding/                 StepCard, ProgressBar, LiveReadList
     icp/                        IcpCard, ChipRow, CountLine
     table/                      LeadsTable, CellLadder, StatusBadge, ProviderChip, RowReceipt
     billing/                    CreditsCard, TaxiM