import cron from 'node-cron';
import { Touristes } from '../models/Touriste';
import { dbConnection } from '../BDconnection/BDconnection';
export class TouristeCron {
    private static task: cron.ScheduledTask;

    static initDeleteUnverifiedTouristes() {
        this.task = cron.schedule('*/1 * * * *', async () => {
            await dbConnection.getConnection().then(
                async () => {
                    console.log('Connecté à MongoDB');
                    await Touristes.find({ 
                        "securites.isverified": false, 
                        'securites.date': { 
                        $lt: new Date(Date.now() - 3 * 60 * 1000)
                    }
                }
                    ).then(async (touristes) => {
                    if (touristes.length === 0) {
                        console.log('Aucun touriste non vérifié trouveé');
                        return;
                    }
                    console.log('Suppression des touristes non vérifiés...');
                    await Touristes.deleteMany({ "securites.isverified": false }).then(() => {
                        console.log('Tous les touristes non vérifiés ont été supprimés');
                    }).catch((error) => {
                        console.error('Erreur lors de la suppression des touristes non vérifiés:', error);
                    })
                    }) 
                }
            ).catch((error) => {
                console.error('Erreur de connexion à MongoDB:', error);
            }).finally(async () => {
                await dbConnection.closeConnection();
            })
    }
)}
}
// Créer une instance singleton
export const touristeCronInstance = new TouristeCron();