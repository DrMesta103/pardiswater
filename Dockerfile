# پایه تصویر Node.js (استفاده از نسخه slim به جای alpine برای جلوگیری از ارورهای شبکه و تحریم در سرورهای ایرانی)
FROM node:18-slim AS base

# مرحله ۱: نصب نیازمندی‌ها
FROM base AS deps
RUN apt-get update && apt-get install -y openssl libc6
WORKDIR /app

# کپی فایل‌های نصب پکیج
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# نصب پکیج‌ها و جنریت کردن کلاینت Prisma
RUN npm install
RUN npx prisma generate

# مرحله ۲: بیلد پروژه
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# غیرفعال کردن تله‌متری Next.js
ENV NEXT_TELEMETRY_DISABLED=1

# بیلد پروژه
RUN npm run build

# مرحله ۳: اجرای پروژه در محیط پروداکشن
FROM base AS runner
WORKDIR /app

# نصب openssl برای اجرای Prisma در محیط داکر
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# ساخت کاربر غیر-روت برای امنیت
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# کپی فایل‌های استاتیک
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# کپی فایل‌های خروجی Standalone که حجم بسیار کمی دارند
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
