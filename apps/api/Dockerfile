FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
WORKDIR /workspace
RUN npm install --global corepack@latest && \
    corepack enable && \
    corepack use pnpm@10.12.1

FROM base AS prod-base
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir /nonexistent && \
    chown nextjs:nodejs /nonexistent

FROM base AS installer
RUN pnpm install --global turbo
COPY . .
RUN turbo prune --scope=api --docker

FROM base AS builder
COPY --from=installer /workspace/out/json/ .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --fetch-timeout=60000
COPY --from=installer /workspace/out/full/ .
RUN pnpm turbo build

FROM base AS runner-deps
COPY --from=installer /workspace/out/json/ .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --fetch-timeout=60000

FROM prod-base AS runner
COPY --from=runner-deps --chown=nextjs:nodejs  /workspace /workspace
RUN chown nextjs:nodejs /workspace
WORKDIR /workspace/apps/api
#COPY --from=builder /workspace/apps/api/public ./public
COPY --from=builder --chown=nextjs:nodejs /workspace/apps/api/.next ./.next
USER nextjs
EXPOSE 3000
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PNPM_HOME="/pnpm" \
    PATH="$PNPM_HOME:$PATH"

CMD ["pnpm", "start"]
