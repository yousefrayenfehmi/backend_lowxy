import { Types } from "mongoose";

interface IChauffeur extends Document {
    _id: Types.ObjectId
     info: {
         nom_complet: string;
         email: string; 
         telephone: string;
         motdepasse: string;
         strategy:string
         google_id:string
         facebook_id:string
         matricule: string;
         naissance: Date;
         adresse: {
            ville: string;
            pays: string;
        };
        Rib:string
     };
     vehicule: {
         matricule?: string;
         modele?: string;
         places?: number;
     };
     documents: {
         permis: {
             numero: string;
             expiration?: Date;
         };
         assurance: {
             nom?: string;
             numero?: string;
             expiration?: Date;
         };
         carte_taxi: {
             numero?: string;
             expiration?: Date;
         };
     };
     securites: {
         code?: string;
         date?: Date;
         isverified: boolean;
     };
     resetPasswordToken?: string;
     resetPasswordTokenExpire?: Date;
     createdAt: Date;
     updatedAt: Date;
  }

  export default IChauffeur;