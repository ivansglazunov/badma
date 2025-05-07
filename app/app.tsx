"use client";

import { LogOut, LoaderCircle, Crown, Joystick, X } from "lucide-react";
import { signOut } from "next-auth/react";

import { useClient, useSession } from "hasyx";
import { Avatar, AvatarFallback, AvatarImage } from "hasyx/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "hasyx/components/ui/tabs";

import Board from "@/lib/board";
import { OAuthButtons } from "hasyx/components/auth/oauth-buttons";
import { useTheme } from "hasyx/components/theme-switcher";
import { Button } from "hasyx/components/ui/button";
import { Card } from "hasyx/components/ui/card";
import { useState } from "react";
import { Input } from "hasyx/components/ui/input";

import { cn } from "hasyx/lib/utils"
import { useMounted } from "@/hooks/mounted";

export function GameCard({ disabled = false }: { disabled?: boolean }) {
  return <Card className={`w-[min(15vw,15vh)] h-[min(30vw,30vh)] transform ${disabled ? "" : "hover:-translate-y-20 hover:scale-120"} transition-all duration-300 shadow-xl/30`}>
  </Card>;
}

export function GameCards({ disabled = false, className }: { disabled?: boolean, className?: string }) {
  return (
    <div className={cn("absolute w-full flex items-center justify-center", className)}>
      <div className="transform -rotate-35 translate-y-0"><GameCard disabled={disabled} /></div>
      <div className="transform -rotate-20 translate-y-0"><GameCard disabled={disabled} /></div>
      <div className="transform rotate-0 translate-y-0"><GameCard disabled={disabled} /></div>
      <div className="transform rotate-20 translate-y-0"><GameCard disabled={disabled} /></div>
      <div className="transform rotate-35 translate-y-0"><GameCard disabled={disabled} /></div>
    </div>
  );
}

export function GameClassic() {
  const { theme, setTheme } = useTheme();
  return (
    <>
      <div className="aspect-square w-full h-full max-w-[min(70vw,70vh)] max-h-[min(70vw,70vh)]">
        <Board position="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
          bgBlack={theme === "dark" ? '#3b0764' : '#c084fc'}
          bgWhite={theme === "dark" ? '#581c87' : '#faf5ff'}
        />
      </div>
    </>
  );
}

export function GameFree() {
  const session = useSession();
  const mounted = useMounted();
  const { theme, setTheme } = useTheme();
  return (
    <>
      <div className="w-full flex flex-row relative z-2">
        <div className="flex-grow"></div>
        <div className={`bg-transparent border-none p-3`}>
          <Avatar className={`relative transition-all duration-300 size-25 transform`}>
            {!!session?.data?.user?.image && <AvatarImage src={session?.data?.user?.image} />}
            <AvatarFallback>{session?.data?.user?.name || '?'}</AvatarFallback>
            {session?.status === "loading" && <LoaderCircle className="animate-spin absolute top-0 left-0 w-full h-full"/>}
          </Avatar>
        </div>
        <div className="flex-grow"></div>
      </div>
      <div className="aspect-square w-full h-full max-w-[min(70vw,70vh)] max-h-[min(70vw,70vh)]">
        <Board position="qqqqkqqq/pppppppp/pppppppp/8/8/PPPPPPPP/PPPPPPPP/QQQQKQQQ w - - 0 1"
          bgBlack={theme === "dark" ? '#3b0764' : '#c084fc'}
          bgWhite={theme === "dark" ? '#581c87' : '#faf5ff'}
        />
      </div>
      <GameCards className={`top-0 left-0 -rotate-180 transition-all duration-300 ${mounted ? "-translate-y-35" : "-translate-y-300"}`} disabled/>
      <GameCards className={`bottom-0 left-0 transition-all duration-300 ${mounted ? "translate-y-40" : "translate-y-300"}`}/>
    </>
  );
}

export default function App() {
  const hasyx = useClient();
  const { theme, setTheme } = useTheme();
  const session = useSession();
  const [tab, setTab] = useState("classic");
  const [profile, setProfile] = useState(false);
  
  const isAuthenticated = session?.status === "authenticated";

  return (<>
    <Tabs
      className="flex flex-1 flex-col bg-background relative"
      value={isAuthenticated ? tab : "classic"}
      onValueChange={setTab}
    >
      <div className="absolute top-3 right-3">
        <Button variant="outline" size="icon" className="rounded-full">
          <X/>
        </Button>
      </div>
      <div className="flex-grow">
        <TabsContent value="classic" className="flex items-center justify-center h-full">
          <GameClassic />
        </TabsContent>
        <TabsContent value="free" className="flex flex-col items-center justify-center h-full relative">
          <GameFree />
        </TabsContent>
      </div>

      <div className={`absolute top-0 left-0 w-full h-full transition-all duration-300 p-10 pb-25 flex items-center justify-center ${profile
        ? `opacity-100 top-0`
        : `opacity-0 top-full pointer-events-none`
      }`}>
        <Card className={`max-w-md h-full p-3 flex-1 shadow-xl/30`}>
          <Tabs defaultValue="account" className="w-full h-full flex flex-col">
            <TabsList className="w-full">
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="payment">Payment</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>
            <div className="flex-1">
              <TabsContent value="account" className="h-full flex flex-col">
                <div className="flex-grow">
                  <Input value={theme} onChange={(e) => setTheme(e.target.value)} />
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

      <div className={`p-2 relative ${isAuthenticated ? "top-0" : "top-100vh"} transition-all duration-300`}>
        <TabsList className="w-full h-15 bg-black bg-purple-900">
          <TabsTrigger value="classic"><Crown/> Classic</TabsTrigger>
          <div className={`bg-transparent border-none data-[state=active]:bg-transparent p-1 relative ${isAuthenticated ? "bottom-0" : "bottom-100vh"} transition-all duration-300`} onClick={() => setProfile(!profile)}>
            <Avatar className={`relative transition-all duration-300 size-25 transform ${profile ? "scale-120 bottom-4" : "scale-100 bottom-2"
              }`}>
              {!!session?.data?.user?.image && <AvatarImage src={session?.data?.user?.image} />}
              <AvatarFallback>{session?.data?.user?.name || '?'}</AvatarFallback>
              {session?.status === "loading" && <LoaderCircle className="animate-spin absolute top-0 left-0 w-full h-full"/>}
            </Avatar>
          </div>
          <TabsTrigger value="free"><Joystick/>Free</TabsTrigger>
        </TabsList>
      </div>
    </Tabs>
  </>);
}