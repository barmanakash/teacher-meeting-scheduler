FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

RUN mkdir -p logs

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
