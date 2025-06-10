import mongoose, { Schema, model } from 'mongoose';
import { TarifsPublicitaires } from '../Interface/InterfaceConfigpublicite';

const configPubliciteSchema = new Schema<TarifsPublicitaires>({
    prixClic: { type: Number, required: true },
    prixImpression: { type: Number, required: true },
    tarifParJour: { type: Object, required: true },
  });

const ConfigPublicite = model<TarifsPublicitaires>('ConfigPublicite', configPubliciteSchema);

export default ConfigPublicite;

