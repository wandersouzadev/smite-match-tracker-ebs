FROM node:16-alpine

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./

COPY .env ./

COPY ./dist ./dist


CMD ["npm", "run", "start:prod"]
