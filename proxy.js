import { NextResponse } from 'next/server';

export function proxy(request) {
  if (request.method === 'POST') {
    // Keep the existing login form and credential check; add a session afterwards.
    return NextResponse.rewrite(new URL('/api/workflow/login', request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/api/login'] };
