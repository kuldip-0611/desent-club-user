import { NextResponse } from 'next/server';

type SendOtpBody = {
  email?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as SendOtpBody;

  if (!body.email) {
    return NextResponse.json({ message: 'Email is required' }, { status: 400 });
  }

  return NextResponse.json({ message: `OTP sent to ${body.email}` }, { status: 200 });
}
