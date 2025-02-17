FROM node:alpine

FROM oven/bun:latest

WORKDIR /runtime
COPY . /runtime

RUN npm install

EXPOSE 5010
CMD npm start
