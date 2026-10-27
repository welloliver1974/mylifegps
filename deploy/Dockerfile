FROM node:20-alpine AS builder

WORKDIR /app

# Copia arquivos de dependência
COPY server/package*.json ./
RUN npm ci

# Copia código-fonte e schema do Prisma
COPY server/prisma ./prisma
RUN npx prisma generate

COPY server/ ./
RUN npm run build

# Imagem final leve
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV DATABASE_URL="file:/data/life360.db"

COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# Volume para persistência do banco SQLite
VOLUME ["/data"]

EXPOSE 3000

CMD ["node", "dist/index.js"]
