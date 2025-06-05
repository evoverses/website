FROM public.ecr.aws/lambda/nodejs:22 AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
WORKDIR /workspace
RUN npm install --global corepack@latest && \
    corepack enable && \
    corepack use pnpm@10.11.0

FROM base AS prod-base
RUN dnf update -y && \
    dnf install -y which && \
    dnf clean all && \
    rm -rf /var/cache/dnf

FROM base AS installer
RUN pnpm install --global turbo
COPY . .
RUN turbo prune --scope=squid --docker

FROM base AS builder
COPY --from=installer /workspace/out/json/ .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install
COPY --from=installer /workspace/out/full/ .
RUN pnpm turbo build

FROM base AS runner-deps
COPY --from=installer /workspace/out/json/ .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod

FROM prod-base AS runner
ENV PROCESSOR_PROMETHEUS_PORT=3000 \
    DB_NAME=squid \
    DB_PORT=5432 \
    DB_USER=squid \
    GQL_PORT=4350
COPY --from=runner-deps /workspace /workspace
WORKDIR /workspace/apps/squid
COPY --from=builder /workspace/apps/squid/lib lib
COPY --from=builder /workspace/apps/squid/db db
COPY --from=builder /workspace/apps/squid/schema.graphql schema.graphql
COPY --from=installer /workspace/apps/squid/commands.json commands.json
RUN echo -e "loglevel=silent\\nupdate-notifier=false" > /workspace/.npmrc
RUN npm install --global @subsquid/commands && ln -s $(which squid-commands) /usr/local/bin/sqd

ENTRYPOINT ["sqd"]
