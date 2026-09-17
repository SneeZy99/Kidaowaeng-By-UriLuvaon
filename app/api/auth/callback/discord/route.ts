import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb, getAdminDiscordIds } from "@/lib/firebaseAdmin";

interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
}

interface DiscordUser {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
  discriminator?: string;
}

type OAuthFailure = "oauth_config" | "token_exchange" | "discord_profile" | "guild_check" | "firebase_setup";

class OAuthError extends Error {
  constructor(public readonly code: OAuthFailure) { super(code); }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const storedState = req.cookies.get("discord_oauth_state")?.value;
  const loginUrl = new URL("/login", url.origin);

  if (!code || !state || !storedState || state !== storedState) {
    loginUrl.searchParams.set("error", "invalid_state");
    return NextResponse.redirect(loginUrl);
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;
  const guildId = process.env.DISCORD_GUILD_ID;

  try {
    if (!clientId || !clientSecret || !redirectUri || !guildId) throw new OAuthError("oauth_config");
    // 1. Exchange the authorization code for an access token.
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) throw new OAuthError("token_exchange");
    const tokenData: DiscordTokenResponse = await tokenRes.json();

    // 2. Fetch the Discord profile.
    const profileRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!profileRes.ok) throw new OAuthError("discord_profile");
    const profile: DiscordUser = await profileRes.json();

    // This endpoint is only available after the user consents to the
    // guilds.members.read scope. A 404 means they are not in this server.
    const guildMemberRes = await fetch(`https://discord.com/api/v10/users/@me/guilds/${guildId}/member`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (guildMemberRes.status === 404) {
      loginUrl.searchParams.set("error", "not_in_guild");
      return NextResponse.redirect(loginUrl);
    }
    if (!guildMemberRes.ok) throw new OAuthError("guild_check");

    const avatarUrl = profile.avatar
      ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png?size=128`
      : `https://cdn.discordapp.com/embed/avatars/${Number(profile.discriminator ?? 0) % 5}.png`;

    const username = profile.global_name || profile.username;
    const uid = `discord:${profile.id}`;
    const isAdmin = getAdminDiscordIds().includes(profile.id);

    // 3. Upsert the user document in Firestore.
    const userRef = adminDb.collection("users").doc(uid);
    const existing = await userRef.get();
    const role = isAdmin ? "admin" : existing.exists ? existing.data()?.role ?? "member" : "member";

    await userRef.set(
      {
        uid,
        discordId: profile.id,
        username,
        avatarUrl,
        role,
        guildMember: true,
        createdAt: existing.exists ? existing.data()?.createdAt ?? Date.now() : Date.now(),
      },
      { merge: true }
    );

    // Keep the Auth user record's custom claims in sync too, so the role
    // stays correct even on a session that never re-runs this callback.
    await adminAuth.setCustomUserClaims(uid, { role, guildMember: true }).catch(() => {});

    // 4. Mint a Firebase custom token. The claims here are also used as a
    // fallback profile on the client (see AuthProvider) if the Firestore
    // read hasn't resolved yet or is briefly unavailable.
    const customToken = await adminAuth.createCustomToken(uid, {
      role,
      username,
      avatarUrl,
      discordId: profile.id,
      guildMember: true,
    });

    // 5. Hand the token to the client via a short-lived cookie so it never
    // shows up in the URL or server logs.
    const completeUrl = new URL("/login/complete", url.origin);
    const res = NextResponse.redirect(completeUrl);
    res.cookies.set("discord_oauth_state", "", { maxAge: 0, path: "/" });
    res.cookies.set("pending_token", customToken, {
      httpOnly: false,
      secure: true,
      sameSite: "lax",
      maxAge: 60,
      path: "/",
    });
    return res;
  } catch (err) {
    const error = err instanceof OAuthError ? err.code : "firebase_setup";
    console.error("Discord OAuth failed:", error, err);
    loginUrl.searchParams.set("error", error);
    return NextResponse.redirect(loginUrl);
  }
}
