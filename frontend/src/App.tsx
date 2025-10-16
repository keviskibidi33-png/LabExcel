import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import OrdenesList from './pages/OrdenesList'
import OrdenDetail from './pages/OrdenDetail'
import UploadExcel from './pages/UploadExcel'
import ExportExcel from './pages/ExportExcel'
import OrdenForm from './pages/OrdenForm'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/ordenes" element={<OrdenesList />} />
        <Route path="/ordenes/:id" element={<OrdenDetail />} />
        <Route path="/nueva-orden" element={<OrdenForm />} />
        <Route path="/upload" element={<UploadExcel />} />
        <Route path="/export" element={<ExportExcel />} />
      </Routes>
    </Layout>
  )
}

export default App
