// Imports for getting server-side session

import { SidebarLayout } from "hasyx/components/sidebar/layout";
import sidebar from "@/app/sidebar";
import pckg from "@/package.json";
import App from "./app";

// Now this is an async server component
export default function Page() {
  return (
    // <SidebarLayout sidebarData={sidebar} breadcrumb={[{ title: pckg.name, link: '/' }]}>
      <App />
    // </SidebarLayout>
  );
}
