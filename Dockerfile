FROM node:16-alpine as build

WORKDIR /usr/src/app

ENV NODE_ENV=development

COPY package*.json ./

RUN npm i

COPY tsconfig*.json ./

COPY src ./src

RUN npm run build


FROM node:16-alpine as prod

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY package*.json ./

RUN npm i

COPY --from=build /usr/src/app/dist ./dist

EXPOSE 4000

CMD ["npm", "run", "start:prod"]
