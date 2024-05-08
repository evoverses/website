import { columns } from "@/app/(authenticated)/roadmap/columns";
import { data } from "@/app/(authenticated)/roadmap/data";
import { DataTable } from "@/components/ui/data-table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const RoadmapPage = () => {

  return (
    <div className="pt-4 md:pt-16 flex flex-col flex-grow gap-4 items-center">
      <h1>Roadmap</h1>
      <ScrollArea className="h-[600px] max-sm:w-[340px] max-md:w-[600px] max-lg:w-[750px]">
        <DataTable columns={columns} data={data} />
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>

  );
};

export default RoadmapPage;
