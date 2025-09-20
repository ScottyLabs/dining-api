FROM node:24-slim AS base
ENV PNPM_HOME="/pnpm"
# ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app

FROM base AS prod-deps
RUN --mount=type=cache,id=s/8ced5fd2-dd3a-4a6d-9429-f4bcf2553871-/pnpm/store,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base AS build
RUN --mount=type=cache,id=s/8ced5fd2-dd3a-4a6d-9429-f4bcf2553871-/pnpm/store,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build

FROM base
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/dist /app/dist
EXPOSE 5010
CMD ["sh","./run-pnpm.sh"]
