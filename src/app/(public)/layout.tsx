'use client';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1B3F66] p-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
