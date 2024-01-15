FROM oven/bun:latest

# Copy the package file
COPY ./package.json .

# Install dependencies
RUN bun install

# Copy environment variables
COPY .env .

# Copy source code
COPY src ./src

EXPOSE 5010
CMD bun start