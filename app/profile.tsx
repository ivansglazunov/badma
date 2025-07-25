'use client';

import { Accounts } from 'hasyx/components/accounts';
import { Avatar, AvatarFallback, AvatarImage } from 'hasyx/components/ui/avatar';
import { Button } from 'hasyx/components/ui/button';
import { Card } from 'hasyx/components/ui/card';
import { Dialog, DialogContent } from 'hasyx/components/ui/dialog';
import { Label } from 'hasyx/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'hasyx/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'hasyx/components/ui/tabs';
import { LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

interface ProfileProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  theme?: string;
  setTheme: (theme: string) => void;
  isLoadingSession: boolean;
  selectedBoardStyle: string;
  saveBoardStyleSetting: (value: string) => void;
  isSavingBoardStyle: boolean;
}

export function Profile({
  isOpen,
  onClose,
  user,
  theme,
  setTheme,
  isLoadingSession,
  selectedBoardStyle,
  saveBoardStyleSetting,
  isSavingBoardStyle
}: ProfileProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-w-[90vw] w-full max-h-[90vh] p-0 gap-0">
        {/* Avatar над карточкой */}
        <div className="flex justify-center -mt-20 relative z-10">
          <Avatar className="border-4 border-background shadow-lg size-20 relative top-2 border-purple-500">
            <AvatarImage src={user?.image || ''} alt={user?.name || 'User'} className="z-1"/>
            <AvatarFallback className="text-lg font-semibold">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>

        <Card className="border-0 shadow-none">
          {/* <div className="h-1 w-full bg-purple-500"/> */}
          <Tabs defaultValue="account" className="w-full h-full flex flex-col">
            <div className="px-6 pb-2">
              <TabsList className="w-full">
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="accounts">Accounts</TabsTrigger>
              </TabsList>
            </div>
            
            <div className="flex-1 overflow-y-auto px-6 pb-2">
              <TabsContent value="account" className="h-full flex flex-col space-y-4 mt-0">
                <div className="flex-grow space-y-4">
                  <div className="text-center space-y-1">
                    <p className="font-medium">{user?.name || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">{user?.email || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="themeSelect" className="block text-sm font-medium mb-2">
                      Тема
                    </Label>
                    <Select value={theme} onValueChange={setTheme}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите тему" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">Системная</SelectItem>
                        <SelectItem value="light">Светлая</SelectItem>
                        <SelectItem value="dark">Темная</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => signOut({ callbackUrl: '/' })} 
                    disabled={isLoadingSession}
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Sign Out
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="accounts" className="mt-0 h-full">
                <div className="h-full overflow-y-auto">
                  <Accounts />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
