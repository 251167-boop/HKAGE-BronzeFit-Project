import { Routes, Route } from 'react-router'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Records from './pages/Records'
import RecordDetail from './pages/RecordDetail'
import Chat from './pages/Chat'
import Profile from './pages/Profile'

export default function App() {
  return (
    <div className="min-h-screen bg-[var(--warm-bg)]">
      <Sidebar />
      <main className="ml-20 min-h-screen">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/records" element={<Records />} />
          <Route path="/records/:id" element={<RecordDetail />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
    </div>
  )
}
