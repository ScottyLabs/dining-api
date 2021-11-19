FROM nikolaik/python-nodejs:latest

WORKDIR /runtime
COPY . /runtime

RUN npm install

EXPOSE 5010

CMD npm start
