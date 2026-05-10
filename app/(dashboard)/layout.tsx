import { AppSidebar } from "@/components/sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { QueryProvider } from "@/providers/query-provider";

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <QueryProvider>
            <SidebarProvider
                style={
                    {
                        "--sidebar-width": "15rem",
                        "--sidebar-width-mobile": "20rem",
                    } as React.CSSProperties
                }
            >
                <AppSidebar />
                <main className="w-full bg-[#fff3e6]">
                    <SidebarTrigger />
                    <div className="w-full h-full px-6 py-4">
                        {children}
                    </div>
                </main>
            </SidebarProvider>
        </QueryProvider>
    );
}
