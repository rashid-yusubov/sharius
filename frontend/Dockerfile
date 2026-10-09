# Multi-stage build для разработки и продакшена
FROM node:20-alpine as base

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Development stage - для разработки с Hot Module Replacement (HMR)
FROM base as development

ENV NODE_ENV=development
EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Builder stage - сборка статики Vite
FROM base as builder

ARG VITE_API_URL=http://localhost:9000
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# Production stage - легкая раздача собранной статики
FROM node:20-alpine as production

WORKDIR /app
RUN npm install -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 5173

CMD ["serve", "-s", "dist", "-l", "5173"]
