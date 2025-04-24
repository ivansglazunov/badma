import pckg from "hasyx/package.json"
import { SidebarData } from "hasyx/components/app-sidebar"

export const sidebar: SidebarData = {
  versions: [pckg.version],
  navMain: [
    {
      title: "Core",
      url: "#",
      items: [
        {
          title: "Badma",
          url: "/",
        },
        {
          title: "Diagnostics",
          url: "/diagnostics",
        },
      ],
    },
  ],
};

export default sidebar;
