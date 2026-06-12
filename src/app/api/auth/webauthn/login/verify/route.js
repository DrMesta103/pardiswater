import { NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { PrismaClient } from '@prisma/client';
import { signToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const url = new URL(req.url);
    const rpID = url.hostname;
    const expectedOrigin = url.origin;

    const body = await req.json();
    const { username, response } = body;

    const user = await prisma.user.findUnique({ 
      where: { username }, 
      include: { authenticators: true } 
    });
    
    if (!user) return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });

    const authenticator = user.authenticators.find(a => a.credentialID === response.id);
    if (!authenticator) return NextResponse.json({ error: 'اطلاعات سنسور مطابقت ندارد' }, { status: 400 });

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: user.challenge,
      expectedOrigin,
      expectedRPID: rpID,
      authenticator: {
        credentialID: Buffer.from(authenticator.credentialID, 'base64url'),
        credentialPublicKey: Buffer.from(authenticator.credentialPublicKey),
        counter: Number(authenticator.counter),
      },
    });

    if (verification.verified) {
      await prisma.authenticator.update({
        where: { id: authenticator.id },
        data: { counter: BigInt(verification.authenticationInfo.newCounter) }
      });
      let parsedRoles = user.roles;
    if (typeof parsedRoles === 'string') {
      try { parsedRoles = JSON.parse(parsedRoles); } catch (e) { parsedRoles = null; }
    }
    
    let userRoles = Array.isArray(parsedRoles) ? parsedRoles : ['COUNTER'];
      const token = signToken({ id: user.id, username: user.username, name: user.name, roles: userRoles });
      return NextResponse.json({ verified: true, token, user: { id: user.id, name: user.name, roles: userRoles } });
    }
    return NextResponse.json({ verified: false }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
