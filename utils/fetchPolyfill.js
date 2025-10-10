// Ensure a global fetch is available for environments running Node < 18
// @neondatabase/serverless requires fetch. In Node 18+ it exists by default.
export async function ensureFetchPolyfill() {
  if (typeof globalThis.fetch === 'function') return;
  // Try undici first
  try {
    const undici = await import('undici');
    const { fetch, Headers, Request, Response } = undici;
    if (typeof fetch === 'function') {
      Object.assign(globalThis, { fetch, Headers, Request, Response });
      console.log('[db] Installed fetch polyfill via undici');
      return;
    }
  } catch {}
  // Fallback to node-fetch (if installed)
  try {
    const mod = await import('node-fetch');
    const fetch = (mod && (mod.default || mod));
    if (typeof fetch === 'function') {
      Object.assign(globalThis, { fetch });
      console.log('[db] Installed fetch polyfill via node-fetch');
      return;
    }
  } catch {}
  console.warn('[db] No fetch polyfill available. Use Node 18+ or install undici/node-fetch.');
}

