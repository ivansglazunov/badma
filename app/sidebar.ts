import { SidebarData } from "hasyx/components/sidebar";
import pckg from "../package.json";

export const sidebar: SidebarData = {
  name: pckg.name,
  version: pckg.version,
  logo: 'logo.svg',
  navMain: [
    {
      title: "Hasyx",
      url: "#",
      items: [
        {
          title: "Diagnostics",
          url: "/hasyx",
        },
      ],
    },
    {
      title: "Badma",
      url: "#",
      items: [
        {
          title: "Application",
          url: "/",
        },
        {
          title: "Diagnostics",
          url: "/badma",
        },
        {
          title: "Games",
          url: "/badma/games",
        },
      ],
    },
  ],
};

export default sidebar;