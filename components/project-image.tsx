import type { PropertyProject } from '@/lib/types'

type ProjectImageProps = {
  project: PropertyProject
  className?: string
  sizes?: string
}

export default function ProjectImage({ project, className = '', sizes = '100vw' }: ProjectImageProps) {
  const accent = project.accent || 'lime'

  if (project.coverImageUrl?.trim()) {
    return (
      <img
        className={className}
        src={project.coverImageUrl}
        alt={project.name}
        loading="lazy"
        sizes={sizes}
      />
    )
  }

  return (
    <div className={`project-image-placeholder project-${accent} ${className}`.trim()} aria-hidden="true">
      <span>{project.name}</span>
    </div>
  )
}
