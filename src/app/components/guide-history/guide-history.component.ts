import { Component, OnInit } from '@angular/core';
import { GuideService, GuideResponse } from '../../services/guide.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-guide-history',
  template: `
    <div class="container mt-4">
      <h2>Historique des Réponses du Guide</h2>
      
      <!-- Filtre par session -->
      <div class="mb-4">
        <select class="form-select" [(ngModel)]="selectedSessionId" (change)="loadResponses()">
          <option value="">Toutes les sessions</option>
          <option *ngFor="let session of sessions" [value]="session._id">
            Session du {{ session.date_debut | date:'dd/MM/yyyy HH:mm' }}
          </option>
        </select>
      </div>

      <!-- Liste des réponses -->
      <div class="responses-list">
        <div *ngFor="let response of responses" class="card mb-3">
          <div class="card-header">
            <h5 class="mb-0">{{ response.ville }}</h5>
            <small class="text-muted">
              {{ response.timestamp | date:'dd/MM/yyyy HH:mm:ss' }}
            </small>
          </div>
          <div class="card-body">
            <!-- Position -->
            <div class="mb-3">
              <strong>Position :</strong>
              <p class="mb-0">
                Latitude: {{ response.position.latitude }},
                Longitude: {{ response.position.longitude }}
              </p>
            </div>

            <!-- Texte du guide -->
            <div class="mb-3">
              <strong>Guide :</strong>
              <p class="mb-0">{{ response.response.text }}</p>
            </div>

            <!-- Points d'intérêt -->
            <div *ngIf="response.response.pois.length > 0">
              <strong>Points d'intérêt :</strong>
              <div class="list-group mt-2">
                <div *ngFor="let poi of response.response.pois" class="list-group-item">
                  <h6 class="mb-1">{{ poi.name }}</h6>
                  <p class="mb-1">{{ poi.description }}</p>
                  <small class="text-muted">Type: {{ poi.type }}</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Message si aucune réponse -->
      <div *ngIf="responses.length === 0" class="alert alert-info">
        Aucune réponse trouvée pour cette session.
      </div>
    </div>
  `,
  styles: [`
    .responses-list {
      max-height: 800px;
      overflow-y: auto;
    }
    .card {
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .card-header {
      background-color: #f8f9fa;
    }
  `]
})
export class GuideHistoryComponent implements OnInit {
  responses: GuideResponse[] = [];
  sessions: any[] = [];
  selectedSessionId: string = '';

  constructor(
    private guideService: GuideService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Charger les réponses initiales
    this.loadResponses();

    // Écouter les changements de paramètres d'URL
    this.route.queryParams.subscribe(params => {
      if (params['sessionId']) {
        this.selectedSessionId = params['sessionId'];
        this.loadResponses();
      }
    });
  }

  loadResponses() {
    this.guideService.getGuideResponses(this.selectedSessionId).subscribe({
      next: (data) => {
        if (data.success) {
          this.responses = data.responses;
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des réponses:', error);
      }
    });
  }
} 