import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import OrdenesList from './pages/OrdenesList'
import OrdenDetail from './pages/OrdenDetail'
import UploadExcel from './pages/UploadExcel'
import ExportExcel from './pages/ExportExcel'
import OrdenForm from './pages/OrdenForm'
import OTList from './pages/OTList'
import OTDetail from './pages/OTDetail'
import OTForm from './pages/OTForm'
import ControlConcretoList from './pages/ControlConcretoList'
import ControlConcretoForm from './pages/ControlConcretoForm'
import ControlConcretoDetail from './pages/ControlConcretoDetail'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/ordenes" element={<OrdenesList />} />
        <Route path="/ordenes/:id" element={<OrdenDetail />} />
        <Route path="/nueva-orden" element={<OrdenForm />} />
        <Route path="/ot" element={<OTList />} />
        <Route path="/ot/:id" element={<OTDetail />} />
        <Route path="/ot/new" element={<OTForm />} />
        <Route path="/concreto" element={<ControlConcretoList />} />
        <Route path="/concreto/nuevo" element={<ControlConcretoForm />} />
        <Route path="/concreto/:id" element={<ControlConcretoDetail />} />
        <Route path="/upload" element={<UploadExcel />} />
        <Route path="/export" element={<ExportExcel />} />
      </Routes>
    </Layout>
  )
}

export default App
