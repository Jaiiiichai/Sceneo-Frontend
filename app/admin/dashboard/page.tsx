'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Users, CalendarDays, TrendingUp, LogOut, Eye, EyeOff, Check, XCircle, Camera, Edit3, Palette, ChevronLeft, ChevronRight, Plus, Trash2, TicketPercent, LockKeyhole, Package } from 'lucide-react';
import { api } from '@/network';

type BookingStatus = 'pending' | 'confirmed' | 'paid' | 'completed' | 'cancelled' | 'no_show';

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
  status: BookingStatus;
  services: {
    photographer?: {
      enabled: boolean;
      name: string;
      durationMinutes?: number;
      startOffsetMinutes?: number | null;
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
  packageName?: string;
  packageDetails?: {
    audienceName?: string;
    accessMinutes?: number;
    photographyMinutes?: number;
    editedPhotos?: number;
  } | null;
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
  booking_status: BookingStatus;
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
    duration_minutes?: number | null;
    start_offset_minutes?: number | null;
  }>;
  studio_package_id?: number | null;
  package_name_snapshot?: string | null;
  package_end_time?: string | null;
  package_details_snapshot?: Booking['packageDetails'];
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
  rate_30_minutes?: number | null;
  rate_60_minutes?: number | null;
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

interface PromoCode {
  id: number;
  code: string;
  description?: string | null;
  discount_type: 'fixed_price' | 'amount_off' | 'percent_off';
  discount_value: number | string;
  booking_types: string[];
  start_at?: string | null;
  end_at?: string | null;
  booking_start_date?: string | null;
  booking_end_date?: string | null;
  max_uses?: number | null;
  used_count: number;
  is_active: boolean;
}

interface BundlePackage {
  id: number;
  name: string;
  description?: string | null;
  booking_quantity: number;
  package_price: number | string;
  booking_type: 'professional_slots' | 'whole_studio';
  is_active: boolean;
  sort_order: number;
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

const formatPhotographyDuration = (durationMinutes?: number | null, startOffsetMinutes?: number | null) => {
  if (durationMinutes === 30 && Number(startOffsetMinutes || 0) === 0) return 'First 30 mins';
  if (durationMinutes === 30 && Number(startOffsetMinutes || 0) === 30) return 'Last 30 mins';
  if (durationMinutes === 60) return 'Full 1 hour';
  if (durationMinutes) return `${durationMinutes} minutes`;
  return '';
};

const mapAddonsToServices = (addons?: ApiBooking['booking_addons']) => {
  const services: Booking['services'] = {};
  if (!addons?.length) return services;

  const cleanMakeupAddonName = (currentName: string | undefined, nextName: string) => {
    if (!currentName) return nextName;

    const artistPrefix = currentName.split(' - ')[0]?.trim();
    const cleanedNextName =
      artistPrefix && nextName.startsWith(`${artistPrefix} - `)
        ? nextName.slice(artistPrefix.length + 3)
        : nextName;

    return `${currentName} • ${cleanedNextName}`;
  };

  addons.forEach((addon) => {
    if (!addon.provider_name_snapshot || !addon.service_type) return;
    const normalizedType = addon.service_type.toLowerCase();

    if (normalizedType.includes('photo')) {
      services.photographer = {
        enabled: true,
        name: addon.provider_name_snapshot,
        durationMinutes: addon.duration_minutes || undefined,
        startOffsetMinutes: addon.start_offset_minutes,
      };
    } else if (normalizedType.includes('edit')) {
      services.editor = { enabled: true, name: addon.provider_name_snapshot };
    } else if (normalizedType.includes('make')) {
      services.makeupArtist = {
        enabled: true,
        name: cleanMakeupAddonName(services.makeupArtist?.name, addon.provider_name_snapshot),
      };
    }
  });

  return services;
};

const formatServiceTypeLabel = (serviceType?: string) => {
  switch ((serviceType || '').toLowerCase()) {
    case 'photography':
      return 'Photography';
    case 'editor':
      return 'Editor';
    case 'make_up_artist':
      return 'Make-up Artist';
    default:
      return (serviceType || 'Service').split('_').join(' ');
  }
};

const formatBookingStatusLabel = (status: BookingStatus) =>
  status.split('_').join(' ').toUpperCase();

const getBookingStatusClass = (status: BookingStatus) => {
  switch (status) {
    case 'confirmed':
    case 'paid':
      return 'bg-green-100 text-green-700';
    case 'pending':
      return 'bg-orange-100 text-orange-700';
    case 'completed':
      return 'bg-blue-100 text-blue-700';
    case 'no_show':
      return 'bg-purple-100 text-purple-700';
    case 'cancelled':
    default:
      return 'bg-red-100 text-red-700';
  }
};

const formatDateTimeLocal = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

const formatDateInput = (value?: string | null) => {
  if (!value) return '';
  return value.slice(0, 10);
};

const formatPromoBookingDate = (value?: string | null) => {
  if (!value) return 'No limit';
  return formatDisplayDate(value.slice(0, 10));
};

const formatMonthKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const formatMonthLabel = (monthKey: string) => {
  if (!monthKey) return 'Selected month';
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
};

const formatPromoWindow = (value?: string | null) => {
  if (!value) return 'No limit';
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const mapApiBookingToBooking = (booking: ApiBooking): Booking => ({
  id: String(booking.id),
  rawDate: booking.booking_date,
  customerName: booking.customer_name || booking.users?.full_name || 'Unknown Customer',
  email: booking.customer_email || booking.users?.email || 'N/A',
  phone: booking.customer_phone || 'N/A',
  studio: booking.studio_package_id
    ? (booking.package_name_snapshot || 'STUDIO PACKAGE').toUpperCase()
    : booking.booking_type === 'whole_studio' || booking.booking_type === 'Whole Studio'
    ? 'WHOLE STUDIO'
    : 'STUDIO SLOT',
  date: formatDisplayDate(booking.booking_date),
  time: booking.package_end_time
    ? `${formatDisplayTime(booking.booking_time)} - ${formatDisplayTime(booking.package_end_time)}`
    : formatDisplayTime(booking.booking_time),
  duration: booking.package_details_snapshot?.accessMinutes
    ? `${booking.package_details_snapshot.accessMinutes} MIN`
    : '60 MIN',
  price: `₱${Number(booking.booking_price || 0).toLocaleString()}`,
  status: booking.booking_status,
  services: booking.booking_addons?.length
    ? mapAddonsToServices(booking.booking_addons)
    : mapProviderToServices(booking.providers),
  packageName: booking.package_name_snapshot || undefined,
  packageDetails: booking.package_details_snapshot,
});

export default function AdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'availability' | 'providers' | 'promos'>('overview');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | BookingStatus>('all');
  const [dateFilter, setDateFilter] = useState<string>(''); // Empty string means show all dates
  const [nameFilter, setNameFilter] = useState<string>('');
  const [confirmationToast, setConfirmationToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState<{ show: boolean; date: string; action: 'open' | 'close'; formattedDate: string }>({ show: false, date: '', action: 'open', formattedDate: '' });
  const [statusChangeModal, setStatusChangeModal] = useState<{ show: boolean; bookingId: string; customerName: string; currentStatus: BookingStatus; newStatus: BookingStatus } | null>(null);
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
    } catch {
      setBookings([]);
      showConfirmation('Unable to load bookings from API.', 'error');
    }
  };


  const [closedDates, setClosedDates] = useState<ClosedDate[]>([]);
  const [currentViewDate, setCurrentViewDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providerSchedules, setProviderSchedules] = useState<ProviderSchedule[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);
  const [scheduleModalProviderId, setScheduleModalProviderId] = useState<number | null>(null);
  const [scheduleModalMonth, setScheduleModalMonth] = useState(formatMonthKey(new Date()));
  const [dutyModalProviderId, setDutyModalProviderId] = useState<number | null>(null);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [providerForm, setProviderForm] = useState({
    full_name: '',
    service_type: 'photography',
    rate: '',
    rate_30_minutes: '1000',
    rate_60_minutes: '1800',
    quote_required: false,
  });
  const [scheduleForm, setScheduleForm] = useState({
    provider_id: '',
    start_date: '',
    end_date: '',
    start_time: '08:00',
    end_time: '17:00',
  });
  const [promoUnlocked, setPromoUnlocked] = useState(false);
  const [promoAdminToken, setPromoAdminToken] = useState('');
  const [promoUnlockPassword, setPromoUnlockPassword] = useState('');
  const [showPromoUnlockPassword, setShowPromoUnlockPassword] = useState(false);
  const [promoUnlocking, setPromoUnlocking] = useState(false);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [promosLoading, setPromosLoading] = useState(false);
  const [editingPromoId, setEditingPromoId] = useState<number | null>(null);
  const [bundlePackages, setBundlePackages] = useState<BundlePackage[]>([]);
  const [bundlesLoading, setBundlesLoading] = useState(false);
  const [editingBundleId, setEditingBundleId] = useState<number | null>(null);
  const [promoForm, setPromoForm] = useState({
    code: '',
    description: '',
    discount_type: 'fixed_price',
    discount_value: '88',
    booking_types: ['professional_slots'],
    start_at: '',
    end_at: '',
    booking_start_date: '',
    booking_end_date: '',
    max_uses: '',
    is_active: true,
  });
  const [bundleForm, setBundleForm] = useState({
    name: '',
    description: '',
    booking_quantity: '2',
    package_price: '1299',
    booking_type: 'professional_slots',
    sort_order: '2',
    is_active: true,
  });
  const [editingProviderId, setEditingProviderId] = useState<number | null>(null);
  const [providerDeleteModal, setProviderDeleteModal] = useState<{
    show: boolean;
    providerId: number | null;
    providerName: string;
  }>({ show: false, providerId: null, providerName: '' });
  const dutyModalProvider = providers.find(provider => provider.id === dutyModalProviderId) || null;
  const scheduleModalProvider = providers.find(provider => provider.id === scheduleModalProviderId) || null;
  const scheduleModalSchedules = scheduleModalProvider
    ? providerSchedules
        .filter(schedule => schedule.provider_id === scheduleModalProvider.id)
        .sort((a, b) => `${a.duty_date} ${a.start_time}`.localeCompare(`${b.duty_date} ${b.start_time}`))
    : [];
  const filteredScheduleModalSchedules = scheduleModalSchedules.filter(schedule =>
    schedule.duty_date?.slice(0, 7) === scheduleModalMonth
  );

  const getProviderScheduleCount = (providerId: number) =>
    providerSchedules.filter(schedule => schedule.provider_id === providerId).length;

  const selectProviderForSchedule = (provider: Provider) => {
    setSelectedProviderId(provider.id);
    setScheduleForm(prev => ({ ...prev, provider_id: String(provider.id) }));
  };

  const openProviderScheduleModal = (provider: Provider) => {
    selectProviderForSchedule(provider);
    setScheduleModalProviderId(provider.id);
    setScheduleModalMonth(formatMonthKey(new Date()));
  };

  const openDutyModal = (provider: Provider) => {
    selectProviderForSchedule(provider);
    setDutyModalProviderId(provider.id);
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
    } catch {
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
    } catch {
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
    } catch {
      setProviderSchedules([]);
      showConfirmation('Unable to load provider schedules.', 'error');
    }
  };

  const resetProviderForm = () => {
    setProviderForm({
      full_name: '',
      service_type: 'photography',
      rate: '',
      rate_30_minutes: '1000',
      rate_60_minutes: '1800',
      quote_required: false,
    });
    setEditingProviderId(null);
  };

  const handleProviderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isPhotography = providerForm.service_type === 'photography';
    const isEditor = providerForm.service_type === 'editor';
    const isMakeupArtist = providerForm.service_type === 'make_up_artist';

    if (
      !providerForm.full_name.trim() ||
      (isEditor && (!providerForm.rate || !providerForm.rate_30_minutes || !providerForm.rate_60_minutes)) ||
      (!isPhotography && !isMakeupArtist && !providerForm.rate) ||
      (isPhotography && (!providerForm.rate_30_minutes || !providerForm.rate_60_minutes))
    ) {
      showConfirmation(
        isPhotography
          ? 'Please fill in provider name, 30-minute rate, and 60-minute rate.'
          : isEditor
            ? 'Please fill in provider name and all editor package rates.'
          : isMakeupArtist
            ? 'Please fill in provider name.'
            : 'Please fill in provider name and rate.',
        'error'
      );
      return;
    }

    const payload = {
      full_name: providerForm.full_name.trim(),
      service_type: providerForm.service_type,
      rate: isPhotography ? Number(providerForm.rate_60_minutes) : isMakeupArtist ? 0 : Number(providerForm.rate),
      rate_30_minutes: isPhotography || isEditor ? Number(providerForm.rate_30_minutes) : null,
      rate_60_minutes: isPhotography || isEditor ? Number(providerForm.rate_60_minutes) : null,
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
    } catch {
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
      rate: provider.service_type === 'make_up_artist' ? '' : String(provider.rate),
      rate_30_minutes: provider.rate_30_minutes ? String(provider.rate_30_minutes) : provider.service_type === 'editor' ? '850' : '',
      rate_60_minutes: provider.rate_60_minutes ? String(provider.rate_60_minutes) : provider.service_type === 'editor' ? '1200' : '',
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
      setDutyModalProviderId(null);
      await fetchProviderSchedules();
    } catch {
      showConfirmation('Failed to save provider schedule.', 'error');
    }
  };

  const handleDeleteSchedule = async (scheduleId: number) => {
    try {
      await api.delete(`/providers/schedules/${scheduleId}`, { requiresAuth: true });
      showConfirmation('Provider duty schedule removed.', 'success');
      await fetchProviderSchedules();
    } catch {
      showConfirmation('Failed to remove provider schedule.', 'error');
    }
  };

  const requestDeleteProvider = (provider: Provider) => {
    setProviderDeleteModal({
      show: true,
      providerId: provider.id,
      providerName: provider.full_name,
    });
  };

  const cancelDeleteProvider = () => {
    setProviderDeleteModal({ show: false, providerId: null, providerName: '' });
  };

  const handleDeleteProvider = async () => {
    if (!providerDeleteModal.providerId) return;

    try {
      await api.delete(`/providers/${providerDeleteModal.providerId}`, { requiresAuth: true });
      showConfirmation('Provider deleted successfully.', 'success');
      cancelDeleteProvider();
      await fetchProviders();
    } catch {
      showConfirmation('Failed to delete provider.', 'error');
    }
  };

  const getPromoAdminHeaders = (token = promoAdminToken) => ({
    'x-promo-admin-token': token,
  });

  const fetchPromoCodes = async (token = promoAdminToken) => {
    if (!token) return;

    try {
      setPromosLoading(true);
      const result = await api.get<{ success: boolean; data?: PromoCode[] }>('/admin/promos', {
        requiresAuth: true,
        headers: getPromoAdminHeaders(token),
      });
      setPromoCodes(Array.isArray(result.data) ? result.data : []);
    } catch {
      setPromoUnlocked(false);
      setPromoAdminToken('');
      showConfirmation('Promo manager session expired. Please unlock again.', 'error');
    } finally {
      setPromosLoading(false);
    }
  };

  const fetchBundlePackages = async (token = promoAdminToken) => {
    if (!token) return;

    try {
      setBundlesLoading(true);
      const result = await api.get<{ success: boolean; data?: BundlePackage[] }>('/admin/bundle-packages', {
        requiresAuth: true,
        headers: getPromoAdminHeaders(token),
      });
      setBundlePackages(Array.isArray(result.data) ? result.data : []);
    } catch {
      setPromoUnlocked(false);
      setPromoAdminToken('');
      showConfirmation('Owner pricing session expired. Please unlock again.', 'error');
    } finally {
      setBundlesLoading(false);
    }
  };

  const handlePromoUnlock = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!promoUnlockPassword) {
      showConfirmation('Please enter the owner password.', 'error');
      return;
    }

    try {
      setPromoUnlocking(true);
      const result = await api.post<{ success: boolean; data?: { token?: string }; message?: string }>('/admin/promos/unlock', {
        password: promoUnlockPassword,
      }, { requiresAuth: true });

      const token = result.data?.token;
      if (!result.success || !token) {
        throw new Error(result.message || 'Unable to unlock promo manager.');
      }

      setPromoAdminToken(token);
      setPromoUnlocked(true);
      setPromoUnlockPassword('');
      showConfirmation('Pricing manager unlocked.', 'success');
      await Promise.all([fetchPromoCodes(token), fetchBundlePackages(token)]);
    } catch {
      showConfirmation('Invalid owner password.', 'error');
    } finally {
      setPromoUnlocking(false);
    }
  };

  const resetPromoForm = () => {
    setEditingPromoId(null);
    setPromoForm({
      code: '',
      description: '',
      discount_type: 'fixed_price',
      discount_value: '88',
      booking_types: ['professional_slots'],
      start_at: '',
      end_at: '',
      booking_start_date: '',
      booking_end_date: '',
      max_uses: '',
      is_active: true,
    });
  };

  const resetBundleForm = () => {
    setEditingBundleId(null);
    setBundleForm({
      name: '',
      description: '',
      booking_quantity: '2',
      package_price: '1299',
      booking_type: 'professional_slots',
      sort_order: '2',
      is_active: true,
    });
  };

  const buildBundlePayload = () => ({
    name: bundleForm.name.trim(),
    description: bundleForm.description.trim() || null,
    booking_quantity: Number(bundleForm.booking_quantity),
    package_price: Number(bundleForm.package_price),
    booking_type: bundleForm.booking_type,
    sort_order: Number(bundleForm.sort_order || bundleForm.booking_quantity || 0),
    is_active: bundleForm.is_active,
  });

  const handleBundleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!bundleForm.name.trim() || !bundleForm.booking_quantity || !bundleForm.package_price) {
      showConfirmation('Please enter package name, quantity, and price.', 'error');
      return;
    }

    try {
      const payload = buildBundlePayload();
      if (editingBundleId) {
        await api.put(`/admin/bundle-packages/${editingBundleId}`, payload, {
          requiresAuth: true,
          headers: getPromoAdminHeaders(),
        });
        showConfirmation('Bundle package updated.', 'success');
      } else {
        await api.post('/admin/bundle-packages', payload, {
          requiresAuth: true,
          headers: getPromoAdminHeaders(),
        });
        showConfirmation('Bundle package created.', 'success');
      }

      resetBundleForm();
      await fetchBundlePackages();
    } catch {
      showConfirmation('Failed to save bundle package. Check if that quantity already exists.', 'error');
    }
  };

  const handleEditBundle = (bundle: BundlePackage) => {
    setEditingBundleId(bundle.id);
    setBundleForm({
      name: bundle.name,
      description: bundle.description || '',
      booking_quantity: String(bundle.booking_quantity),
      package_price: String(bundle.package_price),
      booking_type: bundle.booking_type || 'professional_slots',
      sort_order: String(bundle.sort_order ?? bundle.booking_quantity),
      is_active: bundle.is_active,
    });
  };

  const handleDeleteBundle = async (bundleId: number) => {
    if (!confirm('Delete this bundle package?')) return;

    try {
      await api.delete(`/admin/bundle-packages/${bundleId}`, {
        requiresAuth: true,
        headers: getPromoAdminHeaders(),
      });
      showConfirmation('Bundle package deleted.', 'success');
      await fetchBundlePackages();
    } catch {
      showConfirmation('Failed to delete bundle package.', 'error');
    }
  };

  const handlePromoBookingTypeToggle = (bookingType: string) => {
    setPromoForm((prev) => {
      const exists = prev.booking_types.includes(bookingType);
      const bookingTypes = exists
        ? prev.booking_types.filter((type) => type !== bookingType)
        : [...prev.booking_types, bookingType];
      return { ...prev, booking_types: bookingTypes.length ? bookingTypes : ['professional_slots'] };
    });
  };

  const buildPromoPayload = () => ({
    code: promoForm.code.trim().toUpperCase(),
    description: promoForm.description.trim() || null,
    discount_type: promoForm.discount_type,
    discount_value: Number(promoForm.discount_value),
    booking_types: promoForm.booking_types,
    start_at: promoForm.start_at ? new Date(promoForm.start_at).toISOString() : null,
    end_at: promoForm.end_at ? new Date(promoForm.end_at).toISOString() : null,
    booking_start_date: promoForm.booking_start_date || null,
    booking_end_date: promoForm.booking_end_date || null,
    max_uses: promoForm.max_uses ? Number(promoForm.max_uses) : null,
    is_active: promoForm.is_active,
  });

  const handlePromoSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!promoForm.code.trim() || !promoForm.discount_value) {
      showConfirmation('Please enter a promo code and discount value.', 'error');
      return;
    }

    if (
      promoForm.booking_start_date &&
      promoForm.booking_end_date &&
      promoForm.booking_end_date < promoForm.booking_start_date
    ) {
      showConfirmation('Booking date until cannot be before booking date from.', 'error');
      return;
    }

    try {
      const payload = buildPromoPayload();
      if (editingPromoId) {
        await api.put(`/admin/promos/${editingPromoId}`, payload, {
          requiresAuth: true,
          headers: getPromoAdminHeaders(),
        });
        showConfirmation('Promo code updated.', 'success');
      } else {
        await api.post('/admin/promos', payload, {
          requiresAuth: true,
          headers: getPromoAdminHeaders(),
        });
        showConfirmation('Promo code created.', 'success');
      }

      resetPromoForm();
      await fetchPromoCodes();
    } catch {
      showConfirmation('Failed to save promo code.', 'error');
    }
  };

  const handleEditPromo = (promo: PromoCode) => {
    setEditingPromoId(promo.id);
    setPromoForm({
      code: promo.code,
      description: promo.description || '',
      discount_type: promo.discount_type,
      discount_value: String(promo.discount_value),
      booking_types: promo.booking_types?.length ? promo.booking_types : ['professional_slots'],
      start_at: formatDateTimeLocal(promo.start_at),
      end_at: formatDateTimeLocal(promo.end_at),
      booking_start_date: formatDateInput(promo.booking_start_date),
      booking_end_date: formatDateInput(promo.booking_end_date),
      max_uses: promo.max_uses ? String(promo.max_uses) : '',
      is_active: promo.is_active,
    });
  };

  const handleDeletePromo = async (promoId: number) => {
    if (!confirm('Delete this promo code?')) return;

    try {
      await api.delete(`/admin/promos/${promoId}`, {
        requiresAuth: true,
        headers: getPromoAdminHeaders(),
      });
      showConfirmation('Promo code deleted.', 'success');
      await fetchPromoCodes();
    } catch {
      showConfirmation('Failed to delete promo code.', 'error');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    if (activeTab === 'availability') {
      setCurrentViewDate(new Date());
    }
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('sceneo_admin');
    localStorage.removeItem('authToken');
    router.push('/admin');
  };

  const today = new Date();
  const todayDateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const stats = {
    totalBookings: bookings.filter(b => b.status === 'paid').length,
    pendingBookings: bookings.filter(b => b.status === 'pending').length,
    todayBookings: bookings.filter(b => b.rawDate === todayDateKey).length,
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
    } catch {
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

  const requestBookingStatusChange = (booking: Booking, newStatus: BookingStatus) => {
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

      showConfirmation(`Booking status updated to ${formatBookingStatusLabel(statusChangeModal.newStatus)}`, 'success');
      setStatusChangeModal(null);
    } catch {
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
    return <div className="min-h-screen bg-[#e5e7eb] flex items-center justify-center">
      <p className="font-semibold text-slate-700">Loading admin workspace...</p>
    </div>;
  }

  const adminInitials = (admin?.name || admin?.email || 'A')
    .split(' ')
    .map((part: string) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#e5e7eb]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#e5e7eb]/90 px-4 pt-4 backdrop-blur sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl rounded-lg border border-slate-200 bg-white/95 px-4 shadow-sm sm:px-6">
          <div className="h-16 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-700">Sceneo Studio</p>
              <h1 className="text-xl font-black text-slate-950 tracking-tight sm:text-2xl">Admin Dashboard</h1>
            </div>

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
                className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 font-semibold text-white transition-colors hover:bg-slate-800"
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
        <div className="mb-8 flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 min-w-[120px] px-6 py-3 rounded-lg font-bold transition-all ${
              activeTab === 'overview' ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex-1 min-w-[120px] px-6 py-3 rounded-lg font-bold transition-all ${
              activeTab === 'bookings' ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
            }`}
          >
            Bookings
          </button>
          <button
            onClick={() => setActiveTab('availability')}
            className={`flex-1 min-w-[120px] px-6 py-3 rounded-lg font-bold transition-all ${
              activeTab === 'availability' ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
            }`}
          >
            Availability
          </button>
          <button
            onClick={() => setActiveTab('providers')}
            className={`flex-1 min-w-[120px] px-6 py-3 rounded-lg font-bold transition-all ${
              activeTab === 'providers' ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
            }`}
          >
            Providers
          </button>
          <button
            onClick={() => setActiveTab('promos')}
            className={`flex-1 min-w-[120px] px-6 py-3 rounded-lg font-bold transition-all ${
              activeTab === 'promos' ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
            }`}
          >
            Pricing
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">Overview</p>
              <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-3xl font-black text-slate-950">Today&apos;s admin snapshot</h2>
                  <p className="mt-1 text-slate-600">Track booking activity, payment progress, and studio performance at a glance.</p>
                </div>
                <div className="rounded-lg bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700">
                  {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100">
                    <Calendar className="text-slate-700" size={22} />
                  </div>
                  <span className="text-3xl font-black text-gray-900">{stats.totalBookings}</span>
                </div>
                <p className="text-sm font-semibold text-gray-600">Paid Bookings</p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-orange-50">
                    <Users className="text-orange-600" size={22} />
                  </div>
                  <span className="text-3xl font-black text-gray-900">{stats.pendingBookings}</span>
                </div>
                <p className="text-sm font-semibold text-gray-600">Pending</p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-50">
                    <CalendarDays className="text-teal-700" size={22} />
                  </div>
                  <span className="text-3xl font-black text-gray-900">{stats.todayBookings}</span>
                </div>
                <p className="text-sm font-semibold text-gray-600">Bookings Scheduled Today</p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50">
                    <TrendingUp className="text-blue-600" size={22} />
                  </div>
                  <span className="text-3xl font-black text-gray-900">{stats.completionRate}%</span>
                </div>
                <p className="text-sm font-semibold text-gray-600">Completion Rate</p>
              </div>
            </div>

            {/* Recent Bookings */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-950">Recent Bookings</h2>
                  <p className="text-sm text-slate-600">Latest customer reservations shown first.</p>
                </div>
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Latest 3</span>
              </div>
              <div className="space-y-3">
                {bookings.slice(0, 3).map(booking => (
                  <div key={booking.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
                    <div>
                      <p className="font-bold text-gray-900">{booking.customerName}</p>
                      <p className="text-sm text-gray-600">{booking.studio} • {booking.date}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${getBookingStatusClass(booking.status)}`}>
                      {formatBookingStatusLabel(booking.status)}
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
            <div className="lg:col-span-2 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-700">Bookings</p>
                  <h2 className="text-2xl font-black text-slate-950">All Bookings</h2>
                </div>
                <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700">
                  {bookings.length} total
                </p>
              </div>
              
              {/* Date Filter */}
              <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Search by Customer Name</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={nameFilter}
                        onChange={(e) => setNameFilter(e.target.value)}
                        placeholder="Type customer name..."
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold focus:border-slate-950 focus:outline-none"
                      />
                      {nameFilter && (
                        <button
                          onClick={() => setNameFilter('')}
                          className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Filter by Date</label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold focus:border-slate-950 focus:outline-none"
                      />
                      {dateFilter && (
                        <button
                          onClick={() => setDateFilter('')}
                          className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100"
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
                </div>
              </div>
              
              {/* Status Filters */}
              <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-200 pb-4">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                    statusFilter === 'all' 
                      ? 'bg-slate-950 text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                    statusFilter === 'pending' 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setStatusFilter('confirmed')}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                    statusFilter === 'confirmed' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Confirmed
                </button>
                <button
                  onClick={() => setStatusFilter('completed')}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                    statusFilter === 'completed' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Completed
                </button>
                <button
                  onClick={() => setStatusFilter('cancelled')}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                    statusFilter === 'cancelled' 
                      ? 'bg-red-500 text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Cancelled
                </button>
                <button
                  onClick={() => setStatusFilter('no_show')}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                    statusFilter === 'no_show'
                      ? 'bg-purple-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  No Show
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
                    className="cursor-pointer rounded-lg border border-slate-200 p-4 transition-colors hover:border-slate-950 hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-bold text-gray-900">{booking.customerName}</p>
                        <p className="text-sm text-gray-600">{booking.email}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${getBookingStatusClass(booking.status)}`}>
                        {formatBookingStatusLabel(booking.status)}
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
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-28 lg:flex lg:max-h-[calc(100vh-8rem)] lg:flex-col lg:self-start lg:overflow-hidden">
              <div className="mb-4 shrink-0">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-700">Selected</p>
                <h2 className="text-2xl font-black text-slate-950">Booking Details</h2>
              </div>
              {selectedBooking ? (
                <div className="space-y-4 lg:overflow-y-auto lg:pr-2 lg:pb-2">
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Customer</p>
                    <p className="font-bold text-gray-900">{selectedBooking.customerName}</p>
                    <p className="text-sm text-gray-600">{selectedBooking.email}</p>
                    <p className="text-sm text-gray-600">{selectedBooking.phone}</p>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Studio</p>
                    <p className="font-bold text-gray-900">{selectedBooking.studio}</p>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Date & Time</p>
                    <p className="font-bold text-gray-900">{selectedBooking.date}</p>
                    <p className="text-sm text-gray-600">{selectedBooking.time} • {selectedBooking.duration}</p>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Price</p>
                    <p className="text-2xl font-black text-gray-900">{selectedBooking.price}</p>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="text-sm font-semibold text-gray-600 mb-2">Add-on Services</p>
                    {selectedBooking.services.photographer?.enabled || selectedBooking.services.editor?.enabled || selectedBooking.services.makeupArtist?.enabled ? (
                      <div className="space-y-3">
                        {selectedBooking.services.photographer?.enabled && (
                          <div className="flex items-start gap-3">
                            <Camera size={18} className="text-gray-600 mt-0.5" />
                            <div>
                              <p className="font-bold text-gray-900">Photographer</p>
                              <p className="text-sm text-gray-600">{selectedBooking.services.photographer.name}</p>
                              {selectedBooking.services.photographer.durationMinutes && (
                                <p className="text-xs font-semibold text-gray-500">
                                  {formatPhotographyDuration(
                                    selectedBooking.services.photographer.durationMinutes,
                                    selectedBooking.services.photographer.startOffsetMinutes
                                  )}
                                </p>
                              )}
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

                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="text-sm font-semibold text-gray-600 mb-2">Status</p>
                    <div className="flex flex-col gap-2">
                      <span className={`inline-block rounded-full px-3 py-1 text-center text-sm font-bold ${getBookingStatusClass(selectedBooking.status)}`}>
                        {formatBookingStatusLabel(selectedBooking.status)}
                      </span>
                      
                      <p className="mt-3 text-xs font-semibold text-gray-600">Change Status</p>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <button
                          type="button"
                          disabled={selectedBooking.status === 'completed'}
                          onClick={() => requestBookingStatusChange(selectedBooking, 'completed')}
                          className="rounded-lg bg-blue-100 px-3 py-2 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Completed
                        </button>
                        <button
                          type="button"
                          disabled={selectedBooking.status === 'cancelled'}
                          onClick={() => requestBookingStatusChange(selectedBooking, 'cancelled')}
                          className="rounded-lg bg-red-100 px-3 py-2 text-xs font-bold text-red-700 transition-colors hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Cancelled
                        </button>
                        <button
                          type="button"
                          disabled={selectedBooking.status === 'no_show'}
                          onClick={() => requestBookingStatusChange(selectedBooking, 'no_show')}
                          className="rounded-lg bg-purple-100 px-3 py-2 text-xs font-bold text-purple-700 transition-colors hover:bg-purple-200 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          No Show
                        </button>
                      </div>
                    </div>
                  </div>

                  {selectedBooking.packageDetails && (
                    <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
                      <p className="mb-2 text-sm font-semibold text-teal-800">Package Inclusions</p>
                      <div className="grid gap-1 text-sm text-teal-950">
                        <p><span className="font-bold">Group:</span> {selectedBooking.packageDetails.audienceName}</p>
                        <p><span className="font-bold">Studio access:</span> {Number(selectedBooking.packageDetails.accessMinutes || 0) / 60} hour(s)</p>
                        <p><span className="font-bold">Photography:</span> {selectedBooking.packageDetails.photographyMinutes || 0} minutes</p>
                        <p><span className="font-bold">Edited photos:</span> {selectedBooking.packageDetails.editedPhotos || 0}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                  <Eye size={48} className="text-slate-300 mx-auto mb-3" />
                  <p className="font-semibold text-slate-600">Select a booking to view details</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Availability Tab */}
        {activeTab === 'availability' && (
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-700">Availability</p>
                <h2 className="text-2xl font-black text-slate-950">Manage Studio Availability</h2>
                <p className="mt-1 text-slate-600">Click a future date to open or close it for customer booking.</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-bold">
                <span className="rounded-full bg-green-100 px-3 py-1 text-green-700">Open</span>
                <span className="rounded-full bg-red-100 px-3 py-1 text-red-700">Closed</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-500">Past</span>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Month Navigation */}
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
                <button
                  onClick={goToPreviousMonth}
                  className="rounded-lg bg-white p-2 text-slate-700 transition-colors hover:bg-slate-100"
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
                  className="rounded-lg bg-white p-2 text-slate-700 transition-colors hover:bg-slate-100"
                >
                  <ChevronRight size={24} className="text-gray-700" />
                </button>
              </div>

              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="rounded-md bg-slate-100 py-2 text-center text-xs font-bold text-slate-600">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {getDaysInMonth().map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} className="h-20 rounded-lg bg-slate-50/60" />;
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
                      className={`h-20 p-1.5 rounded-lg border text-left transition-all ${
                        isPast
                          ? 'border-slate-200 bg-slate-100 cursor-not-allowed opacity-60'
                          : isClosed
                          ? 'border-red-200 bg-red-50 hover:border-red-400'
                          : 'border-green-200 bg-green-50 hover:border-green-400'
                      } ${
                        isToday ? 'ring-2 ring-slate-950 ring-offset-1' : ''
                      }`}
                    >
                      <div className="flex h-full flex-col justify-between">
                        <span className={`text-sm font-black ${
                          isPast ? 'text-gray-400' : 'text-gray-900'
                        }`}>
                          {date.getDate()}
                        </span>
                        {!isPast && (
                          isClosed ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600"><XCircle size={12} /> Closed</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-600"><Check size={12} /> Open</span>
                          )
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 rounded-lg bg-slate-50 p-4">
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
            <div className="lg:col-span-2 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-700">Providers</p>
                  <h2 className="text-2xl font-black text-slate-950">All Providers</h2>
                  <p className="text-sm text-slate-600">Click a provider to view assigned duty schedules.</p>
                </div>
                <button
                  onClick={fetchProviders}
                  className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200"
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
                      onClick={() => openProviderScheduleModal(provider)}
                      className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                        selectedProviderId === provider.id ? 'border-slate-950 bg-slate-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-400'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold text-gray-900">{provider.full_name}</p>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                              {formatServiceTypeLabel(provider.service_type)}
                            </span>
                          </div>
                          {provider.quote_required && (
                            <p className="mt-1 text-sm font-semibold text-amber-700">For quotation</p>
                          )}
                          <p className="mt-3 text-xs font-bold text-slate-500">
                            {getProviderScheduleCount(provider.id)} scheduled duty day(s)
                          </p>
                          <p className="text-sm text-gray-600">
                            {provider.service_type === 'photography'
                              ? `Rates: 30 min ₱${Number(provider.rate_30_minutes ?? provider.rate ?? 0).toLocaleString()} / 60 min ₱${Number(provider.rate_60_minutes ?? provider.rate ?? 0).toLocaleString()}`
                              : provider.service_type === 'editor'
                                ? `Rates: 10 photos ₱${Number(provider.rate ?? 0).toLocaleString()} / 20 photos ₱${Number(provider.rate_30_minutes ?? 0).toLocaleString()} / 30 photos ₱${Number(provider.rate_60_minutes ?? 0).toLocaleString()}`
                              : provider.service_type === 'make_up_artist'
                                ? 'Package rates fixed'
                                : `Rate: ₱${Number(provider.rate).toLocaleString()}`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              openProviderScheduleModal(provider);
                            }}
                            className="px-3 py-2 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                          >
                            View Schedules
                          </button>
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              openDutyModal(provider);
                            }}
                            className="px-3 py-2 rounded-lg text-xs font-bold bg-slate-950 text-white hover:bg-slate-800 transition-colors"
                          >
                            <span className="inline-flex items-center gap-1"><Plus size={12} /> Add Duty</span>
                          </button>
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
                              requestDeleteProvider(provider);
                            }}
                            className="px-3 py-2 rounded-lg text-xs font-bold bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                          >
                            <span className="inline-flex items-center gap-1"><Trash2 size={12} /> Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="h-fit rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-700">Provider Form</p>
                <h2 className="text-2xl font-black text-slate-950">
                  {editingProviderId ? 'Update Provider' : 'Add Provider'}
                </h2>
              </div>

              <form onSubmit={handleProviderSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={providerForm.full_name}
                    onChange={(e) => setProviderForm(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold focus:border-slate-950 focus:bg-white focus:outline-none"
                    placeholder="Provider full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Service Type</label>
                  <select
                    value={providerForm.service_type}
                    onChange={(e) => setProviderForm(prev => ({
                      ...prev,
                      service_type: e.target.value,
                      rate: e.target.value === 'make_up_artist' ? '' : e.target.value === 'editor' ? '500' : prev.rate,
                      rate_30_minutes: e.target.value === 'photography' ? '1000' : e.target.value === 'editor' ? '850' : '',
                      rate_60_minutes: e.target.value === 'photography' ? '1800' : e.target.value === 'editor' ? '1200' : '',
                    }))}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold focus:border-slate-950 focus:bg-white focus:outline-none"
                  >
                    <option value="photography">Photography</option>
                    <option value="editor">Editor</option>
                    <option value="make_up_artist">Make-up Artist</option>
                  </select>
                </div>

                {providerForm.service_type === 'photography' ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">30-minute Rate</label>
                      <input
                        type="number"
                        min="0"
                        value={providerForm.rate_30_minutes}
                        onChange={(e) => setProviderForm(prev => ({ ...prev, rate_30_minutes: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold focus:border-slate-950 focus:bg-white focus:outline-none"
                        placeholder="800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">60-minute Rate</label>
                      <input
                        type="number"
                        min="0"
                        value={providerForm.rate_60_minutes}
                        onChange={(e) => setProviderForm(prev => ({ ...prev, rate_60_minutes: e.target.value, rate: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold focus:border-slate-950 focus:bg-white focus:outline-none"
                        placeholder="1500"
                      />
                    </div>
                  </div>
                ) : providerForm.service_type === 'editor' ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">10-photo Rate</label>
                      <input
                        type="number"
                        min="0"
                        value={providerForm.rate}
                        onChange={(e) => setProviderForm(prev => ({ ...prev, rate: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold focus:border-slate-950 focus:bg-white focus:outline-none"
                        placeholder="500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">20-photo Rate</label>
                      <input
                        type="number"
                        min="0"
                        value={providerForm.rate_30_minutes}
                        onChange={(e) => setProviderForm(prev => ({ ...prev, rate_30_minutes: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold focus:border-slate-950 focus:bg-white focus:outline-none"
                        placeholder="850"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">30-photo Rate</label>
                      <input
                        type="number"
                        min="0"
                        value={providerForm.rate_60_minutes}
                        onChange={(e) => setProviderForm(prev => ({ ...prev, rate_60_minutes: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold focus:border-slate-950 focus:bg-white focus:outline-none"
                        placeholder="1200"
                      />
                    </div>
                  </div>
                ) : providerForm.service_type === 'make_up_artist' ? (
                  <div className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-3 text-sm font-semibold text-rose-900">
                    HMUA package rates are fixed in checkout. Add only the artist name and duty schedules here.
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Rate</label>
                    <input
                      type="number"
                      min="0"
                      value={providerForm.rate}
                      onChange={(e) => setProviderForm(prev => ({ ...prev, rate: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold focus:border-slate-950 focus:bg-white focus:outline-none"
                      placeholder="1500"
                    />
                  </div>
                )}

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

            {dutyModalProvider && (
              <div
                className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 px-4 py-6"
                onClick={() => setDutyModalProviderId(null)}
              >
                <div
                  className="w-full max-w-2xl rounded-lg bg-white shadow-2xl"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-700">Duty Calendar</p>
                      <h3 className="text-2xl font-black text-slate-950">Add Duty Schedule</h3>
                      <p className="text-sm text-slate-600">
                        Add one day or a date range with the same working hours.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDutyModalProviderId(null)}
                      className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950"
                      aria-label="Close add duty modal"
                    >
                      <XCircle size={22} />
                    </button>
                  </div>

                  <form onSubmit={handleScheduleSubmit} className="space-y-4 p-5">
                    <div>
                      <label className="mb-1 block text-sm font-bold text-slate-700">Provider</label>
                      <select
                        value={scheduleForm.provider_id}
                        onChange={(e) => {
                          const providerId = Number(e.target.value);
                          setScheduleForm(prev => ({ ...prev, provider_id: e.target.value }));
                          setSelectedProviderId(Number.isFinite(providerId) ? providerId : null);
                          setDutyModalProviderId(Number.isFinite(providerId) ? providerId : null);
                        }}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold focus:border-slate-950 focus:bg-white focus:outline-none"
                      >
                        <option value="">Select provider</option>
                        {providers.map(provider => (
                          <option key={provider.id} value={provider.id}>
                            {provider.full_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-bold text-slate-700">Start Date</label>
                        <input
                          type="date"
                          value={scheduleForm.start_date}
                          onChange={(e) => setScheduleForm(prev => ({ ...prev, start_date: e.target.value, end_date: prev.end_date || e.target.value }))}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold focus:border-slate-950 focus:bg-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-bold text-slate-700">End Date</label>
                        <input
                          type="date"
                          value={scheduleForm.end_date}
                          onChange={(e) => setScheduleForm(prev => ({ ...prev, end_date: e.target.value }))}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold focus:border-slate-950 focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-bold text-slate-700">Start Time</label>
                        <input
                          type="time"
                          value={scheduleForm.start_time}
                          onChange={(e) => setScheduleForm(prev => ({ ...prev, start_time: e.target.value }))}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold focus:border-slate-950 focus:bg-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-bold text-slate-700">End Time</label>
                        <input
                          type="time"
                          value={scheduleForm.end_time}
                          onChange={(e) => setScheduleForm(prev => ({ ...prev, end_time: e.target.value }))}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold focus:border-slate-950 focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={() => setDutyModalProviderId(null)}
                        className="rounded-lg bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-lg bg-slate-950 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-800"
                      >
                        <span className="inline-flex items-center gap-2"><Plus size={14} /> Add Duty</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {scheduleModalProvider && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6"
                onClick={() => setScheduleModalProviderId(null)}
              >
                <div
                  className="flex max-h-[88vh] w-full max-w-3xl flex-col rounded-lg bg-white shadow-2xl"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-700">
                        Provider Schedule
                      </p>
                      <h3 className="text-2xl font-black text-slate-950">{scheduleModalProvider.full_name}</h3>
                      <p className="text-sm text-slate-600">
                        {formatServiceTypeLabel(scheduleModalProvider.service_type)} · {scheduleModalSchedules.length} assigned duty day(s)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setScheduleModalProviderId(null)}
                      className="self-end rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950 sm:self-start"
                      aria-label="Close schedule modal"
                    >
                      <XCircle size={22} />
                    </button>
                  </div>

                  <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-950">{formatMonthLabel(scheduleModalMonth)}</p>
                      <p className="text-xs text-slate-500">
                        {filteredScheduleModalSchedules.length} duty day(s) in this month
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        type="month"
                        value={scheduleModalMonth}
                        onChange={(event) => setScheduleModalMonth(event.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 focus:border-slate-950 focus:outline-none"
                        aria-label="Filter schedules by month"
                      />
                      <button
                        type="button"
                        onClick={() => openDutyModal(scheduleModalProvider)}
                        className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-slate-800"
                      >
                        <span className="inline-flex items-center gap-2"><Plus size={14} /> Add Duty</span>
                      </button>
                    </div>
                  </div>

                  <div className="overflow-y-auto p-4">
                    {filteredScheduleModalSchedules.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                        <CalendarDays size={38} className="mx-auto mb-3 text-slate-300" />
                        <p className="font-bold text-slate-700">No duty schedules for this month</p>
                        <p className="mt-1 text-sm text-slate-500">Choose another month or add a duty schedule.</p>
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-lg border border-slate-200">
                        {filteredScheduleModalSchedules.map((schedule, index) => (
                          <div
                            key={schedule.id}
                            className={`grid gap-3 bg-white p-4 sm:grid-cols-[1fr_auto] sm:items-center ${
                              index === 0 ? '' : 'border-t border-slate-100'
                            }`}
                          >
                            <div>
                              <p className="font-black text-slate-950">{formatDisplayDate(schedule.duty_date)}</p>
                              <p className="mt-1 text-sm font-semibold text-slate-600">
                                {formatDisplayTime(schedule.start_time)} - {formatDisplayTime(schedule.end_time)}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteSchedule(schedule.id)}
                              className="rounded-lg bg-red-100 px-3 py-2 text-xs font-bold text-red-700 transition-colors hover:bg-red-200"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Promo Codes Tab */}
        {activeTab === 'promos' && (
          <div className="space-y-6">
            {!promoUnlocked ? (
              <div className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-950 text-white">
                    <LockKeyhole size={22} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-rose-700">Owner Access</p>
                    <h2 className="text-2xl font-black text-slate-950">Unlock Pricing Manager</h2>
                    <p className="text-sm text-slate-600">Enter the owner password to manage promo codes and bundle packages.</p>
                  </div>
                </div>

                <form onSubmit={handlePromoUnlock} className="space-y-4">
                  <div className="relative">
                    <input
                      type={showPromoUnlockPassword ? 'text' : 'password'}
                      value={promoUnlockPassword}
                      onChange={(event) => setPromoUnlockPassword(event.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 pr-12 font-semibold focus:border-slate-950 focus:bg-white focus:outline-none"
                      placeholder="Owner password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPromoUnlockPassword((value) => !value)}
                      className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-950"
                      aria-label={showPromoUnlockPassword ? 'Hide owner password' : 'Show owner password'}
                    >
                      {showPromoUnlockPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={promoUnlocking}
                    className="w-full rounded-lg bg-slate-950 px-4 py-3 font-bold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {promoUnlocking ? 'Unlocking...' : 'Unlock Pricing Manager'}
                  </button>
                </form>
              </div>
            ) : (
              <>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-700">Promo Codes</p>
                      <h2 className="text-2xl font-black text-slate-950">Active Promo Library</h2>
                      <p className="text-sm text-slate-600">Create, edit, deactivate, or remove promo codes for checkout.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => fetchPromoCodes()}
                      className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200"
                    >
                      Refresh
                    </button>
                  </div>

                  {promosLoading ? (
                    <p className="text-sm font-semibold text-slate-600">Loading promo codes...</p>
                  ) : promoCodes.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                      <TicketPercent size={44} className="mx-auto mb-3 text-slate-300" />
                      <p className="font-semibold text-slate-600">No promo codes yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {promoCodes.map((promo) => (
                        <div key={promo.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-lg font-black text-slate-950">{promo.code}</p>
                                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                                  promo.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
                                }`}>
                                  {promo.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                              <p className="mt-1 text-sm text-slate-600">{promo.description || 'No description'}</p>
                              <div className="mt-3 grid gap-2 text-xs font-bold text-slate-600 sm:grid-cols-2">
                                <span>Discount: {promo.discount_type.replaceAll('_', ' ')} - {Number(promo.discount_value).toLocaleString()}</span>
                                <span>Uses: {promo.used_count}{promo.max_uses ? ` / ${promo.max_uses}` : ''}</span>
                                <span>Starts: {formatPromoWindow(promo.start_at)}</span>
                                <span>Ends: {formatPromoWindow(promo.end_at)}</span>
                                <span>Booking from: {formatPromoBookingDate(promo.booking_start_date)}</span>
                                <span>Booking until: {formatPromoBookingDate(promo.booking_end_date)}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleEditPromo(promo)}
                                className="rounded-lg bg-blue-100 px-3 py-2 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-200"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePromo(promo.id)}
                                className="rounded-lg bg-red-100 px-3 py-2 text-xs font-bold text-red-700 transition-colors hover:bg-red-200"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="h-fit rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-700">Promo Form</p>
                    <h2 className="text-2xl font-black text-slate-950">{editingPromoId ? 'Update Promo' : 'Add Promo'}</h2>
                  </div>

                  <form onSubmit={handlePromoSubmit} className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-bold text-slate-700">Code</label>
                      <input
                        value={promoForm.code}
                        onChange={(event) => setPromoForm(prev => ({ ...prev, code: event.target.value.toUpperCase() }))}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold uppercase focus:border-slate-950 focus:bg-white focus:outline-none"
                        placeholder="GRAND88"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-bold text-slate-700">Description</label>
                      <input
                        value={promoForm.description}
                        onChange={(event) => setPromoForm(prev => ({ ...prev, description: event.target.value }))}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold focus:border-slate-950 focus:bg-white focus:outline-none"
                        placeholder="Grand opening promo"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-sm font-bold text-slate-700">Discount Type</label>
                        <select
                          value={promoForm.discount_type}
                          onChange={(event) => setPromoForm(prev => ({ ...prev, discount_type: event.target.value }))}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold focus:border-slate-950 focus:bg-white focus:outline-none"
                        >
                          <option value="fixed_price">Fixed price</option>
                          <option value="amount_off">Amount off</option>
                          <option value="percent_off">Percent off</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-bold text-slate-700">Value</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={promoForm.discount_value}
                          onChange={(event) => setPromoForm(prev => ({ ...prev, discount_value: event.target.value }))}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold focus:border-slate-950 focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-700">Booking Types</label>
                      <div className="space-y-2 rounded-lg bg-slate-50 p-3">
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <input
                            type="checkbox"
                            checked={promoForm.booking_types.includes('professional_slots')}
                            onChange={() => handlePromoBookingTypeToggle('professional_slots')}
                          />
                          Studio Slot
                        </label>
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <input
                            type="checkbox"
                            checked={promoForm.booking_types.includes('whole_studio')}
                            onChange={() => handlePromoBookingTypeToggle('whole_studio')}
                          />
                          Whole Studio
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="mb-1 block text-sm font-bold text-slate-700">Promo Active Start</label>
                        <input
                          type="datetime-local"
                          value={promoForm.start_at}
                          onChange={(event) => setPromoForm(prev => ({ ...prev, start_at: event.target.value }))}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold focus:border-slate-950 focus:bg-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-bold text-slate-700">Promo Active End</label>
                        <input
                          type="datetime-local"
                          value={promoForm.end_at}
                          onChange={(event) => setPromoForm(prev => ({ ...prev, end_at: event.target.value }))}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold focus:border-slate-950 focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-bold text-slate-700">Booking Date From</label>
                        <input
                          type="date"
                          value={promoForm.booking_start_date}
                          onChange={(event) => setPromoForm(prev => ({ ...prev, booking_start_date: event.target.value }))}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold focus:border-slate-950 focus:bg-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-bold text-slate-700">Booking Date Until</label>
                        <input
                          type="date"
                          value={promoForm.booking_end_date}
                          onChange={(event) => setPromoForm(prev => ({ ...prev, booking_end_date: event.target.value }))}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold focus:border-slate-950 focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-bold text-slate-700">Max Uses</label>
                      <input
                        type="number"
                        min="1"
                        value={promoForm.max_uses}
                        onChange={(event) => setPromoForm(prev => ({ ...prev, max_uses: event.target.value }))}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold focus:border-slate-950 focus:bg-white focus:outline-none"
                        placeholder="Leave blank for unlimited"
                      />
                    </div>

                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={promoForm.is_active}
                        onChange={(event) => setPromoForm(prev => ({ ...prev, is_active: event.target.checked }))}
                      />
                      Active
                    </label>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        className="flex-1 rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-slate-800"
                      >
                        {editingPromoId ? 'Update Promo' : 'Add Promo'}
                      </button>
                      {editingPromoId && (
                        <button
                          type="button"
                          onClick={resetPromoForm}
                          className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-700">Bundle Packages</p>
                    <h2 className="text-2xl font-black text-slate-950">Multi-slot Package Pricing</h2>
                    <p className="text-sm text-slate-600">Set the customer-facing package name, quantity, and package price. Active bundles apply automatically at checkout.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fetchBundlePackages()}
                    className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200"
                  >
                    Refresh
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.7fr]">
                  <div>
                    {bundlesLoading ? (
                      <p className="text-sm font-semibold text-slate-600">Loading bundle packages...</p>
                    ) : bundlePackages.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                        <Package size={44} className="mx-auto mb-3 text-slate-300" />
                        <p className="font-semibold text-slate-600">No bundle packages yet</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {bundlePackages.map((bundle) => (
                          <div key={bundle.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-lg font-black text-slate-950">{bundle.name}</p>
                                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                                    bundle.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
                                  }`}>
                                    {bundle.is_active ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
                                <p className="mt-1 text-sm text-slate-600">{bundle.description || 'No description'}</p>
                                <div className="mt-3 grid gap-2 text-xs font-bold text-slate-600 sm:grid-cols-2">
                                  <span>Quantity: {bundle.booking_quantity} bookings</span>
                                  <span>Price: PHP {Number(bundle.package_price || 0).toLocaleString()}</span>
                                  <span>Type: {bundle.booking_type === 'whole_studio' ? 'Whole Studio' : 'Studio Slot'}</span>
                                  <span>Sort: {bundle.sort_order}</span>
                                </div>
                              </div>
                              <div className="flex flex-shrink-0 gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleEditBundle(bundle)}
                                  className="rounded-lg bg-blue-100 px-3 py-2 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-200"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteBundle(bundle.id)}
                                  className="rounded-lg bg-red-100 px-3 py-2 text-xs font-bold text-red-700 transition-colors hover:bg-red-200"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleBundleSubmit} className="h-fit rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-700">Bundle Form</p>
                    <h3 className="mt-1 text-xl font-black text-slate-950">{editingBundleId ? 'Update Bundle' : 'Add Bundle'}</h3>

                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="mb-1 block text-sm font-bold text-slate-700">Package Name</label>
                        <input
                          value={bundleForm.name}
                          onChange={(event) => setBundleForm(prev => ({ ...prev, name: event.target.value }))}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold focus:border-slate-950 focus:outline-none"
                          placeholder="2 Slot Bundle"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-bold text-slate-700">Description</label>
                        <textarea
                          value={bundleForm.description}
                          onChange={(event) => setBundleForm(prev => ({ ...prev, description: event.target.value }))}
                          className="min-h-20 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold focus:border-slate-950 focus:outline-none"
                          placeholder="Package price for multiple studio slots."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-sm font-bold text-slate-700">Bookings</label>
                          <input
                            type="number"
                            min="2"
                            value={bundleForm.booking_quantity}
                            onChange={(event) => setBundleForm(prev => ({ ...prev, booking_quantity: event.target.value, sort_order: prev.sort_order || event.target.value }))}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold focus:border-slate-950 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-bold text-slate-700">Package Price</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={bundleForm.package_price}
                            onChange={(event) => setBundleForm(prev => ({ ...prev, package_price: event.target.value }))}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold focus:border-slate-950 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-sm font-bold text-slate-700">Booking Type</label>
                          <select
                            value={bundleForm.booking_type}
                            onChange={(event) => setBundleForm(prev => ({ ...prev, booking_type: event.target.value }))}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold focus:border-slate-950 focus:outline-none"
                          >
                            <option value="professional_slots">Studio Slot</option>
                            <option value="whole_studio">Whole Studio</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-bold text-slate-700">Sort Order</label>
                          <input
                            type="number"
                            value={bundleForm.sort_order}
                            onChange={(event) => setBundleForm(prev => ({ ...prev, sort_order: event.target.value }))}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold focus:border-slate-950 focus:outline-none"
                          />
                        </div>
                      </div>

                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={bundleForm.is_active}
                          onChange={(event) => setBundleForm(prev => ({ ...prev, is_active: event.target.checked }))}
                        />
                        Active
                      </label>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="submit"
                          className="flex-1 rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-slate-800"
                        >
                          {editingBundleId ? 'Update Bundle' : 'Add Bundle'}
                        </button>
                        {editingBundleId && (
                          <button
                            type="button"
                            onClick={resetBundleForm}
                            className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-100"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </form>
                </div>
              </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md animate-slide-up rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/15">
            <h3 className="text-xl font-black text-gray-900 mb-2">Confirm Action</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to <span className="font-bold">{confirmModal.action === 'open' ? 'OPEN' : 'CLOSE'}</span> {confirmModal.formattedDate} for bookings?
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelToggle}
                disabled={loading}
                className="flex-1 rounded-lg bg-slate-100 px-4 py-3 font-bold text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
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

      {providerDeleteModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md animate-slide-up rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/15">
            <h3 className="mb-2 text-xl font-black text-gray-900">Delete Provider?</h3>
            <p className="mb-6 text-gray-600">
              Are you sure you want to delete <span className="font-bold">{providerDeleteModal.providerName}</span>? Existing bookings will not be removed, but this provider will no longer be available.
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelDeleteProvider}
                disabled={providersLoading}
                className="flex-1 rounded-lg bg-slate-100 px-4 py-3 font-bold text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProvider}
                disabled={providersLoading}
                className="flex-1 rounded-lg bg-red-600 px-4 py-3 font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {providersLoading ? 'Deleting...' : 'Delete Provider'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Toast */}
      {confirmationToast.show && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className={`rounded-lg border px-6 py-4 ${
            confirmationToast.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-900' 
              : 'bg-red-50 border-red-200 text-red-900'
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
          <div className="mx-4 w-full max-w-md animate-slide-up rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/15">
            <h3 className="text-xl font-black text-gray-900 mb-2">Confirm Status Update</h3>
            <p className="text-gray-600 mb-6">
              Change booking status for <span className="font-bold">{statusChangeModal.customerName}</span> from{' '}
              <span className="font-bold">{formatBookingStatusLabel(statusChangeModal.currentStatus)}</span> to{' '}
              <span className="font-bold">{formatBookingStatusLabel(statusChangeModal.newStatus)}</span>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelStatusChange}
                disabled={statusUpdating}
                className="flex-1 rounded-lg bg-slate-100 px-4 py-3 font-bold text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                disabled={statusUpdating}
                className="flex-1 rounded-lg bg-slate-950 px-4 py-3 font-bold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
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

