'use client'
import { countPartnerProjects, partnerInitial } from '@/lib/projects'
import type { Partner, PropertyProject } from '@/lib/types'
import { useRef } from 'react'

type PartnersSectionProps = {
  partners: Partner[]
  projects: PropertyProject[]
  activePartnerId: string | null
  onSelectPartner: (partnerId: string) => void
  onClearPartner: () => void
}

// Функция для поиска минимальной цены квартир среди опубликованных проектов партнёра
function getMinPriceForPartner(partnerId: string, projects: PropertyProject[]): number | null {
  const filtered = projects.filter(
    (p) =>
      // published
      (!('isDraft' in p) || !p.isDraft) &&
      p.partnerId === partnerId &&
      typeof p.priceFrom === 'number'
  )

  if (!filtered.length) return null
  return Math.min(...filtered.map((p) => p.priceFrom!))
}

export default function PartnersSection({
  partners,
  projects,
  activePartnerId,
  onSelectPartner,
  onClearPartner,
}: PartnersSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null)

  function handleSelect(partnerId: string) {
    onSelectPartner(partnerId)
    // Плавный scroll к секции проектов
    const projectsSection = document.getElementById('projects')
    if (projectsSection) {
      setTimeout(() => {
        projectsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 0)
    }
  }

  return (
    <section
      id="partners"
      ref={sectionRef}
      style={{ background: '#fff', padding: 0 }}
    >
      <div className="apple-container" style={{ padding: 0 }}>
        <div style={{ padding: '48px 0 24px 0', textAlign: 'center' }}>
          <h2 style={{
            fontSize: 32,
            fontWeight: 700,
            margin: 0,
            marginBottom: 8,
            letterSpacing: '-0.03em',
          }}>
            Выберите застройщика
          </h2>
          <p style={{
            color: '#777',
            fontSize: 18,
            margin: 0,
            marginBottom: 0
          }}>
            Выберите партнера Ailat Finance, чтобы посмотреть доступные жилые комплексы.
          </p>
        </div>

        <div
          className="catalog-partners-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 32,
            alignItems: 'stretch',
            marginTop: 24,
          }}
        >
          {partners.map((partner) => {
            const projectCount = countPartnerProjects(partner.id, projects)
            const priceFrom = getMinPriceForPartner(partner.id, projects)
            const isActive = activePartnerId === partner.id
            const hasProjects = projectCount > 0

            return (
              <article
                key={partner.id}
                className="catalog-partner-card"
                tabIndex={0}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#fff',
                  border: isActive
                    ? '1.5px solid #4681F4'
                    : '1px solid #E5E7EA',
                  borderRadius: 24,
                  padding: 32,
                  minHeight: 340,
                  transition: 'box-shadow 0.2s, border-color 0.2s, transform 0.2s',
                  boxShadow: 'none',
                  cursor: hasProjects ? 'pointer' : 'default',
                  willChange: 'transform',
                }}
                onMouseOver={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'
                  ;(e.currentTarget as HTMLElement).style.borderColor = '#bbc5ce'
                }}
                onMouseOut={e => {
                  (e.currentTarget as HTMLElement).style.transform = ''
                  ;(e.currentTarget as HTMLElement).style.borderColor = isActive ? '#4681F4' : '#E5E7EA'
                }}
              >
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 16,
                    background: '#F7F8FB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 24,
                    overflow: 'hidden',
                  }}
                >
                  {partner.logoUrl?.trim() ? (
                    <img
                      src={partner.logoUrl}
                      alt={partner.name}
                      style={{ maxWidth: '70%', maxHeight: '70%', display: 'block', objectFit: 'contain' }}
                      loading="lazy"
                    />
                  ) : (
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: 32,
                        color: '#CCD5E2',
                        userSelect: 'none',
                        lineHeight: 1,
                      }}
                    >
                      {partnerInitial(partner.name)}
                    </span>
                  )}
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: '100%',
                  flexGrow: 1
                }}>
                  <h3
                    style={{
                      fontWeight: 600,
                      fontSize: 20,
                      letterSpacing: '-0.01em',
                      margin: '0 0 16px 0',
                      textAlign: 'center'
                    }}
                  >{partner.name}</h3>

                  <div style={{
                    fontSize: 16,
                    color: '#2B2E34',
                    marginBottom: hasProjects ? 10 : 24,
                    minHeight: 24,
                    textAlign: 'center'
                  }}>
                    {hasProjects ? (
                      <>
                        {projectCount} ЖК
                        {priceFrom && (
                          <>
                            {'\u00A0'}·{'\u00A0'}
                            <span style={{ color: '#4681F4', fontWeight: 500 }}>
                              от&nbsp;
                              {priceFrom.toLocaleString('ru-RU', {
                                style: 'currency',
                                currency: 'KZT',
                                maximumFractionDigits: 0,
                                minimumFractionDigits: 0
                                })}
                            </span>
                          </>
                        )}
                      </>
                    ) : (
                      <>Проекты скоро появятся</>
                    )}
                  </div>
                </div>

                {hasProjects ? (
                  <button
                    className="catalog-btn catalog-btn-secondary catalog-btn-full"
                    type="button"
                    style={{
                      borderRadius: 12,
                      minHeight: 44,
                      fontSize: 16,
                      fontWeight: 500,
                      background: '#fff',
                      border: '1px solid #4681F4',
                      color: '#4681F4',
                      transition: 'background 0.2s, border-color 0.2s, color 0.2s',
                      cursor: 'pointer',
                      marginTop: 24,
                      width: '100%'
                    }}
                    onClick={() => handleSelect(partner.id)}
                  >
                    Смотреть проекты&nbsp;&rarr;
                  </button>
                ) : (
                  <div style={{ height: 44, marginTop: 24 }}></div>
                )}
              </article>
            )
          })}
        </div>

        {activePartnerId ? (
          <div className="catalog-partners-toolbar" style={{ textAlign: 'center', margin: '32px 0 0 0' }}>
            <button
              className="catalog-link-btn"
              type="button"
              style={{
                fontSize: 16,
                color: '#4681F4',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer'
              }}
              onClick={onClearPartner}
            >
              Все партнеры
            </button>
          </div>
        ) : null}
      </div>
    </section>
  )
}
