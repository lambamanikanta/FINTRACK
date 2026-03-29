import { Navigate, Route, Routes } from 'react-router-dom'
import MainLayout from './components/MainLayout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Analytics from './pages/Analytics.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Help from './pages/Help.jsx'
import History from './pages/History.jsx'
import Login from './pages/Login.jsx'
import Loans from './pages/Loans.jsx'
import Settings from './pages/Settings.jsx'
import TransactionsPage from './pages/Transactions.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/loans" element={<Loans />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/help" element={<Help />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
