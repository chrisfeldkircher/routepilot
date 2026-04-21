import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { GUIDED_TOUR_CONFIG } from '@routepilot/angular';
import { TourIndex } from '@routepilot/assistant';
import { TOUR_ASSISTANT_CONFIG } from '@routepilot/assistant-angular';
import { routes } from './app.routes';
import { onboardingTour } from './tours/onboarding.tour';
import { faqTour } from './tours/faq.tour';
import { errorRecoveryTour } from './tours/error-recovery.tour';
import { interactiveDocsTour } from './tours/interactive-docs.tour';
import { assistantShowcaseTour } from './tours/assistant-showcase.tour';

const tours = [
  onboardingTour,
  faqTour,
  errorRecoveryTour,
  interactiveDocsTour,
  assistantShowcaseTour,
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    {
      provide: GUIDED_TOUR_CONFIG,
      useValue: {
        tours,
        debug: true,
      },
    },
    {
      provide: TOUR_ASSISTANT_CONFIG,
      useValue: {
        index: TourIndex.fromTours(tours),
        queryOptions: { scope: 'current-tour-only' },
      },
    },
  ],
};
