FROM node:lts-slim
WORKDIR /rentIT
COPY package.json /rentIT
RUN npm install
COPY . /rentIT
EXPOSE 6969
CMD ["npm", "start"]