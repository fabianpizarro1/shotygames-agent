FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production --no-audit --no-fund

COPY . .

EXPOSE 3500

HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3500/health || exit 1

CMD ["node", "index.js"]
