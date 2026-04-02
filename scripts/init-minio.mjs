import { Client } from 'minio'

const accessKey = process.env.MINIO_ACCESS_KEY
const secretKey = process.env.MINIO_SECRET_KEY

if (!process.env.MINIO_ENDPOINT || !accessKey || !secretKey) {
  throw new Error('MinIO environment variables are incomplete.')
}

function resolveMinioConfig(env = process.env) {
  const rawEndpoint = env.MINIO_ENDPOINT
  const rawPort = env.MINIO_PORT
  const rawUseSSL = env.MINIO_USE_SSL

  if (/^https?:\/\//i.test(rawEndpoint)) {
    const url = new URL(rawEndpoint)

    return {
      endPoint: url.hostname,
      port: url.port
        ? Number.parseInt(url.port, 10)
        : url.protocol === 'https:'
          ? 443
          : 80,
      useSSL: url.protocol === 'https:',
      accessKey,
      secretKey,
    }
  }

  const requestedUseSSL = rawUseSSL === 'true'
  const requestedPort = rawPort
    ? Number.parseInt(rawPort, 10)
    : requestedUseSSL
      ? 443
      : 9000

  return {
    endPoint: rawEndpoint,
    port: requestedUseSSL && requestedPort === 80 ? 443 : requestedPort,
    useSSL: requestedUseSSL,
    accessKey,
    secretKey,
  }
}

const buckets = [
  process.env.MINIO_BUCKET_FILES ?? 'pi-chat-files',
  process.env.MINIO_BUCKET_AVATARS ?? 'pi-chat-avatars',
]

const client = new Client(resolveMinioConfig())

for (const bucket of buckets) {
  const exists = await client.bucketExists(bucket)
  if (!exists) {
    await client.makeBucket(bucket)
    console.log(`Created bucket: ${bucket}`)
    continue
  }

  console.log(`Bucket already present: ${bucket}`)
}
