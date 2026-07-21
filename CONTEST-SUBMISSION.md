# OpenADA

## Inspiration

Every person deserves equal access to information and public services on the
web, yet many websites still contain barriers that are difficult to find and
expensive to remediate. Nonprofits, schools, municipalities, special districts,
and small businesses often do not have the budget or staff for an enterprise
accessibility platform.

OpenADA was created to make the first step open and practical. Two days after
the contest began, I received the contest email. On July 16, 2026, I bought
the `OpenADA.us` domain through GoDaddy and started building a public-interest
service with GPT-5.6 Luna and OpenAI Codex. The goal was simple: create useful,
free accessibility infrastructure that can benefit many people.

The result is more than a score. OpenADA turns public website checks into a
browseable, dated archive so developers and public-service teams can see which
pages failed, understand the findings, and measure improvement over time.

## What It Does

OpenADA accepts HTML or a public URL and runs accessibility checks with
`axe-core`. It also exposes LanguageTool-compatible language checks and a
combined API for workflows that need both. A site URL can start a bounded,
same-host asynchronous crawl. The UI shows scan progress, then redirects to a
report with:

- accessibility and language scores with letter grades;
- sorted pages and page-level findings;
- scan history and the same page across multiple scan dates;
- printable reports and PDF saving;
- public directory pages for sites, scans, pages, and findings; and
- API and OpenAPI documentation for developers.

The scan worker and Redis queue keep long crawls out of the web request. Scan
jobs, pages, findings, and history are stored durably in DynamoDB. The public
service is available at [openada.us](https://openada.us/), and the repository
also runs locally with `docker compose up --build` using DynamoDB Local.

OpenADA also exposes a stateless MCP endpoint at
[https://openada.us/mcp](https://openada.us/mcp). We tested it as a custom MCP
connection in both ChatGPT Developer Mode and Claude's **Add custom connector**
flow. Codex CLI and other MCP clients can use the same endpoint. An AI client
can ask OpenADA to check a public page, start a bounded site scan, read scan
progress, or browse the public directory.

For teams that need an AWS-native boundary, OpenADA has two deployment paths:

- **Private OpenADA:** a prepared, upcoming customer-owned ECS deployment with
  its own UI, API, worker, Redis queue, DynamoDB archive, VPC, and API-key
  controls.
- **OpenADA MCP AgentCore:** an approved AWS Marketplace product that places the
  MCP gateway in Amazon Bedrock AgentCore Runtime and connects it to the public
  service or a private OpenADA endpoint.

## How I Built It

OpenADA combines established accessibility tooling, browser automation, an
asynchronous scan architecture, and open integration protocols into one
developer workflow:

- GPT-5.6 Luna and OpenAI Codex for the engineering process;
- Next.js, TypeScript, and React for the web experience and API;
- `axe-core` for automated accessibility rules;
- Playwright-based public-page fetching and crawl support;
- LanguageTool-compatible provider integration for spelling and grammar;
- Redis and BullMQ for durable asynchronous scan work;
- DynamoDB for sites, pages, scans, findings, and job state;
- Model Context Protocol for ChatGPT, Claude, Codex, and AgentCore access;
- Docker Compose for local development; and
- AWS ECS, CloudFormation, CloudWatch, IAM, and Bedrock AgentCore for hosted
  deployment options.

Codex was used across the full loop: shaping the product, building the API and
MCP tools, creating the crawler and progress workflow, designing the archive
experience, writing deployment infrastructure, debugging live behavior, and
verifying the local and AWS paths.

## How GPT-5.6 And Codex Accelerated The Work

GPT-5.6 Luna in Codex was the primary engineering collaborator for this
project, not just a source of copy or isolated code snippets. I used Codex to
inspect the existing application shape, turn product ideas into small
implementation steps, trace failures across the UI/API/worker boundary, and
keep the public service, local Compose stack, CloudFormation templates, and
Marketplace documentation aligned. The fast feedback loop was: describe a
behavior, inspect the relevant code, implement the smallest complete change,
run a focused test, exercise the live path, and revise from the observed
result.

The most important decisions made during that loop were:

1. **Asynchronous crawling:** Codex helped identify that a site crawl could
   not safely run inside one browser request. The final design separates job
   creation, Redis/BullMQ delivery, worker progress, DynamoDB persistence, and
   report rendering so the UI stays responsive while pages are checked.
2. **A public archive instead of a one-time score:** We chose to store sites,
   scans, pages, and findings so users can compare the same page across dates.
   That decision turned an accessibility checker into a public improvement
   record.
3. **One service with multiple interfaces:** Codex helped implement the shared
   checking core behind REST, OpenAPI, the browser UI, a public widget, and
   stateless MCP tools. The same tools can be used by ChatGPT, Claude, Codex,
   or Amazon Bedrock AgentCore rather than requiring a separate integration
   for each client.
4. **Public and private deployment paths:** We kept the free public service
   simple for first-time users, while preparing a customer-owned ECS path and
   an approved AgentCore path for private networking, API keys, IAM/SigV4, and
   AWS operational controls. Codex carried those decisions through Docker,
   CloudFormation, release workflows, and customer quickstarts.

Codex also accelerated the less visible work that made the product runnable:
API contract fixes, crawler limits and robots/sitemap handling, iframe fallback
behavior, scan progress states, DynamoDB Local initialization, container health
checks, ARM64/AMD64 release workflows, and production debugging. I still made
the product and safety decisions: what the crawler is allowed to fetch, how
destructive AI actions are excluded, how automated findings are described
without claiming legal compliance, and which changes were accepted only after
local or live verification.

That combination is the core technical contribution of the project: GPT-5.6
and Codex compressed the distance between an idea and a tested system, while
the implementation remained grounded in explicit architecture, observable
behavior, and human review.

## Challenges I Ran Into

Accessibility cannot be completely automated. Some WCAG success criteria need
human judgment, content understanding, visual context, keyboard testing, or
assistive-technology testing. OpenADA therefore presents automated findings as
engineering guidance, not a legal determination or accessibility certification.

Public websites also behave differently. Some block crawlers, exceed response
limits, require JavaScript, or prevent iframe previews with security headers.
The crawler has to stay bounded, same-host, respectful of robots and sitemap
signals, and resilient when an individual page cannot be fetched. The report
keeps the scan useful even when a page is unavailable.

The other major challenge was turning a slow crawl into a good product
experience. A synchronous request would hang or time out, so OpenADA separates
job creation, queue delivery, progress updates, page checks, durable storage,
and final reporting. That architecture makes the same workflow useful from a
browser, REST client, or AI agent.

## Accomplishments I Am Proud Of

- Built and deployed a working public accessibility and language-quality service
  during the contest.
- Created a public, dated archive instead of stopping at a private score.
- Added asynchronous crawl progress and durable scan history.
- Added page detail views, historical comparison, printable reports, and PDF
  saving.
- Exposed a real REST API, OpenAPI document, public widget, and MCP endpoint.
- Verified custom MCP connections in ChatGPT Developer Mode and Claude.
- Prepared the Private OpenADA ECS deployment path for a future Marketplace
  release.
- Released and received approval for the OpenADA MCP AgentCore Marketplace
  product: [subscribe in AWS Marketplace](https://aws.amazon.com/marketplace/pp/prodview-2bjfvhksfwuwq).
- Made the complete local stack reproducible with one Compose command and an
  automatically initialized local archive.
- Published human-readable ADA guidance, MCP setup instructions, API examples,
  and customer deployment quickstarts.

## What I Learned

I learned that the most useful accessibility product is not necessarily the
one with the largest report. It is the one that helps a team decide what to do
next, keeps work from disappearing between scans, and makes progress visible to
the people responsible for a public website.

I also learned that interoperability matters. A stable MCP endpoint lets the
same OpenADA tools work in ChatGPT, Claude, Codex, and AWS AgentCore without
building a separate integration for each client. Stateless protocol handling,
explicit tool schemas, and durable scan jobs make those connections easier to
reason about and safer to operate.

Finally, I learned to separate public convenience from private control. A free
public service can help teams start immediately, while the planned Private
OpenADA ECS deployment and approved AgentCore runtime can provide customer-owned
infrastructure, networking, authentication, and operational boundaries when
needed.

## What's Next for OpenADA

The next stage is focused on remediation and reach:

- AI-assisted explanations and remediation suggestions with explicit human
  review for every recommendation;
- screenshot capture for pages that block embedded previews;
- repository and pull-request workflows for proposed fixes;
- scheduled monitoring and notifications for changed pages;
- CMS integrations and reusable developer widgets;
- multilingual guidance and language-quality support; and
- broader public reporting for agencies and communities tracking improvement.

The long-term vision is an open platform where accessibility teams, developers,
public agencies, AI assistants, and the public can inspect progress together.
OpenADA starts with a free scan and a concrete finding, then gives every team a
path toward better, more accessible web services.

## Links

- [Live checker](https://openada.us/)
- [Public directory](https://openada.us/directory)
- [API reference](https://openada.us/api-reference)
- [MCP connection guide](https://openada.us/docs/mcp)
- [OpenADA Quickstart](https://github.com/techcto/openada/blob/main/Quickstart.md)
- [Source repository](https://github.com/techcto/openada)
- [OpenAI Build Week](https://openai.devpost.com/)
