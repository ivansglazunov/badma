import React from 'react'; // Import React

import sidebar from "@/app/sidebar"; // Make sure the path is correct
import { Sidebar } from "hasyx/components/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "hasyx/components/ui/breadcrumb";
import { Separator } from "hasyx/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "hasyx/components/ui/sidebar";
import pckg from "hasyx/package.json";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "hasyx/components/ui/card";
import { Badge } from "hasyx/components/ui/badge";

// This page needs to be a client component for A-Frame
export default function BadmaDiagnosticPage() {
  return (
    <SidebarProvider>
      {/* Make sure that activeUrl is correct */}
      <Sidebar data={sidebar} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/">
                  {pckg.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Badma Diagnostics</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex-1 p-8 overflow-auto">
          <h1 className="text-3xl font-bold mb-6">Badma Diagnostic Interface</h1>
          <p className="text-lg mb-4">
            Welcome to the Badma diagnostic interface. This page provides system diagnostics 
            and monitoring tools for the Badma chess gaming platform.
          </p>
          
          <Card className="my-4">
            <CardHeader className="pb-2">
              <CardTitle>System Status</CardTitle>
              <CardDescription>Current operational status of all systems</CardDescription>
            </CardHeader>
            <CardContent>
              <p><Badge variant="outline" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100">All systems operational</Badge></p>
            </CardContent>
          </Card>
          
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Game Engine</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="outline" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100">Active</Badge>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Database Connection</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="outline" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100">Connected</Badge>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Event System</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="outline" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100">Operational</Badge>
              </CardContent>
            </Card>
          </div>
          
          <p className="mt-8 text-sm text-muted-foreground">
            Use the navigation menu to access specific diagnostic tools and game management features.
          </p>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

