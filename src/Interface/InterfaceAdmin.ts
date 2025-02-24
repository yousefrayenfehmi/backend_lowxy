import { Document } from 'mongoose';

export interface IAdmin extends Document {
    nom_complet: string;
    email: string;
    tel: string;
    mot_de_passe: string;
    securites?: {
        code?: string;
        date?: Date;
        isverified: boolean;
    };
    resetPasswordToken?: string;
    resetPasswordTokenExpire?: Date;
    isAdmin?:boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export default IAdmin;