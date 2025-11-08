import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Interfaces pour les réponses du guide
export interface GuideResponse {
  sessionId: string;
  date: Date;
  ville: string;
  position: {
    latitude: number;
    longitude: number;
  };
  response: {
    text: string;
    pois: PointOfInterest[];
  };
  timestamp: Date;
}

export interface PointOfInterest {
  _id: string;           // ID du POI
  name: string;          // Nom du POI
  type: string;          // Type du POI
  description: string;   // Description
  address: string;       // Adresse
  rating: number;        // Note
  photos: string[];      // URLs des photos
  location: {
    latitude: number;
    longitude: number;
  };
  opening_hours?: {      // Horaires d'ouverture (optionnel)
    open_now: boolean;
    periods?: Array<{
      open: { day: number; time: string };
      close: { day: number; time: string };
    }>;
    weekday_text?: string[];
  };
  contact?: {            // Informations de contact (optionnel)
    phone?: string;
    website?: string;
  };
  price_level?: number;  // Niveau de prix (optionnel)
  reviews?: Array<{      // Avis (optionnel)
    author: string;
    rating: number;
    text: string;
    time: Date;
  }>;
}

export interface GuideResponsesResponse {
  success: boolean;
  responses: GuideResponse[];
}

@Injectable({
  providedIn: 'root'
})
export class GuideIaService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getGuideResponses(sessionId?: string): Observable<GuideResponsesResponse> {
    let url = `${this.apiUrl}/guide/responses`;
    if (sessionId) {
      url += `?sessionId=${sessionId}`;
    }
    return this.http.get<GuideResponsesResponse>(url);
  }
} 