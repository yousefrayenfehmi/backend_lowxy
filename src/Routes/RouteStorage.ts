import express, { Router, Request, Response } from "express";
import path from "path";
import fs from "fs";
import { S3 } from 'aws-sdk';

const router: Router = express.Router();

class RouteStorage {
    private s3: S3;

    constructor() {
        this.s3 = new S3({
            accessKeyId: 'AKIARZM5LUMYHWZ24C4Z',
            secretAccessKey: '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',
            region:  'eu-west-3'
        });
        
        this.initRoutes();
    }

    public getRouter(): Router {
        return router;
    }

    private initRoutes() {
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
            } catch (error) {
                console.error('Error generating S3 signed URL:', error);
                
                // Fallback to local file system if S3 fails
                const localPath = path.join(process.cwd(), 'src', 'uploads', req.params.path);
                if (fs.existsSync(localPath)) {
                    res.sendFile(localPath);
                } else {
                    res.status(404).json({ error: 'File not found' });
                }
            }
        });
    }
}

export const RouteStorageInstance = new RouteStorage(); 