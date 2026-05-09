import React from 'react';
import { 
  User, 
  Shield, 
  Bell, 
  CreditCard, 
  Smartphone, 
  HelpCircle,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { ProfileSettingsDialog } from '@/components/account/ProfileSettingsDialog';
import { BillingDialog } from '@/components/account/BillingDialog';
import { SecurityDialog } from '@/components/account/SecurityDialog';

export const SettingsPage: React.FC = () => {
  const { profile } = useAuth();
  const [activeModal, setActiveModal] = React.useState<'profile' | 'billing' | 'security' | null>(null);

  const sections = [
    {
      title: 'Account Settings',
      items: [
        { icon: User, label: 'Personal Information', desc: 'Update your name, email, and photo.', id: 'profile' },
        { icon: Shield, label: 'Security', desc: 'Manage your password and 2FA.', id: 'security' },
        { icon: CreditCard, label: 'Billing & Plans', desc: 'Manage your subscription and payments.', id: 'billing' },
      ]
    },
    {
      title: 'Preferences',
      items: [
        { icon: Bell, label: 'Notifications', desc: 'Choose what alerts you want to receive.', id: 'notifications' },
        { icon: Smartphone, label: 'App Settings', desc: 'Language, theme, and region settings.', id: 'app' },
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help Center', desc: 'FAQs and customer support.', id: 'help' },
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-4xl font-display font-bold text-slate-900 dark:text-white tracking-tight">Settings</h1>
        <p className="text-slate-500 dark:text-gray-400 mt-1.5 font-medium">Manage your account and app preferences.</p>
      </div>

      {/* Profile Card */}
      <Card className="glass-card border-none overflow-hidden">
        <div className="h-32 premium-gradient" />
        <CardContent className="relative pt-0 pb-8 px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-12">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
              <Avatar className="w-24 h-24 border-4 border-white dark:border-white/10 shadow-xl">
                <AvatarImage src={profile?.photoURL} />
                <AvatarFallback className="bg-brand-100 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 text-2xl font-bold">
                  {profile?.displayName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">{profile?.displayName}</h2>
                <p className="text-slate-500 dark:text-gray-400">{profile?.email}</p>
              </div>
            </div>
            <Button onClick={() => setActiveModal('profile')} className="rounded-xl bg-brand-600 hover:bg-brand-700 dark:bg-brand-700 dark:hover:bg-brand-600">Edit Profile</Button>
          </div>
        </CardContent>
      </Card>

      {/* Settings Sections */}
      <div className="space-y-6">
        {sections.map((section, i) => (
          <div key={i} className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest px-2">{section.title}</h3>
            <div className="grid grid-cols-1 gap-4">
              {section.items.map((item, j) => (
                <Card 
                  key={j} 
                  className="glass-card border-none hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                  onClick={() => {
                    if (item.id === 'profile') setActiveModal('profile');
                    if (item.id === 'security') setActiveModal('security');
                    if (item.id === 'billing') setActiveModal('billing');
                  }}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-white dark:group-hover:bg-white/10 transition-colors">
                        <item.icon className="w-5 h-5 text-slate-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{item.label}</p>
                        <p className="text-xs text-slate-500 dark:text-gray-400">{item.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 dark:text-white/20 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-8 border-t border-slate-200 dark:border-white/5">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 rounded-xl py-6"
          onClick={() => signOut(auth)}
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span className="font-bold">Sign Out from all devices</span>
        </Button>
      </div>

      <ProfileSettingsDialog open={activeModal === 'profile'} onOpenChange={(open) => !open && setActiveModal(null)} />
      <BillingDialog open={activeModal === 'billing'} onOpenChange={(open) => !open && setActiveModal(null)} />
      <SecurityDialog open={activeModal === 'security'} onOpenChange={(open) => !open && setActiveModal(null)} />
    </div>
  );
};
