// ============================================================
// DRAS Cloudflare Worker — CORS proxy for Apps Script API
//
// SETUP:
// 1. Go to https://workers.cloudflare.com — free account
// 2. Create Worker → paste this file → Save & Deploy
// 3. Copy your Worker URL (e.g. dras-proxy.yourname.workers.dev)
// 4. Paste it as WORKER_URL in index.html
//
// The Apps Script URL can change freely — only update it here.
// ============================================================

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz-Xd4tKFqzBpG02VD8rG7EJcRMqwGw77kWqmPJtU8xDS9LUuS1CABPfCqchXM_3nlN/exec';
// e.g. 'https://script.google.com/macros/s/AKfycbx.../exec'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age':       '86400'
};

export default {
  async fetch(request) {

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    try {
      // Forward GET or POST to Apps Script
      const isPost = request.method === 'POST';
      const body   = isPost ? await request.text() : undefined;

      const resp = await fetch(APPS_SCRIPT_URL, {
        method:   isPost ? 'POST' : 'GET',
        headers:  { 'Content-Type': 'text/plain' }, // text/plain avoids CORS preflight on Apps Script side
        body:     body,
        redirect: 'follow'
      });

      const text = await resp.text();

      return new Response(text, {
        status:  200,
        headers: {
          'Content-Type': 'application/json',
          ...CORS
        }
      });

    } catch (err) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Worker error: ' + err.message }),
        { status: 502, headers: { 'Content-Type': 'application/json', ...CORS } }
      );
    }
  }
};
