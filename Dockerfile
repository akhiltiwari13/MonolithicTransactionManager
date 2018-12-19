FROM node:10.13.0-alpine

RUN mkdir -p /opt

# install dependecies
RUN apk update
RUN apk add --no-cache git build-base gcc abuild make bash python
RUN apk add postgresql-client

# Flow alpine fix
RUN apk --no-cache add ca-certificates wget
RUN wget -q -O /etc/apk/keys/sgerrand.rsa.pub https://alpine-pkgs.sgerrand.com/sgerrand.rsa.pub
RUN wget https://github.com/sgerrand/alpine-pkg-glibc/releases/download/2.28-r0/glibc-2.28-r0.apk
RUN apk add glibc-2.28-r0.apk && rm glibc-2.28-r0.apk

# set our node environment, either development or production
# defaults to production, compose overrides this to development on build and run
ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

# install latest npm, reguardless of node version, for speed and fixes
RUN npm i npm@latest -g

# install dependencies first, in a different location for easier app bind mounting for local development
WORKDIR /opt

COPY package*.json ./
RUN npm install --only=dev
RUN npm install glob
ENV PATH /opt/node_modules/.bin:$PATH

# copy in our source code last, as it changes the most
COPY . /opt

RUN make build

# copy dir which is not copy by babel
COPY ./bin /opt/dist/

CMD make start_prod_server
