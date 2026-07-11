import {
  MessageCircle,
  Ruler,
  Palette,
  Hammer,
  Truck,
  CheckCircle2,
  ClipboardList,
  Home,
  Wrench,
  Package,
  ThumbsUp,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export const PROCESS_ICONS: Record<string, LucideIcon> = {
  consultation: MessageCircle,
  measure: Ruler,
  design: Palette,
  execution: Hammer,
  delivery: Truck,
  check: CheckCircle2,
  plan: ClipboardList,
  home: Home,
  install: Wrench,
  package: Package,
  approve: ThumbsUp,
  finish: Sparkles,
};

export const PROCESS_ICON_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "بدون أيقونة (رقم الخطوة)" },
  { value: "consultation", label: "💬 استشارة" },
  { value: "measure", label: "📏 معاينة / قياس" },
  { value: "design", label: "🎨 تصميم" },
  { value: "execution", label: "🔨 تنفيذ" },
  { value: "delivery", label: "🚚 توصيل" },
  { value: "check", label: "✅ فحص" },
  { value: "plan", label: "📋 تخطيط" },
  { value: "home", label: "🏠 منزل" },
  { value: "install", label: "🔧 تركيب" },
  { value: "package", label: "📦 تغليف" },
  { value: "approve", label: "👍 موافقة" },
  { value: "finish", label: "✨ تسليم نهائي" },
];

