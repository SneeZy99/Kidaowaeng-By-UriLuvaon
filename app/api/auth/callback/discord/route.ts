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

  const clientId = process.env.DISCORD_CLIENT_ID!;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET!;
  const redirectUri = process.env.DISCORD_REDIRECT_URI!;

  try {
    // 1. Exchange the authorization code for an access token.
    const tokenRes = await fetch("https://discord.com/api/v10/oauth2/token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const errorDetails = await tokenRes.text();
      console.error("Discord token exchange failed", tokenRes.status, errorDetails);
      throw new Error("Discord token exchange failed");
    }
    const tokenData: DiscordTokenResponse = await tokenRes.json();

    // 2. Fetch the Discord profile.
    const profileRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!profileRes.ok) throw new Error("Failed to fetch Discord profile");
    const profile: DiscordUser = await profileRes.json();

    const avatarUrl = profile.avatar
      ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png?size=128`
      : `https://cdn.discordapp.com/embed/avatars/${Number(profile.discriminator ?? 0) % 5}.png`;

    const username = profile.global_name || profile.username;
    const uid = `discord:${profile.id}`;
    const isAdmin = getAdminDiscordIds().includes(profile.id);

    // 3. Upsert the user document in Firestore.
    const userRef = adminDb.collection("users").doc(uid);
    const existing = await userRef.get();
    const existingData = existing.data();
    const savedUsername = existingData?.username || username;
    await userRef.set(
      {
        uid,
        discordId: profile.id,
        username: savedUsername,
        avatarUrl,
        role: isAdmin ? "admin" : existing.exists ? existingData?.role ?? "member" : "member",
        createdAt: existing.exists ? existingData?.createdAt ?? Date.now() : Date.now(),
      },
      { merge: true }
    );

    // 4. Mint a Firebase custom token carrying the gang role as a claim.
    const finalRole = isAdmin ? "admin" : existingData?.role ?? "member";
    const customToken = await adminAuth.createCustomToken(uid, {
      role: finalRole,
      username: savedUsername,
      avatarUrl,
      discordId: profile.id,
    });

    // 5. Hand the token to the client via a URL fragment so it never touches server logs.
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
    console.error(err);
    loginUrl.searchParams.set("error", "oauth_failed");
    return NextResponse.redirect(loginUrl);
  }
}
