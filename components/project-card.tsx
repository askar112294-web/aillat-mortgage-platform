'use client'

import Link from 'next/link'
import ProjectImage from '@/components/project-image'
import { formatKzt } from '@/lib/mortgage'
import {
  formatProjectAddress,
  formatProjectArea,
  formatProjectPrice,
  getConstructionStatusLabel,
  getProjectPayment,
  getProjectSlug,
  partnerById,
} from '@/lib/projects'
import type { Partner, ProductConfig, PropertyProject } from '@/lib/types'

type ProjectCardProps = {
  project: PropertyProject
  partners: Partner[]
  product: ProductConfig
  onCalculate: (project: PropertyProject) => void
}

export default function ProjectCard({ project, partners, product, onCalculate }: ProjectCardProps) {
  const partner = partnerById(partners, project.partnerId)
  const payment = getProjectPayment(project, product)
  const area = formatProjectArea(project)
  const slug = getProjectSlug(project)

  return (
    <article className="catalog-project-card">
      <Link href={`/projects/${slug}`} className="catalog-project-media">
        <ProjectImage project={project} className="catalog-project-image" />
        <span className="catalog-project-status">{getConstructionStatusLabel(project)}</span>
      </Link>

      <div className="catalog-project-body">
        <div className="catalog-project-top">
          <div>
            <h3>{project.name}</h3>
            <p className="catalog-project-developer">{partner?.name ?? 'Партнер Ailat'}</p>
          </div>
        </div>

        <p className="catalog-project-address">{formatProjectAddress(project)}</p>

        <div className="catalog-project-specs">
          <div><span>Стоимость</span><strong>{formatProjectPrice(project)}</strong></div>
          <div><span>Срок сдачи</span><strong>{project.completion}</strong></div>
          {area ? <div><span>Площадь</span><strong>{area}</strong></div> : null}
        </div>

        <div className="catalog-project-payment">
          <span>Платеж от</span>
          <strong>{formatKzt(payment.monthlyPayment)}</strong>
          <small>в месяц · {Math.max(...product.terms)} мес.</small>
        </div>

        <div className="catalog-project-actions">
          <Link className="catalog-btn catalog-btn-secondary" href={`/projects/${slug}`}>Подробнее</Link>
          <button className="catalog-btn catalog-btn-primary" type="button" onClick={() => onCalculate(project)}>Рассчитать</button>
        </div>
      </div>
    </article>
  )
}
