import { Client } from 'minio'

export const FILE_BUCKET = process.env.MINIO_BUCKET_FILES ?? 'pi-chat-files'
export const AVATAR_BUCKET = process.env.MINIO_BUCKET_AVATARS ?? 'pi-chat-avatars'

type MinioConfig = {
  endPoint: string
  port: number
  useSSL: boolean
  accessKey: string
  secretKey: string
}

export function resolveMinioConfig(env: NodeJS.ProcessEnv = process.env): MinioConfig {
  const rawEndpoint = env.MINIO_ENDPOINT ?? 'localhost'
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
      accessKey: env.MINIO_ACCESS_KEY ?? '',
      secretKey: env.MINIO_SECRET_KEY ?? '',
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
    accessKey: env.MINIO_ACCESS_KEY ?? '',
    secretKey: env.MINIO_SECRET_KEY ?? '',
  }
}

export const minioClient = new Client(resolveMinioConfig())

export async function ensureBuckets() {
  for (const bucket of [FILE_BUCKET, AVATAR_BUCKET]) {
    const exists = await minioClient.bucketExists(bucket)
    if (!exists) {
      await minioClient.makeBucket(bucket)
    }
  }
}
