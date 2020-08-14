FROM node:lts-alpine
ENV CHROME_BIN=/usr/bin/chromium-browser
ENV CHROME_PATH=/usr/lib/chromium/
ENV MEMORY_CACHE=0
ENV S3_CACHE=0
ENV CACHE_MAXSIZE=1000
ENV CACHE_TTL=6000
ENV HOST 0.0.0.0

WORKDIR /app

# Configure permissions
RUN addgroup -S user && adduser -S user -G user
RUN chown -R user:user /app && chmod -R 755 /app

# Install Chromium
RUN apk add --update-cache chromium \
  && rm -rf /var/cache/apk/* /tmp/*

# Install node deps
COPY ./package.json .
COPY ./yarn.lock .
RUN yarn

# Add the server file
COPY ./server.js .
COPY ./s3-cache.js .

USER user
EXPOSE 3000

CMD ["node", "server"]
