import { Sidebar } from "@/components/sidebar"
import { PipelineViewReal } from "@/components/pipeline/pipeline-view-real"

export default function PipelinePage() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <PipelineViewReal />
      </main>
    </div>
  )
}
