import { CollectionHeader } from "@/app/marketplace/[slug]/header";
import { AppSidebar } from "@/app/marketplace/[slug]/sidebar";
import { SortFilterProvider } from "@/components/filters";
import { InnerSidebarProvider } from "@/components/inner-sidebar";
import { getServerSideUrlFromHeaders } from "@/utils/server";
import { Metadata } from "next";
import { type PropsWithChildren } from "react";

export const metadata: Metadata = {
  title: "Evos | Marketplace",
};
const Layout = async ({ children }: PropsWithChildren) => {
  const url = await getServerSideUrlFromHeaders();
  const searchParams = url ? new URL(url).searchParams.toString() : undefined;
  return (
    <SortFilterProvider searchParams={searchParams}>
      <CollectionHeader slug="evo" />
      <div className="grid @6xl:group-has-data-[inner-sidebar-state=open]/global:grid-cols-[280px_minmax(0,1fr)] items-start flex-1 outline-none gap-6 page">
        <InnerSidebarProvider>
          <AppSidebar className="sticky top-30 space-y-6 pt-3" />
          {children}
        </InnerSidebarProvider>
      </div>
    </SortFilterProvider>
  );
};

export default Layout;
