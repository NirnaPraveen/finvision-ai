import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FinanceProvider } from './context/FinanceContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { ExpensesPage } from './pages/Expenses';
import { SharedExpensesPage } from './pages/SharedExpenses';
import { SubscriptionsPage } from './pages/Subscriptions';
import { NotificationsPage } from './pages/Notifications';
import { InsightsPage } from './pages/Insights';
import { SettingsPage } from './pages/Settings';
import { LoginPage } from './pages/LoginPage';
import { ChatBot } from './components/dashboard/ChatBot';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <FinanceProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="expenses" element={<ExpensesPage />} />
                <Route path="shared" element={<SharedExpensesPage />} />
                <Route path="subscriptions" element={<SubscriptionsPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="insights" element={<InsightsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Routes>
            <ChatBot />
          </Router>
          <Toaster position="top-right" richColors />
        </FinanceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
