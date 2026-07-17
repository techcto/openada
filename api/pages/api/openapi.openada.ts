import type { NextApiRequest, NextApiResponse } from 'next'
import { applyCors, handleOptions } from '@lib/openada/http'

const document = {
  openapi: '3.1.0',
  info: {
    title: 'OpenADA API',
    version: '0.1.0',
    description: 'Accessibility, language, public URL scanning, and directory APIs.',
  },
  servers: [{ url: 'https://openada.us' }],
  paths: {
    '/api/v1/check': {
      post: {
        summary: 'Run a combined accessibility and language check',
        requestBody: { required: true, content: { 'application/json': { schema: { '$ref': '#/components/schemas/CheckRequest' } } } },
        responses: { '200': { description: 'Combined check result' }, '400': { description: 'Invalid request' } },
      },
    },
    '/api/v1/scans': {
      post: {
        summary: 'Queue a public site scan or check one public URL',
        requestBody: { required: true, content: { 'application/json': { schema: { '$ref': '#/components/schemas/ScanRequest' } } } },
        responses: { '201': { description: 'Published single-page scan result' }, '202': { description: 'Queued asynchronous site scan' }, '400': { description: 'Invalid URL' } },
      },
      get: {
        summary: 'List scan history for a normalized public URL',
        parameters: [{ name: 'url', in: 'query', required: true, schema: { type: 'string', format: 'uri' } }],
        responses: { '200': { description: 'Scan history' } },
      },
    },
    '/api/v1/scans/{jobId}': {
      get: {
        summary: 'Read queued site scan progress or final report',
        parameters: [{ name: 'jobId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Scan progress or report' }, '404': { description: 'Scan job not found' } },
      },
    },
    '/api/v1/directory': {
      get: {
        summary: 'List public sites or retrieve one site with ?site=hostname',
        responses: { '200': { description: 'Directory records' } },
      },
    },
    '/api/v1/ada/check': {
      post: {
        summary: 'Run axe-core WCAG checks',
        requestBody: { required: true, content: { 'application/json': { schema: { '$ref': '#/components/schemas/HtmlRequest' } } } },
        responses: { '200': { description: 'ADA result' } },
      },
    },
    '/api/v2/check': {
      post: {
        summary: 'Run a LanguageTool-compatible check',
        requestBody: { required: true, content: { 'application/json': { schema: { '$ref': '#/components/schemas/LanguageRequest' } } } },
        responses: { '200': { description: 'LanguageTool-compatible result' } },
      },
    },
  },
  components: {
    schemas: {
      HtmlRequest: { type: 'object', required: ['html'], properties: { html: { type: 'string' }, url: { type: 'string', format: 'uri' }, wcagTags: { type: 'array', items: { type: 'string' } } } },
      LanguageRequest: { type: 'object', required: ['text'], properties: { text: { type: 'string' }, language: { type: 'string', default: 'en-US' } } },
      CheckRequest: { type: 'object', properties: { html: { type: 'string' }, text: { type: 'string' }, url: { type: 'string', format: 'uri' }, language: { type: 'string', default: 'en-US' }, wcagTags: { type: 'array', items: { type: 'string' } } } },
      ScanRequest: { type: 'object', required: ['url'], properties: { url: { type: 'string', format: 'uri' }, title: { type: 'string' }, crawl: { type: 'boolean', default: false, description: 'When true, enqueue a same-host scan and poll /api/v1/scans/{jobId} for progress.' }, maxPages: { type: 'integer', minimum: 1, maximum: 100, default: 50 }, language: { type: 'string', default: 'en-US' }, wcagTags: { type: 'array', items: { type: 'string' } } } },
    },
  },
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (handleOptions(req, res)) return
  applyCors(req, res)
  if (req.method !== 'GET') {
    res.status(405).json({ error: { code: 'method_not_allowed', message: 'Use GET for the OpenAPI document.' } })
    return
  }
  res.status(200).json(document)
}
