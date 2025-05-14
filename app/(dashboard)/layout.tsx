// import { GeistSans } from "geist/font/sans";
import { AppSidebar } from "@/components/sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Geist } from "next/font/google";


const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className={`${geistSans.variable} antialiased`}>
                <SidebarProvider
                    style={{
                        "--sidebar-width": "15rem",
                        "--sidebar-width-mobile": "20rem",
                    }}
                >
                    <AppSidebar />
                    <main className="w-full">
                        <SidebarTrigger />
                        {children}
                    </main>
                </SidebarProvider>
            </body>
        </html>
    );
}
