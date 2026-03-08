const { S3Client, ListObjectsV2Command, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3 = new S3Client({
    region: "us-east-1",
    endpoint: process.env.CLOUFLY_ENDPOINT,
    credentials: {
        accessKeyId: process.env.CLOUFLY_ACCESS_KEY?.trim(),
        secretAccessKey: process.env.CLOUFLY_SECRET_KEY?.trim(),
    },
    forcePathStyle: true,
});

export default async function handler(req, res) {
    const bucket = process.env.CLOUFLY_BUCKET_NAME?.trim(); // Sẽ là music-sever
    try {
        if (req.method === "GET") {
            const command = new ListObjectsV2Command({ Bucket: bucket });
            const { Contents } = await s3.send(command);
            
            const songs = Contents?.filter(f => f.Key.match(/\.(mp3|wav|flac|m4a)$/i)).map(f => ({
                name: f.Key.replace(/\.[^/.]+$/, "").replace(/_/g, " "),
                fileName: f.Key,
                size: (f.Size / 1024 / 1024).toFixed(2) + " MB",
                url: `${process.env.CLOUFLY_ENDPOINT}/${bucket}/${encodeURIComponent(f.Key)}`
            })) || [];
            
            return res.status(200).json(songs);
        }
        
        if (req.method === "POST") {
            const { fileName, fileType } = req.body;
            const command = new PutObjectCommand({ Bucket: bucket, Key: fileName, ContentType: fileType });
            const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 600 });
            return res.status(200).json({ uploadUrl });
        }
    } catch (e) {
        console.error(e);
        return res.status(200).json([]); // Trả về mảng rỗng nếu lỗi để giao diện vẫn hiện
    }
}
