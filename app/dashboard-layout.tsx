'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarHeader, SidebarContent, SidebarFooter } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Mail, Users, ListFilter, FileText, Settings, LogOut } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarHeader className="p-4">
            <Link href="/" className="flex items-center gap-2">
              <Mail className="h-6 w-6" />
              <span className="font-bold text-xl">Email App</span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/campaigns" className="w-full">
                  <SidebarMenuButton
                    isActive={pathname.startsWith('/campaigns')}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Campaigns
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/templates" className="w-full">
                  <SidebarMenuButton
                    isActive={pathname.startsWith('/templates')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Templates
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/subscribers" className="w-full">
                  <SidebarMenuButton
                    isActive={pathname.startsWith('/subscribers')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Subscribers
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/subscriber-lists" className="w-full">
                  <SidebarMenuButton
                    isActive={pathname.startsWith('/subscriber-lists')}
                  >
                    <ListFilter className="h-4 w-4 mr-2" />
                    Lists
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/settings" className="w-full">
                  <SidebarMenuButton>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/api/auth/signout" className="w-full">
                  <SidebarMenuButton>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <div className="flex-1">
          <header className="border-b p-4 flex items-center justify-between">
            <SidebarTrigger />
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm">Help</Button>
            </div>
          </header>
          <main className="p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}