"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ControllerPreferences_1 = require("../Controlleur/ControllerPreferences");
const router = express_1.default.Router();
const categoryController = new ControllerPreferences_1.CategoryController();
class RouteCategory {
    constructor() {
        this.initRoutes();
    }
    getRouter() {
        return router;
    }
    initRoutes() {
        // Routes CRUD pour les catégories sans vérification de token
        router.post('/category', categoryController.createCategory);
        router.get('/categories', categoryController.getAllCategories);
        router.get('/category/:id', categoryController.getCategoryById);
        router.get('/category/custom/:customId', categoryController.getCategoryByCustomId);
        router.put('/category/:id', categoryController.updateCategory);
        router.delete('/category/:id', categoryController.deleteCategory);
    }
}
exports.default = new RouteCategory();
