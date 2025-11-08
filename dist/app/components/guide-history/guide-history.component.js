"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuideHistoryComponent = void 0;
const core_1 = require("@angular/core");
let GuideHistoryComponent = (() => {
    let _classDecorators = [(0, core_1.Component)({
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
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var GuideHistoryComponent = _classThis = class {
        constructor(guideService, route) {
            this.guideService = guideService;
            this.route = route;
            this.responses = [];
            this.sessions = [];
            this.selectedSessionId = '';
        }
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
    };
    __setFunctionName(_classThis, "GuideHistoryComponent");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        GuideHistoryComponent = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return GuideHistoryComponent = _classThis;
})();
exports.GuideHistoryComponent = GuideHistoryComponent;
