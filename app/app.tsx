"use client";

import { signIn, signOut } from "next-auth/react";
import { Github, LogIn, LogOut, MailCheck, MailWarning, Loader2 } from "lucide-react";

import { useClient, useSession, SessionData } from "hasyx";
import { Avatar, AvatarFallback, AvatarImage } from "hasyx/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "hasyx/components/ui/tabs";

import { Card, CardContent } from "hasyx/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "hasyx/components/ui/carousel"
import { useState } from "react";
import { Button } from "hasyx/components/ui/button";
import { OAuthButtons } from "hasyx/components/auth/oauth-buttons";
export default function App() {
  const hasyx = useClient();
  const session = useSession();
  const [tab, setTab] = useState("user");
  
  const isAuthenticated = session?.status === "authenticated";

  return <Tabs
    defaultValue="user" className="flex flex-1 flex-col bg-purple-950 relative"
    value={isAuthenticated ? tab : "auth"}
    onValueChange={setTab}
  >
    <div className={`absolute top-0 left-0 w-full h-full transition-all duration-300 p-10 pb-25 flex items-center justify-center ${tab === "user"
      ? `opacity-100 top-0`
      : `opacity-0 top-full pointer-events-none`
    }`}>
      <Card className={`max-w-md h-full p-3 flex-1`}>
        <Tabs defaultValue="account" className="w-full h-full flex flex-col">
          <TabsList className="w-full">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          <div className="flex-1">
            <TabsContent value="account" className="h-full flex flex-col">
              <div className="flex-grow">
              </div>
              <div>
                {isAuthenticated ? <Button variant="outline"
                  className="w-full"
                  onClick={() => signOut({ callbackUrl: '/' })} disabled={session.status === "loading"}
                  >
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </Button>
                : <OAuthButtons />}
              </div>
            </TabsContent>
            <TabsContent value="payment">Payment Settings</TabsContent>
            <TabsContent value="notifications">Notifications Settings</TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>

    <div className="flex-grow">
      <TabsContent value="classic">Classic chess</TabsContent>
      <TabsContent value="free">Free chess mode</TabsContent>
    </div>

    <div className={`p-2 relative ${isAuthenticated ? "top-0" : "top-full"}`}>
      <TabsList className="w-full h-15 bg-black bg-purple-900">
        <TabsTrigger value="classic">Classic</TabsTrigger>
        <div className="bg-transparent border-none data-[state=active]:bg-transparent p-1" onClick={() => setTab(tab === "user" ? "classic" : "user")}>
          <Avatar className={`relative transition-all duration-300 ${tab === "user" ? "size-25 bottom-8" : "size-20 bottom-3"
            }`}>
            {!!session?.data?.user?.image && <AvatarImage src={session?.data?.user?.image} />}
            <AvatarFallback>{session?.data?.user?.name || '?'}</AvatarFallback>
          </Avatar>
        </div>
        <TabsTrigger value="free">Free</TabsTrigger>
      </TabsList>
    </div>
  </Tabs>
}