'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import ProjectImage from '@/components/project-image'
import { formatKzt } from '@/lib/mortgage'
import {
  formatProjectAddress,
  formatProjectArea,
  formatProjectPrice,
  getConstructionStatusLabel,
  getProjectHighlights,
  getProjectPayment,
  getProjectSlug,
} from '@/lib/projects'
import type { Partner, ProductConfig, PropertyProject } from '@/lib/types'

type ProjectDetailViewProps = {
  project: PropertyProject
  partner?: Partner
  product: ProductConfig
}

export default function ProjectDetailView({ project, partner, product }: ProjectDetailViewProps) {
  const payment = useMemo(() => getProjectPayment(project, product), [project, product])
  const area = formatProjectArea(project)
  const highlights = getProjectHighlights(project)
  const slug = getProjectSlug(project)
  const calcHref = `/?select=${encodeURIComponent(slug)}#calculator`
  const applyHref = `/?select=${encodeURIComponent(slug)}&apply=1#calculator`

  return (
    <main className="project-detail-page">
      <header className="apple-header-shell">
        <div className="apple-header apple-container">
          <Link className="apple-brand" href="/" aria-label="Ailat Finance">
            <span className="apple-brand-mark">a</span>
            <span>ailat<span className="apple-brand-dot">.</span></span>
          </Link>
          <div className="apple-header-actions">
            <Link className="apple-pill apple-pill-small" href={calcHref}>Рассчитать</Link>
          </div>
        </div>
      </header>

      <section className="project-detail-hero">
        <ProjectImage project={project} className="project-detail-cover" />
        <div className="apple-container project-detail-hero-copy">
          <span className="apple-section-label">{getConstructionStatusLabel(project)}</span>
          <h1>{project.name}</h1>
          <p>{partner?.name ?? 'Партнер Ailat'} · {project.city}</p>
        </div>
      </section>

      <section className="apple-container project-detail-content">
        <div className="project-detail-grid">
          <div className="project-detail-main">
            <h2>О проекте</h2>
            <p>{project.description}</p>

            {highlights.length ? (
              <div className="project-detail-highlights">
                <h3>Преимущества</h3>
                <ul>
                  {highlights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <aside className="project-detail-sidebar">
            <div className="project-detail-facts">
              <div><span>Застройщик</span><strong>{partner?.name ?? 'Партнер Ailat'}</strong></div>
              <div><span>Город</span><strong>{project.city}</strong></div>
              <div><span>Адрес</span><strong>{formatProjectAddress(project)}</strong></div>
              <div><span>Стоимость</span><strong>{formatProjectPrice(project)}</strong></div>
              {area ? <div><span>Площадь</span><strong>{area}</strong></div> : null}
              <div><span>Срок сдачи</span><strong>{project.completion}</strong></div>
              <div><span>Статус</span><strong>{getConstructionStatusLabel(project)}</strong></div>
            </div>

            <div className="project-detail-payment">
              <span>Платеж от</span>
              <strong>{formatKzt(payment.monthlyPayment)}</strong>
              <small>в месяц · {Math.max(...product.terms)} мес.</small>
            </div>

            <Link className="apple-pill apple-pill-full" href={calcHref}>Рассчитать финансирование</Link>
            <Link className="apple-pill apple-pill-full project-detail-apply" href={applyHref}>Получить предварительное решение</Link>
            <Link className="catalog-link-btn project-detail-back" href="/#projects">← Все жилые комплексы</Link>
          </aside>
        </div>
      </section>
    </main>
  )
}
