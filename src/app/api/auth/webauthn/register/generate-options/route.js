import { NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();
const rpName = 'پردیس رایانه';

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const rpID = url.hostname;

    let token = req.cookies.get('token')?.value;
    if (!token) {
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
      token = authHeader.split(' ')[1];
    }

    const payload = verifyToken(token);
    if (!payload || !payload.id) return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
    
    const user = await prisma.user.findUnique({ 
      where: { id: payload.id }, 
      include: { authenticators: true } 
    });

    if (!user) return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: Buffer.from(user.id.toString(), 'utf-8'),
      userName: user.username,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'preferred',
      },
      excludeCredentials: user.authenticators.map(auth => ({
        id: Buffer.from(auth.credentialID, 'base64url'),
        type: 'public-key',
        transports: auth.transports ? auth.transports.split(',') : [],
      })),
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { challenge: options.challenge }
    });

    return NextResponse.json(options);
  } catch (error) {
    console.error('generateOptions error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
