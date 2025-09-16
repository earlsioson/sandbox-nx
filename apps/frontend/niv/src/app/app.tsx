import { Navigate, Route, Routes } from 'react-router-dom';
import OnboardingLandingPage from './pages/OnboardingLandingPage';
import OnboardingStepPage from './pages/OnboardingStepPage';
import PatientDetailPage from './pages/PatientDetailPage';
import PatientsListPage from './pages/PatientsListPage';
import Layout from './ui/site/Layout';

function App() {
  return (
    <Layout>
      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/onboarding" replace />} />

        {/* Main onboarding landing page */}
        <Route path="/onboarding" element={<OnboardingLandingPage />} />

        {/* Patients list and detail routes */}
        <Route path="/patients" element={<PatientsListPage />} />
        <Route path="/patients/:patientId" element={<PatientDetailPage />} />

        {/* NIV Onboarding workflow routes */}
        <Route
          path="/patients/:patientId/onboarding/:step"
          element={<OnboardingStepPage />}
        />

        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
