import { describe, expect, it, vi } from 'vitest';
import worker from '../../../worker.js';
import { readFileSync } from 'node:fs';

const fetchEdge = async (url: string, status = 200) => {
  const assets = vi.fn(async () => new Response('static HTML', {
    status,
    headers: { 'Content-Type': 'text/html', 'Cache-Control': 'public, max-age=0' },
  }));
  const response = await worker.fetch(new Request(url), { ASSETS: { fetch: assets } }, {});
  return { response, assets };
};

describe('edge SEO controls', () => {
  it('runs the Worker before matching static assets', () => {
    const config = readFileSync(new URL('../../../wrangler.jsonc', import.meta.url), 'utf8');
    expect(JSON.parse(config).assets.run_worker_first).toBe(true);
  });

  it.each(['/calculators/?q=concrete', '/?q=concrete'])('serves crawlable search %s with server noindex', async (path) => {
    const { response } = await fetchEdge(`https://calculatorst.com${path}`);
    expect(response.status).toBe(200);
    expect(response.headers.get('X-Robots-Tag')).toBe('noindex, follow');
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=0');
    expect(await response.text()).toBe('static HTML');
  });

  it.each(['/calculators/', '/concrete-calculator/', '/concrete-calculator/?length=12', '/_astro/app.js'])('keeps canonical resource %s indexable', async (path) => {
    const { response, assets } = await fetchEdge(`https://calculatorst.com${path}`);
    expect(response.status).toBe(200);
    expect(response.headers.get('X-Robots-Tag')).toBeNull();
    expect(assets).toHaveBeenCalledOnce();
  });

  it('normalizes host, protocol, slash and category alias in one redirect', async () => {
    const { response, assets } = await fetchEdge('http://www.calculatorst.com/construction/decking?campaign=test');
    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe('https://calculatorst.com/construction/deck-fence/?campaign=test');
    expect(assets).not.toHaveBeenCalled();
  });

  it('removes a leaked template query without removing useful parameters', async () => {
    const { response } = await fetchEdge('https://calculatorst.com/calculators/?q=%24%7BencodeURIComponent&campaign=test');
    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe('https://calculatorst.com/calculators/?campaign=test');
  });

  it.each(['/ton/', '/ft%C2%B2/', '/yd%C2%B3/', '/missing-calculator/'])('preserves genuine 404 for invalid path %s', async (path) => {
    const { response } = await fetchEdge(`https://calculatorst.com${path}`, 404);
    expect(response.status).toBe(404);
    expect(response.headers.get('Location')).toBeNull();
  });
});
