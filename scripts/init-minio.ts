import { minioClient, FILE_BUCKET, AVATAR_BUCKET } from '../lib/minio'

async function main() {
  for (const bucket of [FILE_BUCKET, AVATAR_BUCKET]) {
    const exists = await minioClient.bucketExists(bucket)
    if (!exists) {
      await minioClient.makeBucket(bucket)
      console.log(`Created bucket: ${bucket}`)
    } else {
      console.log(`Bucket exists: ${bucket}`)
    }
  }
  console.log('MinIO init complete')
}

main().catch(err => { console.error(err); process.exit(1) })
