import type { Partner, ProductConfig, PropertyProject } from './types'
import { calculateMortgage, formatKzt } from './mortgage'

export type ConstructionStatus = 'ready' | 'building' | 'planned'

export type ProjectFilters = {
  partnerId: string | null
  city: string | null
  priceRange: 'all' | 'under30' | '30to40' | 'over40'
  status: 'all' | ConstructionStatus
}

export const DEFAULT_FILTERS: ProjectFilters = {
  partnerId: null,
  city: null,
  priceRange: 'all',
  status: 'all',
}

const STATUS_LABELS: Record<ConstructionStatus, string> = {
  ready: 'Сдан',
  building: 'Строится',
  planned: 'Планируется',
}

export function getProjectSlug(project: PropertyProject): string {
  return project.slug || project.id
}

export function findProjectBySlug(projects: PropertyProject[], slug: string): PropertyProject | undefined {
  return projects.find((project) => getProjectSlug(project) === slug)
}

export function getConstructionStatus(project: PropertyProject): ConstructionStatus {
  if (project.constructionStatus) return project.constructionStatus
  const text = project.completion.toLowerCase()
  if (text.includes('готов') || text.includes('сдан')) return 'ready'
  if (text.includes('квартал') || text.includes('стро')) return 'building'
  return 'planned'
}

export function getConstructionStatusLabel(project: PropertyProject): string {
  return STATUS_LABELS[getConstructionStatus(project)]
}

export function formatProjectAddress(project: PropertyProject): string {
  if (project.address?.trim()) return project.address.trim()
  return [project.district, project.city].filter(Boolean).join(', ')
}

export function formatProjectPrice(project: PropertyProject): string {
  if (project.priceTo && project.priceTo > project.priceFrom) {
    return `от ${formatKzt(project.priceFrom)} до ${formatKzt(project.priceTo)}`
  }
  return `от ${formatKzt(project.priceFrom)}`
}

export function formatProjectArea(project: PropertyProject): string | null {
  if (project.areaFrom) {
    return project.areaTo && project.areaTo > project.areaFrom
      ? `от ${project.areaFrom} до ${project.areaTo} м²`
      : `от ${project.areaFrom} м²`
  }
  return null
}

export function countPartnerProjects(partnerId: string, projects: PropertyProject[]): number {
  return projects.filter((project) => project.active && project.partnerId === partnerId).length
}

export function getProjectPayment(project: PropertyProject, product: ProductConfig) {
  const term = Math.max(...product.terms)
  return calculateMortgage(project.priceFrom, term, undefined, product)
}

export function filterProjects(projects: PropertyProject[], filters: ProjectFilters): PropertyProject[] {
  return projects.filter((project) => {
    if (filters.partnerId && project.partnerId !== filters.partnerId) return false
    if (filters.city && project.city !== filters.city) return false
    if (filters.status !== 'all' && getConstructionStatus(project) !== filters.status) return false

    if (filters.priceRange === 'under30' && project.priceFrom >= 30_000_000) return false
    if (filters.priceRange === '30to40' && (project.priceFrom < 30_000_000 || project.priceFrom > 40_000_000)) return false
    if (filters.priceRange === 'over40' && project.priceFrom <= 40_000_000) return false

    return true
  })
}

export function getProjectCities(projects: PropertyProject[]): string[] {
  return [...new Set(projects.map((project) => project.city))].sort()
}

export function partnerInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || 'A'
}

export function getProjectHighlights(project: PropertyProject): string[] {
  if (project.highlights?.length) return project.highlights
  const items = [project.badge, project.completion].filter(Boolean)
  return items.length ? items : ['Современный жилой комплекс', 'Финансирование через Ailat Finance']
}

export function partnerById(partners: Partner[], partnerId: string): Partner | undefined {
  return partners.find((partner) => partner.id === partnerId)
}
