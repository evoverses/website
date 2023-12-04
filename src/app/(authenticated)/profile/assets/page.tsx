import { getWallet } from "@/app/(authenticated)/profile/assets/functions";
import { Viewer } from "@/app/(authenticated)/profile/assets/viewer";
import { NFTSort, SortOption, SortOrder } from "@/app/(authenticated)/profile/assets/viewer-components";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getNftsOfAccount } from "@/lib/opensea";

type PageProps = {
  searchParams: {
    sort: SortOption;
    order: SortOrder;
  }
}

const ProfileAssetsPage = async ({ searchParams: { sort = "id", order = "desc" } }: PageProps) => {
  const wallet = await getWallet();
  const nfts = [];

  if (wallet) {
    const resp = await getNftsOfAccount(wallet, "avalanche", "evoverses-evo", 200);
    nfts.push(...resp.nfts);
  }
  return (
    <main>
      <Tabs defaultValue="evo" className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <NFTSort sort={sort} order={order} />
          <TabsList className="w-[150px]">
            <TabsTrigger value="evo">Evos</TabsTrigger>
            <TabsTrigger value="trainer" disabled>Trainers</TabsTrigger>
          </TabsList>
          <h4 className="hidden sm:block w-[150px] text-right">Total: {nfts.length}</h4>
        </div>
        <TabsContent value="evo" className="pb-6 lg:max-h-[calc(100vh-259px)] lg:overflow-y-scroll">
          {wallet ? nfts.length > 0 ? (
            <Viewer nfts={nfts} sort={sort} order={order} />
          ) : (
            <div>You have no Evos :(</div>
          ) : (
            <div>
              You have no wallet associated with your account
            </div>
          )}
        </TabsContent>
        <TabsContent value="trainer">Coming Soon</TabsContent>
      </Tabs>
    </main>
  );
};

export default ProfileAssetsPage;
