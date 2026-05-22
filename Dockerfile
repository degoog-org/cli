FROM oven/bun:1-alpine

RUN apk add --no-cache su-exec

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY src ./src
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

VOLUME ["/workspace", "/degoog-config"]
ENV DEGOOG_CONFIG_HOME=/degoog-config
WORKDIR /workspace

USER root
ENTRYPOINT ["/entrypoint.sh"]
