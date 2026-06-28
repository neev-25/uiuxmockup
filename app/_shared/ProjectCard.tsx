"use client"

import { ProjectType } from '@/type/types'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Loader2, Monitor, Smartphone, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import axios from 'axios'
import { useState } from 'react'
import { toast } from 'sonner'

type Props = {
  project: ProjectType
  onDeleted: (projectId: string) => void
}

function ProjectCard({ project, onDeleted }: Props) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const isMobile = project.device?.toLowerCase() === 'mobile'

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await axios.delete(`/api/project?projectId=${project.projectId}`)
      toast.success('Project deleted')
      onDeleted(project.projectId)
    } catch (error) {
      const msg = axios.isAxiosError(error)
        ? error.response?.data?.error || 'Failed to delete project'
        : 'Failed to delete project'
      toast.error(msg)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="border rounded-xl overflow-hidden bg-white group relative hover:shadow-lg transition-shadow">
      <div
        className="cursor-pointer"
        onClick={() => router.push(`/project/${project.projectId}`)}
      >
        {project.screenShot ? (
          <div className="w-full h-48 bg-gray-100 relative overflow-hidden">
            <Image
              src={project.screenShot}
              alt={project.projectName || 'Project screenshot'}
              fill
              className="object-cover object-top"
              unoptimized
            />
          </div>
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-primary/5 to-primary/20 flex items-center justify-center">
            <span className="text-muted-foreground text-sm">No preview yet</span>
          </div>
        )}
        <div className="p-4">
          <h3 className="font-semibold text-lg truncate pr-8">
            {project.projectName || 'Untitled Project'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
            {isMobile ? (
              <Smartphone className="h-3.5 w-3.5" />
            ) : (
              <Monitor className="h-3.5 w-3.5" />
            )}
            {isMobile ? 'Mobile' : 'Website'}
          </p>
        </div>
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 bg-white/90 hover:bg-red-50 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
            disabled={deleting}
            onClick={(e) => e.stopPropagation()}
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{' '}
              <span className="font-medium text-foreground">
                {project.projectName || 'Untitled Project'}
              </span>{' '}
              and all of its screens. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default ProjectCard
