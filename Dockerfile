# Note: include stuff from here if chromium breaks: https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#running-puppeteer-in-docker

FROM oven/bun:latest
# installs appropriate chromium binary for current architecture (x86 vs. ARM) https://github.com/cline/cline/pull/1721
RUN apt update && apt install chromium -y

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /runtime
COPY . /runtime

RUN bun install

EXPOSE 5010
CMD bun start
