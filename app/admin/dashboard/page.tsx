'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Users, DollarSign, TrendingUp, LogOut, Menu, X, Eye, Check, XCircle, Camera, Edit3, Palette, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/network';

interface Booking {
  id: string;
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

interface ClosedDate {
  id: number;
  closed_date: string;
  reason?: string;
  created_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'availability'>('overview');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [dateFilter, setDateFilter] = useState<string>(''); // Empty string means show all dates
  const [confirmationToast, setConfirmationToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState<{ show: boolean; date: string; action: 'open' | 'close'; formattedDate: string }>({ show: false, date: '', action: 'open', formattedDate: '' });

  // Mock bookings data
  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: '1',
      customerName: 'John Doe',
      email: 'john@example.com',
      phone: '+63 912 345 6789',
      studio: 'Professional Studio',
      date: '2026-02-15',
      time: '1:00 PM',
      duration: '2 HR',
      price: '₱600',
      status: 'confirmed',
      services: {
        photographer: {
          enabled: true,
          name: 'Maria Santos',
        },
      }
    },
    {
      id: '2',
      customerName: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+63 923 456 7890',
      studio: 'Creative Space',
      date: '2026-02-16',
      time: '3:30 PM',
      duration: '1 HR 30 MIN',
      price: '₱450',
      status: 'pending',
      services: {
        photographer: {
          enabled: true,
          name: 'Carlos Reyes',
        },
        editor: {
          enabled: true,
          name: 'Anna Cruz',
        },
        makeupArtist: {
          enabled: true,
          name: 'Lisa Tan',
        },
      }
    },
    {
      id: '3',
      customerName: 'Mike Johnson',
      email: 'mike@example.com',
      phone: '+63 934 567 8901',
      studio: 'Grand Studio (Whole Day)',
      date: '2026-02-20',
      time: '9:00 AM',
      duration: '8 HR',
      price: '₱5000',
      status: 'completed',
      services: {}
    },
    {
      id: '4',
      customerName: 'Sarah Williams',
      email: 'sarah@example.com',
      phone: '+63 945 678 9012',
      studio: 'Professional Studio',
      date: '2026-02-18',
      time: '2:00 PM',
      duration: '1 HR 30 MIN',
      price: '₱450',
      status: 'cancelled',
      services: {
        photographer: {
          enabled: true,
          name: 'John Dela Cruz',
        },
      }
    },
  ]);

  const [closedDates, setClosedDates] = useState<ClosedDate[]>([]);
  const [currentViewDate, setCurrentViewDate] = useState(new Date(2026, 1, 1)); // February 2026
  const [loading, setLoading] = useState(false);

  // Fetch closed dates from API
  const fetchClosedDates = async () => {
    try {
      const result = await api.get('/closed-dates');
      if (result.success && result.data && Array.isArray(result.data)) {
        // Filter out any invalid entries
        const validDates = result.data.filter((item: any) => 
          item && typeof item === 'object' && item.closed_date
        );
        setClosedDates(validDates);
      }
    } catch (error) {
      console.error('Error fetching closed dates:', error);
      setClosedDates([]); // Set to empty array on error
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
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('sceneo_admin');
    router.push('/admin');
  };

  const stats = {
    totalBookings: bookings.length,
    pendingBookings: bookings.filter(b => b.status === 'pending').length,
    revenue: bookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + parseFloat(b.price.replace(/[^0-9.]/g, '')), 0),
    completionRate: Math.round((bookings.filter(b => b.status === 'completed').length / bookings.length) * 100),
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

  const updateBookingStatus = (bookingId: string, newStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled') => {
    setBookings(bookings.map(booking => 
      booking.id === bookingId ? { ...booking, status: newStatus } : booking
    ));
    
    if (selectedBooking && selectedBooking.id === bookingId) {
      setSelectedBooking({ ...selectedBooking, status: newStatus });
    }
    
    showConfirmation(`Booking status updated to ${newStatus.toUpperCase()}`, 'success');
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-black text-white border-b-2 border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 hover:bg-gray-800 rounded-lg"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <h1 className="text-2xl font-black">SCENEO ADMIN</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400 hidden sm:block">{admin.email}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition-colors"
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
                    
                    // Date filter - check if booking.date matches the selected filter date
                    const matchesDate = !dateFilter || booking.date.includes(
                      new Date(dateFilter).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    );
                    
                    return matchesStatus && matchesDate;
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
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => updateBookingStatus(selectedBooking.id, 'pending')}
                          disabled={selectedBooking.status === 'pending'}
                          className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                            selectedBooking.status === 'pending'
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                          }`}
                        >
                          Pending
                        </button>
                        <button
                          onClick={() => updateBookingStatus(selectedBooking.id, 'confirmed')}
                          disabled={selectedBooking.status === 'confirmed'}
                          className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                            selectedBooking.status === 'confirmed'
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          Confirmed
                        </button>
                        <button
                          onClick={() => updateBookingStatus(selectedBooking.id, 'completed')}
                          disabled={selectedBooking.status === 'completed'}
                          className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                            selectedBooking.status === 'completed'
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                        >
                          Completed
                        </button>
                        <button
                          onClick={() => updateBookingStatus(selectedBooking.id, 'cancelled')}
                          disabled={selectedBooking.status === 'cancelled'}
                          className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                            selectedBooking.status === 'cancelled'
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          Cancelled
                        </button>
                      </div>
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
    </div>
  );
}
