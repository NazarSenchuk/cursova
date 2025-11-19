FROM node:22-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app

RUN npm install -g serve

COPY --from=builder  --chown=node:node /app/dist ./dist
COPY --from=builder   --chown=node:node /app/public/env-config.js ./public/env-config.js
COPY env.sh /app/env.sh

COPY --chown=node:node env.sh /app/env.sh
RUN chmod +x /app/env.sh

EXPOSE 3000
USER node

CMD ["/app/env.sh"]