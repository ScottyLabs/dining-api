FROM oven/bun:latest

WORKDIR /runtime
COPY . /runtime

RUN bun install

EXPOSE 5010
CMD bun start
