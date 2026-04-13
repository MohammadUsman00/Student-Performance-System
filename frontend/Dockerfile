# Build from repository root:
#   docker build -f frontend/Dockerfile --build-arg VITE_CONVEX_URL=https://....convex.cloud .
FROM node:22-alpine AS build

WORKDIR /workspace

COPY frontend/package.json frontend/package-lock.json ./frontend/
WORKDIR /workspace/frontend
RUN npm ci

COPY frontend/ ./
COPY convex/ /workspace/convex/

ARG VITE_CONVEX_URL
# Fail fast if Convex URL is missing (Vite embeds this at build time).
RUN test -n "$VITE_CONVEX_URL" || (echo "ERROR: build-arg VITE_CONVEX_URL is required (your Convex HTTPS URL)" && exit 1)
ENV VITE_CONVEX_URL=${VITE_CONVEX_URL}
ENV NODE_ENV=production

RUN npm run build

FROM nginx:alpine
COPY --from=build /workspace/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.docker.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
