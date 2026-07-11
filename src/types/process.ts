export interface ProcessStep {
  id: string;
  title: string;
  description: string;
  details?: string;
  icon?: string;
  order: number;
}

export type ProcessStepInput = Omit<ProcessStep, "id">;

export interface ProcessSettings {
  sectionLabel: string;
  sectionTitle: string;
  backgroundImageUrl: string;
  backgroundOpacity: number; // من 0 لحد 100
}

export const DEFAULT_PROCESS_SETTINGS: ProcessSettings = {
  sectionLabel: "رحلتك معانا",
  sectionTitle: "من الفكرة للتسليم",
  backgroundImageUrl: "",
  backgroundOpacity: 15,
};