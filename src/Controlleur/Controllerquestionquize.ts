import { Request, Response } from 'express';
import { QuestionBanks} from '../models/Questionquize';
import { dbConnection } from '../BDconnection/BDconnection';
import mongoose from 'mongoose';

class QuestionBankController {
    async createQuestion(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            });
        }

        try {
            const question = new QuestionBanks(req.body);
            const savedQuestion = await question.save();
            res.status(201).json(savedQuestion);
        } catch (error) {
            res.status(500).json({ error: error });
        } 
    }

    async getAllQuestions(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            });
        }

        try {
            const questions = await QuestionBanks.find();
            res.status(200).json(questions);
        } catch (error) {
            res.status(500).json({ error });
        } 
    }

    async getQuestionById(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            });
        }

        try {
            const { id } = req.params;
            const question = await QuestionBanks.findById(id);
            if (!question) {
                res.status(404).json({
                    success: false,
                    message: 'Question non trouvée'
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: question
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la recherche de la question'
            });
        } 
    }

    async updateQuestion(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            });
        }

        try {
            const { id } = req.params;
            const question = await QuestionBanks.findByIdAndUpdate(
                id,
                req.body,
                { new: true, runValidators: true }
            );
            if (!question) {
                res.status(404).json({ error: 'Question non trouvée' });
                return;
            }
            res.status(200).json(question);
        } catch (error) {
            res.status(500).json({ error: error });
        } 
    }

    async deleteQuestion(req: Request, res: Response): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            await dbConnection.getConnection().catch(error => {
                res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                return;
            });
        }

        try {
            const { id } = req.params;
            const question = await QuestionBanks.findByIdAndDelete(id);
            if (!question) {
                res.status(404).json({ error: 'Question non trouvée' });
                return;
            }
            res.status(200).json({ message: 'Question supprimée avec succès' });
        } catch (error) {
            res.status(500).json({ error: error });
        } 
    }
}

export const ControllerquestionBankInstance = new QuestionBankController();