"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouteStorageInstance = void 0;
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const aws_sdk_1 = require("aws-sdk");
const router = express_1.default.Router();
class RouteStorage {
    constructor() {
        this.s3 = new aws_sdk_1.S3({
            accessKeyId: 'AKIARZM5LUMYHWZ24C4Z',
            secretAccessKey: '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',
            region: 'eu-west-3'
        });
        this.initRoutes();
    }
    getRouter() {
        return router;
    }
    initRoutes() {
        // Route pour accéder aux fichiers sur S3
        router.get('/:path(*)', (req, res) => {
            const key = `uploads/${req.params.path}`;
            const bucketName = 'lowxysas';
            if (!bucketName) {
                return res.status(500).json({ error: 'AWS_S3_BUCKET environment variable is not defined' });
            }
            try {
                const url = this.s3.getSignedUrl('getObject', {
                    Bucket: bucketName,
                    Key: key,
                    Expires: 60 // URL valide pendant 60 secondes
                });
                res.redirect(url);
            }
            catch (error) {
                console.error('Error generating S3 signed URL:', error);
                // Fallback to local file system if S3 fails
                const localPath = path_1.default.join(process.cwd(), 'src', 'uploads', req.params.path);
                if (fs_1.default.existsSync(localPath)) {
                    res.sendFile(localPath);
                }
                else {
                    res.status(404).json({ error: 'File not found' });
                }
            }
        });
    }
}
exports.RouteStorageInstance = new RouteStorage();
