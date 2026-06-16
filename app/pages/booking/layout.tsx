export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f7f7f4]">
      <div className="mx-auto max-w-7xl px-4 py-8 pt-28 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
