export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[100] bg-gray-50 dark:bg-gray-950 overflow-y-auto">
      {children}
    </div>
  );
}
