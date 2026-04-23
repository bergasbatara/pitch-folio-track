# Frontend (Vite) build + Nginx static serving
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL
ARG VITE_MIDTRANS_CLIENT_KEY
ARG VITE_MIDTRANS_ENV
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_MIDTRANS_CLIENT_KEY=$VITE_MIDTRANS_CLIENT_KEY
ENV VITE_MIDTRANS_ENV=$VITE_MIDTRANS_ENV

RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80

