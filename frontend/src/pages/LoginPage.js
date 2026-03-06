import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';

const LoginPage = () => {
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const user = await login(mobile, password);
            if (user) {
                if (user.role === 'driver') navigate('/driver/dashboard');
                else if (user.role === 'manager') navigate('/manager/dashboard');
                else if (user.role === 'owner') navigate('/owner/dashboard');
                else navigate('/');
            }
        } catch (err) {
            setError(err.message || 'Invalid mobile number or password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-[#0A0F0B] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
            {/* Animated Background Elements */}
            <div className="absolute top-0 -left-4 w-96 h-96 bg-primary/20 rounded-full mix-blend-screen filter blur-[128px] animate-pulse"></div>
            <div className="absolute bottom-0 -right-4 w-96 h-96 bg-secondary/10 rounded-full mix-blend-screen filter blur-[128px] animate-pulse delay-700"></div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <div className="flex flex-col items-center">
                    <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[2.5rem] shadow-2xl border border-white/10 mb-8 transform hover:scale-105 transition-all duration-500 group">
                        <div className="absolute inset-0 bg-primary/20 rounded-[2.5rem] filter blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <Logo className="h-32 w-auto drop-shadow-[0_0_25px_rgba(72,187,120,0.3)] relative z-10" />
                    </div>
                    <h2 className="text-center text-4xl font-black tracking-tighter text-white mb-2">
                        Welcome Back
                    </h2>
                    <p className="text-center text-sm font-bold text-gray-400 uppercase tracking-[0.3em] mb-8">
                        Lalchand Traders
                    </p>
                </div>

                <div className="bg-white/[0.03] backdrop-blur-2xl py-10 px-6 shadow-2xl rounded-[2.5rem] border border-white/10 sm:px-10 mx-4">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="rounded-2xl bg-red-500/20 p-4 mb-4 border border-red-500/20 text-center animate-shake">
                                <span className="text-sm font-bold text-red-300">{error}</span>
                            </div>
                        )}
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">
                                Mobile Number
                            </label>
                            <input
                                type="text"
                                required
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value)}
                                className="block w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-300 font-bold"
                                placeholder="Enter mobile number"
                                autoComplete="username"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all duration-300 font-bold"
                                placeholder="••••••••"
                                autoComplete="current-password"
                            />
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-xl shadow-primary/20 text-base font-black text-white bg-primary hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-300 active:scale-[0.98] disabled:opacity-50 tracking-[0.2em] uppercase"
                            >
                                {isLoading ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Signing in...
                                    </span>
                                ) : 'Sign in'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <p className="mt-8 text-center text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] relative z-10">
                &copy; {new Date().getFullYear()} Lalchand Traders &bull; Bhandari Sugar
            </p>
        </div>
    );
};

export default LoginPage;
