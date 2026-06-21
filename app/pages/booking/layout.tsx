export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#e5e7eb]">
      <div className="mx-auto max-w-7xl px-4 py-5 pt-7 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}


