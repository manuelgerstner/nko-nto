# stage1 as builder
FROM node:23-alpine as builder

# copy the package.json to install dependencies
COPY package.json package-lock.json ./

# Install the dependencies and make the folder
RUN npm install && mkdir /react-ui && mv ./node_modules ./react-ui

WORKDIR /react-ui

COPY . .

ARG VITE_API_BASE_URL
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_APP_ID

# Build the project and copy the files
RUN npm run build


FROM owasp/modsecurity-crs:3.3-nginx-alpine-202601060501

#!/bin/sh

COPY ./nginx.conf /etc/nginx/nginx.conf

USER root
# Remove default nginx index page
RUN rm -rf /usr/share/nginx/html/*

# Copy from stage 1
COPY --from=builder /react-ui/dist /usr/share/nginx/html

EXPOSE 3000 80

ENTRYPOINT ["nginx", "-g", "daemon off;"]