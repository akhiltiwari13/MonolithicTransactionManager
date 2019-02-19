FROM node:8.11.4-alpine

WORKDIR /app

RUN apk add --no-cache git yarn python g++ bash make

COPY package.json package-lock.json ./

RUN npm install

COPY . .

EXPOSE 5000

CMD [ "npm", "start" ]
