export interface ServiceType {
  id: string;
  name: string;
  icon: string; // اسم أيقونة من مكتبة Tabler بدون بادئة، مثال: "armchair-2"
  order: number;
}

export type ServiceTypeInput = Omit<ServiceType, "id">;