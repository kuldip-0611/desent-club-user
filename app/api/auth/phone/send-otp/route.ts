import { NextResponse } from 'next/server';

type SendOtpBody = {
  phone?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as SendOtpBody;

  if (!body.phone) {
    return NextResponse.json({ message: 'Phone number is required' }, { status: 400 });
  }

  return NextResponse.json({ message: `OTP sent to ${body.phone}` }, { status: 200 });
}
