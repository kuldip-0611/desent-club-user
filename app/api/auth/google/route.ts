import { NextResponse } from 'next/server';

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleUserInfo = {
  sub: string;
  name?: string;
  email?: string;
};

type GoogleLoginBody = {
  code?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as GoogleLoginBody;

  if (!body.code) {
    return NextResponse.json({ message: 'Google authorization code is required' }, { status: 400 });
  }

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json(
      { message: 'Google OAuth environment variables are missing' },
      { status: 500 },
    );
  }

  const tokenPayload = new URLSearchParams({
    code: body.code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: tokenPayload,
  });

  const tokenData = (await tokenResponse.json()) as GoogleTokenResponse;

  if (!tokenResponse.ok || !tokenData.access_token) {
    return NextResponse.json(
      {
        message: tokenData.error_description ?? tokenData.error ?? 'Failed to exchange Google code',
      },
      { status: 400 },
    );
  }

  const userInfoResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
  });

  if (!userInfoResponse.ok) {
    return NextResponse.json({ message: 'Failed to fetch Google profile' }, { status: 400 });
  }

  const profile = (await userInfoResponse.json()) as GoogleUserInfo;

  return NextResponse.json(
    {
      token: `mock-jwt-google-${Date.now()}`,
      user: {
        id: profile.sub,
        name: profile.name ?? 'Google User',
        email: profile.email,
        provider: 'google',
      },
      message: 'Google login successful',
    },
    { status: 200 },
  );
}
