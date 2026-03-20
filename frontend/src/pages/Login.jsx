import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const Login = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { login } = useAuth();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const carId = searchParams.get('carId');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const user = await login(formData.email, formData.password);

            // Redirect based on role
            if (user.role === 'ADMIN') {
                navigate('/admin/dashboard');
            } else if (user.role === 'EMPLOYEE') {
                navigate('/employee/dashboard');
            } else {
                const hasDocs = user.profile?.idCardUrl && user.profile?.driverLicenseUrl;
                const hasAgreement = user.profile?.agreementSigned;

                if (carId) {
                    // During booking flow
                    if (!hasDocs) {
                        navigate(`/upload-docs?carId=${carId}`);
                    } else if (!hasAgreement) {
                        navigate(`/agreement?carId=${carId}`);
                    } else {
                        navigate(`/agreement?carId=${carId}`);
                    }
                } else {
                    // General login
                    if (!hasDocs) {
                        navigate('/upload-docs');
                    } else if (!hasAgreement) {
                        navigate('/agreement');
                    } else {
                        navigate('/');
                    }
                }
            }
        } catch (err) {
            const msg = err.message || 'Invalid email or password';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="min-h-[85vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-primary mb-2">{t('auth.welcomeBack')}</h1>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        {t('auth.signInToAccount')}
                    </h2>
                </div>

                <div className="bg-white py-10 px-6 shadow-xl rounded-2xl border border-gray-100 sm:px-10 relative">

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-md">
                            <div className="flex">
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-red-700">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>

                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                                {t('auth.emailAddress')}
                            </label>
                            <div className="mt-2">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    placeholder={t('auth.emailPlaceholder')}
                                    className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary sm:text-sm transition-all text-gray-900"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                                {t('auth.password')}
                            </label>
                            <div className="mt-2">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    placeholder={t('auth.passwordPlaceholder')}
                                    className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary sm:text-sm transition-all text-gray-900"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 cursor-pointer">
                                    {t('auth.rememberMe')}
                                </label>
                            </div>

                            <div className="text-sm">
                                <a href="#" className="font-medium text-primary hover:text-primary/80 transition-colors">
                                    {t('auth.forgotPassword')}
                                </a>
                            </div>
                        </div>

                        <div className="pt-2">
                            <Button type="submit" isLoading={loading} className="w-full py-3.5 text-base font-bold shadow-md hover:shadow-lg">
                                {t('auth.signIn')}
                            </Button>
                        </div>
                    </form>

                    <div className="mt-8">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">
                                    {t('auth.noAccount')}
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 grid gap-3">
                            <Link to={carId ? `/register?carId=${carId}` : '/register'} className="w-full">
                                <Button className="w-full bg-gray-900 hover:bg-black text-white border-gray-900 shadow-md hover:shadow-lg transition-all py-3">
                                    {t('auth.createAccount')}
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
