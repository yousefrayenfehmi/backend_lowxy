import mongoose, { Schema, Document, Types } from "mongoose";
import IPartenaire from "../Interface/InterfacePartenair";


const partenaireSchema = new Schema<IPartenaire>({
    inforamtion: {
        inforegester: {
            nom_entreprise: {
                type: String,
                required: true
            },
            Proprietaire: {
                type: String,
                required: true
            },
            email: {
                type: String,
                required: true,
                unique: true
            },
            telephone: {
                type: String,
                required: true
            },
            motdepasse: {
                type: String,
                required: true
            }
        },
        info_societe: {
            numero_serie: {
                type: String,
            },
            domaines: [String],
            adresse: {
                pays: { type: String },
                ville: { type: String },
                rue: { type: String }
            }
        }
    },
    tours: [{
        nom: String,
        description: String,
        ville: String,
        duree: Number,
        itineraire: {
            depart: String,
            arrivee: String,
            plan: String
        }, 
        images: [String],
        jours: [{
            date: Date,
            depart: String,
            capacite: {
                adultes: Number,
                enfants: Number
            },
            prix: Number,
            
            supplements: [String]
        }],
        reservations: [{
            client_id: { type: Schema.Types.ObjectId, ref: 'Client' },
            date: Date,
            participants: {
                adultes: Number,
                enfants: Number
            },
            prix_total: Number
        }]
    }],
    covering_ads: [{
        image: { type: String },
        modele_voiture: {type:String},
        type_covering: {type:String},
        nombre_taxi: {type:Number},
        nombre_jour:{type:Number},
        prix: {type:Number}
    }],
    pub_quiz: [{
        
        bannieres: [String],
        videos: [String],
        call_to_action: [String],
        keywords: [Array],
        periode: {
            debut: Date,
            fin: Date
        },
        Budget_totale:{type: Number},
        statu: {type: String,required: true,default:'pending'},
        impressions: {type: Number},
        clicks: {type: Number},
    }],
    securites: {
        code: { type: String, required: false },
        date: { type: Date, required: false },
        isverified: { type: Boolean, default: false }
    },
    resetPasswordToken: String,
    resetPasswordTokenExpire: Date
}, {
    timestamps: true
});

// Index
partenaireSchema.index({ 'inforamtion.inforegester.email': 1 }, { unique: true });

// TTL Index
partenaireSchema.index( { "resetPasswordTokenExpire": 1 }, { expireAfterSeconds: 3600 } );

// TTL Index
partenaireSchema.index(
    { "securites.date": 1 },
    { 
        expireAfterSeconds: 900,
        partialFilterExpression: { "securites.isverified": false }
    }
);

const Partenaire = mongoose.model<IPartenaire>('partenaire', partenaireSchema);

export const Partenaires = Partenaire;