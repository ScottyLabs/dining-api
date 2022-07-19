FROM node:16

WORKDIR /runtime
COPY . /runtime

RUN npm install && npm run build

EXPOSE 5010
CMD npm start