
export interface TarifsPublicitaires {
    prixClic: number;
    prixImpression: number;
    tarifParJour: {
      partiel: number;
      semiIntegral: number;
      integral: number;
    };
  }