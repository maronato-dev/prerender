# [maronato.dev](maronato.dev) Prerender service

[Prerender.io](https://prerender.io/) service used to cache http responses to web crawlers and bots.

No config is required, but S3 credentials can be provided to persist cached files.

S3 environment vars:

- `AWS_ACCESS_KEY_ID`: Your key ID
- `AWS_SECRET_ACCESS_KEY`: Your key secret
- `AWS_REGION`: Bucket region
- `S3_BUCKET_NAME`: Name of the bucket
- `S3_PREFIX_KEY`: Prefix path for cached files
- `AWS_ENDPOINT`: Alternative endpoint
- `S3_EXPIRATION_DAYS`: Number of days for cache expiration
