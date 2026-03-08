const { S3Client, ListObjectsV2Command } = require("@aws-sdk/client-s3");

const s3 = new S3Client({
    region: "us-east-1",
    endpoint: process.env.CLOUFLY_ENDPOINT,
    credentials: {
        accessKeyId: process.env.CLOUFLY_ACCESS_KEY,
        secretAccessKey: process.env.CLOUFLY_SECRET_KEY,
    },
    forcePathStyle: true,
});

export default async function handler(req, res) {
    try {
        const command = new ListObjectsV2Command({
            Bucket: process.env.CLOUFLY_BUCKET_NAME,
        });
        const { Contents } = await s3.send(command);
        const songs = Contents?.filter(f => f.Key.match(/\.(mp3|wav|flac)$/i)).map(f => ({
            name: f.Key.replace(/\.[^/.]+$/, "").replace(/_/g, " "),
            url: `${process.env.CLOUFLY_ENDPOINT}/${process.env.CLOUFLY_BUCKET_NAME}/${f.Key}`
        })) || [];
        res.status(200).json(songs);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}
