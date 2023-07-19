FROM node:latest

WORKDIR /runtime
COPY . /runtime

RUN npm install && npm run build

EXPOSE 5010
CMD npm start