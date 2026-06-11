import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const persons = [
  { name: 'ایمان کمالی', number: '09911999852', org: 0, role: 'ADMIN' },
  { name: 'طباطبایی', number: '09176852349', org: 1, role: 'USER' },
  { name: 'نکویی', number: '09174234065', org: 2, role: 'USER' },
  { name: 'عبادی', number: '09170493652', org: 3, role: 'USER' },
  { name: 'ایزدی', number: '09173260279', org: 4, role: 'USER' },
  { name: 'اسماعیل بیگ', number: '09173268033', org: 5, role: 'USER' },
  { name: 'مدیریت', number: '09177154176', org: 6, role: 'ADMIN' },
  { name: 'طاهری', number: '09382217731', org: 7, role: 'USER' },
  { name: 'نعمتی', number: '09172556207', org: 8, role: 'USER' },
  { name: 'ملکی', number: '09335585635', org: 9, role: 'USER' },
  { name: 'حیدری', number: '09173268028', org: 10, role: 'USER' },
  { name: 'آقارضا', number: '09385512778', org: 11, role: 'USER' },
  { name: 'حبیبی', number: '09338907776', org: 12, role: 'USER' },
  { name: 'قائدی', number: '09171088733', org: 13, role: 'USER' },
  { name: 'رجبی', number: '09056011806', org: 14, role: 'USER' }
];

async function main() {
  console.log(`Start seeding ...`);
  for (const p of persons) {
    const hashedPassword = await bcrypt.hash('123456', 10);
    const user = await prisma.user.upsert({
      where: { username: p.number },
      update: { role: p.role },
      create: {
        username: p.number,
        password: hashedPassword,
        name: p.name,
        mobile: p.number,
        role: p.role,
        orgId: p.org
      },
    });
    console.log(`Created user with id: ${user.id} - ${user.name}`);
  }
  
  await prisma.location.upsert({
    where: { code: 'C2F2' },
    update: {},
    create: {
      code: 'C2F2',
      floor: 'C',
      region: 2,
      sector: 'F',
      row: 2
    }
  });

  console.log(`Seeding finished.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
