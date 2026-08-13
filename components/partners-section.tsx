'use client'

import type { Partner, PropertyProject } from '@/lib/types'
import { countPartnerProjects } from '@/lib/projects'

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

  const handleSelect = (partnerId: string) => {
    if (activePartnerId === partnerId) {
      onClearPartner()
      return
    }

    onSelectPartner(partnerId)

    const projectsSection = document.getElementById('projects')

    if (projectsSection) {
      setTimeout(() => {
        projectsSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }, 0)
    }
  }

  const activeProjects = projects.filter(
    (project) => !('isDraft' in project) || !project.isDraft,
  )

  return (
    <section
      id="partners"
      className="partner-selector-section"
    >
      <div className="apple-container">

        <div className="partner-selector-head">
          <span className="apple-section-label">
            ПАРТНЕРЫ AILAT
          </span>

          <h2>Выберите застройщика</h2>

          <p>
            Посмотрите жилые комплексы партнеров Ailat Finance
          </p>
        </div>

        <div className="partner-selector-list">

          <button
            type="button"
            className={
              activePartnerId === null
                ? 'partner-selector-item partner-selector-item-active'
                : 'partner-selector-item'
            }
            onClick={onClearPartner}
          >
            <div>
              <strong>Все проекты</strong>
              <span>{activeProjects.length} ЖК</span>
            </div>

            <span className="partner-selector-arrow">
              →
            </span>
          </button>

          {partners.map((partner) => {
            const projectCount = countPartnerProjects(
              partner.id,
              projects,
            )

            const active =
              activePartnerId === partner.id

            return (
              <button
                key={partner.id}
                type="button"
                className={
                  active
                    ? 'partner-selector-item partner-selector-item-active'
                    : 'partner-selector-item'
                }
                onClick={() =>
                  handleSelect(partner.id)
                }
              >
                <div>
                  <strong>{partner.name}</strong>
                  <span>{projectCount} ЖК</span>
                </div>

                <span className="partner-selector-arrow">
                  →
                </span>
              </button>
            )
          })}

        </div>
      </div>
    </section>
  )
}
