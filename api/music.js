const { S3Client, ListObjectsV2Command, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

// Hàm làm sạch URL và đảm bảo có https://
const getCleanEndpoint = (endpoint) => {
    if (!endpoint) return "https://s3.cloufly.vn";
    let clean = endpoint.trim();
    if (!clean.startsWith('http')) {
        clean = `https://${clean}`;
    }
    return clean;
};

const s3 = new S3Client({
    region: "us-east-1",
    endpoint: getCleanEndpoint(process.env.CLOUFLY_ENDPOINT),
    credentials: {
        accessKeyId: process.env.CLOUFLY_ACCESS_KEY?.trim(),
        secretAccessKey: process.env.CLOUFLY_SECRET_KEY?.trim(),
    },
    forcePathStyle: true,
});

export default async function handler(req, res) {
    const { method } = req;
    const bucketName = process.env.CLOUFLY_BUCKET_NAME?.trim();

    try {
        if (method === "GET") {
            const command = new ListObjectsV2Command({ Bucket: bucketName });
            const { Contents } = await s3.send(command);
            
            const endpoint = getCleanEndpoint(process.env.CLOUFLY_ENDPOINT);

            const songs = Contents?.filter(f => f.Key.match(/\.(mp3|wav|flac|m4a)$/i)).map(f => ({
                name: f.Key.replace(/\.[^/.]+$/, "").replace(/_/g, " "),
                fileName: f.Key,
                size: (f.Size / 1024 / 1024).toFixed(2) + " MB",
                // Tạo URL tải nhạc trực tiếp
                url: `${endpoint}/${bucketName}/${f.Key}`
            })) || [];
            
            return res.status(200).json(songs);
        }
        
        if (method === "POST") {
            const { fileName, fileType } = req.body;
            const command = new PutObjectCommand({
                Bucket: bucketName,
                Key: fileName,
                ContentType: fileType
            });
            const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
            return res.status(200).json({ uploadUrl });
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
}
