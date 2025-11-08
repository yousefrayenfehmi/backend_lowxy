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
exports.VerifierTokenInstance = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Touriste_1 = require("../models/Touriste");
const Partenaire_1 = require("../models/Partenaire");
const Chauffeure_1 = require("../models/Chauffeure");
class VerifierToken {
    verifyToken(req, res, next) {
        console.log("Verifier Token Midleware");
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        console.log(token);
        console.log("Verifier Token Midleware");
        if (!token) {
            res.status(401).json({ message: "Accès refusé. Token manquant." });
            return;
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            console.log(decoded);
            const { id } = decoded;
            req.user = id;
            next();
        }
        catch (error) {
            res.status(403).json({ message: "Token invalide ou expiré." });
        }
    }
    getUser(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const authHeader = req.headers.authorization;
            const token = authHeader && authHeader.split(' ')[1];
            console.log(token);
            console.log("Verifier Token Midleware");
            if (!token) {
                res.status(401).json({ message: "Accès refusé. Token manquant." });
                return;
            }
            else {
            }
            try {
                const touriste = yield Touriste_1.Touristes.findOne({ resetPasswordToken: token });
                const partenaire = yield Partenaire_1.Partenaires.findOne({ resetPasswordToken: token });
                const chauffeur = yield Chauffeure_1.Chauffeurs.findOne({ resetPasswordToken: token });
                if (touriste) {
                    res.status(200).json({
                        success: true,
                        user: 'Touriste',
                        message: 'Token valide',
                        touriste: touriste
                    });
                }
                if (partenaire) {
                    res.status(200).json({
                        success: true,
                        user: 'Partenaire',
                        message: 'Token valide',
                        partenaire: partenaire
                    });
                }
                if (chauffeur) {
                    res.status(200).json({
                        success: true,
                        user: 'Chauffeur',
                        message: 'Token valide',
                        chauffeur: chauffeur
                    });
                }
            }
            catch (error) {
                res.status(403).json({ message: "Token invalide ou expiré." });
            }
        });
    }
}
exports.VerifierTokenInstance = new VerifierToken();
