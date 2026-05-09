import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { toast } from 'sonner';
import { Camera, Save, User, Mail, Globe } from 'lucide-react';

interface ProfileSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfileSettingsDialog: React.FC<ProfileSettingsDialogProps> = ({ open, onOpenChange }) => {
  const { profile, updateProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    photoURL: '',
    currency: 'INR',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        email: profile.email || '',
        photoURL: profile.photoURL || '',
        currency: profile.currency || 'INR',
      });
    }
  }, [profile, open]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile(formData);
      toast.success('Profile updated successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-[3rem] glass-card border-none p-10 shadow-3xl bg-white dark:bg-slate-900">
        <DialogHeader className="mb-8">
          <DialogTitle className="text-3xl font-display font-black dark:text-white tracking-tight uppercase">Profile Settings</DialogTitle>
          <p className="text-[11px] text-slate-500 dark:text-gray-400 font-bold uppercase tracking-widest">Update your identity and preferences.</p>
        </DialogHeader>

        <div className="space-y-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <Avatar className="w-24 h-24 border-4 border-white dark:border-white/10 shadow-xl">
                <AvatarImage src={formData.photoURL} />
                <AvatarFallback className="bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-3xl font-black">
                  {formData.displayName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 p-2 bg-brand-600 rounded-full text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div className="w-full">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Avatar URL</Label>
              <Input 
                value={formData.photoURL}
                onChange={(e) => setFormData({ ...formData, photoURL: e.target.value })}
                placeholder="https://example.com/avatar.jpg"
                className="rounded-2xl ios-input h-12 mt-1 px-4 text-xs font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="rounded-2xl ios-input h-12 pl-12 text-sm font-bold"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled
                  className="rounded-2xl ios-input h-12 pl-12 text-sm font-bold opacity-50 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Currency</Label>
              <Select 
                value={formData.currency} 
                onValueChange={(val) => setFormData({...formData, currency: val})}
              >
                <SelectTrigger className="rounded-2xl h-12 px-4 font-bold border-slate-200 dark:border-white/10 dark:bg-white/5">
                  <SelectValue placeholder="Select Currency" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl glass-card border-none">
                  <SelectItem value="INR">₹ INR (Indian Rupee)</SelectItem>
                  <SelectItem value="USD">$ USD (US Dollar)</SelectItem>
                  <SelectItem value="EUR">€ EUR (Euro)</SelectItem>
                  <SelectItem value="GBP">£ GBP (British Pound)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Theme Mode</Label>
              <div className="flex items-center justify-between h-12 px-4 rounded-2xl border border-slate-200 dark:border-white/10 dark:bg-white/5">
                <span className="text-sm font-bold text-slate-600 dark:text-gray-400 capitalize">{theme} Mode</span>
                <Switch 
                  checked={theme === 'dark'}
                  onCheckedChange={toggleTheme}
                />
              </div>
            </div>
          </div>

          <Button 
            onClick={handleSave} 
            className="w-full rounded-2xl premium-gradient h-14 text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-brand-500/30 flex items-center justify-center gap-2"
            disabled={isSaving}
          >
            {isSaving ? 'Synching...' : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
