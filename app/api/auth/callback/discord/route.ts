import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

const clientSecret = process.env.DISCORD_CLIENT_SECRET;
const clientId = process.env.DISCORD_CLIENT_ID;
const redirectUri = process.env.DISCORD_REDIRECT_URI;
const adminDiscordIds = (process.env.ADMIN_DISCORD_IDS || '').split(',');

interface DiscordUser {
  id: string;
  username: string;
  avatar: string | null;
  global_name: string | null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', req.url));
  }

  try {
    const tokenRes = await fetch('https://discord.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId || '',
        client_secret: clientSecret || '',
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri || '',
      }),
    });

    if (!tokenRes.ok) throw new Error('Discord token exchange failed');
    const tokenData = await tokenRes.json();

    const profileRes = await fetch('https://discord.com', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!profileRes.ok) throw new Error('Failed to fetch Discord profile');
    const profile: DiscordUser = await profileRes.json();

    const avatarUrl = profile.avatar
      ? `https://discordapp.com{profile.id}/${profile.avatar}.png?size=128`
      : `https://discordapp.com{(BigInt(profile.id) >> 22n) % 6n}.png`;

    const username = profile.global_name || profile.username;
    const uid = `discord:${profile.id}`;
    const isAdmin = adminDiscordIds.includes(profile.id);

    const userRef = adminDb.collection('users').doc(uid);
    const existing = await userRef.get();
    
    await userRef.set({
      uid,
      discordId: profile.id,
      username,
      avatarUrl,
      role: existing.exists ? (existing.data()?.role ?? 'member') : (isAdmin ? 'admin' : 'member'),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    if (isAdmin) {
      await adminAuth.setCustomUserClaims(uid, { role: 'admin' });
    } else if (!existing.exists) {
      await adminAuth.setCustomUserClaims(uid, { role: 'member' });
    }

    const firebaseToken = await adminAuth.createCustomToken(uid);
    return NextResponse.redirect(new URL(`/login/complete?token=${firebaseToken}`, req.url));
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.redirect(new URL('/login?error=auth_failed', req.url));
  }
}
