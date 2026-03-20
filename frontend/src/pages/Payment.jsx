import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, Wallet, Smartphone, ShieldCheck, Loader2, Navigation, Calendar } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { api } from '@/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

import MapSelector from '@/components/MapSelector';

const Payment = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user, isAuthenticated } = useAuth();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [car, setCar] = useState(null);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [packages, setPackages] = useState([]);

    // Location State
    const [locationData, setLocationData] = useState({
        lat: 9.0227,
        lng: 38.7460,
        isDelivery: false,
        address: ''
    });

    // Payment State
    const [paymentMethod, setPaymentMethod] = useState('TELEBIRR'); // 'TELEBIRR' or 'CBE'
    const [phoneNumber, setPhoneNumber] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [transactionNumber, setTransactionNumber] = useState('');
    const [pickupTime, setPickupTime] = useState(null);

    const carId = searchParams.get('carId');
    const packageId = searchParams.get('packageId');
    const bookingId = searchParams.get('bookingId');

    useEffect(() => {
        const fetchData = async () => {
            if (!isAuthenticated) {
                navigate(`/login?carId=${carId || ''}&packageId=${packageId || ''}`);
                return;
            }
            if (!carId && !packageId) {
                navigate('/');
                return;
            }
            try {
                let carData = null;
                let packageData = null;
                const packagesData = await api.get('/packages');
                setPackages(packagesData);

                if (carId) {
                    carData = await api.get(`/cars/${carId}`);
                    setCar(carData);
                }

                if (packageId) {
                    // Find the package from the list
                    packageData = packagesData.find(p => p.id === parseInt(packageId));
                    if (packageData) {
                        setSelectedPackage(packageData);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch payment data:', error);
            } finally {
                setFetching(false);
            }
        };
        fetchData();
    }, [carId, packageId, navigate]);

    // Calculate totals from session storage dates
    const sDateStr = sessionStorage.getItem('startDate');
    const eDateStr = sessionStorage.getItem('endDate');

    let durationDays = 3; // Fallback
    if (sDateStr && eDateStr) {
        const start = new Date(sDateStr);
        const end = new Date(eDateStr);
        const diffTime = Math.abs(end - start);
        durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    }

    const insuranceFee = 1000;
    const rentalFee = car ? Number(car.dailyRate) * durationDays : 0;
    // For packages, use the package price directly (already includes everything)
    const packageTotal = selectedPackage ? Number(selectedPackage.price) : 0;
    const total = selectedPackage ? packageTotal : rentalFee + insuranceFee;

    const handlePayment = async () => {
        // Validation - Pickup time is required
        if (!pickupTime) {
            toast.error(t('booking.selectPickupTime'));
            return;
        }

        // Validation
        if (paymentMethod === 'TELEBIRR') {
            if (!phoneNumber || !transactionNumber) {
                toast.error(t('booking.enterTelebirrDetails'));
                return;
            }
        } else if (paymentMethod === 'CBE') {
            if (!accountNumber || !transactionNumber) {
                toast.error(t('booking.enterCBEDetails'));
                return;
            }
        }

        setLoading(true);
        try {
            // Combine startDate with pickupTime
            let finalStartDate = sDateStr ? new Date(sDateStr) : new Date();
            finalStartDate.setHours(pickupTime.getHours(), pickupTime.getMinutes(), 0, 0);

            const payload = {
                carId: carId ? parseInt(carId) : null,
                packageId: packageId ? parseInt(packageId) : null,
                startDate: finalStartDate.toISOString(),
                endDate: eDateStr ? new Date(eDateStr).toISOString() : new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString(),
                totalAmount: total,
                idCardUrl: sessionStorage.getItem('idCardUrl') || user?.profile?.idCardUrl,
                driverLicenseUrl: sessionStorage.getItem('licenseUrl') || user?.profile?.driverLicenseUrl,
                pickupLocation: locationData.address
                    ? `${locationData.address} (Lat: ${locationData.lat}, Lng: ${locationData.lng})`
                    : `Lat: ${locationData.lat}, Lng: ${locationData.lng}`,
                isDelivery: locationData.isDelivery,
                paymentDetails: {
                    method: paymentMethod,
                    phoneNumber: paymentMethod === 'TELEBIRR' ? phoneNumber : null,
                    accountNumber: paymentMethod === 'CBE' ? accountNumber : null,
                    transactionNumber: transactionNumber
                }
            };

            let response;
            if (bookingId) {
                // Update existing booking with payment details (keep status as VERIFIED, employee will verify payment)
                response = await api.patch(`/bookings/${bookingId}`, payload);
            } else {
                // Create new booking (old flow for backward compatibility)
                response = await api.post('/bookings', payload);
            }
            
            sessionStorage.setItem('lastBookingId', response.id);
            toast.success('Payment details submitted! Waiting for employee verification...');
            navigate('/confirmation');
        } catch (error) {
            toast.error(error.message || t('booking.failedToProcessBooking'));
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="animate-spin text-primary h-12 w-12" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-10">
                    <p className="mt-2 text-gray-500">{t('booking.paymentSecure')}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                        <div className="bg-white shadow-lg rounded-2xl overflow-hidden border border-gray-100 sticky top-24">
                            <div className="px-6 py-5 bg-gray-900 text-white border-b border-gray-800">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <ShieldCheck size={20} className="text-primary" />
                                    {t('booking.bookingSummary')}
                                </h3>
                            </div>
                            <div className="p-6 space-y-5">
                                {selectedPackage ? (
                                    <>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500 font-medium">Package</span>
                                            <span className="font-bold text-gray-900">{selectedPackage.name}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500 font-medium">{t('search.category')}</span>
                                            <span className="font-bold text-gray-900">{t(`search.${selectedPackage.category.toLowerCase()}`)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500 font-medium">Duration</span>
                                            <span className="font-bold text-gray-900">{durationDays} Days</span>
                                        </div>
                                        <div className="border-t border-dashed border-gray-200 pt-4">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">{selectedPackage.period}</span>
                                                <span className="font-medium">{Number(selectedPackage.price).toLocaleString()} ETB</span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500 font-medium">{t('booking.vehicle')}</span>
                                            <span className="font-bold text-gray-900">{car?.make} {car?.model}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500 font-medium">{t('booking.rentalPeriod')}</span>
                                            <span className="font-bold text-gray-900">{durationDays} Days</span>
                                        </div>

                                        <div className="border-t border-dashed border-gray-200 pt-4 space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Rental Fee ({car?.dailyRate} x {durationDays})</span>
                                                <span className="font-medium">{Number(rentalFee).toLocaleString()} ETB</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">{t('booking.insuranceRefundable')}</span>
                                                <span className="font-medium">{insuranceFee.toLocaleString()} ETB</span>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="border-t border-gray-100 pt-4 flex justify-between items-end">
                                    <span className="text-lg font-bold text-gray-900">{t('booking.totalAmount')}</span>
                                    <span className="text-3xl font-extrabold text-primary">{total.toLocaleString()} <span className="text-sm text-gray-500 font-medium">ETB</span></span>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-6 py-3 text-xs text-gray-500 text-center border-t border-gray-100">
                                {t('booking.secureTransaction')}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        {/* Pickup Time Selection - Required */}
                        <div className="bg-white shadow-lg rounded-2xl border border-gray-100 p-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Calendar size={22} className="text-primary" />
                                {t('booking.pickupTime')} *
                            </h3>
                            <div className="max-w-md">
                                <label className="block text-sm font-bold text-gray-900 mb-2">{t('booking.selectTime')} *</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={18} />
                                    <DatePicker
                                        selected={pickupTime}
                                        onChange={(date) => setPickupTime(date)}
                                        showTimeSelect
                                        timeFormat="h:mm aa"
                                        timeIntervals={30}
                                        dateFormat="MMM dd, yyyy h:mm aa"
                                        placeholderText={t('booking.selectTimeDesc')}
                                        minDate={new Date()}
                                        required
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-gray-900"
                                    />
                                </div>
                                <p className="mt-2 text-xs text-gray-500">{t('booking.selectTimeDesc')}</p>
                            </div>
                        </div>

                        {/* Map Integration */}
                        <div className="bg-white shadow-lg rounded-2xl border border-gray-100 p-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Navigation size={22} className="text-primary" />
                                {t('booking.selectLocation')}
                            </h3>
                            <MapSelector
                                onLocationChange={setLocationData}
                                initialLocation={null}
                            />
                        </div>

                        <div className="bg-white shadow-lg rounded-2xl border border-gray-100 p-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">{t('booking.choosePayment')}</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Telebirr Option */}
                                <div
                                    onClick={() => setPaymentMethod('TELEBIRR')}
                                    className={`relative p-5 rounded-xl border-2 transition-all cursor-pointer ${paymentMethod === 'TELEBIRR' ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                                >
                                    {paymentMethod === 'TELEBIRR' && (
                                        <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                            <div className="h-2 w-2 rounded-full bg-white" />
                                        </div>
                                    )}
                                    <div className="flex items-center space-x-4">
                                        <div className={`p-3 rounded-xl ${paymentMethod === 'TELEBIRR' ? 'bg-white shadow-sm' : 'bg-gray-50'}`}>
                                            <Smartphone className={paymentMethod === 'TELEBIRR' ? 'text-primary' : 'text-gray-400'} size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">{t('booking.telebirr')}</h4>
                                            <p className="text-xs text-gray-500">{t('booking.mobileTransfer')}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* CBE Option */}
                                <div
                                    onClick={() => setPaymentMethod('CBE')}
                                    className={`relative p-5 rounded-xl border-2 transition-all cursor-pointer ${paymentMethod === 'CBE' ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                                >
                                    {paymentMethod === 'CBE' && (
                                        <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                            <div className="h-2 w-2 rounded-full bg-white" />
                                        </div>
                                    )}
                                    <div className="flex items-center space-x-4">
                                        <div className={`p-3 rounded-xl ${paymentMethod === 'CBE' ? 'bg-white shadow-sm' : 'bg-gray-50'}`}>
                                            <Wallet className={paymentMethod === 'CBE' ? 'text-primary' : 'text-gray-400'} size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">{t('booking.cbe')}</h4>
                                            <p className="text-xs text-gray-500">{t('booking.commercialBank')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 space-y-6 pt-6 border-t border-gray-100">
                                {paymentMethod === 'TELEBIRR' ? (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label htmlFor="phone" className="block text-sm font-bold text-gray-900 mb-2">{t('booking.telebirrNumber')}</label>
                                        <div className="relative mb-4">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <span className="text-gray-500 font-medium">+251</span>
                                            </div>
                                            <input
                                                type="tel"
                                                id="phone"
                                                required
                                                value={phoneNumber}
                                                onChange={(e) => setPhoneNumber(e.target.value)}
                                                className="block w-full pl-16 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-gray-900"
                                                placeholder="911 234 567"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label htmlFor="account" className="block text-sm font-bold text-gray-900 mb-2">{t('booking.cbeAccount')}</label>
                                        <input
                                            type="text"
                                            id="account"
                                            required
                                            value={accountNumber}
                                            onChange={(e) => setAccountNumber(e.target.value)}
                                            className="block w-full px-4 py-3 mb-4 border border-gray-300 rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-gray-900"
                                            placeholder="1000123456789"
                                        />
                                    </div>
                                )}

                                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                    <label htmlFor="transaction" className="block text-sm font-bold text-gray-900 mb-2">{t('booking.transactionNumber')}</label>
                                    <input
                                        type="text"
                                        id="transaction"
                                        required
                                        value={transactionNumber}
                                        onChange={(e) => setTransactionNumber(e.target.value)}
                                        className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-gray-900"
                                        placeholder={t('booking.enterRef')}
                                    />
                                    <p className="mt-2 text-xs text-gray-500 italic">{t('booking.confirmCodeDesc')}</p>
                                </div>

                                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                                    <Button variant="outline" onClick={() => navigate(-1)} className="w-full sm:w-auto px-6 py-3 rounded-xl">
                                        {t('booking.back')}
                                    </Button>
                                    <Button onClick={handlePayment} disabled={loading} className="w-full sm:w-auto px-8 py-3 rounded-xl text-lg shadow-lg hover:shadow-primary/40">
                                        {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                                        {t('booking.payAmount', { amount: total.toLocaleString() })}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="text-center text-sm text-gray-400 mt-8">
                            <p>{t('booking.agreeTermsPrivacy')}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Payment;
