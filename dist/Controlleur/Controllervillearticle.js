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
exports.ControllervillearticleInstance = void 0;
const VilleArticle_1 = require("../models/VilleArticle");
const BDconnection_1 = require("../BDconnection/BDconnection");
const mongoose_1 = __importDefault(require("mongoose"));
class Controllervillearticle {
    getVilleArticle(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const villeArticle = yield VilleArticle_1.PointInteret.find();
                res.status(200).json({ villeArticle });
            }
            catch (error) {
                res.status(500).json({ error: error });
            }
        });
    }
    createVilleArticle(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                console.log(req.body);
                const { nom_lieu, description, categorie, ville, pays, adresse, rating, url_image, texte_alternatif } = req.body;
                const villeArticle = new VilleArticle_1.PointInteret({
                    nom_lieu,
                    description,
                    categorie,
                    ville,
                    pays,
                    adresse,
                    rating,
                    url_image,
                    texte_alternatif
                });
                yield villeArticle.save();
                res.status(201).json({ message: 'Point d\'intérêt créé avec succès', villeArticle });
            }
            catch (error) {
                console.log(error);
                res.status(500).json({ error: error });
            }
        });
    }
    updateVilleArticle(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const { id } = req.params;
                // Vérifier si l'élément existe
                const existingPointInteret = yield VilleArticle_1.PointInteret.findById(id);
                if (!existingPointInteret) {
                    res.status(404).json({ error: 'Point d\'intérêt non trouvé' });
                    return;
                }
                const { nom_lieu, description, categorie, ville, pays, adresse, rating, url_image, texte_alternatif } = req.body;
                // Mettre à jour le point d'intérêt
                const updatedPointInteret = yield VilleArticle_1.PointInteret.findByIdAndUpdate(id, {
                    nom_lieu,
                    description,
                    categorie,
                    ville,
                    pays,
                    adresse,
                    rating,
                    url_image,
                    texte_alternatif
                }, { new: true, runValidators: true } // new: true retourne le document mis à jour
                );
                res.status(200).json({
                    message: 'Point d\'intérêt mis à jour avec succès',
                    pointInteret: updatedPointInteret
                });
            }
            catch (error) {
                console.log(error);
                res.status(500).json({ error: error });
            }
        });
    }
    deleteVilleArticle(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const { id } = req.params;
                console.log(id);
                const villeArticle = yield VilleArticle_1.PointInteret.findByIdAndDelete(id);
                res.status(200).json({ message: 'Ville article supprimée avec succès', villeArticle });
            }
            catch (error) {
                res.status(500).json({ error: error });
            }
        });
    }
    getVilleArticleByVille(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mongoose_1.default.connection.readyState !== 1) {
                yield BDconnection_1.dbConnection.getConnection().catch(error => {
                    res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                    return;
                });
            }
            try {
                const { ville } = req.params;
                console.log('ville', ville);
                const lowercaseVille = ville.toLowerCase();
                const villeArticle = yield VilleArticle_1.PointInteret.find({ 'ville': lowercaseVille });
                console.log('villeArticle', villeArticle);
                res.status(200).json({ villeArticle });
            }
            catch (error) {
                res.status(500).json({ error: error });
            }
        });
    }
}
exports.ControllervillearticleInstance = new Controllervillearticle();
