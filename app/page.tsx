import { Sidebar } from "hasyx/components/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "hasyx/components/ui/breadcrumb"
import { Separator } from "hasyx/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "hasyx/components/ui/sidebar"

import pckg from "hasyx/package.json"

import { AuthActionsCard } from "hasyx/components/auth/auth-actions-card"
import { CredentialsSignInCard } from "hasyx/components/auth/credentials-signin-card"
import { SessionCard } from "hasyx/components/auth/session-card"
import { HasuraCard } from "hasyx/components/hasura/card"
import { ProxyCard } from "hasyx/components/proxy/card"
import { UsersCard } from "hasyx/components/users/users-card"

// Imports for getting server-side session
import authOptions from "@/app/options"

import sidebar from "@/app/sidebar"
import useSsr, { SsrResult } from "hasyx/lib/ssr"

import App from "./app"

// Now this is an async server component
export default async function Page() {
  // Get session on the server
  const { session } = await useSsr(authOptions) as SsrResult;
  // const session = null;
  return (
    <SidebarProvider>
      <Sidebar activeUrl={'/'} data={sidebar} />
      <SidebarInset>
        <App />
      </SidebarInset>
    </SidebarProvider>
  )
}
