'use client';

import { Camera, Users, Clock, Award, Sparkles, Shield } from 'lucide-react';

export default function HeroDetails() {
  return (
    <div className="w-full">
      {/* Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {/* Card 1 */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-white/60">
          <div className="w-14 h-14 bg-indigo-900 rounded-xl flex items-center justify-center mb-4">
            <Camera className="w-7 h-7 text-white" />
          </div>
          <h3 className="font-bold text-xl text-slate-900 mb-2">Professional Studios</h3>
          <p className="text-slate-700">State-of-the-art equipment and lighting for every photography need</p>
        </div>

        {/* Card 2 */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-white/60">
          <div className="w-14 h-14 bg-indigo-800 rounded-xl flex items-center justify-center mb-4">
            <Users className="w-7 h-7 text-white" />
          </div>
          <h3 className="font-bold text-xl text-slate-900 mb-2">Expert Team</h3>
          <p className="text-slate-700">Experienced photographers and support staff ready to assist you</p>
        </div>

        {/* Card 3 */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-white/60">
          <div className="w-14 h-14 bg-indigo-700 rounded-xl flex items-center justify-center mb-4">
            <Clock className="w-7 h-7 text-white" />
          </div>
          <h3 className="font-bold text-xl text-slate-900 mb-2">Flexible Booking</h3>
          <p className="text-slate-700">Book hourly slots or full-day sessions that fit your schedule</p>
        </div>

        {/* Card 4 */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-white/60">
          <div className="w-14 h-14 bg-indigo-950 rounded-xl flex items-center justify-center mb-4">
            <Award className="w-7 h-7 text-white" />
          </div>
          <h3 className="font-bold text-xl text-slate-900 mb-2">Quality Guaranteed</h3>
          <p className="text-slate-700">Professional results backed by our quality assurance promise</p>
        </div>

        {/* Card 5 */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-white/60">
          <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center mb-4">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h3 className="font-bold text-xl text-slate-900 mb-2">Premium Equipment</h3>
          <p className="text-slate-700">Access to top-tier cameras, lighting, and photography gear</p>
        </div>

        {/* Card 6 */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-white/60">
          <div className="w-14 h-14 bg-indigo-500 rounded-xl flex items-center justify-center mb-4">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h3 className="font-bold text-xl text-slate-900 mb-2">Secure & Trusted</h3>
          <p className="text-slate-700">Safe payments and verified professionals you can rely on</p>
        </div>
      </div>

      {/* Feature Highlight */}
      <div className="relative bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-10 md:p-12 text-white shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-700 rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-700 rounded-full blur-3xl opacity-30" />
        
        <div className="relative z-10">
          <h3 className="text-3xl md:text-4xl font-bold mb-4">
            Complete Photography Solutions
          </h3>
          <p className="text-lg text-indigo-100 mb-8 max-w-3xl">
            From state-of-the-art studio spaces to a network of professional photographers,
            we provide comprehensive solutions to bring your creative vision to life.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl">
            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-indigo-50">
              Book hourly slots or whole-studio sessions
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-indigo-50">
              Add photographers, editors, or make-up artists
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-indigo-50">
              Manage booking history from your profile
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-indigo-50">
              Secure checkout with real-time availability
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
