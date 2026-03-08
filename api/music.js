const { S3Client, ListObjectsV2Command, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3 = new S3Client({
    region: "us-east-1",
    endpoint: process.env.CLOUFLY_ENDPOINT.startsWith('http') ? process.env.CLOUFLY_ENDPOINT : `https://${process.env.CLOUFLY_ENDPOINT}`,
    credentials: { accessKeyId: process.env.CLOUFLY_ACCESS_KEY, secretAccessKey: process.env.CLOUFLY_SECRET_KEY },
    forcePathStyle: true,
});

export default async function handler(req, res) {
    const bucket = process.env.CLOUFLY_BUCKET_NAME;
    try {
        if (req.method === "GET") {
            const { Contents } = await s3.send(new ListObjectsV2Command({ Bucket: bucket }));
            const songs = Contents?.filter(f => f.Key.match(/\.(mp3|wav|flac|m4a)$/i)).map(f => ({
                name: f.Key.replace(/\.[^/.]+$/, "").replace(/_/g, " "),
                fileName: f.Key,
                size: (f.Size / 1024 / 1024).toFixed(2) + " MB",
                url: `${s3.config.endpoint}/${bucket}/${encodeURIComponent(f.Key)}`
            })) || [];
            return res.status(200).json(songs);
        }
        
        if (req.method === "POST") {
            const { fileName, fileType } = req.body;
            const url = await getSignedUrl(s3, new PutObjectCommand({ Bucket: bucket, Key: fileName, ContentType: fileType }), { expiresIn: 600 });
            return res.status(200).json({ uploadUrl: url });
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
}
