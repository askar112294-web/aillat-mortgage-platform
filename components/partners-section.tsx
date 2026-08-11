'use client'

import { countPartnerProjects, partnerInitial } from '@/lib/projects'
import type { Partner, PropertyProject } from '@/lib/types'

type PartnersSectionProps = {
  partners: Partner[]
  projects: PropertyProject[]
  activePartnerId: string | null
  onSelectPartner: (partnerId: string) => void
  onClearPartner: () => void
}

export default function PartnersSection({
  partners,
  projects,
  activePartnerId,
  onSelectPartner,
  onClearPartner,
}: PartnersSectionProps) {
  return (
    <section id="partners" className="catalog-partners-section">
      <div className="apple-container">
        <div className="catalog-section-head">
          <div>
            <span className="apple-section-label">Партнеры</span>
            <h2>Застройщики Ailat Finance</h2>
          </div>
          <p>Выберите партнера и посмотрите его жилые комплексы с актуальными условиями финансирования.</p>
        </div>

        <div className="catalog-partners-grid">
          {partners.map((partner) => {
            const projectCount = countPartnerProjects(partner.id, projects)
            const isActive = activePartnerId === partner.id

            return (
              <article className={`catalog-partner-card${isActive ? ' is-active' : ''}`} key={partner.id}>
                <div className="catalog-partner-logo">
                  {partner.logoUrl?.trim() ? (
                    <img src={partner.logoUrl} alt={partner.name} loading="lazy" />
                  ) : (
                    <span>{partnerInitial(partner.name)}</span>
                  )}
                </div>

                <div className="catalog-partner-content">
                  <h3>{partner.name}</h3>
                  <p>{partner.description}</p>

                  <div className="catalog-partner-meta">
                    <span>{projectCount} {projectCount === 1 ? 'ЖК' : 'ЖК'}</span>
                    <span>{partner.city}</span>
                  </div>

                  <button
                    className="catalog-btn catalog-btn-secondary catalog-btn-full"
                    type="button"
                    onClick={() => onSelectPartner(partner.id)}
                  >
                    Посмотреть проекты
                  </button>
                </div>
              </article>
            )
          })}
        </div>

        {activePartnerId ? (
          <div className="catalog-partners-toolbar">
            <button className="catalog-link-btn" type="button" onClick={onClearPartner}>Все партнеры</button>
          </div>
        ) : null}
      </div>
    </section>
  )
}
