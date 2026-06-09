import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
