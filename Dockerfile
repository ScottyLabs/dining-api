FROM oven/bun:latest

WORKDIR /runtime
COPY . /runtime

RUN bun install
RUN bun run build

EXPOSE 5010
CMD bun run start
