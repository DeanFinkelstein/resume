// Single source of truth for Dean's resume.
// T = Technical register, P = Plain English register, src = where each claim comes from.
// Every pair is the same fact said two ways. Names, dates, and certifications never change between registers.
// No client names, client contacts, or private client quotes anywhere in this file.

const name = 'Dean Finkelstein';
const contact = ['Matamoras, PA', 'finkelstein.dean@gmail.com', 'linkedin.com/in/deanfinkelstein'];
const availability = 'Availability: remote part-time, 20 to 30 hours a week, W2 or 1099, can start now. Evenings and weekends ET; daytime calls by appointment.';

const tagline = {
  t: 'Salesforce Managed Services Team Lead  |  8x Salesforce Certified  |  Builds AI and agentic tooling',
  p: 'Leads a support team for companies that run on Salesforce  |  Eight Salesforce certifications  |  Builds AI helpers that do real work',
};

const summary = {
  t: 'Salesforce consultant and team lead with five years at a Salesforce consulting partner and seven years before that in sales management and CRM administration. Leads a 13-client managed-services book at Cirrius Solutions: 80% renewal rate in H1 2026 (8 of 10 renewals due), the highest client survey (CSAT) score on the team, and one of nine delivery leads named on the entry that won Cirrius the 2027 Salesforce Partner of the Year for Customer Value. Builds AI tooling for his own operation and for clients, from a Claude Code operations agent to an AI security briefing now reused company-wide. Makes complex technical work simple for the people who depend on it, and still carries hands-on delivery as a lead.',
  p: 'Five years at a firm that helps companies run Salesforce, the system businesses use to track customers, sales, and service. Seven years before that managing sales teams and the systems they ran on. Looks after thirteen companies on retainer at Cirrius Solutions: eight of the ten contracts up for renewal in the first half of 2026 renewed, with the highest client survey score on the team. One of nine people named on the work that won the firm a Salesforce Partner of the Year award. Builds AI tools for his own work and for clients. Explains hard things in plain words, and still does the hands-on work himself.',
  src: 'Internal review, Jul 2026; Salesforce announcement, Sep 2026; 2026 self-evaluation',
};

const highlights = [
  { t: 'Widest client portfolio on the Managed Services team (13 clients). 80% renewal rate in H1 2026 (8 of 10 renewals due). Highest client survey (CSAT) score on the team.',
    p: 'Thirteen companies on retainer, the most on the team. Eight of the ten contracts up for renewal in the first half of 2026 renewed. Highest client survey score on the team.',
    src: 'Internal review, Jul 2026' },
  { t: 'Named as one of nine contributing delivery leads on the entry that won Cirrius the 2027 Salesforce Partner of the Year for Customer Value (Sept 2026).',
    p: 'One of nine people named on the work that won the firm a 2027 Salesforce Partner of the Year award for Customer Value (Sept 2026).',
    src: 'Salesforce announcement, Sep 2026',
    srcHref: 'https://www.salesforce.com/blog/announcing-the-2027-salesforce-partner-of-the-year-award-winners/' },
  { t: 'Closed two managed-services renewals in Jul and Aug 2026, one of them for a further 12 months.',
    p: 'Two companies re-signed their support contracts in July and August 2026, one of them for another full year.',
    src: 'Renewal notices, Jul and Aug 2026' },
  { t: 'Converted a 244-line Health Cloud audit into 96 structured ClickUp tasks in about ten minutes with Claude Code and MCP. The same work previously took half a day by hand.',
    p: 'Turned a 244-line audit document into 96 tracked tasks in about ten minutes using an AI assistant. By hand it took half a day.',
    src: '2026 self-evaluation', ai: true },
  { t: 'Led a Field Service rollout that leadership praised as a clear success, and shipped a sales team’s KPI dashboard in CRM Analytics to their Sales homepage.',
    p: 'Set up the system a client uses to schedule technicians, which leadership praised as a clear success, and built a sales team a dashboard that now sits on their home page.',
    src: 'Leadership email, Mar 2026; client announcement, Aug 2026' },
];

// Three numbers shown as tiles above Selected Results, on screen only. Each one restates a sourced line in highlights.
const metrics = [
  { n: '80%', t: 'renewal rate in H1 2026 (8 of 10 due)', p: 'of contracts due in the first half of 2026 renewed (8 of 10)' },
  { n: '13', t: 'clients in his managed-services book, the most on the team', p: 'companies on retainer, the most on the team' },
  { n: '10 min', t: '244-line audit to 96 ClickUp tasks with Claude Code (was half a day)', p: 'to turn a 244-line audit into 96 tasks with AI (was half a day)', ai: true },
];

const skills = [
  { label: { t: 'Administration and development', p: 'Running Salesforce' },
    t: 'Flow, validation rules and formulas, users, profiles, roles, permission sets and sharing, Data Loader, sandbox strategy, change sets, Production deployments; Apex, SOQL, Lightning Web Components (LWC), SFDX, Git',
    p: 'Running the system day to day: automating steps, setting rules that keep data clean, deciding who sees and does what, bringing data in, and moving changes into the live system without breaking it. Writes code on Salesforce when settings alone are not enough.' },
  { label: { t: 'Clouds', p: 'Salesforce products' },
    t: 'Sales Cloud, Service Cloud, Experience Cloud, Health Cloud, Field Service, Salesforce Maps; Data Cloud (Data 360): setup, data streams and model, identity resolution, segments and activations',
    p: 'The parts of Salesforce for sales, customer service, field technicians, customer websites, healthcare, and maps. Also the part that pulls customer data from many systems into one profile per person and groups people for outreach.' },
  { label: { t: 'Analytics', p: 'Dashboards' },
    t: 'CRM Analytics (CRMA), Tableau, Tableau Next, Lightning reports and dashboards',
    p: 'Charts and dashboards that show a business how it is doing, built simple enough that people use them.' },
  { label: { t: 'Integrations', p: 'Connections' },
    t: 'DocuSign CLM, RingCentral, CallRail, carrier API remediation, SOAP Login Retirement analysis, Zapier, Salesmate, Delphi CRM',
    p: 'Connecting the customer system to other software (contract signing, phone systems, call tracking, mobile carriers, maps) and fixing the link when it breaks. Earlier tools: Zapier, Salesmate, Delphi.' },
  { label: { t: 'AI and agentic tooling', p: 'AI tools' }, ai: true,
    t: 'Claude Code, MCP, Obsidian, SharinPix “Work with AI”, AI security briefings. Einstein for clients: Activity Capture, Lead and Opportunity Scoring, bots, Conversation Insights. Agentforce (Agent Script, Prompt Builder, Apex actions): practice builds, not yet for clients',
    p: 'Building AI helpers with Claude Code and related tools, and showing a client’s IT team how to adopt AI safely. Setting up Salesforce’s built-in AI features for clients (email and calendar sync, lead scoring, chat bots, call analysis). Has built Salesforce AI agents from start to finish in practice accounts, not yet for a client.' },
  { label: { t: 'Delivery and leadership', p: 'Running the work' },
    t: 'Managed services, SOW renewals, UAT coordination, End of Month reviews, pre-sales support, team leadership',
    p: 'Ongoing support contracts, renewals, client testing, monthly reviews with clients, sales support, and leading a team.' },
];

const experience = [
  {
    company: 'Cirrius Solutions Inc.',
    note: { t: 'Salesforce consulting partner', p: 'a firm that helps companies run Salesforce' },
    dates: 'Jun 2021 to present',
    roles: 'Team Lead, Managed Services (Feb 2024 to present)  ·  Senior Consultant (Jun 2023 to Feb 2024)  ·  Salesforce Consultant (Jun 2021 to Jun 2023)',
    src: 'Dates: LinkedIn profile',
    bullets: [
      { t: 'Own delivery outcomes across a 13-client managed-services book. Lead the Managed Services team day to day, line-manage two consultants, run the daily standup, and carry hands-on technical delivery alongside.',
        p: 'Responsible for results across thirteen companies on retainer. Runs the team day to day, coaches two consultants, runs the daily check-in, and still does hands-on work.',
        src: 'Internal review, Jul 2026' },
      { t: 'Run client governance: End of Month reviews, SOW renewals, and named point of contact for one client’s data work. Built a pre-sales deck that leadership credited with getting the deal across the line.',
        p: 'Holds monthly reviews with clients, handles contract renewals, and is one client’s named contact for anything to do with their data. Built a sales deck that leadership said got the deal across the line.',
        src: 'Leadership message, Apr 2026; client email, Oct 2026' },
      { t: 'For a managed-services client: wrote an AI-security briefing as a branded PDF and walked the client’s IT team through Claude’s OAuth, data retention, and licensing so they could adopt it; the briefing became a company-wide template. Deployed a new build to Production and smoke-tested it. The client renewed its SOW in Aug 2026.',
        p: 'For one client: wrote a guide to using Claude safely (who can log in, how long data is kept, what it costs) and walked their IT team through it. The firm now reuses that guide. Put a new build live and checked that it worked. The client renewed in August 2026.',
        src: 'Client messages, May to Sep 2026', ai: true },
      { t: 'For a medical-device manufacturer: reconnected the Salesforce-to-DocuSign CLM integration after it broke; wrote the SOAP Login Retirement integration analysis ahead of the platform deadline; moved a Health Cloud downgrade ahead of schedule; built the persona and permission-set model. Before a Full sandbox refresh, flagged every at-risk item, including items outside Cirrius’s scope, and the client acted on it with a third-party vendor.',
        p: 'For a medical-device maker: got their contract-signing tool talking to their customer system again after it broke; checked every connected system before an old login method was switched off; removed a healthcare add-on ahead of schedule without losing data; set up who can see and do what. Before a scheduled wipe of their test system, listed everything that would be lost, including things that were not the firm’s responsibility, and the client acted on it.',
        src: 'Client emails, Apr to Sep 2026' },
      { t: 'For a client’s sales organization: built the Sales KPI dashboard in CRM Analytics; it cleared tester feedback and went live on the Sales homepage. Tableau Next work that impressed the client’s internal stakeholder. The account was one of three behind the Partner of the Year entry.',
        p: 'For a client’s sales team: built the dashboard that shows how sales are doing. Testers approved it and it now sits on their home page. Work on the same account helped win the Partner of the Year award.',
        src: 'Client announcement, Aug 2026; leadership message, Jul 2026' },
      { t: 'For a client with a carrier API integration: verified the client’s own failure diagnosis read-only against the org, confirmed it held, and caught a gap on the reschedule path the client had missed. Took ownership of the remediation build; the client’s CEO confirmed the catch in writing.',
        p: 'For a client whose system talks to a mobile carrier: checked their own diagnosis of a failing connection without changing anything, confirmed they were right, and found one more case they had missed. Took on the fix. Their CEO confirmed the catch in writing.',
        src: 'Client email, Oct 2026' },
      { t: 'For a field-service client: led the Field Service (FSM) rollout and delivered Salesforce Maps enablement with a short walkthrough video.',
        p: 'For a client with technicians in the field: set up the system that schedules their jobs, and added maps with a short how-to video.',
        src: 'Leadership email, Mar 2026; client email, Apr 2026' },
      { t: 'Organized the Managed Services team through a client’s testing push and drove items to UAT.',
        p: 'Organized the team through a client’s testing push and got the work ready for the client to sign off.',
        src: 'Leadership message, Aug 2025' },
      { t: 'AI and methodology: run a Claude Code plus Obsidian operations agent that keeps project pictures, daily notes, and task tracking current. Connected Claude Code into a client org through VS Code to pull every piece of metadata a package touched. Built a reusable skill that turns a client’s form requirements (Sheet, Doc, or PDF) into a ready-to-run SharinPix “Work with AI” prompt, with a back-up-first rule. Share the approach and demos with the team.',
        p: 'Built an AI assistant that keeps project notes, daily plans, and task lists current. Connected an AI assistant to a client’s system to pull out every piece a software package touched. Built a tool that turns a client’s form requirements into ready-to-run instructions for a form builder, with a back-up-first rule. Shares the approach with the team.',
        src: '2026 self-evaluation', ai: true },
      { t: 'Featured guest on the Cirrius podcast episode on Salesforce security (Apr 2026). Rated among the firm’s most trusted, high-impact leaders in the mid-year review.',
        p: 'Guest on the firm’s podcast episode about keeping Salesforce safe (April 2026). Rated among the firm’s most trusted leaders in the mid-year review.',
        src: 'Company post, Apr 2026; internal review, Jul 2026' },
    ],
  },
  {
    company: 'Final Mentor, LLC.',
    collapsed: true, // web page only: details start folded, the PDFs and Word copy show everything
    note: { t: 'Fort Lauderdale, FL', p: 'Fort Lauderdale, FL' },
    dates: 'Jun 2019 to Jun 2021',
    roles: 'Customer Engagement Manager & CRM Administrator',
    src: 'LinkedIn profile',
    bullets: [
      { t: 'Owned all customer engagement activities and the instructional design of sales, marketing, and workflow automation products.',
        p: 'Looked after customers and designed the training for sales, marketing, and automation products.' },
      { t: 'Built workflow automations in Salesmate CRM and connected tools through Zapier within the platform’s offerings.',
        p: 'Built automations in Salesmate (a customer-tracking tool) and connected other tools to it through Zapier.' },
      { t: 'Ran business analysis to identify software that cut manual processes and sped up customer sales. Put virtual workplace technologies and processes in place during COVID-19.',
        p: 'Found software that cut manual work and sped up sales. Set up remote-work tools and routines during COVID-19.' },
    ],
  },
  {
    company: 'Innovative Health Group, LLC.',
    collapsed: true, // web page only: details start folded, the PDFs and Word copy show everything
    note: { t: 'Fort Lauderdale, FL', p: 'Fort Lauderdale, FL' },
    dates: 'Mar 2017 to Jun 2019',
    roles: 'Sales Manager / Salesforce Admin',
    src: 'LinkedIn profile',
    bullets: [
      { t: 'Managed fifty sales representatives against daily markers and monthly sales goals; mentored and motivated staff.',
        p: 'Managed fifty sales reps against daily and monthly goals, and coached the team.' },
      { t: 'Key player in the company’s Salesforce Lightning implementation and its day-to-day Salesforce Admin: users and profiles, data imports (Import Wizard, Data Loader), custom reports and dashboards, user training, processes and flows, custom objects and fields, Lightning App Builder apps, AppExchange.',
        p: 'Key player in the company’s move to a new version of Salesforce, and ran the system day to day: user accounts, data imports, reports and dashboards, training, automations, custom fields, and apps.' },
      { t: 'Owned new-hire technology training and training development for new technology products.',
        p: 'Ran technology training for new hires and built the training for new tools.' },
    ],
  },
  {
    company: 'Maggiano’s Little Italy',
    collapsed: true, // web page only: details start folded, the PDFs and Word copy show everything
    note: { t: 'Hackensack, NJ', p: 'Hackensack, NJ' },
    dates: 'Mar 2014 to Jun 2017',
    roles: 'Regional Sales and Supply Chain Coordinator',
    src: 'LinkedIn profile',
    bullets: [
      { t: 'Ran all catering sales, supply inventory, delivery staff scheduling, and networking and marketing for the region. Organized philanthropic events to build brand awareness and catering sales.',
        p: 'Ran catering sales, kept supplies stocked, scheduled deliveries, and did the marketing for the region. Organized charity events that raised the brand’s profile and catering sales.' },
      { t: 'Used Delphi CRM to create and manage contracts, client follow-up, and service feedback.',
        p: 'Used Delphi (a contract and customer tool) for contracts, follow-up, and feedback.' },
    ],
  },
];

// Names as Salesforce lists them today, with the older name where it was renamed. Checked 2026-10-18 on the verification page.
const certifications = [
  { name: 'Salesforce Certified Agentforce Specialist (formerly AI Specialist)', date: 'Oct 2024', ai: true },
  { name: 'Salesforce Certified Data 360 Consultant (formerly Data Cloud Consultant)', date: 'Sep 2024', ai: true },
  { name: 'Salesforce Certified Experience Cloud Consultant', date: 'Aug 2023' },
  { name: 'Salesforce Certified Agentforce Field Service and Operations Consultant (formerly Field Service Consultant)', date: 'Feb 2023' },
  { name: 'Salesforce Certified Agentforce Sales Consultant (formerly Sales Cloud Consultant)', date: 'Jul 2022' },
  { name: 'Salesforce Certified Agentforce Service Consultant (formerly Service Cloud Consultant)', date: 'Apr 2022' },
  { name: 'Salesforce Certified Platform App Builder', date: 'Oct 2021' },
  { name: 'Salesforce Certified Platform Administrator (formerly Administrator)', date: 'Feb 2021' },
];
const certNote = {
  t: 'All eight current. Trailhead Ranger; seven Trailhead superbadges (2021). In progress: Anthropic and OpenAI certification track.',
  p: 'All eight are current. Ranger rank on Salesforce’s training site and seven hands-on badges there (2021). Working through Anthropic and OpenAI certifications.',
  src: 'Verify by name with Salesforce',
  srcHref: 'https://trailhead.salesforce.com/en/credentials/verification/',
  ai: true,
};

const education = [
  { text: 'Western Governors University, B.Sc. Information Technology Management, 2021', src: 'LinkedIn profile' },
  { text: 'Eagle Scout, Scouting America, 2009', src: 'LinkedIn profile' },
];

// AI tooling in practice: captions under the diagram. All from the 2026 self-evaluation.
const aiPractice = {
  heading: { t: 'AI Tooling in Practice', p: 'How I Use AI' },
  intro: {
    t: 'The loop below is how the work runs day to day. Inputs on the left, Claude Code in the middle with MCP, Obsidian, and reusable skills around it, outputs on the right.',
    p: 'The picture below is how the work runs day to day. What comes in on the left, the AI assistant and its tools in the middle, what comes out on the right.',
  },
  items: [
    { t: 'Thor: a Claude Code plus Obsidian operations agent that keeps COPs, daily notes, and task tracking current.',
      p: 'Thor: an AI assistant that keeps my project notes, daily plan, and task list up to date.' },
    { t: 'Audit to tasks: a 244-line Health Cloud audit became 96 structured ClickUp tasks in about ten minutes through MCP. Half a day by hand before.',
      p: 'Audit to tasks: a 244-line audit became 96 tracked tasks in about ten minutes. Half a day by hand before.' },
    { t: 'Reusable skill: form requirements (Sheet, Doc, or PDF) become a ready-to-run SharinPix “Work with AI” prompt, with a back-up-first rule added after finding the vendor’s AI regenerates the whole form.',
      p: 'Reusable tool: a client’s form requirements become ready-to-run instructions for a form builder, with a back-up-first rule added after learning the builder’s AI rewrites the whole form.' },
    { t: 'Client org analysis: Claude Code connected to a client org through VS Code to pull every piece of metadata a package touched, which made the analysis cleaner.',
      p: 'Looking inside a client’s system: connected the AI assistant to a client’s Salesforce to pull out every piece a software package touched, which made the review cleaner.' },
    { t: 'Working rule: let the agent ask questions before it acts. Shared with the team, along with a client AI-security briefing that became a company-wide template.',
      p: 'Working rule: let the AI ask questions before it acts. Shared with the team, along with a client safety guide that became a company-wide template.' },
  ],
  src: '2026 self-evaluation',
};

// How this page was built
const builtWith = {
  heading: 'How This Page Was Built',
  body: {
    t: 'One content file holds every line of this resume in two registers with a source for each claim. Three builds read it: this page, a Word copy for applicant tracking systems, and the two PDFs printed from this page. Before anything is published, I run a scan script on it that flags em-dashes, a list of filler phrases, and any client name. Built in Claude Code sessions under those rules, the same way I run client work: write the rules down, let the tooling enforce them, keep one source of truth.',
    p: 'Everything on this page comes from one file that holds each line twice, once in plain words and once in Salesforce terms, with a note on where each claim comes from. Three things are built from that file: this page, a Word copy for job-application systems, and the two PDFs. Before anything is published, I run a checking script on it that catches any em-dash, filler phrase, or client name. Built with Claude Code, the same way I run client work: write the rules down, let the tools enforce them, keep one source of truth.',
  },
  pipeline: [
    'content.js  →  build-web-resume.js  →  this page  →  PDF (Plain English) and PDF (Technical)',
    'content.js  →  build-resume.js  →  Word copy for applicant tracking systems',
    'qa.py  →  run on every output before it is published: em-dashes, filler phrases, client names',
    'resume.json  →  the same content for machines, beside this page',
  ],
  links: [
    { label: 'Build folder and README', href: 'build/README.md' },
    { label: 'Machine-readable version (resume.json)', href: 'resume.json' },
  ],
};

const disclosure = {
  t: 'Drafted with Claude Code under my rules: every number sourced, every quote verbatim, no filler, no client names.',
  p: 'Written with Claude Code under my rules: every number has a source, every quote is word for word, no filler, no client names.',
};

// Ask this resume: the chat panel. endpoint is the deployed Worker URL (no trailing slash). Empty means not switched on yet.
const ask = {
  endpoint: 'https://ask-this-resume.finkelstein-dean.workers.dev',
  label: 'Ask this resume',
  intro: {
    t: 'Answers come only from this page. If it is not on the page, the assistant says so and points you to email. Runs on Claude behind a Cloudflare Worker Dean built, with a per-visitor limit and a daily cap. Dean does not log your questions. They are sent to Anthropic’s API, which deletes them within 30 days under its standard policy.',
    p: 'Ask anything about Dean. The answers come only from this page. If something is not on the page, it says so and gives you his email. It runs on Claude behind a small service Dean built, with a limit per visitor and per day. Dean does not keep a log of your questions. They go to Anthropic, the company that makes Claude, which deletes them within 30 days under its standard policy.',
  },
  offline: 'The assistant is not switched on yet. Email Dean at finkelstein.dean@gmail.com and he will answer in person.',
  starters: ['What has he done with Field Service?', 'Is he certified in Data Cloud?', 'What AI tools has he built?', 'Is he open to full-time work?'],
};

// Artifact gallery: fresh builds in a dev org. Only items with ready: true appear on the page.
const gallery = [
  {
    key: 'agentforce', ready: true, ai: true, href: 'gallery/01-agentforce-resume-agent/',
    title: { t: 'Agentforce resume agent', p: 'An Agentforce assistant about Dean' },
    what: {
      t: 'Service agent in Agent Script with four grounded Apex actions, a read-only permission model, tests, and a 16-question test plan run against the live agent.',
      p: 'The same kind of assistant as the one on this page, built on Salesforce’s own AI agent product.',
    },
    proof: 'Published 2026-10-18: 14 of 16 test conversations pass',
    video: {
      src: 'gallery/01-agentforce-resume-agent/demo.mp4',
      poster: 'gallery/01-agentforce-resume-agent/demo-poster.jpg',
      caption: 'Silent, 75 seconds, in the Agentforce Builder preview. The agent confirms a certification from the data in the org, declines to name clients, gives the availability line, and saves a test message for Dean as a Lead.',
    },
  },
  {
    key: 'ask', ready: true, ai: true, href: 'gallery/05-ask-this-resume/',
    title: { t: 'Ask this resume', p: 'The chat assistant on this page' },
    what: {
      t: 'Cloudflare Worker in TypeScript calling Claude with this resume as cached grounding: origin allowlist, per-visitor and daily caps, published rules at /prompt, plain refusals for anything off-topic.',
      p: 'The chat button at the bottom right. It answers only from this resume, politely refuses everything else, and has a spending cap.',
    },
    proof: 'Live 2026-10-18: 12 of 12 test questions pass',
  },
  {
    key: 'audit', ready: true, ai: true, href: 'gallery/02-org-audit-to-tasks/',
    title: { t: 'Org audit to tasks', p: 'Health check that writes its own to-do list' },
    what: {
      t: 'Read-only org audit (access, licenses, retired automation, API versions, coverage, Health Check, limits) shaped into prioritized tasks with acceptance criteria, reviewed, then created as GitHub issues.',
      p: 'Scans a Salesforce account for security gaps, wasted licenses, and old automation, then turns what it finds into a prioritized task list a team can work from.',
    },
    proof: 'Ran 2026-10-17: 36 findings, 7 issues; 37 after MFA',
  },
  {
    key: 'refresh', ready: true, ai: true, href: 'gallery/03-pre-refresh-risk-scan/',
    title: { t: 'Pre-refresh risk scan', p: 'What a test-system reset would break' },
    what: {
      t: 'Lists everything a sandbox refresh wipes or breaks (scheduled jobs, OAuth tokens, credentials, sites, custom settings, recent setup changes) with an owner column, wrapped in a Claude Code skill that asks first and drafts the client note.',
      p: 'Before a test copy of Salesforce gets wiped and rebuilt, it lists everything that will be lost or broken, so each item gets an owner instead of a surprise.',
    },
    proof: 'Ran 2026-10-17: 16 checks in 67 seconds',
  },
  {
    key: 'briefing', ready: true, ai: true, href: 'gallery/04-adopting-ai-safely/BRIEFING.pdf',
    title: { t: 'Adopting AI safely in a Salesforce shop', p: 'A one-page AI safety guide for IT' },
    what: {
      t: 'One-page briefing for an IT lead: identity and OAuth scopes, data retention by plan and API, Einstein Trust Layer coverage, licensing, and a seven-step rollout.',
      p: 'One page that answers what an IT lead asks before approving AI: who can log in, where the data goes, and what it costs.',
    },
    proof: 'Facts checked against 8 primary sources on 2026-10-17',
  },
];

// The page's own address. In print it goes on the contact line, and the proof lines below point a forwarded copy back to the work.
// description is the search and link-preview text; card is the preview image, made by the build from og-card.html.
const site = {
  href: 'https://deanfinkelstein.github.io/resume/',
  label: 'deanfinkelstein.github.io/resume',
  description: 'Salesforce Managed Services team lead, 8x Salesforce Certified, who builds AI and agentic tooling. Resume with a source for each claim, PDF and Word copies, and an Agentforce agent you can watch.',
  card: { file: 'og-card.png', alt: 'Dean Finkelstein: Salesforce Managed Services Team Lead, 8x Salesforce Certified, builds AI and agentic tooling.' },
};
const proof = {
  heading: 'Proof',
  items: [
    { label: { t: 'Agentforce agent', p: 'Agentforce assistant' },
      t: 'Agent Script, Apex actions, 16-question test plan.',
      p: 'an assistant about Dean, built in Salesforce.',
      href: site.href + 'gallery/01-agentforce-resume-agent/' },
    { label: { t: 'Ask this resume', p: 'Ask this resume' },
      t: 'Claude chat grounded in this resume, on the live page.',
      p: 'a chat on the web page that answers only from this resume.',
      href: site.href + '#ask' },
    { label: { t: 'AI safety briefing', p: 'AI safety guide' },
      t: 'OAuth, data retention, and licensing.',
      p: 'one page for IT on adopting AI safely.',
      href: site.href + 'gallery/04-adopting-ai-safely/BRIEFING.pdf' },
  ],
};

// Technical-only view used by the Word builder (same facts, one register, no source notes)
const T = {
  name, contact: [...contact, site.label], availability,
  tagline: tagline.t,
  summary: summary.t,
  highlights: highlights.map(h => h.t),
  skills: skills.map(s => [s.label.t, s.t]),
  experience: experience.map(j => ({ company: j.company, note: j.note.t, dates: j.dates, roles: j.roles, bullets: j.bullets.map(b => b.t) })),
  certifications: certifications.map(c => `${c.name} (${c.date})`),
  certNote: certNote.t,
  education: education.map(e => e.text),
  quotes: [],
};

module.exports = { name, contact, availability, tagline, summary, highlights, metrics, skills, experience, certifications, certNote, education, aiPractice, builtWith, disclosure, ask, gallery, site, proof, T };
