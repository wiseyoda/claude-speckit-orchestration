"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LayoutGrid, Columns3, GitBranch } from "lucide-react"

export type ViewType = "status" | "kanban" | "timeline"

interface ViewTabsProps {
  activeView: ViewType
  onViewChange: (view: ViewType) => void
}

export function ViewTabs({ activeView, onViewChange }: ViewTabsProps) {
  return (
    <div className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-6">
      <Tabs value={activeView} onValueChange={(v) => onViewChange(v as ViewType)}>
        <TabsList className="h-12 bg-transparent p-0 gap-1">
          <TabsTrigger
            value="status"
            className="relative h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent bg-transparent px-4 font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400"
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            Status
          </TabsTrigger>
          <TabsTrigger
            value="kanban"
            className="relative h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent bg-transparent px-4 font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400"
          >
            <Columns3 className="h-4 w-4 mr-2" />
            Kanban
          </TabsTrigger>
          <TabsTrigger
            value="timeline"
            className="relative h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent bg-transparent px-4 font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400"
          >
            <GitBranch className="h-4 w-4 mr-2" />
            Timeline
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
