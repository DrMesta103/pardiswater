import { NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const url = new URL(req.url);
    const rpID = url.hostname;
    const expectedOrigin = url.origin;

    let token = req.cookies.get('token')?.value;
    if (!token) {
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
      token = authHeader.split(' ')[1];
    }

    const payload = verifyToken(token);
    if (!payload || !payload.id) return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });

    const body = await req.json();

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });

    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: user.challenge,
      expectedOrigin,
      expectedRPID: rpID,
    });

    if (verification.verified) {
      const { registrationInfo } = verification;
      const { credentialPublicKey, credentialID, counter } = registrationInfo;

      await prisma.authenticator.create({
        data: {
          credentialID: Buffer.from(credentialID).toString('base64url'),
          credentialPublicKey: Buffer.from(credentialPublicKey),
          counter: BigInt(counter),
          transports: body.response.transports?.join(',') || '',
          userId: user.id
        }
      });

      return NextResponse.json({ verified: true });
    }
    
    return NextResponse.json({ verified: false }, { status: 400 });
  } catch (error) {
    console.error('verify error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
