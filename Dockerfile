FROM node:14-alpine

ENV ENV_NAME dev

WORKDIR app
COPY . .

RUN npm install
RUN npm run transpile

CMD [ "npm", "run", "serve" ]
EXPOSE 3001