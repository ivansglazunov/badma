import React from 'react';

import sidebar from "@/app/sidebar";
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "hasyx/components/ui/card";
import { Badge } from "hasyx/components/ui/badge";
import GamesClient from './client';

export default function GamesPage() {
  return (
    <SidebarProvider>
      <Sidebar activeUrl={'/badma/games'} data={sidebar} />
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
                <BreadcrumbLink href="/badma">
                  Badma
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Games</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex-1 p-8 overflow-auto">
          <GamesClient />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 