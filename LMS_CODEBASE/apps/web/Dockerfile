# ULMS staff app — build with Vite, serve as static files behind nginx (audit R1)
# Build arg mirrors the dev-mode switch: VITE_USE_MOCK_API=0 → the browser talks
# to the real api via the nginx /api proxy below (PLANNING/07 dev parity).
FROM node:24-alpine AS build
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_USE_MOCK_API=0
ENV VITE_USE_MOCK_API=$VITE_USE_MOCK_API
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /src/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
