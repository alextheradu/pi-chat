import { Client } from 'minio'

export const FILE_BUCKET = process.env.MINIO_BUCKET_FILES ?? 'pi-chat-files'
export const AVATAR_BUCKET = process.env.MINIO_BUCKET_AVATARS ?? 'pi-chat-avatars'

export const minioClient = new Client({
  endPoint:  process.env.MINIO_ENDPOINT ?? 'localhost',
  port:      parseInt(process.env.MINIO_PORT ?? '9000'),
  useSSL:    process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY ?? '',
  secretKey: process.env.MINIO_SECRET_KEY ?? '',
})
