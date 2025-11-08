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
exports.ControllerConfigpubliciteInstance = void 0;
const Configpublicite_1 = __importDefault(require("../models/Configpublicite"));
const BDconnection_1 = require("../BDconnection/BDconnection");
const mongoose_1 = __importDefault(require("mongoose"));
class ControllerConfigpublicite {
    // Créer une nouvelle configuration
    creerConfiguration(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const { prixClic, prixImpression, tarifParJour } = req.body;
                const nouvelleConfiguration = new Configpublicite_1.default({
                    prixClic,
                    prixImpression,
                    tarifParJour
                });
                console.log(nouvelleConfiguration);
                yield Configpublicite_1.default.deleteMany();
                console.log("suppression");
                yield nouvelleConfiguration.save();
                res.status(201).json(nouvelleConfiguration);
            }
            catch (error) {
                res.status(500).json({ message: 'Erreur lors de la création de la configuration', error });
            }
        });
    }
    getConfiguration(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const configuration = yield Configpublicite_1.default.findOne();
                res.status(200).json(configuration);
            }
            catch (error) {
                res.status(500).json({ message: 'Erreur lors de la récupération de la configuration', error });
            }
        });
    }
}
exports.ControllerConfigpubliciteInstance = new ControllerConfigpublicite();
