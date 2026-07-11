export interface ConsultationSettings {
  sectionTitle: string;
  sectionSubtitle: string;
  beforeImage: string;
  beforeImageKey: string;
  afterImage: string;
  afterImageKey: string;
  beforeLabel: string;
  afterLabel: string;
  labelFontSize: number; // px
  backgroundOpacity: number; // من 0 لـ 100
  availableDays: string[];
  availableTimeSlots: string[];
}

export const defaultConsultationSettings: ConsultationSettings = {
  sectionTitle: "احجز استشارة مجانية",
  sectionSubtitle: "بنرد عليك خلال ساعتين في أيام العمل",
  beforeImage: "",
  beforeImageKey: "",
  afterImage: "",
  afterImageKey: "",
  beforeLabel: "",
  afterLabel: "",
  labelFontSize: 14,
  backgroundOpacity: 80,
  availableDays: ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"],
  availableTimeSlots: ["9 ص - 11 ص", "11 ص - 1 م", "1 م - 3 م", "3 م - 5 م", "5 م - 7 م", "7 م - 9 م"],
};