export interface IPointInteret {
    nom_lieu: string;
    categorie: 'all' | 'restaurants' | 'hotels' | 'concerts' | 'spectacles'
    description: string;
    url_image: string;
    texte_alternatif: string;
    rating: 1 | 2 | 3 | 4 | 5;
    ville: string;
    pays: string;
    adresse?: string; // optionnel
}