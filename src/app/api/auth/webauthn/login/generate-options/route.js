import { NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const url = new URL(req.url);
    const rpID = url.hostname;
    const { username } = await req.json();
    
    if (!username) return NextResponse.json({ error: 'لطفاً ابتدا شماره موبایل را وارد کنید' }, { status: 400 });

    const user = await prisma.user.findUnique({ 
      where: { username }, 
      include: { authenticators: true } 
    });
    
    if (!user) return NextResponse.json({ error: 'حسابی با این شماره یافت نشد' }, { status: 404 });
    if (!user.authenticators.length) return NextResponse.json({ error: 'اثر انگشتی روی این حساب فعال نیست' }, { status: 400 });

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: user.authenticators.map(auth => ({
        id: Buffer.from(auth.credentialID, 'base64url'),
        type: 'public-key',
        transports: auth.transports ? auth.transports.split(',') : [],
      })),
      userVerification: 'preferred',
    });

    await prisma.user.update({ where: { id: user.id }, data: { challenge: options.challenge } });

    return NextResponse.json(options);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
