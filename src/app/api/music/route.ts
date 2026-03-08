import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { NextResponse } from 'next/server';

const s3Client = new S3Client({
  region: "us-east-1",
  endpoint: process.env.CLOUFLY_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUFLY_ACCESS_KEY!,
    secretAccessKey: process.env.CLOUFLY_SECRET_KEY!,
  },
  forcePathStyle: true,
});

export async function GET() {
  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.CLOUFLY_BUCKET_NAME,
    });
    const { Contents } = await s3Client.send(command);
    const musicFiles = Contents?.filter(file => file.Key?.match(/\.(mp3|wav|flac|m4a)$/i))
      .map(file => ({
        name: file.Key?.replace(/\.[^/.]+$/, "").replaceAll("_", " "),
        fileName: file.Key,
        url: `${process.env.CLOUFLY_ENDPOINT}/${process.env.CLOUFLY_BUCKET_NAME}/${file.Key}`
      })) || [];
    return NextResponse.json(musicFiles);
  } catch (error) {
    return NextResponse.json({ error: "S3 Error" }, { status: 500 });
  }
}
