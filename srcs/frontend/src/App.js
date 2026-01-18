import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import { LoginModal, RegisterModal } from './components/AuthModals';


function MainLayout() {
	const [isLoginOpen, setIsLoginOpen] = useState(false);
	const [isRegisterOpen, setIsRegisterOpen] = useState(false);
	const navigate = useNavigate();

	const handleLoginSuccess = () => {
		setIsLoginOpen(false);
		navigate('/dashboard');
	};

	return (
		<>
			<Navbar
				onLoginClick={() => setIsLoginOpen(true)}
				onRegisterClick={() => setIsRegisterOpen(true)}
			/>
			<Home />

			<LoginModal
				isOpen={isLoginOpen}
				onClose={() => setIsLoginOpen(false)}
				onSuccess={handleLoginSuccess}
			/>
			<RegisterModal
				isOpen={isRegisterOpen}
				onClose={() => setIsRegisterOpen(false)}
			/>
		</>
	);
}

function App() {
	return (
		<Router>
			<div className="App">
				<Routes>
					<Route path="/" element={<MainLayout />} />
					<Route path="/dashboard" element={<Dashboard />} />
				</Routes>
			</div>
		</Router>
	);
}

export default App;
