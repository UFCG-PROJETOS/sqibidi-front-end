FROM node:18-alpine AS builder

WORKDIR /

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /

RUN npm install -g serve

COPY --from=builder ./dist ./dist

EXPOSE 5173

CMD ["serve", "-s", "dist", "-l", "5173"]