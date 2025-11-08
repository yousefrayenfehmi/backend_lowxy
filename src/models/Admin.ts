import mongoose, { Schema } from "mongoose";

const AdminSchema = new Schema({
    nom_complet: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    tel: {
        type: String,
        required: true
    },
    mot_de_passe: {
        type: String,
        required: true
    },
   isAdmin:{
    type: Boolean,
    default: false
   },
   type: {
    type: String,
    enum: ['admin', 'superadmin'],
    default: 'admin'
   }
    
}, {
    timestamps: true
});
AdminSchema.index({email: 1}, {unique: true});
AdminSchema.index({_id: 1}, {unique: true});
AdminSchema.index({ "securites.date": 1 }, { 
    expireAfterSeconds: 3600,
    partialFilterExpression: { "securites.isverified": false }
});


const AdminModel = mongoose.model('Admin', AdminSchema);

export const Admin = AdminModel;