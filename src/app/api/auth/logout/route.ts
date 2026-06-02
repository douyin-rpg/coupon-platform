import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function POST(request: Request) {
  try {
    const authResult = await verifyAuth(request as any);
    if (authResult && typeof authResult === 'object' && 'userId' in authResult) {
      const client = getSupabaseClient();
      await client
        .from('users')
        .update({ is_online: false })
        .eq('id', (authResult as any).userId);
    }
  } catch {
    // Ignore errors on logout
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return response;
}
