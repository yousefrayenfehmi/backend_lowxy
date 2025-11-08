"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouteDebugInstance = void 0;
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = express_1.default.Router();
class RouteDebug {
    constructor() {
        this.initRoutes();
    }
    getRouter() {
        return router;
    }
    initRoutes() {
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
                const pathsToCheck = [];
                // Chemin original
                const originalPath = path_1.default.join('src', 'uploads', filePath);
                console.log(process.cwd());
                console.log(originalPath);
                pathsToCheck.push({ type: 'original', path: originalPath });
                // Essayer avec images au lieu de banners
                if (filePath.includes('/banners/')) {
                    const alternatePath = path_1.default.join('src', 'uploads', filePath.replace('/banners/', '/images/'));
                    pathsToCheck.push({ type: 'alternate (images)', path: alternatePath });
                }
                // Essayer avec banners au lieu de images
                if (filePath.includes('/images/')) {
                    const alternatePath = path_1.default.join('src', 'uploads', filePath.replace('/images/', '/banners/'));
                    pathsToCheck.push({ type: 'alternate (banners)', path: alternatePath });
                }
                // Vérifier chaque chemin
                const results = pathsToCheck.map(item => {
                    const exists = fs_1.default.existsSync(item.path);
                    const details = { exists };
                    if (exists) {
                        const stats = fs_1.default.statSync(item.path);
                        Object.assign(details, {
                            isFile: stats.isFile(),
                            isDirectory: stats.isDirectory(),
                            size: stats.size,
                            created: stats.birthtime,
                            modified: stats.mtime
                        });
                    }
                    return Object.assign({ type: item.type, path: item.path }, details);
                });
                // Liste des dossiers parents
                const dirs = [];
                let currentDir = path_1.default.dirname(originalPath);
                while (currentDir.includes('uploads')) {
                    dirs.push({
                        path: currentDir,
                        exists: fs_1.default.existsSync(currentDir),
                        contents: fs_1.default.existsSync(currentDir) ? fs_1.default.readdirSync(currentDir) : []
                    });
                    currentDir = path_1.default.dirname(currentDir);
                }
                // Créer les dossiers nécessaires au passage
                const dirToCreate = path_1.default.dirname(originalPath);
                if (!fs_1.default.existsSync(dirToCreate)) {
                    fs_1.default.mkdirSync(dirToCreate, { recursive: true });
                }
                res.status(200).json({
                    success: true,
                    query: filePath,
                    results,
                    directories: dirs,
                    directoryCreated: !fs_1.default.existsSync(dirToCreate) ? undefined : {
                        path: dirToCreate,
                        created: true
                    }
                });
            }
            catch (error) {
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
exports.RouteDebugInstance = new RouteDebug();
