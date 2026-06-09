import { NextResponse } from 'next/server';

type VerifyBody = {
  email?: string;
  otp?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as VerifyBody;

  if (!body.email || !body.otp) {
    return NextResponse.json({ message: 'Email and OTP are required' }, { status: 400 });
  }

  if (body.otp.length !== 6) {
    return NextResponse.json({ message: 'Invalid OTP format' }, { status: 400 });
  }

  return NextResponse.json(
    {
      token: `mock-jwt-email-${Date.now()}`,
      user: {
        id: 'user-email-1',
        name: 'Email User',
        email: body.email,
        provider: 'email',
      },
      message: 'Email OTP verified successfully',
    },
    { status: 200 },
  );
}
