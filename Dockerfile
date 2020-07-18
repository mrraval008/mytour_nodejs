# Stage 0, "build-stage", based on Node.js, to build and compile Angular
FROM node:10
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# EXPOSE 3000

# Serve the app
CMD ["npm", "start"]
