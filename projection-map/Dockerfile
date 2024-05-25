FROM node:18-slim

WORKDIR /app

COPY package*.json /app/
RUN npm install
ENV PUBLIC_URL /render
COPY . .
RUN npm run build

RUN npm install -g serve

EXPOSE 3000

CMD ["serve","-s","build"]
