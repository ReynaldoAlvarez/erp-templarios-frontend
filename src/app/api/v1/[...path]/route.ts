import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001/api/v1';

async function proxyRequest(
  request: NextRequest,
  method: string,
  pathSegments: string[]
) {
  const path = pathSegments.join('/');
  const url = `${BACKEND_URL}/${path}${request.nextUrl.search}`;

  // Forward headers
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');

  // Forward Authorization header if present
  const authHeader = request.headers.get('Authorization');
  if (authHeader) {
    headers.set('Authorization', authHeader);
  }

  // Forward cookies for session-based auth
  const cookieHeader = request.headers.get('Cookie');
  if (cookieHeader) {
    headers.set('Cookie', cookieHeader);
  }

  let body: string | undefined;
  if (method !== 'GET' && method !== 'HEAD') {
    body = await request.text();
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body,
    });

    const responseHeaders = new Headers();
    
    // Forward content-type
    const contentType = response.headers.get('Content-Type');
    if (contentType) {
      responseHeaders.set('Content-Type', contentType);
    }

    // Forward set-cookie headers
    const setCookies = response.headers.getSetCookie();
    setCookies.forEach((cookie) => {
      responseHeaders.append('Set-Cookie', cookie);
    });

    const data = await response.text();

    return new NextResponse(data, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error connecting to backend service',
        statusCode: 503,
      },
      { status: 503 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, 'GET', path);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, 'POST', path);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, 'PUT', path);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, 'PATCH', path);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, 'DELETE', path);
}
