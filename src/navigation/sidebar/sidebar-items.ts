import { FileText, LayoutDashboard, type LucideIcon, SlidersHorizontal, Store } from "lucide-react";

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "SPK",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Pengaturan Bobot",
        url: "/dashboard/pengaturan-bobot",
        icon: SlidersHorizontal,
      },
      {
        title: "Data Toko",
        url: "/dashboard/data-toko",
        icon: Store,
      },
      {
        title: "Input Kinerja",
        url: "/dashboard/input-kinerja",
        icon: FileText,
      },
    ],
  },
];
