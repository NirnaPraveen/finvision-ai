import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Smartphone, 
  Lock, 
  Eye, 
  LogOut,
  Clock,
  MapPin,
  Laptop
} from 'lucide-react';

interface SecurityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SecurityDialog: React.FC<SecurityDialogProps> = ({ open, onOpenChange }) => {
  const activities = [
    { device: 'MacBook Pro 16"', location: 'Mumbai, India', time: 'Active Now', icon: Laptop },
    { device: 'iPhone 15 Pro', location: 'Pune, India', time: '2 hours ago', icon: Smartphone },
    { device: 'Windows Desktop', location: 'Bengaluru, India', time: 'Yesterday', icon: Laptop },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-[3rem] glass-card border-none p-10 shadow-3xl bg-white dark:bg-slate-900">
        <DialogHeader className="mb-8">
          <DialogTitle className="text-3xl font-display font-black dark:text-white tracking-tight uppercase">Security</DialogTitle>
          <p className="text-[11px] text-slate-500 dark:text-gray-400 font-bold uppercase tracking-widest">Fortify your account security.</p>
        </DialogHeader>

        <div className="space-y-8">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 gap-4">
            <Button variant="outline" className="h-16 rounded-2xl flex items-center justify-between px-6 border-slate-200 dark:border-white/10 dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-orange-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">Change Password</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mt-1">Last changed 3 months ago</p>
                </div>
              </div>
              <Eye className="w-4 h-4 text-slate-300 group-hover:text-brand-500 transition-colors" />
            </Button>

            <Button variant="outline" className="h-16 rounded-2xl flex items-center justify-between px-6 border-slate-200 dark:border-white/10 dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-brand-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">Two-Factor Authentication</p>
                  <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter mt-1">Enabled</p>
                </div>
              </div>
              <Shield className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
            </Button>
          </div>

          {/* Recent Activity */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Recent Login Activity</h4>
            <div className="space-y-3">
              {activities.map((activity, i) => (
                <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-white/10 flex items-center justify-center">
                      <activity.icon className="w-5 h-5 text-slate-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">{activity.device}</p>
                      <div className="flex items-center gap-3 mt-1.5 opacity-60">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span className="text-[10px] font-bold uppercase">{activity.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span className="text-[10px] font-bold uppercase">{activity.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button 
            variant="ghost"
            className="w-full rounded-2xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 h-14 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout from all sessions
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
