import { NextResponse } from 'next/server';

type VerifyBody = {
  phone?: string;
  otp?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as VerifyBody;

  if (!body.phone || !body.otp) {
    return NextResponse.json({ message: 'Phone and OTP are required' }, { status: 400 });
  }

  if (body.otp.length !== 6) {
    return NextResponse.json({ message: 'Invalid OTP format' }, { status: 400 });
  }

  return NextResponse.json(
    {
      token: `mock-jwt-phone-${Date.now()}`,
      user: {
        id: 'user-phone-1',
        name: 'Phone User',
        phone: body.phone,
        provider: 'phone',
      },
      message: 'Phone OTP verified successfully',
    },
    { status: 200 },
  );
}
