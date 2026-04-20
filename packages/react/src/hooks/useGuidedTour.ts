import { useGuidedTourContext } from '../components/GuidedTourContext';

export const useGuidedTour = () => useGuidedTourContext();

export const useGuidedTourState = () => useGuidedTourContext().state;

export const useGuidedTourActions = () => useGuidedTourContext().actions;

export const useGuidedTourServices = () => useGuidedTourContext().services;
