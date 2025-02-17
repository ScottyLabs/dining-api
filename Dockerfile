FROM node:alpine

WORKDIR /runtime
COPY . /runtime

RUN npm install

EXPOSE 5010
CMD npm start

