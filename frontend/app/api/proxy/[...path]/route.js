/**
 * Universal backend proxy — catches ALL requests to /api/proxy/*
 * 
 * WHY THIS EXISTS:
 *   BACKEND_URL is a server-side env var (no NEXT_PUBLIC_ prefix).
 *   It is NEVER sent to the browser. When the load balancer IP or 
 *   Kubernetes service hostname changes, you only update the env var
 *   and restart the pod — zero frontend rebuilds needed.
 * 
 * FLOW:
 *   Browser → /api/proxy/v1/tenants/   (same-origin, no CORS issues)
 *   Next.js server → ${BACKEND_URL}/api/v1/tenants/   (server-to-server)
 *   Response streamed back to browser
 */

export async function GET(request, { params }) {
  return proxyRequest(request, params, 'GET');
}

export async function POST(request, { params }) {
  return proxyRequest(request, params, 'POST');
}

export async function PUT(request, { params }) {
  return proxyRequest(request, params, 'PUT');
}

export async function PATCH(request, { params }) {
  return proxyRequest(request, params, 'PATCH');
}

export async function DELETE(request, { params }) {
  return proxyRequest(request, params, 'DELETE');
}

async function proxyRequest(request, params, method) {
  // BACKEND_URL is read at RUNTIME — never baked into the build.
  // Change it in your ConfigMap and restart → picks up automatically.
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';

  // Reconstruct the path: /api/proxy/v1/tenants/ → /api/v1/tenants/
  const pathSegments = await params;
  const path = Array.isArray(pathSegments.path)
    ? pathSegments.path.join('/')
    : pathSegments.path || '';

  // Preserve query string
  const { searchParams } = new URL(request.url);
  const query = searchParams.toString();
  const targetUrl = `${backendUrl}/api/${path}${query ? `?${query}` : ''}`;

  // Forward auth token from incoming request headers
  const headers = {};
  const authHeader = request.headers.get('Authorization');
  if (authHeader) headers['Authorization'] = authHeader;
  headers['Content-Type'] = 'application/json';
  headers['Accept'] = 'application/json';

  const fetchOptions = { method, headers };

  if (!['GET', 'HEAD', 'DELETE'].includes(method)) {
    try {
      const body = await request.text();
      if (body) fetchOptions.body = body;
    } catch (_) {}
  }

  try {
    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.text();
    return new Response(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      },
    });
  } catch (error) {
    console.error(`[proxy] Failed to reach backend at ${targetUrl}:`, error.message);
    return new Response(
      JSON.stringify({
        error: 'Backend unreachable',
        detail: `Cannot connect to ${backendUrl}. Check BACKEND_URL env var.`,
      }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
