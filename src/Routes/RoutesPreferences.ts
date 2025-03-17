import express, { Router } from "express";
import { CategoryController } from "../Controlleur/ControllerPreferences";

const router: Router = express.Router();
const categoryController = new CategoryController();

class RouteCategory {
    constructor() {
        this.initRoutes();
    }
    
    public getRouter(): Router {
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

export default new RouteCategory();