'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Users, DollarSign, TrendingUp, LogOut, Eye, Check, XCircle, Camera, Edit3, Palette, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { api } from '@/network';

interface Booking {
  id: string;
  rawDate: string;
  customerName: string;
  email: string;
  phone: string;
  studio: string;
  date: string;
  time: string;
  duration: string;
  price: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  services: {
    photographer?: {
      enabled: boolean;
      name: string;
    };
    editor?: {
      enabled: boolean;
      name: string;
    };
    makeupArtist?: {
      enabled: boolean;
      name: string;
    };
  };
}

interface ApiBooking {
  id: number;
  user_id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  booking_type: 'professional_slots' | 'whole_studio' | 'Whole Studio' | 'Studio Slot';
  booking_date: string;
  booking_time: string;
  booking_status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  booking_price: number;
  service_type?: string;
  service_provider_id?: number;
  created_at: string;
  updated_at: string;
  users?: {
    email?: string;
    full_name?: string;
  };
  providers?: {
    full_name?: string;
    service_type?: string;
  };
  booking_addons?: Array<{
    provider_name_snapshot?: string;
    service_type?: string;
  }>;
}

interface ClosedDate {
  id: number;
  closed_date: string;
  reason?: string;
  created_at: string;
}

interface Provider {
  id: number;
  full_name: string;
  service_type: 'photography' | 'editor' | 'make_up_artist' | string;
  rate: number;
  active?: boolean;
  quote_required?: boolean;
}

interface ProviderSchedule {
  id: number;
  provider_id: number;
  duty_date: string;
  start_time: string;
  end_time: string;
  providers?: Provider;
}

interface AdminUser {
  id?: number;
  email?: string;
  name?: string;
}

const formatDisplayDate = (dateValue: string): string => {
  const [year, month, day] = dateValue.split('-').map(Number);
  const localDate = new Date(year, (month || 1) - 1, day || 1);
  return localDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatDisplayTime = (timeValue: string): string => {
  const [hourPart = '0', minutePart = '0'] = timeValue.split(':');
  let hours = Number(hourPart);
  const minutes = minutePart.padStart(2, '0');
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${hours}:${minutes} ${period}`;
};

const mapProviderToServices = (provider?: { full_name?: string; service_type?: string }) => {
  const services: Booking['services'] = {};
  if (!provider?.full_name || !provider?.service_type) {
    return services;
  }

  const normalizedType = provider.service_type.toLowerCase();

  if (normalizedType.includes('photo')) {
    services.photographer = { enabled: true, name: provider.full_name };
  } else if (normalizedType.includes('edit')) {
    services.editor = { enabled: true, name: provider.full_name };
  } else if (normalizedType.includes('make')) {
    services.makeupArtist = { enabled: true, name: provider.full_name };
  }

  return services;
};

const mapAddonsToServices = (addons?: ApiBooking['booking_addons']) => {
  const services: Booking['services'] = {};
  if (!addons?.length) return services;

  addons.forEach((addon) => {
    if (!addon.provider_name_snapshot || !addon.service_type) return;
    const normalizedType = addon.service_type.toLowerCase();

    if (normalizedType.includes('photo')) {
      services.photographer = { enabled: true, name: addon.provider_name_snapshot };
    } else if (normalizedType.includes('edit')) {
      services.editor = { enabled: true, name: addon.provider_name_snapshot };
    } else if (normalizedType.includes('make')) {
      services.makeupArtist = { enabled: true, name: addon.provider_name_snapshot };
    }
  });

  return services;
};

const mapApiBookingToBooking = (booking: ApiBooking): Booking => ({
  id: String(booking.id),
  rawDate: booking.booking_date,
  customerName: booking.customer_name || booking.users?.full_name || 'Unknown Customer',
  email: booking.customer_email || booking.users?.email || 'N/A',
  phone: booking.customer_phone || 'N/A',
  studio: booking.booking_type === 'whole_studio' || booking.booking_type === 'Whole Studio'
    ? 'WHOLE STUDIO'
    : 'STUDIO SLOT',
  date: formatDisplayDate(booking.booking_date),
  time: formatDisplayTime(booking.booking_time),
  duration: '55 MIN',
  price: `₱${Number(booking.booking_price || 0).toLocaleString()}`,
  status: booking.booking_status,
  services: booking.booking_addons?.length
    ? mapAddonsToServices(booking.booking_addons)
    : mapProviderToServices(booking.providers),
});

export default function AdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'availability' | 'providers'>('overview');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [dateFilter, setDateFilter] = useState<string>(''); // Empty string means show all dates
  const [nameFilter, setNameFilter] = useState<string>('');
  const [confirmationToast, setConfirmationToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState<{ show: boolean; date: string; action: 'open' | 'close'; formattedDate: string }>({ show: false, date: '', action: 'open', formattedDate: '' });
  const [statusChangeModal, setStatusChangeModal] = useState<{ show: boolean; bookingId: string; customerName: string; currentStatus: Booking['status']; newStatus: Booking['status'] } | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const [bookings, setBookings] = useState<Booking[]>([]);
  // Fetch bookings from API
  const fetchBookings = async () => {
    try {
      const result = await api.get('/bookings', { requiresAuth: true });
      if (result.success && Array.isArray(result.data)) {
        const mappedBookings = result.data.map((item: ApiBooking) => mapApiBookingToBooking(item));
        setBookings(mappedBookings);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookings([]);
      showConfirmation('Unable to load bookings from API.', 'error');
    }
  };


  const [closedDates, setClosedDates] = useState<ClosedDate[]>([]);
  const [currentViewDate, setCurrentViewDate] = useState(new Date(2026, 1, 1)); // February 2026
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providerSchedules, setProviderSchedules] = useState<ProviderSchedule[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [providerForm, setProviderForm] = useState({
    full_name: '',
    service_type: 'photography',
    rate: '',
    quote_required: false,
  });
  const [scheduleForm, setScheduleForm] = useState({
    provider_id: '',
    start_date: '',
    end_date: '',
    start_time: '08:00',
    end_time: '17:00',
  });
  const [editingProviderId, setEditingProviderId] = useState<number | null>(null);
  const selectedProvider = providers.find(provider => provider.id === selectedProviderId) || null;
  const selectedProviderSchedules = selectedProvider
    ? providerSchedules
        .filter(schedule => schedule.provider_id === selectedProvider.id)
        .sort((a, b) => `${a.duty_date} ${a.start_time}`.localeCompare(`${b.duty_date} ${b.start_time}`))
    : [];

  const getProviderScheduleCount = (providerId: number) =>
    providerSchedules.filter(schedule => schedule.provider_id === providerId).length;

  const selectProviderForSchedule = (provider: Provider) => {
    setSelectedProviderId(provider.id);
    setScheduleForm(prev => ({ ...prev, provider_id: String(provider.id) }));
  };

  // Fetch closed dates from API
  const fetchClosedDates = async () => {
    try {
      const result = await api.get('/closed-dates');
      if (result.success && result.data && Array.isArray(result.data)) {
        // Filter out any invalid entries
        const validDates = result.data.filter((item: Partial<ClosedDate>) => 
          item && typeof item === 'object' && item.closed_date
        );
        setClosedDates(validDates);
      }
    } catch (error) {
      console.error('Error fetching closed dates:', error);
      setClosedDates([]); // Set to empty array on error
    }
  };

  const fetchProviders = async () => {
    try {
      setProvidersLoading(true);
      const result = await api.get('/providers');
      if (result.success && Array.isArray(result.data)) {
        setProviders(result.data);
      } else {
        setProviders([]);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
      setProviders([]);
      showConfirmation('Unable to load providers.', 'error');
    } finally {
      setProvidersLoading(false);
    }
  };

  const fetchProviderSchedules = async () => {
    try {
      const result = await api.get('/providers/schedules');
      if (result.success && Array.isArray(result.data)) {
        setProviderSchedules(result.data);
      } else {
        setProviderSchedules([]);
      }
    } catch (error) {
      console.error('Error fetching provider schedules:', error);
      setProviderSchedules([]);
      showConfirmation('Unable to load provider schedules.', 'error');
    }
  };

  const resetProviderForm = () => {
    setProviderForm({
      full_name: '',
      service_type: 'photography',
      rate: '',
      quote_required: false,
    });
    setEditingProviderId(null);
  };

  const handleProviderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!providerForm.full_name.trim() || !providerForm.rate) {
      showConfirmation('Please fill in provider name and rate.', 'error');
      return;
    }

    const payload = {
      full_name: providerForm.full_name.trim(),
      service_type: providerForm.service_type,
      rate: Number(providerForm.rate),
      quote_required: providerForm.quote_required,
    };

    try {
      setProvidersLoading(true);

      if (editingProviderId) {
        await api.put(`/providers/${editingProviderId}`, payload, { requiresAuth: true });
        showConfirmation('Provider updated successfully.', 'success');
      } else {
        await api.post('/providers', payload, { requiresAuth: true });
        showConfirmation('Provider created successfully.', 'success');
      }

      resetProviderForm();
      await fetchProviders();
    } catch (error) {
      console.error('Error saving provider:', error);
      showConfirmation('Failed to save provider.', 'error');
    } finally {
      setProvidersLoading(false);
    }
  };

  const handleEditProvider = (provider: Provider) => {
    setEditingProviderId(provider.id);
    setProviderForm({
      full_name: provider.full_name,
      service_type: provider.service_type,
      rate: String(provider.rate),
      quote_required: Boolean(provider.quote_required),
    });
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!scheduleForm.provider_id || !scheduleForm.start_date || !scheduleForm.start_time || !scheduleForm.end_time) {
      showConfirmation('Please complete the duty schedule form.', 'error');
      return;
    }

    try {
      const startDate = new Date(`${scheduleForm.start_date}T00:00:00`);
      const endDate = scheduleForm.end_date
        ? new Date(`${scheduleForm.end_date}T00:00:00`)
        : startDate;

      if (endDate < startDate) {
        showConfirmation('End date cannot be before start date.', 'error');
        return;
      }

      const dates: string[] = [];
      const cursor = new Date(startDate);
      while (cursor <= endDate) {
        const year = cursor.getFullYear();
        const month = String(cursor.getMonth() + 1).padStart(2, '0');
        const day = String(cursor.getDate()).padStart(2, '0');
        dates.push(`${year}-${month}-${day}`);
        cursor.setDate(cursor.getDate() + 1);
      }

      await Promise.all(dates.map(dutyDate =>
        api.post(
          `/providers/${scheduleForm.provider_id}/schedules`,
          {
            duty_date: dutyDate,
            start_time: scheduleForm.start_time,
            end_time: scheduleForm.end_time,
          },
          { requiresAuth: true }
        )
      ));

      showConfirmation(`Provider duty schedule added for ${dates.length} day(s).`, 'success');
      setScheduleForm(prev => ({ ...prev, start_date: '', end_date: '' }));
      await fetchProviderSchedules();
    } catch (error) {
      console.error('Error saving provider schedule:', error);
      showConfirmation('Failed to save provider schedule.', 'error');
    }
  };

  const handleDeleteSchedule = async (scheduleId: number) => {
    try {
      await api.delete(`/providers/schedules/${scheduleId}`, { requiresAuth: true });
      showConfirmation('Provider duty schedule removed.', 'success');
      await fetchProviderSchedules();
    } catch (error) {
      console.error('Error deleting provider schedule:', error);
      showConfirmation('Failed to remove provider schedule.', 'error');
    }
  };

  const handleDeleteProvider = async (providerId: number) => {
    try {
      await api.delete(`/providers/${providerId}`, { requiresAuth: true });
      showConfirmation('Provider deleted successfully.', 'success');
      await fetchProviders();
    } catch (error) {
      console.error('Error deleting provider:', error);
      showConfirmation('Failed to delete provider.', 'error');
    }
  };

  useEffect(() => {
    const adminData = localStorage.getItem('sceneo_admin');
    if (!adminData) {
      router.push('/admin');
    } else {
      setAdmin(JSON.parse(adminData));
    }
    
    // Fetch closed dates on mount
    fetchClosedDates();
    fetchBookings();
    fetchProviders();
    fetchProviderSchedules();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('sceneo_admin');
    localStorage.removeItem('authToken');
    router.push('/admin');
  };

  const stats = {
    totalBookings: bookings.length,
    pendingBookings: bookings.filter(b => b.status === 'pending').length,
    revenue: bookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + parseFloat(b.price.replace(/[^0-9.]/g, '')), 0),
    completionRate: bookings.length > 0
      ? Math.round((bookings.filter(b => b.status === 'completed').length / bookings.length) * 100)
      : 0,
  };

  const toggleDateAvailability = (date: string) => {
    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const closedDateObj = closedDates.find(cd => cd && cd.closed_date === date);
    const action = closedDateObj ? 'open' : 'close';
    
    setConfirmModal({ show: true, date, action, formattedDate });
  };

  const confirmToggle = async () => {
    const { date, action, formattedDate } = confirmModal;
    setLoading(true);
    
    try {
      if (action === 'open') {
        // DELETE to open the date
        const closedDateObj = closedDates.find(cd => cd && cd.closed_date === date);
        if (closedDateObj) {
          const result = await api.delete(`/closed-dates/${closedDateObj.id}`, 
            { requiresAuth: true }
          );
          
          if (result.success) {
            setClosedDates(closedDates.filter(cd => cd.id !== closedDateObj.id));
            showConfirmation(`${formattedDate} is now OPEN for bookings`, 'success');
          } else {
            showConfirmation('Failed to open date. Please try again.', 'error');
          }
        } else {
          showConfirmation('Date not found in closed dates list.', 'error');
        }
      } else {
        // POST to close the date
        const result = await api.post('/closed-dates', 
          { closed_date: date },
          { requiresAuth: true }
        );
        
        if (result.success) {
          // Add the new closed date to the list
          if (result.data && result.data.closed_date) {
            setClosedDates([...closedDates, result.data]);
          } else {
            // If data structure is unexpected, refetch to sync with backend
            await fetchClosedDates();
          }
          showConfirmation(`${formattedDate} is now CLOSED for bookings`, 'success');
        } else {
          showConfirmation('Failed to close date. Please try again.', 'error');
        }
      }
    } catch (error) {
      console.error('Error toggling date availability:', error);
      showConfirmation('An error occurred. Please try again.', 'error');
    } finally {
      setLoading(false);
      setConfirmModal({ show: false, date: '', action: 'open', formattedDate: '' });
    }
  };

  const cancelToggle = () => {
    setConfirmModal({ show: false, date: '', action: 'open', formattedDate: '' });
  };

  const showConfirmation = (message: string, type: 'success' | 'error') => {
    setConfirmationToast({ show: true, message, type });
    setTimeout(() => {
      setConfirmationToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const requestBookingStatusChange = (booking: Booking, newStatus: Booking['status']) => {
    if (booking.status === newStatus) return;

    setStatusChangeModal({
      show: true,
      bookingId: booking.id,
      customerName: booking.customerName,
      currentStatus: booking.status,
      newStatus,
    });
  };

  const cancelStatusChange = () => {
    setStatusChangeModal(null);
  };

  const confirmStatusChange = async () => {
    if (!statusChangeModal) return;

    try {
      setStatusUpdating(true);
      await api.put(`/bookings/${statusChangeModal.bookingId}`, {
        booking_status: statusChangeModal.newStatus,
      }, { requiresAuth: true });

      setBookings((prev) => prev.map((booking) => (
        booking.id === statusChangeModal.bookingId
          ? { ...booking, status: statusChangeModal.newStatus }
          : booking
      )));

      setSelectedBooking((prev) => {
        if (!prev || prev.id !== statusChangeModal.bookingId) return prev;
        return { ...prev, status: statusChangeModal.newStatus };
      });

      showConfirmation(`Booking status updated to ${statusChangeModal.newStatus.toUpperCase()}`, 'success');
      setStatusChangeModal(null);
    } catch (error) {
      console.error('Error updating booking status:', error);
      showConfirmation('Failed to update booking status.', 'error');
    } finally {
      setStatusUpdating(false);
    }
  };

  const goToPreviousMonth = () => {
    setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + 1, 1));
  };

  const goToCurrentMonth = () => {
    setCurrentViewDate(new Date());
  };

  // Helper function to format date to YYYY-MM-DD using local timezone
  const formatDateToYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get all days in the current viewing month
  const getDaysInMonth = () => {
    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  if (!admin) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <p className="text-white">Loading...</p>
    </div>;
  }

  const adminInitials = (admin?.name || admin?.email || 'A')
    .split(' ')
    .map((part: string) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-transparent px-4 sm:px-6 lg:px-8 pt-4">
        <div className="mx-auto w-full max-w-6xl rounded-2xl border border-white/70 bg-white/35 backdrop-blur-md shadow-lg shadow-slate-900/10 px-4 sm:px-6">
          <div className="h-16 flex items-center justify-between">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">SCENEO ADMIN</h1>

            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-xs text-slate-500">Admin</p>
                <p className="text-sm font-medium text-slate-800">{admin.email}</p>
              </div>

              <div className="w-10 h-10 rounded-full bg-emerald-400 border-2 border-emerald-200 text-slate-900 font-semibold flex items-center justify-center">
                {adminInitials}
              </div>

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-slate-900 font-semibold hover:bg-slate-100 transition-colors"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-2 mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 min-w-[120px] px-6 py-3 rounded-lg font-bold transition-all ${
              activeTab === 'overview' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex-1 min-w-[120px] px-6 py-3 rounded-lg font-bold transition-all ${
              activeTab === 'bookings' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Bookings
          </button>
          <button
            onClick={() => setActiveTab('availability')}
            className={`flex-1 min-w-[120px] px-6 py-3 rounded-lg font-bold transition-all ${
              activeTab === 'availability' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Availability
          </button>
          <button
            onClick={() => setActiveTab('providers')}
            className={`flex-1 min-w-[120px] px-6 py-3 rounded-lg font-bold transition-all ${
              activeTab === 'providers' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Providers
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <Calendar className="text-gray-600" size={24} />
                  <span className="text-3xl font-black text-gray-900">{stats.totalBookings}</span>
                </div>
                <p className="text-sm font-semibold text-gray-600">Total Bookings</p>
              </div>

              <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <Users className="text-orange-600" size={24} />
                  <span className="text-3xl font-black text-gray-900">{stats.pendingBookings}</span>
                </div>
                <p className="text-sm font-semibold text-gray-600">Pending</p>
              </div>

              <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <DollarSign className="text-green-600" size={24} />
                  <span className="text-3xl font-black text-gray-900">₱{stats.revenue.toFixed(0)}</span>
                </div>
                <p className="text-sm font-semibold text-gray-600">Total Revenue</p>
              </div>

              <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="text-blue-600" size={24} />
                  <span className="text-3xl font-black text-gray-900">{stats.completionRate}%</span>
                </div>
                <p className="text-sm font-semibold text-gray-600">Completion Rate</p>
              </div>
            </div>

            {/* Recent Bookings */}
            <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Bookings</h2>
              <div className="space-y-3">
                {bookings.slice(0, 3).map(booking => (
                  <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-bold text-gray-900">{booking.customerName}</p>
                      <p className="text-sm text-gray-600">{booking.studio} • {booking.date}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      booking.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                      booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {booking.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bookings List */}
            <div className="lg:col-span-2 bg-white rounded-xl p-6 border-2 border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">All Bookings</h2>
              
              {/* Date Filter */}
              <div className="mb-4 pb-4 border-b-2 border-gray-200">
                <label className="block text-sm font-semibold text-gray-600 mb-2">Search by Customer Name</label>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                    placeholder="Type customer name..."
                    className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg font-semibold text-sm focus:border-black focus:outline-none"
                  />
                  {nameFilter && (
                    <button
                      onClick={() => setNameFilter('')}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-200 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <label className="block text-sm font-semibold text-gray-600 mb-2">Filter by Date</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg font-semibold text-sm focus:border-black focus:outline-none"
                  />
                  {dateFilter && (
                    <button
                      onClick={() => setDateFilter('')}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-200 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {dateFilter && (
                  <p className="text-xs text-gray-600 mt-2 font-semibold">
                    Showing bookings for: {new Date(dateFilter).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
              </div>
              
              {/* Status Filters */}
              <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b-2 border-gray-200">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                    statusFilter === 'all' 
                      ? 'bg-black text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                    statusFilter === 'pending' 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setStatusFilter('confirmed')}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                    statusFilter === 'confirmed' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Confirmed
                </button>
                <button
                  onClick={() => setStatusFilter('completed')}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                    statusFilter === 'completed' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Completed
                </button>
                <button
                  onClick={() => setStatusFilter('cancelled')}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                    statusFilter === 'cancelled' 
                      ? 'bg-red-500 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Cancelled
                </button>
              </div>

              <div className="space-y-3">
                {(() => {
                  const filteredBookings = bookings.filter(booking => {
                    // Status filter
                    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;

                    // Name filter
                    const matchesName =
                      !nameFilter ||
                      booking.customerName.toLowerCase().includes(nameFilter.toLowerCase());
                    
                    // Date filter - check if booking.date matches the selected filter date
                    const matchesDate = !dateFilter || booking.rawDate === dateFilter;
                    
                    return matchesStatus && matchesDate && matchesName;
                  });
                  
                  return (
                    <>
                      <div className="mb-3 pb-3 border-b border-gray-200">
                        <p className="text-sm font-bold text-gray-600">
                          Showing {filteredBookings.length} {filteredBookings.length === 1 ? 'booking' : 'bookings'}
                        </p>
                      </div>
                      
                      {filteredBookings.length > 0 ? (
                        filteredBookings.map(booking => (
                  <div
                    key={booking.id}
                    onClick={() => setSelectedBooking(booking)}
                    className="p-4 border-2 border-gray-200 rounded-xl hover:border-black cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-bold text-gray-900">{booking.customerName}</p>
                        <p className="text-sm text-gray-600">{booking.email}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        booking.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                        booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {booking.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{booking.studio}</span>
                      <span>•</span>
                      <span>{booking.date}</span>
                      <span>•</span>
                      <span>{booking.time}</span>
                    </div>
                    
                    {/* Services Icons */}
                    {(booking.services.photographer?.enabled || booking.services.editor?.enabled || booking.services.makeupArtist?.enabled) && (
                      <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-gray-200">
                        <span className="text-xs font-semibold text-gray-500">Services:</span>
                        {booking.services.photographer?.enabled && (
                          <div className="flex items-start gap-2 text-xs">
                            <Camera size={14} className="text-gray-600 mt-0.5" />
                            <div>
                              <p className="font-bold">Photographer</p>
                              <p className="text-gray-600">{booking.services.photographer.name}</p>
                            </div>
                          </div>
                        )}
                        {booking.services.editor?.enabled && (
                          <div className="flex items-start gap-2 text-xs">
                            <Edit3 size={14} className="text-gray-600 mt-0.5" />
                            <div>
                              <p className="font-bold">Editor</p>
                              <p className="text-gray-600">{booking.services.editor.name}</p>
                            </div>
                          </div>
                        )}
                        {booking.services.makeupArtist?.enabled && (
                          <div className="flex items-start gap-2 text-xs">
                            <Palette size={14} className="text-gray-600 mt-0.5" />
                            <div>
                              <p className="font-bold">Make-up Artist</p>
                              <p className="text-gray-600">{booking.services.makeupArtist.name}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Calendar size={48} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-semibold">No bookings match your filters</p>
                  <p className="text-sm text-gray-400 mt-1">Try adjusting the date or status filter</p>
                </div>
              )}
            </>
          );
        })()}
              </div>
            </div>

            {/* Booking Details */}
            <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking Details</h2>
              {selectedBooking ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Customer</p>
                    <p className="font-bold text-gray-900">{selectedBooking.customerName}</p>
                    <p className="text-sm text-gray-600">{selectedBooking.email}</p>
                    <p className="text-sm text-gray-600">{selectedBooking.phone}</p>
                  </div>

                  <div className="border-t-2 border-gray-200 pt-4">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Studio</p>
                    <p className="font-bold text-gray-900">{selectedBooking.studio}</p>
                  </div>

                  <div className="border-t-2 border-gray-200 pt-4">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Date & Time</p>
                    <p className="font-bold text-gray-900">{selectedBooking.date}</p>
                    <p className="text-sm text-gray-600">{selectedBooking.time} • {selectedBooking.duration}</p>
                  </div>

                  <div className="border-t-2 border-gray-200 pt-4">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Price</p>
                    <p className="text-2xl font-black text-gray-900">{selectedBooking.price}</p>
                  </div>

                  <div className="border-t-2 border-gray-200 pt-4">
                    <p className="text-sm font-semibold text-gray-600 mb-2">Add-on Services</p>
                    {selectedBooking.services.photographer?.enabled || selectedBooking.services.editor?.enabled || selectedBooking.services.makeupArtist?.enabled ? (
                      <div className="space-y-3">
                        {selectedBooking.services.photographer?.enabled && (
                          <div className="flex items-start gap-3">
                            <Camera size={18} className="text-gray-600 mt-0.5" />
                            <div>
                              <p className="font-bold text-gray-900">Photographer</p>
                              <p className="text-sm text-gray-600">{selectedBooking.services.photographer.name}</p>
                            </div>
                          </div>
                        )}
                        {selectedBooking.services.editor?.enabled && (
                          <div className="flex items-start gap-3">
                            <Edit3 size={18} className="text-gray-600 mt-0.5" />
                            <div>
                              <p className="font-bold text-gray-900">Editor</p>
                              <p className="text-sm text-gray-600">{selectedBooking.services.editor.name}</p>
                            </div>
                          </div>
                        )}
                        {selectedBooking.services.makeupArtist?.enabled && (
                          <div className="flex items-start gap-3">
                            <Palette size={18} className="text-gray-600 mt-0.5" />
                            <div>
                              <p className="font-bold text-gray-900">Make-up Artist</p>
                              <p className="text-sm text-gray-600">{selectedBooking.services.makeupArtist.name}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No add-on services</p>
                    )}
                  </div>

                  <div className="border-t-2 border-gray-200 pt-4">
                    <p className="text-sm font-semibold text-gray-600 mb-2">Status</p>
                    <div className="flex flex-col gap-2">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold text-center ${
                        selectedBooking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        selectedBooking.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                        selectedBooking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {selectedBooking.status.toUpperCase()}
                      </span>
                      
                      <p className="text-xs font-semibold text-gray-600 mt-2 mb-1">Change Status:</p>
                      <select
                        value={selectedBooking.status}
                        onChange={(event) => requestBookingStatusChange(selectedBooking, event.target.value as Booking['status'])}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg font-semibold text-sm focus:border-black focus:outline-none"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Eye size={48} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Select a booking to view details</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Availability Tab */}
        {activeTab === 'availability' && (
          <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Manage Studio Availability</h2>
            
            <div className="space-y-4">
              <p className="text-gray-600">Control which dates are available for booking. Click on dates below to toggle availability.</p>
              
              {/* Month Navigation */}
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
                <button
                  onClick={goToPreviousMonth}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <ChevronLeft size={24} className="text-gray-700" />
                </button>
                
                <div className="text-center">
                  <h3 className="text-xl font-black text-gray-900">
                    {currentViewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                  <button
                    onClick={goToCurrentMonth}
                    className="text-xs font-semibold text-gray-600 hover:text-black transition-colors mt-1"
                  >
                    Go to Today
                  </button>
                </div>
                
                <button
                  onClick={goToNextMonth}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <ChevronRight size={24} className="text-gray-700" />
                </button>
              </div>

              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-1.5">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-xs font-bold text-gray-600 py-1">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1.5">
                {getDaysInMonth().map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} className="h-16" />;
                  }
                  
                  const dateStr = formatDateToYYYYMMDD(date);
                  const isClosed = closedDates.some(cd => cd && cd.closed_date === dateStr);
                  const isToday = new Date().toDateString() === date.toDateString();
                  const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
                  
                  return (
                    <button
                      key={dateStr}
                      onClick={() => toggleDateAvailability(dateStr)}
                      disabled={isPast}
                      className={`h-16 p-1.5 rounded-lg border-2 transition-all ${
                        isPast
                          ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
                          : isClosed
                          ? 'border-red-300 bg-red-50 hover:border-red-500'
                          : 'border-green-300 bg-green-50 hover:border-green-500'
                      } ${
                        isToday ? 'ring-2 ring-black ring-offset-1' : ''
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center h-full">
                        <span className={`text-sm font-black ${
                          isPast ? 'text-gray-400' : 'text-gray-900'
                        }`}>
                          {date.getDate()}
                        </span>
                        {!isPast && (
                          isClosed ? (
                            <XCircle size={12} className="text-red-500 mt-0.5" />
                          ) : (
                            <Check size={12} className="text-green-500 mt-0.5" />
                          )
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <h3 className="font-bold text-gray-900 mb-2">Currently Closed Dates:</h3>
                {closedDates.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {closedDates.filter(cd => cd && cd.closed_date).map(closedDate => {
                      // Parse YYYY-MM-DD as local date (not UTC)
                      const [year, month, day] = closedDate.closed_date.split('-').map(Number);
                      const localDate = new Date(year, month - 1, day);
                      return (
                        <span key={closedDate.id} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                          {localDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm">All dates are currently open for booking</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Providers Tab */}
        {activeTab === 'providers' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl p-6 border-2 border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">All Providers</h2>
                <button
                  onClick={fetchProviders}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-200 transition-colors"
                >
                  Refresh
                </button>
              </div>

              {providersLoading ? (
                <p className="text-gray-600">Loading providers...</p>
              ) : providers.length === 0 ? (
                <div className="text-center py-12">
                  <Users size={48} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-semibold">No providers found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {providers.map(provider => (
                    <div
                      key={provider.id}
                      onClick={() => selectProviderForSchedule(provider)}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                        selectedProviderId === provider.id ? 'border-black bg-gray-50' : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <p className="font-bold text-gray-900">{provider.full_name}</p>
                          <p className="text-sm text-gray-600">Type: {provider.service_type}</p>
                          {provider.quote_required && (
                            <p className="text-sm font-semibold text-amber-700">For quotation</p>
                          )}
                          <p className="mt-2 text-xs text-gray-500">
                            {getProviderScheduleCount(provider.id)} scheduled duty day(s)
                          </p>
                          <p className="text-sm text-gray-600">Rate: ₱{Number(provider.rate).toLocaleString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              handleEditProvider(provider);
                            }}
                            className="px-3 py-2 rounded-lg text-xs font-bold bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDeleteProvider(provider.id);
                            }}
                            className="px-3 py-2 rounded-lg text-xs font-bold bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                          >
                            <span className="inline-flex items-center gap-1"><Trash2 size={12} /> Delete</span>
                          </button>
                        </div>
                      </div>
                      {selectedProviderId === provider.id && (
                        <div className="mt-4 border-t border-gray-200 pt-4">
                          <div className="flex items-center justify-between gap-3 mb-3">
                            <h3 className="font-bold text-gray-900">Schedules</h3>
                            <span className="text-xs font-semibold text-gray-500">
                              {selectedProviderSchedules.length} duty day(s)
                            </span>
                          </div>
                          {selectedProviderSchedules.length === 0 ? (
                            <p className="text-sm text-gray-500">No duty schedules yet.</p>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {selectedProviderSchedules.map(schedule => (
                                <div key={schedule.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-3 bg-white">
                                  <div>
                                    <p className="text-sm font-bold text-gray-900">{formatDisplayDate(schedule.duty_date)}</p>
                                    <p className="text-xs text-gray-600">
                                      {formatDisplayTime(schedule.start_time)} - {formatDisplayTime(schedule.end_time)}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleDeleteSchedule(schedule.id);
                                    }}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl p-6 border-2 border-gray-200 h-fit">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {editingProviderId ? 'Update Provider' : 'Add Provider'}
              </h2>

              <form onSubmit={handleProviderSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={providerForm.full_name}
                    onChange={(e) => setProviderForm(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg font-semibold text-sm focus:border-black focus:outline-none"
                    placeholder="Provider full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Service Type</label>
                  <select
                    value={providerForm.service_type}
                    onChange={(e) => setProviderForm(prev => ({ ...prev, service_type: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg font-semibold text-sm focus:border-black focus:outline-none"
                  >
                    <option value="photography">photography</option>
                    <option value="make_up_artist">make_up_artist</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Rate</label>
                  <input
                    type="number"
                    min="0"
                    value={providerForm.rate}
                    onChange={(e) => setProviderForm(prev => ({ ...prev, rate: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg font-semibold text-sm focus:border-black focus:outline-none"
                    placeholder="1500"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={providerForm.quote_required}
                    onChange={(e) => setProviderForm(prev => ({ ...prev, quote_required: e.target.checked }))}
                    className="h-4 w-4"
                  />
                  For quotation
                </label>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-black text-white rounded-lg font-bold text-sm hover:bg-gray-800 transition-colors"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Plus size={14} /> {editingProviderId ? 'Update Provider' : 'Add Provider'}
                    </span>
                  </button>
                  {editingProviderId && (
                    <button
                      type="button"
                      onClick={resetProviderForm}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="lg:col-span-3 bg-white rounded-xl p-6 border-2 border-gray-200">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Add Duty Schedule</h2>
                  <p className="text-sm text-gray-600">
                    Select a provider card above, then add one day or a date range with the same hours.
                  </p>
                </div>
                {selectedProvider && (
                  <div className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-bold text-gray-800">
                    Selected: {selectedProvider.full_name}
                  </div>
                )}
              </div>

              <form onSubmit={handleScheduleSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-3">
                <select
                  value={scheduleForm.provider_id}
                  onChange={(e) => {
                    const providerId = Number(e.target.value);
                    setScheduleForm(prev => ({ ...prev, provider_id: e.target.value }));
                    setSelectedProviderId(Number.isFinite(providerId) ? providerId : null);
                  }}
                  className="px-3 py-2 border-2 border-gray-200 rounded-lg font-semibold text-sm focus:border-black focus:outline-none"
                >
                  <option value="">Select provider</option>
                  {providers.map(provider => (
                    <option key={provider.id} value={provider.id}>
                      {provider.full_name}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={scheduleForm.start_date}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, start_date: e.target.value, end_date: prev.end_date || e.target.value }))}
                  className="px-3 py-2 border-2 border-gray-200 rounded-lg font-semibold text-sm focus:border-black focus:outline-none"
                  aria-label="Start date"
                />
                <input
                  type="date"
                  value={scheduleForm.end_date}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, end_date: e.target.value }))}
                  className="px-3 py-2 border-2 border-gray-200 rounded-lg font-semibold text-sm focus:border-black focus:outline-none"
                  aria-label="End date"
                />
                <input
                  type="time"
                  value={scheduleForm.start_time}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, start_time: e.target.value }))}
                  className="px-3 py-2 border-2 border-gray-200 rounded-lg font-semibold text-sm focus:border-black focus:outline-none"
                  aria-label="Start time"
                />
                <input
                  type="time"
                  value={scheduleForm.end_time}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, end_time: e.target.value }))}
                  className="px-3 py-2 border-2 border-gray-200 rounded-lg font-semibold text-sm focus:border-black focus:outline-none"
                  aria-label="End time"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded-lg font-bold text-sm hover:bg-gray-800 transition-colors"
                >
                  Add Duty
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 border-2 border-gray-900 max-w-md w-full mx-4 animate-slide-up">
            <h3 className="text-xl font-black text-gray-900 mb-2">Confirm Action</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to <span className="font-bold">{confirmModal.action === 'open' ? 'OPEN' : 'CLOSE'}</span> {confirmModal.formattedDate} for bookings?
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelToggle}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={confirmToggle}
                disabled={loading}
                className={`flex-1 px-4 py-3 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  confirmModal.action === 'open'
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                {loading ? 'Processing...' : (confirmModal.action === 'open' ? 'Open Date' : 'Close Date')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Toast */}
      {confirmationToast.show && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className={`px-6 py-4 rounded-xl border-2 ${
            confirmationToast.type === 'success' 
              ? 'bg-green-50 border-green-500 text-green-900' 
              : 'bg-red-50 border-red-500 text-red-900'
          } shadow-lg flex items-center gap-3`}>
            {confirmationToast.type === 'success' ? (
              <Check size={20} className="text-green-600" />
            ) : (
              <XCircle size={20} className="text-red-600" />
            )}
            <p className="font-bold text-sm">{confirmationToast.message}</p>
          </div>
        </div>
      )}

      {/* Status Change Confirmation Modal */}
      {statusChangeModal?.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 border-2 border-gray-900 max-w-md w-full mx-4 animate-slide-up">
            <h3 className="text-xl font-black text-gray-900 mb-2">Confirm Status Update</h3>
            <p className="text-gray-600 mb-6">
              Change booking status for <span className="font-bold">{statusChangeModal.customerName}</span> from{' '}
              <span className="font-bold uppercase">{statusChangeModal.currentStatus}</span> to{' '}
              <span className="font-bold uppercase">{statusChangeModal.newStatus}</span>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelStatusChange}
                disabled={statusUpdating}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                disabled={statusUpdating}
                className="flex-1 px-4 py-3 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {statusUpdating ? 'Updating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
