FROM node:18-alpine

# ARG SHOPIFY_API_KEY
# ENV SHOPIFY_API_KEY=$SHOPIFY_API_KEY
ENV SHOPIFY_API_KEY=fba0237f7f8084edf2aa919f82b4a68d
EXPOSE 8081
WORKDIR /app
COPY web .
RUN npm install
RUN cd frontend && npm install && npm run build
CMD ["npm", "run", "serve"]
