import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { importProvidersFrom } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from './app/services/api.service';

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(HttpClientModule, FormsModule, CommonModule),
    ApiService
  ]
}).catch(err => console.error(err));