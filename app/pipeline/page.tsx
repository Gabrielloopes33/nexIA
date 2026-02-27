import { Sidebar } from "@/components/sidebar"
import { PipelineView } from "@/components/pipeline/pipeline-view"

export default function PipelinePage() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <PipelineView />
      </main>
    </div>
  )
}
