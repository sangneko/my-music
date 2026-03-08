const { S3Client, ListObjectsV2Command, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3 = new S3Client({
    region: "us-east-1",
    // Tự động thêm https nếu bạn quên
    endpoint: process.env.CLOUFLY_ENDPOINT?.startsWith('http') 
        ? process.env.CLOUFLY_ENDPOINT 
        : `https://${process.env.CLOUFLY_ENDPOINT}`,
    credentials: {
        accessKeyId: process.env.CLOUFLY_ACCESS_KEY?.trim(),
        secretAccessKey: process.env.CLOUFLY_SECRET_KEY?.trim(),
    },
    forcePathStyle: true,
});

export default async function handler(req, res) {
    try {
        const bucket = process.env.CLOUFLY_BUCKET_NAME?.trim();
        if (req.method === "GET") {
            const command = new ListObjectsV2Command({ Bucket: bucket });
            const { Contents } = await s3.send(command);
            const songs = Contents?.filter(f => f.Key.match(/\.(mp3|wav|flac|m4a)$/i)).map(f => ({
                name: f.Key.replace(/\.[^/.]+$/, "").replace(/_/g, " "),
                fileName: f.Key,
                size: (f.Size / 1024 / 1024).toFixed(2) + " MB",
                url: `${s3.config.endpoint}/${bucket}/${encodeURIComponent(f.Key)}`
            })) || [];
            return res.status(200).json(songs);
        }
        // ... (phần POST giữ nguyên)
    } catch (e) {
        // Trả về mảng rỗng thay vì báo lỗi 500 để tránh sập giao diện
        console.error("S3 Error:", e.message);
        return res.status(200).json([]); 
    }
}
