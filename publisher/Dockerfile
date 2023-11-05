FROM node:21-alpine3.18 as build

WORKDIR /usr/src/app

COPY . .

RUN npm install && npx tsc index.ts

FROM node:21-alpine3.18

WORKDIR /app

COPY --from=build /usr/src/app/node_modules          node_modules
COPY --from=build /usr/src/app/index.js              index.js
COPY --from=build /usr/src/app/package.json          package.json
COPY --from=build /usr/src/app/package-lock.json     package-lock.json

CMD node index.js
