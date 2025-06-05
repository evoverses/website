import { columns } from "@/app/(nav)/roadmap/columns";
import { data, isComplete } from "@/app/(nav)/roadmap/data";
import { DataTable } from "@/components/data-table";
import { Progress } from "@workspace/ui/components/progress";
import { ScrollArea, ScrollBar } from "@workspace/ui/components/scroll-area";

const RoadmapPage = () => {
  const complete = data.reduce((v, o) => isComplete(o) ? v + 1 : v, 0);
  const progress = complete / data.length * 100;
  return (
    <div className="pt-4 md:pt-16 flex flex-col flex-grow gap-4 items-center">
      <h1 className="text-center">Animation Roadmap</h1>
      <div className="flex w-full px-4 gap-4 items-center max-w-7xl">
        <Progress value={progress} />
        <span className="text-nowrap">{progress.toFixed(2)}% ({complete}/{data.length})</span>
      </div>
      <div className="h-full w-full flex items-center justify-center px-4">
        <ScrollArea className="w-full h-full max-h-[80vh] max-w-7xl overflow-auto border border-border rounded-lg">
          <ScrollBar orientation="horizontal" />
          <DataTable columns={columns} data={data} />
        </ScrollArea>
      </div>
    </div>
  );
};
export default RoadmapPage;
