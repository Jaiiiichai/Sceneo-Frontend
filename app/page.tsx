'use client';

import { useState } from 'react';
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
  X,
} from 'lucide-react';
import { useBookingType } from '@/lib/bookingContext';

const heroImage = 'https://images.unsplash.com/photo-1604014237800-1c9102c219da?auto=format&fit=crop&w=1800&q=80';

const modelPreviewImages = [
  {
    src: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=700&q=80',
    title: 'Portrait Preview',
    label: 'Soft portrait set',
  },
  {
    src: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=700&q=80',
    title: 'Studio Model',
    label: 'Editorial lighting',
  },
  {
    src: 'https://images.unsplash.com/photo-1512316609839-ce289d3eba0a?auto=format&fit=crop&w=700&q=80',
    title: 'Creative Set',
    label: 'Styled concept',
  },
  {
    src: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=700&q=80',
    title: 'Beauty Detail',
    label: 'Close-up mood',
  },
  {
    src: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?auto=format&fit=crop&w=700&q=80',
    title: 'Lifestyle Frame',
    label: 'Natural pose',
  },
  {
    src: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=700&q=80',
    title: 'Fresh Portrait',
    label: 'Clean backdrop',
  },
  {
    src: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=700&q=80',
    title: 'Soft Glam',
    label: 'Beauty session',
  },
  {
    src: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=700&q=80',
    title: 'Classic Look',
    label: 'Profile study',
  },
];

const galleryImages = [
  {
    src: 'https://images.unsplash.com/photo-1604014237800-1c9102c219da?auto=format&fit=crop&w=900&q=80',
    title: 'Portrait Set',
    description: 'Clean lighting for personal shoots and campaigns.',
    images: [
      'https://images.unsplash.com/photo-1604014237800-1c9102c219da?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    src: 'https://images.unsplash.com/photo-1502982720700-bfff97f2ecac?auto=format&fit=crop&w=900&q=80',
    title: 'Creative Sessions',
    description: 'Space for photographers, creators, and small teams.',
    images: [
      'https://images.unsplash.com/photo-1502982720700-bfff97f2ecac?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1512316609839-ce289d3eba0a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    src: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80',
    title: 'Studio Gear',
    description: 'Professional equipment ready for your booking.',
    images: [
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    src: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=900&q=80',
    title: 'Make-up Ready',
    description: 'Add make-up artists and photo support when needed.',
    images: [
      'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    src: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=900&q=80',
    title: 'Product Shoots',
    description: 'A flexible setup for products, portraits, and content.',
    images: [
      'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1502982720700-bfff97f2ecac?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    src: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=900&q=80',
    title: 'Full Studio',
    description: 'Book the whole studio for bigger productions.',
    images: [
      'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1604014237800-1c9102c219da?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
    ],
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
  { icon: Users, label: 'Add Professionals', text: 'Choose available photographers, editors, and make-up artists.' },
  { icon: Clock3, label: 'Simple Scheduling', text: 'Pick a date and time that works for your session.' },
  { icon: Sparkles, label: 'Ready to Create', text: 'A smooth booking flow from selection to payment.' },
];

const heroGalleryTileClasses = [
  'md:col-span-4 md:row-span-3',
  'md:col-span-3 md:row-span-2',
  'md:col-span-3 md:row-span-3',
  'md:col-span-2 md:row-span-2',
  'md:col-span-3 md:row-span-2',
  'md:col-span-2 md:row-span-2',
  'md:col-span-4 md:row-span-2',
  'md:col-span-3 md:row-span-2',
];

export default function Home() {
  const { setBookingType } = useBookingType();
  const [selectedScene, setSelectedScene] = useState<(typeof galleryImages)[number] | null>(null);

  return (
    <main className="overflow-x-hidden bg-[#e5e7eb] text-slate-950">
      <section className="relative min-h-[92vh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#e5e7eb] to-transparent" />

        <div className="relative z-10 mx-auto flex min-h-[92vh] max-w-7xl flex-col justify-end px-4 pb-20 pt-32 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
            <div className="text-white">
              <div className="max-w-xl">
                <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/14 px-4 py-2 text-sm font-bold text-white/85 backdrop-blur">
                  <Images size={16} />
                  Creative photo studio
                </p>
                <h2 className="text-6xl font-black leading-none tracking-tight text-white sm:text-7xl lg:text-8xl">
                  Sceneo Studio
                </h2>
                <p className="mt-4 max-w-sm text-lg font-semibold leading-7 text-white/80">
                  Curated sets, flexible bookings, and creative support for your next shoot.
                </p>
              </div>
            </div>

            <div className="text-white lg:text-right">
              <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Making Lasting Memories Accessible to Everyone.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/88 sm:text-xl lg:ml-auto">
                A studio with curated sets designed for you. Turn your imagination and fantasies into memories worth capturing.
              </p>
            </div>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-12 md:auto-rows-[96px] lg:auto-rows-[110px]">
            {modelPreviewImages.map((image, index) => (
              <div
                key={image.title}
                className={`group relative min-h-[220px] overflow-hidden rounded-lg border border-white/25 bg-white/10 shadow-xl backdrop-blur md:min-h-0 ${heroGalleryTileClasses[index]}`}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-[1.04]"
                  style={{ backgroundImage: `url(${image.src})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">{image.label}</p>
                  <h3 className={`${index === 0 ? 'text-2xl' : 'text-lg'} mt-1 font-black`}>{image.title}</h3>
                </div>
              </div>
            ))}
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

      <section id="studio-preview" className="bg-[#e5e7eb] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-teal-700">Studio Preview</p>
              <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">A gallery ready for your real photos.</h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-slate-600">
              Click any scene to view more sample photos from that area. Replace the sample URLs with your actual studio photos when they are ready.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {galleryImages.map((image) => (
              <button
                type="button"
                key={image.title}
                onClick={() => setSelectedScene(image)}
                className="group overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-left shadow-sm transition hover:-translate-y-1 hover:border-slate-400 hover:shadow-lg"
              >
                <div
                  className="h-64 bg-cover bg-center transition duration-500 group-hover:scale-[1.03]"
                  style={{ backgroundImage: `url(${image.src})` }}
                />
                <div className="p-5">
                  <h3 className="text-lg font-black">{image.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{image.description}</p>
                  <p className="mt-4 text-sm font-bold text-slate-950">View scene photos</p>
                </div>
              </button>
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

      {selectedScene && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
          <div className="max-h-[88vh] w-full max-w-6xl overflow-y-auto rounded-lg border border-white/15 bg-[#e5e7eb] shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-300 bg-[#e5e7eb]/95 p-5 backdrop-blur">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">Scene Gallery</p>
                <h3 className="mt-1 text-3xl font-black text-slate-950">{selectedScene.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{selectedScene.description}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedScene(null)}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white hover:bg-slate-800"
                aria-label="Close scene gallery"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
              {selectedScene.images.map((src) => (
                <div
                  key={`${selectedScene.title}-${src}`}
                  className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm"
                >
                  <div
                    className="h-64 bg-cover bg-center"
                    style={{ backgroundImage: `url(${src})` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

