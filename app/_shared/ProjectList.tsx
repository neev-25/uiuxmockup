"use client"

import { ProjectType } from '@/type/types'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import ProjectCard from './ProjectCard'
import { useUser } from '@clerk/nextjs'
import { Skeleton } from '@/components/ui/skeleton'

function ProjectList() {
  const [projectList, setProjectList] = useState<ProjectType[]>([])
  const [loading, setLoading] = useState(false)
  const { user } = useUser()

  useEffect(() => {
    if (!user) {
      setProjectList([])
      return
    }

    const getProjectList = async () => {
      setLoading(true)
      try {
        const result = await axios.get('/api/project')
        setProjectList(Array.isArray(result.data) ? result.data : [])
      } catch (error) {
        console.error('Error fetching project list:', error)
        setProjectList([])
      } finally {
        setLoading(false)
      }
    }

    getProjectList()
  }, [user])

  if (!user) return null

  return (
    <div className="px-10 md:px-24 lg:px-44 xl:px-56 pb-20 relative z-10">
      <h2 className="font-bold text-xl mb-4">My Projects</h2>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : projectList.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No projects yet. Create your first design above!
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projectList.map((project) => (
            <ProjectCard
              key={project.projectId}
              project={project}
              onDeleted={(projectId) =>
                setProjectList((prev) =>
                  prev.filter((p) => p.projectId !== projectId)
                )
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default ProjectList
