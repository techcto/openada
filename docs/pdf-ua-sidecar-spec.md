# PDF/UA sidecar service — spec

Status: implemented in OpenADA. The image, wrapper, API route, Compose service,
release workflow, and CloudFormation task-local sidecar are maintained here.

## Purpose

OpenADA currently checks HTML only — axe-core for WCAG/ADA, LanguageTool for
spelling/grammar. Neither can say anything about a PDF: axe-core is a DOM
engine, and OpenADA's own HTML fetcher (`api/lib/openada/remote.ts`)
explicitly rejects any response whose `content-type` isn't
`text/html`/`application/xhtml+xml`.

This sidecar adds PDF/UA-1 (ISO 14289-1) structural validation —
**detection only** (are the tags, alt text, reading order, and language
metadata present and well-formed), not remediation. Fixing a non-conformant
PDF is a separate, harder problem (semantic judgment: what does this image
actually show, what's the real reading order) and is being handled by a
different piece of work (an Adobe PDF Services-based CMS provider), not this
sidecar.

## Why veraPDF

Evaluated against PAC 2024 (the other common PDF/UA checker):

| | PAC 2024 | veraPDF |
|---|---|---|
| Interface | Windows GUI only, no CLI/API | Real CLI, scriptable |
| Runtime | .NET, Windows-only | JVM — runs in a Linux container |
| License | Free, but not redistributable/embeddable | Open source (GPL/MPL), embeddable |
| Automatable | No | Yes — built for CI/pipeline use |

veraPDF is the only one of the two that can actually run headless inside a
container, which is a hard requirement here.

## Architecture

Same shape as the LanguageTool sidecar already running in this stack
(task-local, `127.0.0.1:8010`, no separate ALB target group). veraPDF is an
additional container in the existing API task definition:

- Base image: the official pinned `ghcr.io/verapdf/cli:1.30.2` image with a
  Python standard-library HTTP wrapper.
- Install veraPDF's CLI distribution (`verapdf` on `PATH`) at build time —
  see veraPDF's own install script / GitHub releases for the CLI tarball.
- A thin HTTP wrapper process listens on a fixed internal port (suggest
  `127.0.0.1:8011`, one port up from LanguageTool's `8010`, to avoid
  collision when both sidecars run in the same task). Language/framework for
  the wrapper is an implementation choice — it just needs to: accept an
  upload, shell out to `verapdf`, parse its JSON output, respond. A single
  small Node/Express, Python/Flask, or even a bash+socat wrapper all work;
  pick whatever's fastest to stand up.
- No persistent storage — each request is stateless: write the uploaded PDF
  to a temp file, run `verapdf`, delete the temp file, return the result.

## API contract

### `POST /check`

Request: JSON body, matching the shape the CMS side already sends (see
`OpenAdaService::checkPdf()` in the CMS repo, which is built and live —
this sidecar is the only missing piece):

```json
{ "file": "<base64-encoded PDF bytes>", "filename": "document.pdf", "private": true }
```

Enforce a 10 MB cap on the **decoded** byte length (matching
`OpenAdaService::MAX_PDF_BYTES` on the CMS side and the `MAX_HTML_BYTES`
pattern already used for HTML checks in `remote.ts`) and reject anything that
doesn't decode to a PDF (magic bytes `%PDF-`) before ever touching disk.

Runs (roughly): `verapdf --format json -f ua1 <tempfile>` (or whatever the
current CLI flag is for the veraPDF-corpus PDF/UA-1 profile — pin the profile
explicitly, don't rely on veraPDF's auto-detected default).

Response `200`:

```json
{
  "compliant": false,
  "profile": "ua1",
  "passedChecksCount": 142,
  "failedChecksCount": 6,
  "failures": [
    {
      "ruleId": "6.3-1",
      "clause": "6.3",
      "description": "Tagged content shall not contain artifacts.",
      "specification": "ISO 14289-1",
      "location": "root/document[0]/paragraph[3]",
      "context": "..."
    }
  ],
  "raw": { "...": "full veraPDF JSON report, unmodified, for anyone who needs more than the normalized summary" }
}
```

Response `4xx` (bad upload — not a PDF, too large, corrupt):

```json
{ "error": { "code": "invalid_pdf", "message": "..." } }
```

Response `5xx`: veraPDF crashed / timed out running against this file —
include enough of stderr to debug, but don't leak filesystem paths.

Timeout: cap at ~30s per check. The CMS-side client (`OpenAdaService::checkPdf()`)
already uses a 45s HTTP timeout specifically to sit above this with headroom
rather than race it — don't push the sidecar's own budget past ~35s without
bumping the CMS-side timeout to match, or a slow-but-legitimate check will
look like a client-side failure instead of a clean sidecar response.

### `GET /health`

Returns `200` once the JVM + `verapdf` binary are confirmed runnable (e.g.
run `verapdf --version` once at startup and cache the result) — same
convention as the LanguageTool sidecar's `/v2/languages` doubling as its
healthcheck.

## OpenADA API integration

OpenADA exposes the sidecar through the following route:

- New file: `api/pages/api/v1/pdf/check.openada.ts`, modeled on
  `api/pages/api/v1/ada/check.openada.ts`.
- Reads `file` (base64), `filename`, and `private` straight off `req.body` --
  same three fields the CMS already sends via `OpenAdaService::checkPdf()`,
  no translation layer needed.
- Enforces the same 10 MB decoded-size cap as the sidecar before proxying.
- Proxies to `http://127.0.0.1:8011/check` (task-local, never exposed
  externally — same trust boundary as the LanguageTool sidecar).
- Response: `{ ...sidecarResult, visibility: isPrivate ? 'private' : 'public' }`,
  matching `check.openada.ts`'s existing `visibility` field convention.
- This is *not* wired into `site-scan.ts`'s crawler in this pass — that
  crawler is HTML-only by design (`fetchRemoteHtml`'s content-type check);
  extending it to also follow and check linked PDFs is a separate decision
  with its own trade-offs (crawl time, PDF size variance) and should be
  scoped independently once the direct `/api/v1/pdf/check` endpoint is
  proven out.

## Explicitly out of scope for v1

- Remediation/fixing (separate work: Adobe PDF Services provider).
- OCR / scanned-image PDFs (veraPDF validates structure, not readability of
  scanned text).
- PDF/A or other conformance profiles — PDF/UA-1 only for now.
- Crawler integration (see above).
