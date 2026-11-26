FROM node:26-alpine

WORKDIR /app

COPY package*.json ./

# npm install đồng bộ package-lock.json khi bổ sung dependency mới của bài 3.
RUN npm install --omit=dev --no-audit --no-fund

COPY src ./src
COPY scripts ./scripts

ENV PORT=3000

EXPOSE 3000

USER node

CMD ["node", "src/server.js"]
