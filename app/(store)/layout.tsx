import { SidebarProvider } from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import Footer from '@/components/layout/Footer';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <div className="flex-1 lg:ml-[280px] flex flex-col min-h-screen">
          <TopBar />
          <main className="flex-1 p-4 md:p-6 lg:p-10 max-w-[1280px] mx-auto w-full">
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </SidebarProvider>
  );
}
