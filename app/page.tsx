'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  CalendarCheck,
  Camera,
  CheckCircle2,
  Clock3,
  Images,
  Sparkles,
  Users,
} from 'lucide-react';
import { useBookingType } from '@/lib/bookingContext';

const galleryImages = [
  {
    src: 'https://images.unsplash.com/photo-1604014237800-1c9102c219da?auto=format&fit=crop&w=900&q=80',
    title: 'Portrait Set',
    description: 'Clean lighting for personal shoots and campaigns.',
  },
  {
    src: 'https://images.unsplash.com/photo-1502982720700-bfff97f2ecac?auto=format&fit=crop&w=900&q=80',
    title: 'Creative Sessions',
    description: 'Space for photographers, creators, and small teams.',
  },
  {
    src: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80',
    title: 'Studio Gear',
    description: 'Professional equipment ready for your booking.',
  },
  {
    src: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=900&q=80',
    title: 'Make-up Ready',
    description: 'Add make-up artists and photo support when needed.',
  },
  {
    src: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=900&q=80',
    title: 'Product Shoots',
    description: 'A flexible setup for products, portraits, and content.',
  },
  {
    src: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=900&q=80',
    title: 'Full Studio',
    description: 'Book the whole studio for bigger productions.',
  },
];

const bookingOptions = [
  {
    title: 'Book a Slot',
    description: 'Reserve a scheduled studio slot for portraits, products, content, or quick creative sessions.',
    href: '/pages/booking?bookingType=slot',
    type: 'slot' as const,
    icon: CalendarCheck,
    action: 'Choose a Slot',
  },
  {
    title: 'Whole Studio',
    description: 'Get exclusive access to the space for productions, events, team shoots, and longer sessions.',
    href: '/pages/booking?bookingType=whole_studio',
    type: 'whole_studio' as const,
    icon: Building2,
    action: 'Book Whole Studio',
  },
];

const serviceHighlights = [
  { icon: Camera, label: 'Studio Shoots', text: 'Clean setups for portraits, products, and content.' },
  { icon: Users, label: 'Add Professionals', text: 'Choose available photographers and make-up artists.' },
  { icon: Clock3, label: 'Simple Scheduling', text: 'Pick a date and time that works for your session.' },
  { icon: Sparkles, label: 'Ready to Create', text: 'A smooth booking flow from selection to payment.' },
];

export default function Home() {
  const { setBookingType } = useBookingType();
  const heroImage = galleryImages[0].src;

  return (
    <main className="overflow-x-hidden bg-[#f7f7f4] text-slate-950">
      <section className="relative min-h-[92vh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-black/48" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#f7f7f4] to-transparent" />

        <div className="relative z-10 mx-auto flex min-h-[92vh] max-w-7xl flex-col justify-end px-4 pb-14 pt-32 sm:px-6 lg:px-8">
          <div className="max-w-4xl text-white">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur">
              <Images size={16} />
              Sceneo Studio
            </p>
            <h1 className="text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl">
              Making Lasting Memories Accessible to Everyone.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/88 sm:text-xl">
              Book studio space, add available photographers or make-up artists, and preview the kind of creative work your session can become.
            </p>
          </div>

          <div className="mt-10 grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-2">
            {bookingOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Link
                  key={option.title}
                  href={option.href}
                  onClick={() => setBookingType(option.type)}
                  className="group rounded-lg border border-white/25 bg-white/92 p-5 text-slate-950 shadow-xl backdrop-blur transition hover:-translate-y-0.5 hover:bg-white"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white">
                      <Icon size={24} />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-xl font-black">{option.title}</h2>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{option.description}</p>
                      <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold">
                        {option.action}
                        <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-rose-700">Booking Options</p>
              <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Choose the setup that fits your shoot.</h2>
            </div>
            <p className="text-lg leading-8 text-slate-600">
              Keep it simple with a scheduled slot, or reserve the whole studio when you need more room, more time, or a private production setup.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
            {bookingOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Link
                  key={option.title}
                  href={option.href}
                  onClick={() => setBookingType(option.type)}
                  className="group rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-950 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#0e1726] text-white">
                      <Icon size={24} />
                    </div>
                    <ArrowRight size={20} className="transition group-hover:translate-x-1" />
                  </div>
                  <h3 className="mt-6 text-2xl font-black">{option.title}</h3>
                  <p className="mt-3 leading-7 text-slate-600">{option.description}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-teal-700">Studio Preview</p>
              <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">A gallery ready for your real photos.</h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-slate-600">
              Replace the dummy image URLs in `galleryImages` with your actual studio photos when they are ready.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {galleryImages.map((image, index) => (
              <article
                key={image.title}
                className={`group overflow-hidden rounded-lg border border-slate-200 bg-slate-50 ${
                  index === 0 ? 'sm:col-span-2' : ''
                }`}
              >
                <div
                  className={`bg-cover bg-center transition duration-500 group-hover:scale-[1.03] ${
                    index === 0 ? 'h-80' : 'h-64'
                  }`}
                  style={{ backgroundImage: `url(${image.src})` }}
                />
                <div className="p-5">
                  <h3 className="text-lg font-black">{image.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{image.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {serviceHighlights.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-100 text-amber-900">
                    <Icon size={22} />
                  </div>
                  <h3 className="mt-5 text-lg font-black">{item.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <CheckCircle2 className="mx-auto mb-5 h-10 w-10 text-teal-300" />
          <h2 className="text-4xl font-black tracking-tight sm:text-5xl">Ready to book your session?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-white/72">
            Pick your booking type, choose your schedule, and add the support you need for the shoot.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/pages/booking?bookingType=slot"
              onClick={() => setBookingType('slot')}
              className="rounded-lg bg-white px-6 py-3 font-bold text-slate-950 transition hover:bg-slate-100"
            >
              Book a Slot
            </Link>
            <Link
              href="/pages/booking?bookingType=whole_studio"
              onClick={() => setBookingType('whole_studio')}
              className="rounded-lg border border-white/30 px-6 py-3 font-bold text-white transition hover:bg-white/10"
            >
              Book Whole Studio
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
