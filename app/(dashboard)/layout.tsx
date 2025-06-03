import { AppSidebar } from "@/components/sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Geist } from "next/font/google";
import { QueryProvider } from "@/providers/query-provider";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className={`${geistSans.variable} antialiased`}>
                <QueryProvider>
                    <SidebarProvider
                        style={{
                            "--sidebar-width": "15rem",
                            "--sidebar-width-mobile": "20rem",
                        }}
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
            </body>
        </html>
    );
}
