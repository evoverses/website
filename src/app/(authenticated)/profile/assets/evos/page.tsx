import { Viewer, ViewerLoading } from "@/app/(authenticated)/assets/[slug]/viewer";
import { getWallet } from "@/app/(authenticated)/profile/assets/functions";
import { SortOption, SortOrder } from "@/app/(authenticated)/profile/assets/viewer-components";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Slug } from "@/types/core";
import { Suspense } from "react";

type Props = {
  params: Promise<{
    slug: Slug;
  }>,
  searchParams: Promise<{
    limit?: number;
    offset?: number;
    sort?: SortOption;
    order?: SortOrder;
  }>
}

const ProfileEvoAssetsPage = async ({ searchParams }: Props) => {
  const { limit = 50, offset = 0, sort = "id", order = "desc" } = await searchParams;
  const wallet = await getWallet();
  console.log(wallet);
  return (
    <Tabs defaultValue="evo">
      <TabsList className="grid w-full max-w-sm grid-cols-3 mx-auto">
        <TabsTrigger value="evo">Evos</TabsTrigger>
        <TabsTrigger value="egg">Eggs</TabsTrigger>
        <TabsTrigger value="trainer" disabled>Trainers</TabsTrigger>
      </TabsList>
      <TabsContent value="evo">
        <Suspense fallback={<ViewerLoading />}>
          <Viewer slug="evo" limit={Number(limit)} offset={Number(offset)} owner={wallet} />
        </Suspense>
      </TabsContent>
      <TabsContent value="egg">
        <Suspense fallback={<ViewerLoading />}>
          <Viewer slug="egg" limit={Number(limit)} offset={Number(offset)} owner={wallet} />
        </Suspense>
      </TabsContent>
    </Tabs>

  );
};

export default ProfileEvoAssetsPage;
