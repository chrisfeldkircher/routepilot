import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { GUIDED_TOUR_CONFIG } from '@routepilot/angular';
import { routes } from './app.routes';
import { onboardingTour } from './tours/onboarding.tour';
import { faqTour } from './tours/faq.tour';
import { errorRecoveryTour } from './tours/error-recovery.tour';
import { interactiveDocsTour } from './tours/interactive-docs.tour';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    {
      provide: GUIDED_TOUR_CONFIG,
      useValue: {
        tours: [onboardingTour, faqTour, errorRecoveryTour, interactiveDocsTour],
        debug: true,
      },
    },
  ],
};
