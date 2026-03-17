import { requireAdmin } from "@/lib/auth";
import { Sidebar } from "@/components/admin/sidebar";
import { Topbar } from "@/components/admin/topbar";
import { MobileBottomNav } from "@/components/admin/mobile-bottom-nav";
import { MobileSidebarDrawer } from "@/components/admin/mobile-sidebar-drawer";
import { SidebarProvider } from "@/components/admin/sidebar-context";
import { getSiteSettings } from "@/lib/settings";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Run auth check and settings fetch in parallel to reduce load time
  const [user, settings] = await Promise.all([
    requireAdmin(),
    getSiteSettings(),
  ]);

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-[#F8FAFC]">
        <Sidebar storeName={settings.store_name} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar user={user} />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6">
            <div className="max-w-[1280px] mx-auto">{children}</div>
          </main>
        </div>
        <MobileSidebarDrawer storeName={settings.store_name} />
        <MobileBottomNav />
      </div>
    </SidebarProvider>
  );
}
