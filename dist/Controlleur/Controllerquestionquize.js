"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControllerquestionBankInstance = void 0;
const Questionquize_1 = require("../models/Questionquize");
const BDconnection_1 = require("../BDconnection/BDconnection");
const mongoose_1 = __importDefault(require("mongoose"));
class QuestionBankController {
    createQuestion(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const question = new Questionquize_1.QuestionBanks(req.body);
                const savedQuestion = yield question.save();
                res.status(201).json(savedQuestion);
            }
            catch (error) {
                res.status(500).json({ error: error });
            }
        });
    }
    getAllQuestions(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const questions = yield Questionquize_1.QuestionBanks.find();
                res.status(200).json(questions);
            }
            catch (error) {
                res.status(500).json({ error });
            }
        });
    }
    getQuestionById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const { id } = req.params;
                const question = yield Questionquize_1.QuestionBanks.findById(id);
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
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: 'Erreur lors de la recherche de la question'
                });
            }
        });
    }
    updateQuestion(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const { id } = req.params;
                const question = yield Questionquize_1.QuestionBanks.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
                if (!question) {
                    res.status(404).json({ error: 'Question non trouvée' });
                    return;
                }
                res.status(200).json(question);
            }
            catch (error) {
                res.status(500).json({ error: error });
            }
        });
    }
    deleteQuestion(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const { id } = req.params;
                const question = yield Questionquize_1.QuestionBanks.findByIdAndDelete(id);
                if (!question) {
                    res.status(404).json({ error: 'Question non trouvée' });
                    return;
                }
                res.status(200).json({ message: 'Question supprimée avec succès' });
            }
            catch (error) {
                res.status(500).json({ error: error });
            }
        });
    }
}
exports.ControllerquestionBankInstance = new QuestionBankController();
