FROM node:20-alpine

WORKDIR /app

# Build tools para compilar módulos nativos (better-sqlite3, sharp)
RUN apk add --no-cache python3 make g++ libc6-compat

# Dependencias (todas: devDeps son necesarias para next build)
COPY package*.json ./
RUN npm ci && npm cache clean --force

# Código fuente
COPY . .

# Build
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Reducir a dependencias de producción para runtime
RUN npm prune --omit=dev

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => { if (r.statusCode >= 500) process.exit(1); }).on('error', () => process.exit(1));"

CMD ["npm", "start"]
