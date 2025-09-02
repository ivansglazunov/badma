'use client';

import { Accounts } from 'hasyx/components/hasyx/users/accounts';
import { Avatar, AvatarFallback, AvatarImage } from 'hasyx/components/ui/avatar';
import { Button } from 'hasyx/components/ui/button';
import { Card } from 'hasyx/components/ui/card';
import { Dialog, DialogContent } from 'hasyx/components/ui/dialog';
import { Label } from 'hasyx/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'hasyx/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'hasyx/components/ui/select';
import { LogOut, Monitor, Languages } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useTranslations } from 'hasyx';
import { useLocaleStore } from 'hasyx/components/locale-switcher';

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
  const t = useTranslations();
  const { locale, setLocale } = useLocaleStore();
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
                <TabsTrigger value="account">{t('badma.app.account')}</TabsTrigger>
                <TabsTrigger value="accounts">{t('badma.app.accounts')}</TabsTrigger>
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
                    <Label className="block text-sm font-medium mb-3">
                      {t('badma.app.theme')}
                    </Label>
                    <div className="flex items-center justify-center space-x-4">
                      {/* Системная тема */}
                      <button
                        onClick={() => setTheme('system')}
                        className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${
                          theme === 'system' 
                            ? 'border-purple-500 bg-transparent' 
                            : 'border-border hover:border-purple-300'
                        }`}
                      >
                        <Monitor className="w-5 h-5 text-foreground" />
                      </button>

                      {/* Светлая тема */}
                      <button
                        onClick={() => setTheme('light')}
                        className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${
                          theme === 'light' 
                            ? 'border-purple-500 bg-white' 
                            : 'border-border bg-white hover:border-purple-300'
                        }`}
                      />

                      {/* Темная тема */}
                      <button
                        onClick={() => setTheme('dark')}
                        className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${
                          theme === 'dark' 
                            ? 'border-purple-500 bg-black' 
                            : 'border-border bg-black hover:border-purple-300'
                        }`}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="block text-sm font-medium mb-3">
                      {t('badma.app.language')}
                    </Label>
                    <Select value={locale} onValueChange={setLocale}>
                      <SelectTrigger className="w-full">
                        <div className="flex items-center gap-2">
                          <Languages className="w-4 h-4" />
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ru">Русский</SelectItem>
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
                    <LogOut className="mr-2 h-4 w-4" /> {t('badma.app.signOut')}
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
