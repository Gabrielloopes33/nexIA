"use client"

import { Suspense } from "react"
import { Sidebar } from "@/components/sidebar"
import { PipelineViewReal } from "@/components/pipeline/pipeline-view-real"
import { PipelineTemplateModal } from "@/components/pipeline/PipelineTemplateModal"
import { useState } from "react"

export default function PipelinePage() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Suspense>
          <PipelineViewReal onNewPipeline={() => setIsModalOpen(true)} />
        </Suspense>
      </main>

      <PipelineTemplateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}
