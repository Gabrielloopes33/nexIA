import { Suspense } from "react"
import { PipelineContent } from "./_components/pipeline-content"
import { PipelineLoading } from "./_components/pipeline-loading"
import { SidebarWrapper } from "./_components/sidebar-wrapper"

export default function PipelinePage() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Suspense fallback={<div className="w-16 h-full bg-card border-r" />}>
        <SidebarWrapper />
      </Suspense>
      <main className="flex-1 overflow-hidden">
        <Suspense fallback={<PipelineLoading />}>
          <PipelineContent />
        </Suspense>
      </main>
    </div>
  )
}
