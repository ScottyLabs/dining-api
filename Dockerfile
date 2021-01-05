FROM nikolaik/python-nodejs:latest

WORKDIR /runtime
COPY . /runtime

RUN npm install

RUN python3 -m venv env
RUN env/bin/pip3 install -r requirements.txt

EXPOSE 5010

CMD npm start