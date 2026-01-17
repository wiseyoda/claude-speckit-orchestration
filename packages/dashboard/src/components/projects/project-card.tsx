"use client"

import Link from "next/link"
import { FolderGit2, AlertCircle, ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Project {
  id: string
  name: string
  path: string
  registered_at: string
  last_seen?: string
}

interface ProjectCardProps {
  project: Project
  isUnavailable?: boolean
}

export function ProjectCard({ project, isUnavailable = false }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.id}`}>
      <Card
        className={cn(
          "cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900/50",
          isUnavailable && "opacity-60"
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <FolderGit2 className="h-5 w-5 text-neutral-600 dark:text-neutral-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                  {project.name}
                </h3>
                {isUnavailable && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 rounded">
                    <AlertCircle className="h-3 w-3" />
                    Unavailable
                  </span>
                )}
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                {project.path}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-neutral-400 flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
