import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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
    pois: Array<{
      name: string;
      type: string;
      description: string;
      location: {
        latitude: number;
        longitude: number;
      };
    }>;
  };
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class GuideService {
  private apiUrl = `${environment.apiUrl}/guide`;

  constructor(private http: HttpClient) {}

  // Démarrer une nouvelle session
  startSession(mode: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/session/demarrer`, { mode });
  }

  // Terminer une session
  endSession(sessionId: string, duree: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/session/terminer`, { sessionId, duree });
  }

  // Obtenir le guide en direct
  getLiveGuide(data: {
    currentLocation: { latitude: number; longitude: number };
    speed?: number;
    interests?: string[];
    narrationStyle?: string;
    voiceType?: string;
    sessionId: string;
    ville: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/guide/live`, data);
  }

  // Obtenir le guide pour un trajet
  getRouteGuide(data: {
    adresseDepart: string;
    adresseArrivee: string;
    interests?: string[];
    narrationStyle?: string;
    voiceType?: string;
    sessionId: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/guide/trajet`, data);
  }

  // Mettre à jour les préférences
  updatePreferences(preferences: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/preferences`, { preferences });
  }

  // Obtenir l'historique des réponses
  getGuideResponses(sessionId?: string): Observable<{ success: boolean; responses: GuideResponse[] }> {
    const params = sessionId ? { sessionId } : {};
    return this.http.get<{ success: boolean; responses: GuideResponse[] }>(`${this.apiUrl}/responses`, { params });
  }
} 