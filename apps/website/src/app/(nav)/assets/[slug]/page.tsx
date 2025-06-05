import { Viewer, ViewerLoading } from "@/app/(nav)/assets/[slug]/viewer";
import { Slug } from "@/types/core";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";

import { Metadata } from "next";
import { Suspense } from "react";
import { CollectionHeader } from "./header";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Assets",
};

export const generateStaticParams = async () => {
  return [ { slug: "evo" } ];
};

type Props = {
  params: Promise<{ slug: Slug }>,
  searchParams: Promise<{
    limit?: number;
    offset?: number;
  }>
}

const AssetPage = async ({ params, searchParams }: Props) => {
  const { limit = 50, offset = 0 } = await searchParams;
  const { slug } = await params;
  return (
    <main className="flex flex-col w-full p-4 sm:p-24 space-y-10">
      <Suspense fallback={<span>Loading</span>}>
        <CollectionHeader slug={slug} />
      </Suspense>
      <div>
        <Tabs defaultValue="evo">
          <TabsList className="grid w-full max-w-sm grid-cols-2 mx-auto">
            <TabsTrigger value="evo">Evos</TabsTrigger>
            <TabsTrigger value="egg">Eggs</TabsTrigger>
          </TabsList>
          <TabsContent value="evo">
            <Suspense fallback={<ViewerLoading />}>
              <Viewer slug="evo" limit={Number(limit)} offset={Number(offset)} />
            </Suspense>
          </TabsContent>
          <TabsContent value="egg">
            <Suspense fallback={<ViewerLoading />}>
              <Viewer slug="egg" limit={Number(limit)} offset={Number(offset)} />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
};

export default AssetPage;
