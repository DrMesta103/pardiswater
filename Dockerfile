# پایه تصویر Node.js (استفاده از نسخه ۲۰ به دلیل نیازمندی‌های Tailwind v4 و WebAuthn)
FROM node:20-slim AS base
RUN apt-get update && apt-get install -y openssl libc6 && rm -rf /var/lib/apt/lists/*

# مرحله ۱: نصب نیازمندی‌ها
FROM base AS deps
WORKDIR /app

# کپی فایل‌های نصب پکیج
COPY package.json ./
COPY prisma ./prisma/

# استفاده از میرور قدرتمند برای دور زدن تحریم و کندی شبکه و دریافت باینری‌های صحیح لینوکس
RUN npm config set registry https://registry.npmmirror.com/ && \
    npm install
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
