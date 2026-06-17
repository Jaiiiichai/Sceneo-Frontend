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
    src: '/assets/main8/6.JPG',
    title: 'Portrait Preview',
    label: 'Sceneo sample set',
    position: 'center',
  },
  {
    src: '/assets/main8/1.jpg',
    title: 'Studio Model',
    label: 'Editorial lighting',
    position: 'center 18%',
  },
  {
    src: '/assets/main8/2.jpg',
    title: 'Creative Set',
    label: 'Styled concept',
    position: 'center 20%',
  },
  {
    src: '/assets/main8/3.jpg',
    title: 'Beauty Detail',
    label: 'Close-up mood',
    position: 'center 16%',
  },
  {
    src: '/assets/main8/8.JPG',
    title: 'Lifestyle Frame',
    label: 'Natural pose',
    position: 'center 18%',
  },
  {
    src: '/assets/main8/5.JPG',
    title: 'Fresh Portrait',
    label: 'Clean backdrop',
    position: 'center 16%',
  },
  {
    src: '/assets/main8/4.jpg',
    title: 'Soft Glam',
    label: 'Beauty session',
    position: 'center 18%',
  },
  {
    src: '/assets/main8/7.JPG',
    title: 'Classic Look',
    label: 'Profile study',
    position: 'center 18%',
  },
];

const sceneFolders = [
  {
    folder: 'Scene1-Disco Fever',
    title: 'Disco Fever',
    files: ['1.JPG', '2.jpg', '3.jpg', '4.JPG', '5.JPG', '6.JPG', '7.jpg'],
  },
  {
    folder: 'Scene2-Crimson Desire',
    title: 'Crimson Desire',
    files: ['1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg', '6.JPG'],
  },
  {
    folder: 'Scene3-Timeless Canvas',
    title: 'Timeless Canvas',
    files: ['1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg', '6.jpg', '7.jpg', '8.jpg'],
  },
  {
    folder: 'Scene4-Golden Hour',
    title: 'Golden Hour',
    files: ['1.jpg', '2.jpg', '3.JPG', '4.JPG'],
  },
  {
    folder: 'Scene5-Secret Garden',
    title: 'Secret Garden',
    files: ['1.jpg', '2.jpg', '3.jpg'],
  },
  {
    folder: 'Scene6-Emerald Woods',
    title: 'Emerald Woods',
    files: ['1.JPG', '2.jpg', '3.JPG', '4.jpg'],
  },
  {
    folder: 'Scene7-Celestial Rose',
    title: 'Celestial Rose',
    files: ['1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg', '6.jpg', '7.jpg'],
  },
  {
    folder: 'Scene8-Barbie',
    title: 'Barbie',
    files: ['1.jpg', '2.JPG'],
  },
  {
    folder: 'Scene9-Royal Velvet',
    title: 'Royal Velvet',
    files: ['1.JPG'],
  },
  {
    folder: 'Scene10-Botanical Haven',
    title: 'Botanical Haven',
    files: ['1.jpg'],
  },
];

const galleryImages = sceneFolders.map((scene) => {
  const paths = scene.files.map((file) => `/assets/scenes/${scene.folder}/${file}`);

  return {
    title: scene.title,
    src: paths[0],
    images: paths.slice(1).length > 0 ? paths.slice(1) : paths,
  };
});

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

const heroGalleryColumns = [
  {
    className: 'lg:basis-[32%]',
    tiles: [
      { imageIndex: 0, aspect: 'aspect-[16/11]' },
      { imageIndex: 4, aspect: 'aspect-[4/5]' },
    ],
  },
  {
    className: 'lg:basis-[23%]',
    tiles: [
      { imageIndex: 1, aspect: 'aspect-[4/5]' },
      { imageIndex: 5, aspect: 'aspect-[3/4]' },
    ],
  },
  {
    className: 'lg:basis-[26%]',
    tiles: [
      { imageIndex: 2, aspect: 'aspect-[4/5]' },
      { imageIndex: 6, aspect: 'aspect-[16/11]' },
    ],
  },
  {
    className: 'lg:basis-[19%]',
    tiles: [
      { imageIndex: 3, aspect: 'aspect-[4/5]' },
      { imageIndex: 7, aspect: 'aspect-[4/5]' },
    ],
  },
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

          <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:flex lg:items-start lg:gap-6">
            {heroGalleryColumns.map((column, columnIndex) => (
              <div key={columnIndex} className={`flex min-w-0 flex-col gap-5 lg:gap-6 ${column.className}`}>
                {column.tiles.map((tile) => {
                  const image = modelPreviewImages[tile.imageIndex];

                  return (
                    <div
                      key={image.title}
                      className={`group relative overflow-hidden rounded-lg border border-white/25 bg-white/10 shadow-xl backdrop-blur ${tile.aspect}`}
                    >
                      <div
                        className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-[1.04]"
                        style={{
                          backgroundImage: `url(${image.src})`,
                          backgroundPosition: image.position,
                        }}
                      />
                    </div>
                  );
                })}
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
              Click any scene to view more sample photos from that area.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {galleryImages.map((image) => (
              <button
                type="button"
                key={image.title}
                onClick={() => setSelectedScene(image)}
                className="group overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-left shadow-sm transition hover:-translate-y-1 hover:border-slate-400 hover:shadow-lg"
              >
                <div
                  className="aspect-[3/4] bg-cover bg-center transition duration-500 group-hover:scale-[1.03]"
                  style={{ backgroundImage: `url("${image.src}")` }}
                />
                <div className="p-5">
                  <h3 className="text-lg font-black">{image.title}</h3>
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
                    className="aspect-[3/4] bg-cover bg-center"
                    style={{ backgroundImage: `url("${src}")` }}
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

