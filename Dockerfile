FROM node:22-alpine AS builder

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci

COPY backend/prisma ./prisma
RUN npx prisma generate

COPY backend/tsconfig*.json ./
COPY backend/nest-cli.json ./
COPY backend/src ./src

RUN npm run build

FROM node:22-alpine

RUN apk add --no-cache openssl bash

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY backend/package*.json ./

COPY backend/entrypoint.sh ./entrypoint.sh
COPY backend/wait-for-db.js ./wait-for-db.js
RUN chmod +x ./entrypoint.sh

RUN npx prisma generate

COPY frontend ../frontend

EXPOSE 5000

CMD ["/bin/bash", "./entrypoint.sh"]
