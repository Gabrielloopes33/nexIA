"use client"

import { PipelineViewReal } from "@/components/pipeline/pipeline-view-real"
import { PipelineTemplateModal } from "@/components/pipeline/PipelineTemplateModal"
import { useState } from "react"
import { useProductSelection } from "@/hooks/use-product-selection"

export function PipelineContent() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { productId } = useProductSelection()

  return (
    <>
      <PipelineViewReal onNewPipeline={() => setIsModalOpen(true)} />
      <PipelineTemplateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productId={productId || ''}
      />
    </>
  )
}
