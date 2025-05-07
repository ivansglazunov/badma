import { SidebarData } from "hasyx/components/sidebar";
import pckg from "hasyx/package.json";

export const sidebar: SidebarData = {
  versions: [pckg.version],
  logo: 'logo.svg',
  navMain: [
    {
      title: "Core",
      url: "#",
      items: [
        {
          title: "Diagnostics",
          url: "/",
        },
      ],
    },
    {
      title: "Badma",
      url: "#",
      items: [
        {
          title: "Diagnostic",
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