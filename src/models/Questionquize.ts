import mongoose, { Schema} from 'mongoose';



const QuestionBankSchema = new Schema({
    question: {
        type: String,
        required: [true ],
        
    },
    ville_concernee: {
        type: String,
        required: [true],
    },
    villes_proches: [{
        type: String,
    }],
    reponse_correcte: {
        type: String,
        required: [true],
    },
    options: [{
        type: String,
        required: [true],
    }]
}, {
    timestamps: true
});

QuestionBankSchema.index({ ville_concernee: 1 });
QuestionBankSchema.index({ villes_proches: 1 });


const QuestionBank = mongoose.model('QuestionBank', QuestionBankSchema);
export const QuestionBanks=QuestionBank