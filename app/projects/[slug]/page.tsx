import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ProjectDetailView from '@/components/project-detail-view'
import { formatProjectAddress, formatProjectPrice, findProjectBySlug, getProjectSlug, partnerById } from '@/lib/projects'
import { readStore } from '@/lib/store'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const store = await readStore()
  const project = findProjectBySlug(store.projects.filter((item) => item.active), slug)

  if (!project) {
    return { title: 'ЖК не найден — Ailat Finance' }
  }

  const partner = partnerById(store.partners, project.partnerId)
  const title = `${project.name} — ${partner?.name ?? 'Ailat Finance'}`
  const description = `${project.description} ${formatProjectPrice(project)}. ${formatProjectAddress(project)}. Исламское финансирование от Ailat Finance.`
  const image = project.coverImageUrl?.trim() || undefined

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'ru_RU',
      ...(image ? { images: [{ url: image, alt: project.name }] } : {}),
    },
  }
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params
  const store = await readStore()
  const project = findProjectBySlug(store.projects.filter((item) => item.active), slug)

  if (!project) notFound()

  const partner = partnerById(store.partners, project.partnerId)

  return <ProjectDetailView project={project} partner={partner} product={store.product} />
}

export async function generateStaticParams() {
  const store = await readStore()
  return store.projects.filter((project) => project.active).map((project) => ({
    slug: getProjectSlug(project),
  }))
}
