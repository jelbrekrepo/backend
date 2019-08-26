FROM node:12-alpine
WORKDIR /usr/src/app
COPY package.json ./
COPY yarn.lock ./
COPY LICENSE ./
COPY README.md ./
COPY dist ./
RUN yarn install --production

CMD ["node", "dist/index.js"]