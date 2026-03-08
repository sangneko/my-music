const { S3Client, ListObjectsV2Command, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

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
    const { method } = req;

    try {
        if (method === "GET") {
            // Lấy danh sách nhạc
            const command = new ListObjectsV2Command({ Bucket: process.env.CLOUFLY_BUCKET_NAME });
            const { Contents } = await s3.send(command);
            const songs = Contents?.filter(f => f.Key.match(/\.(mp3|wav|flac|m4a)$/i)).map(f => ({
                name: f.Key.replace(/\.[^/.]+$/, "").replace(/_/g, " "),
                fileName: f.Key,
                size: (f.Size / 1024 / 1024).toFixed(2) + " MB",
                url: `${process.env.CLOUFLY_ENDPOINT}/${process.env.CLOUFLY_BUCKET_NAME}/${f.Key}`
            })) || [];
            return res.status(200).json(songs);
        } 
        
        if (method === "POST") {
            // Tạo URL để upload nhạc bảo mật (Presigned URL)
            const { fileName, fileType } = req.body;
            const command = new PutObjectCommand({
                Bucket: process.env.CLOUFLY_BUCKET_NAME,
                Key: fileName,
                ContentType: fileType
            });
            const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 }); // Link có hiệu lực 5 phút
            return res.status(200).json({ uploadUrl });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}
