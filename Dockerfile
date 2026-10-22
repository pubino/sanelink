# Test image: docker build -t sanelink-test . && docker run --rm sanelink-test
FROM node:22.11.0-alpine3.20

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY decoder.js ./
COPY tests ./tests

CMD ["npm", "test"]
