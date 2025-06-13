import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { GuideHistoryComponent } from './components/guide-history/guide-history.component';

const routes: Routes = [
  { path: 'guide/history', component: GuideHistoryComponent },
  // ... autres routes
];

@NgModule({
  declarations: [
    AppComponent,
    GuideHistoryComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    RouterModule.forRoot(routes)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { } 