import express, { Router, Request, Response } from "express";
import path from "path";
import fs from "fs";

const router: Router = express.Router();

class RouteDebug {
    constructor() {
        this.initRoutes();
    }

    public getRouter(): Router {
        return router;
    }

    private initRoutes() {
        // Endpoint de diagnostic pour vérifier l'existence des fichiers
        router.get('/check-file', (req, res) => {
            const { filePath } = req.query;
            
            if (!filePath || typeof filePath !== 'string') {
                return res.status(400).json({ 
                success: false, 
                message: 'Le paramètre filePath est requis'
                });
            }
            
            try {
                // Chemins à vérifier
                const pathsToCheck: Array<{type: string, path: string}> = [];
                
                // Chemin original
                const originalPath = path.join( 'src', 'uploads', filePath);
                console.log(process.cwd());
                
                console.log(originalPath);
                
                pathsToCheck.push({ type: 'original', path: originalPath });
                
                // Essayer avec images au lieu de banners
                if (filePath.includes('/banners/')) {
                const alternatePath = path.join( 'src', 'uploads', filePath.replace('/banners/', '/images/'));
                pathsToCheck.push({ type: 'alternate (images)', path: alternatePath });
                }
                
                // Essayer avec banners au lieu de images
                if (filePath.includes('/images/')) {
                const alternatePath = path.join('src', 'uploads', filePath.replace('/images/', '/banners/'));
                pathsToCheck.push({ type: 'alternate (banners)', path: alternatePath });
                }
                
                // Vérifier chaque chemin
                const results = pathsToCheck.map(item => {
                const exists = fs.existsSync(item.path);
                const details: any = { exists };
                
                if (exists) {
                    const stats = fs.statSync(item.path);
                    Object.assign(details, {
                    isFile: stats.isFile(),
                    isDirectory: stats.isDirectory(),
                    size: stats.size,
                    created: stats.birthtime,
                    modified: stats.mtime
                    });
                }
                
                return {
                    type: item.type,
                    path: item.path,
                    ...details
                };
                });
                
                // Liste des dossiers parents
                const dirs: Array<{path: string, exists: boolean, contents: string[]}> = [];
                let currentDir = path.dirname(originalPath);
                while (currentDir.includes('uploads')) {
                dirs.push({
                    path: currentDir,
                    exists: fs.existsSync(currentDir),
                    contents: fs.existsSync(currentDir) ? fs.readdirSync(currentDir) : []
                });
                currentDir = path.dirname(currentDir);
                }
                
                // Créer les dossiers nécessaires au passage
                const dirToCreate = path.dirname(originalPath);
                if (!fs.existsSync(dirToCreate)) {
                fs.mkdirSync(dirToCreate, { recursive: true });
                }
                
                res.status(200).json({
                success: true,
                query: filePath,
                results,
                directories: dirs,
                directoryCreated: !fs.existsSync(dirToCreate) ? undefined : {
                    path: dirToCreate,
                    created: true
                }
                });
            } catch (error: any) {
                console.error('Erreur lors de la vérification du fichier:', error);
                res.status(500).json({
                success: false,
                message: 'Erreur lors de la vérification du fichier',
                error: error.message
                });
            }
        });
    }
}

export const RouteDebugInstance = new RouteDebug(); 