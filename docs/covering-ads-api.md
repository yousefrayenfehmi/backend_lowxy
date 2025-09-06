# API Documentation - Covering Ads pour Utilisateurs

## Endpoint: GET /my-coverings

Cet endpoint permet à un utilisateur connecté de récupérer toutes ses campagnes publicitaires de covering avec des informations détaillées et des statistiques.

### Authentication
- **Requis**: Token JWT valide
- **Header**: `Authorization: Bearer <token>`

### URL
```
GET /covering-ads/my-coverings
```

### Réponse Exemple
```json
{
  "success": true,
  "data": {
    "campaigns": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "creator": {
          "type": "partenaire",
          "id": "507f1f77bcf86cd799439012"
        },
        "details": {
          "modele_voiture": "Toyota Prius",
          "type_covering": "covering_complet",
          "image": "https://s3.amazonaws.com/bucket/covering-image.jpg",
          "nombre_taxi": 5,
          "nombre_jour": 30,
          "prix": 1500
        },
        "status": "Active",
        "assigned_taxis": ["507f1f77bcf86cd799439013", "507f1f77bcf86cd799439014"],
        "progressPercent": 40,
        "isComplete": false,
        "remainingTaxis": 3,
        "statusText": "Active",
        "createdAgo": "il y a 2 jours",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-17T14:20:00.000Z"
      }
    ],
    "userInfo": {
      "nom": "Entreprise ABC",
      "email": "contact@abc.com",
      "telephone": "+33123456789"
    },
    "userType": "partenaire",
    "statistics": {
      "total": 3,
      "active": 1,
      "completed": 1,
      "pending": 1,
      "totalInvestment": 4500,
      "totalTaxisAssigned": 8
    }
  },
  "message": "3 campagne(s) trouvée(s)"
}
```

### Propriétés de Réponse

#### Campaigns
Chaque campagne contient les propriétés suivantes:
- `progressPercent`: Pourcentage de taxis assignés par rapport au nombre requis
- `isComplete`: Booléen indiquant si le nombre requis de taxis est atteint
- `remainingTaxis`: Nombre de taxis encore nécessaires
- `statusText`: Statut en français ("Active", "Terminée", "En attente")
- `createdAgo`: Temps écoulé depuis la création ("il y a X jours")

#### Statistics
- `total`: Nombre total de campagnes
- `active`: Nombre de campagnes actives
- `completed`: Nombre de campagnes terminées
- `pending`: Nombre de campagnes en attente
- `totalInvestment`: Montant total investi
- `totalTaxisAssigned`: Nombre total de taxis assignés

### Statuts de Campagne
- **Pending**: En attente d'activation par l'administrateur
- **Active**: Campagne active et visible aux chauffeurs
- **Completed**: Campagne terminée (nombre de taxis requis atteint)

### Codes d'Erreur
- `401`: Token d'authentification manquant ou invalide
- `500`: Erreur interne du serveur
- `404`: Utilisateur non trouvé

### Exemple d'Utilisation (Frontend)
```javascript
// Récupérer les covering ads de l'utilisateur connecté
const fetchMyCoverings = async () => {
  try {
    const response = await fetch('/api/covering-ads/my-coverings', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Mes campagnes:', data.data.campaigns);
      console.log('Statistiques:', data.data.statistics);
      console.log('Info utilisateur:', data.data.userInfo);
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
};
```

### Interface Frontend Suggérée
L'endpoint fournit toutes les données nécessaires pour créer une interface utilisateur complète avec:
1. **Dashboard avec statistiques** (cartes KPI)
2. **Liste des campagnes** avec filtres par statut
3. **Détails de progression** avec barres de progression
4. **Informations de profil utilisateur**
5. **Actions** (éditer, supprimer, voir détails)

