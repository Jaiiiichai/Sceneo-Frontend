'use client';

import { usePathname } from 'next/navigation';
import Iridescence from '@/components/Iridescence';

export default function UserIridescenceBackground() {
  const pathname = usePathname();

  if (!pathname) return null;

  const isAdminRoute = pathname.startsWith('/admin');
  const isHomeRoute = pathname === '/';

  if (isAdminRoute || isHomeRoute) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <Iridescence
        color={[0.5, 0.6, 0.8]}
        mouseReact
        amplitude={0.1}
        speed={1}
        className="absolute inset-0 w-full h-full"
      />
      <div className="absolute inset-0 bg-white/35" />
    </div>
  );
}
