
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY tsconfig.json ./
COPY drizzle.config.ts ./
COPY src ./src

COPY storage ./storage

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npx", "tsx", "src/server/index.ts"]
