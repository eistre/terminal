FROM node:latest

WORKDIR /usr/src/app/

COPY . .

RUN npm install -g nodemon

RUN npm install

EXPOSE 8080

EXPOSE 5000

ENTRYPOINT ["nodemon", "api.js"]