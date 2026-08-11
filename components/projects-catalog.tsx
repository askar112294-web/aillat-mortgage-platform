'use client'

import ProjectCard from '@/components/project-card'
import {
  DEFAULT_FILTERS,
  filterProjects,
  getProjectCities,
  partnerById,
  type ProjectFilters,
} from '@/lib/projects'
import type { Partner, ProductConfig, PropertyProject } from '@/lib/types'

type ProjectsCatalogProps = {
  projects: PropertyProject[]
  partners: Partner[]
  product: ProductConfig
  filters: ProjectFilters
  onFiltersChange: (filters: ProjectFilters) => void
  onCalculate: (project: PropertyProject) => void
}

export default function ProjectsCatalog({
  projects,
  partners,
  product,
  filters,
  onFiltersChange,
  onCalculate,
}: ProjectsCatalogProps) {
  const cities = getProjectCities(projects)
  const filtered = filterProjects(projects, filters)
  const activePartner = filters.partnerId ? partnerById(partners, filters.partnerId) : null

  const setFilter = <K extends keyof ProjectFilters>(key: K, value: ProjectFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const resetFilters = () => onFiltersChange({ ...DEFAULT_FILTERS })

  const hasActiveFilters =
    filters.partnerId !== null ||
    filters.city !== null ||
    filters.priceRange !== 'all' ||
    filters.status !== 'all'

  return (
    <section id="projects" className="catalog-projects-section">
      <div className="apple-container">
        <div className="catalog-section-head">
          <div>
            <span className="apple-section-label">Жилые комплексы</span>
            <h2>Выберите дом мечты</h2>
          </div>
          <p>
            {activePartner
              ? `Проекты застройщика ${activePartner.name}. Стоимость и платеж рассчитываются по текущим условиям продукта.`
              : 'Каталог объектов партнеров Ailat Finance с предварительным расчетом ежемесячного платежа.'}
          </p>
        </div>

        <div className="catalog-filters">
          <div className="catalog-filter-group">
            <span className="catalog-filter-label">Партнер</span>
            <select
              value={filters.partnerId ?? 'all'}
              onChange={(e) => setFilter('partnerId', e.target.value === 'all' ? null : e.target.value)}
            >
              <option value="all">Все</option>
              {partners.map((partner) => (
                <option key={partner.id} value={partner.id}>{partner.name}</option>
              ))}
            </select>
          </div>

          <div className="catalog-filter-group">
            <span className="catalog-filter-label">Город</span>
            <select
              value={filters.city ?? 'all'}
              onChange={(e) => setFilter('city', e.target.value === 'all' ? null : e.target.value)}
            >
              <option value="all">Все</option>
              {cities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div className="catalog-filter-group">
            <span className="catalog-filter-label">Стоимость</span>
            <select
              value={filters.priceRange}
              onChange={(e) => setFilter('priceRange', e.target.value as ProjectFilters['priceRange'])}
            >
              <option value="all">Все</option>
              <option value="under30">До 30 млн ₸</option>
              <option value="30to40">30–40 млн ₸</option>
              <option value="over40">Свыше 40 млн ₸</option>
            </select>
          </div>

          <div className="catalog-filter-group">
            <span className="catalog-filter-label">Статус</span>
            <select
              value={filters.status}
              onChange={(e) => setFilter('status', e.target.value as ProjectFilters['status'])}
            >
              <option value="all">Все</option>
              <option value="ready">Сдан</option>
              <option value="building">Строится</option>
              <option value="planned">Планируется</option>
            </select>
          </div>

          {hasActiveFilters ? (
            <button className="catalog-link-btn catalog-filter-reset" type="button" onClick={resetFilters}>
              Сбросить фильтры
            </button>
          ) : null}
        </div>

        {filtered.length ? (
          <div className="catalog-projects-grid">
            {filtered.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                partners={partners}
                product={product}
                onCalculate={onCalculate}
              />
            ))}
          </div>
        ) : (
          <div className="catalog-empty">
            <h3>Ничего не найдено</h3>
            <p>Попробуйте изменить фильтры или посмотреть проекты других партнеров.</p>
            <button className="catalog-btn catalog-btn-secondary" type="button" onClick={resetFilters}>Показать все ЖК</button>
          </div>
        )}
      </div>
    </section>
  )
}
