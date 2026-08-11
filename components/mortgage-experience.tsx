'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import PartnersSection from '@/components/partners-section'
import ProjectsCatalog from '@/components/projects-catalog'
import { calculateMortgage, DEFAULT_PRODUCT, formatKzt } from '@/lib/mortgage'
import { DEFAULT_FILTERS, findProjectBySlug, type ProjectFilters } from '@/lib/projects'
import type { Partner, ProductConfig, PropertyProject } from '@/lib/types'

type Content = { product: ProductConfig; partners: Partner[]; projects: PropertyProject[] }
type ApplicationState = { iin: string; phone: string; consent: boolean }

const digits = (value: string) => value.replace(/\D/g, '')
const formatInputNumber = (value: number) => value.toLocaleString('ru-RU')

function AilatLogo({ dark = true }: { dark?: boolean }) {
  return (
    <a className={`apple-brand ${dark ? '' : 'apple-brand-light'}`} href="#top" aria-label="Ailat Finance">
      <span className="apple-brand-mark">a</span>
      <span>ailat<span className="apple-brand-dot">.</span></span>
    </a>
  )
}

export default function MortgageExperience() {
  const [content, setContent] = useState<Content>({ product: DEFAULT_PRODUCT, partners: [], projects: [] })
  const [propertyPrice, setPropertyPrice] = useState(30_000_000)
  const [downPayment, setDownPayment] = useState(9_000_000)
  const [term, setTerm] = useState(60)
  const [selectedProject, setSelectedProject] = useState<PropertyProject | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [application, setApplication] = useState<ApplicationState>({ iin: '', phone: '', consent: false })
  const [submitted, setSubmitted] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [projectFilters, setProjectFilters] = useState<ProjectFilters>(DEFAULT_FILTERS)

  const applyProjectSelection = (project: PropertyProject, openApply = false) => {
    setSelectedProject(project)
    setPropertyPrice(project.priceFrom)
    setDownPayment(Math.round(project.priceFrom * content.product.minDownPaymentPercent / 100))
    if (openApply) {
      setModalOpen(true)
      setSubmitted(false)
    }
  }

  useEffect(() => {
    fetch('/api/content', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data: Content) => {
        setContent(data)
        const nextTerm = data.product.terms.includes(term) ? term : data.product.terms[data.product.terms.length - 1]
        setTerm(nextTerm)
        setPropertyPrice((v) => Math.min(Math.max(v, data.product.minPropertyPrice), data.product.maxPropertyPrice))
        setDownPayment((v) => Math.max(v, Math.round(30_000_000 * data.product.minDownPaymentPercent / 100)))
      })
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    if (!content.projects.length) return

    const params = new URLSearchParams(window.location.search)
    const selectSlug = params.get('select')
    if (!selectSlug) return

    const project = findProjectBySlug(content.projects.filter((item) => item.active), selectSlug)
    if (!project) return

    applyProjectSelection(project, params.get('apply') === '1')
    document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth', block: 'start' })

    params.delete('select')
    params.delete('apply')
    const nextQuery = params.toString()
    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash}`
    window.history.replaceState(null, '', nextUrl)
  }, [content.projects, content.product.minDownPaymentPercent])

  const product = content.product
  const projects = content.projects.filter((p) => p.active)
  const activePartners = content.partners.filter((p) => p.active)
  const result = useMemo(
    () => calculateMortgage(propertyPrice, term, downPayment, product),
    [propertyPrice, term, downPayment, product],
  )

  const onPriceChange = (value: string) => {
    const next = Math.max(Number(digits(value)) || 0, 0)
    setPropertyPrice(next)
    setDownPayment(Math.round(next * product.minDownPaymentPercent / 100))
    if (selectedProject && next !== selectedProject.priceFrom) setSelectedProject(null)
  }

  const chooseProject = (project: PropertyProject) => {
    applyProjectSelection(project)
    document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const filterByPartner = (partnerId: string) => {
    setProjectFilters((current) => ({ ...current, partnerId }))
    document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const clearPartnerFilter = () => {
    setProjectFilters((current) => ({ ...current, partnerId: null }))
  }

  const scrollToCalculator = () => {
    document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const openApplication = () => {
    setModalOpen(true)
    setSubmitted(false)
  }

  const maxTermMonths = Math.max(...product.terms)

  const submitApplication = async (event: FormEvent) => {
    event.preventDefault()
    if (digits(application.iin).length !== 12 || digits(application.phone).length < 10 || !application.consent) return

    const payload = {
      iin: digits(application.iin),
      phone: application.phone,
      selectedProjectId: selectedProject?.id ?? null,
      source: selectedProject ? 'project' : 'calculator',
      ...result,
      consentAccepted: true,
      consentVersion: '2026-08-11-v1',
      consentAcceptedAt: new Date().toISOString(),
    }

    const response = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (response.ok) setSubmitted(true)
  }

  return (
    <main id="top" className="apple-site">
      <header className="apple-header-shell">
        <div className="apple-header apple-container">
          <AilatLogo />
          <nav className={mobileMenu ? 'apple-nav apple-nav-open' : 'apple-nav'}>
            <a href="#mortgage" onClick={() => setMobileMenu(false)}>Ипотека</a>
            <a href="#projects" onClick={() => setMobileMenu(false)}>Жилые комплексы</a>
            <a href="#partners" onClick={() => setMobileMenu(false)}>Партнеры</a>
            <a href="#how-it-works" onClick={() => setMobileMenu(false)}>Как это работает</a>
          </nav>
          <div className="apple-header-actions">
            <button className="apple-pill apple-pill-small" onClick={scrollToCalculator}>Получить решение</button>
            <button className="apple-menu" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Меню">
              <span/><span/>
            </button>
          </div>
        </div>
      </header>

      <section className="apple-hero apple-container">
        <div className="apple-hero-copy">
          <span className="apple-eyebrow">Ailat Finance</span>
          <h1>Исламская ипотека.<br/>Понятно с первого шага.</h1>
          <p>Выберите жилье у партнеров Ailat Finance, рассчитайте условия финансирования и получите предварительное решение онлайн.</p>
          <div className="apple-hero-actions">
            <a className="apple-pill apple-pill-large" href="#calculator">Получить предварительное решение</a>
            <a className="apple-link-arrow" href="#projects">Смотреть жилые комплексы <span>→</span></a>
          </div>
        </div>
      </section>

      <section className="apple-trust-block">
        <div className="apple-container apple-trust-grid">
          <div className="apple-trust-item">
            <strong>Лицензия AFSA</strong>
            <span>Регулируемая финансовая деятельность</span>
          </div>
          <div className="apple-trust-item">
            <strong>Исламское финансирование</strong>
            <span>Прозрачная структура сделки</span>
          </div>
          <div className="apple-trust-item">
            <strong>Онлайн-заявка</strong>
            <span>Предварительное решение за минуты</span>
          </div>
        </div>
      </section>

      <section id="mortgage" className="apple-conditions-section apple-container">
        <div className="apple-section-intro apple-conditions-intro">
          <h2>Основные условия</h2>
          <p>{product.productDescription}</p>
        </div>
        <div className="apple-conditions-grid">
          <div className="apple-condition-item">
            <span>Максимальная сумма финансирования</span>
            <strong>до {formatKzt(product.maxFinancingAmount)}</strong>
          </div>
          <div className="apple-condition-item">
            <span>Минимальный первоначальный взнос</span>
            <strong>от {product.minDownPaymentPercent}%</strong>
          </div>
          <div className="apple-condition-item">
            <span>Максимальный срок финансирования</span>
            <strong>до {maxTermMonths} месяцев</strong>
          </div>
        </div>
      </section>

      <section id="calculator" className="apple-calculator-section">
        <div className="apple-container">
          <div className="apple-section-intro apple-centered apple-calc-intro">
            <h2>Рассчитайте финансирование</h2>
            <p>Изменяйте стоимость недвижимости, первоначальный взнос и срок — расчет обновится автоматически.</p>
          </div>

          <div className="apple-calculator-card">
            <div className="apple-calc-controls">
              {selectedProject && (
                <div className="apple-selected-project">
                  <div><span>Выбран объект</span><strong>{selectedProject.name}</strong></div>
                  <button onClick={() => setSelectedProject(null)} aria-label="Убрать выбранный объект">×</button>
                </div>
              )}

              <div className="apple-control-block">
                <div className="apple-control-label"><span>Стоимость недвижимости</span><b>{formatKzt(propertyPrice)}</b></div>
                <input
                  className="apple-range"
                  type="range"
                  min={product.minPropertyPrice}
                  max={product.maxPropertyPrice}
                  step="500000"
                  value={Math.min(Math.max(propertyPrice, product.minPropertyPrice), product.maxPropertyPrice)}
                  onChange={(e) => onPriceChange(e.target.value)}
                />
                <div className="apple-range-values"><span>{formatKzt(product.minPropertyPrice)}</span><span>{formatKzt(product.maxPropertyPrice)}</span></div>
                <div className="apple-inline-input"><input value={formatInputNumber(propertyPrice)} onChange={(e) => onPriceChange(e.target.value)} inputMode="numeric"/><span>₸</span></div>
              </div>

              <div className="apple-control-block">
                <div className="apple-control-label"><span>Первоначальный взнос</span><b>{result.downPaymentPercent}%</b></div>
                <input
                  className="apple-range"
                  type="range"
                  min={result.minDownPayment}
                  max={Math.max(propertyPrice * .8, result.minDownPayment)}
                  step="100000"
                  value={Math.min(result.downPayment, Math.max(propertyPrice * .8, result.minDownPayment))}
                  onChange={(e) => setDownPayment(Number(e.target.value))}
                />
                <div className="apple-range-values"><span>минимум {product.minDownPaymentPercent}%</span><span>{formatKzt(result.downPayment)}</span></div>
              </div>

              <div className="apple-control-block apple-control-last">
                <div className="apple-control-label"><span>Срок финансирования</span><b>{term} мес.</b></div>
                <div className="apple-term-tabs">
                  {product.terms.map((months) => (
                    <button key={months} className={term === months ? 'active' : ''} onClick={() => setTerm(months)}>{months}<span>мес.</span></button>
                  ))}
                </div>
              </div>
            </div>

            <div className="apple-calc-summary">
              <div>
                <span className="apple-summary-label">Ориентировочный платеж</span>
                <strong className="apple-summary-payment">{formatKzt(result.monthlyPayment)}</strong>
                <span className="apple-summary-period">в месяц*</span>
              </div>
              <div className="apple-summary-list">
                <div><span>Стоимость</span><b>{formatKzt(result.propertyPrice)}</b></div>
                <div><span>Ваш взнос</span><b>{formatKzt(result.downPayment)}</b></div>
                <div><span>Финансирование</span><b>{formatKzt(result.financingAmount)}</b></div>
                <div><span>Срок</span><b>{result.termMonths} мес.</b></div>
              </div>
              {!result.eligible && <div className="apple-alert">{result.eligibilityReason}</div>}
              <button className="apple-pill apple-pill-full" disabled={!result.eligible} onClick={openApplication}>{product.applicationCta}</button>
              <p className="apple-fineprint">*Предварительный расчет. Не является офертой или решением о предоставлении финансирования.</p>
            </div>
          </div>
        </div>
      </section>

      <PartnersSection
        partners={activePartners}
        projects={projects}
        activePartnerId={projectFilters.partnerId}
        onSelectPartner={filterByPartner}
        onClearPartner={clearPartnerFilter}
      />

      <ProjectsCatalog
        projects={projects}
        partners={activePartners}
        product={product}
        filters={projectFilters}
        onFiltersChange={setProjectFilters}
        onCalculate={chooseProject}
      />

      <section id="how-it-works" className="apple-how-section">
        <div className="apple-container">
          <div className="apple-section-intro apple-centered apple-how-intro">
            <span className="apple-section-label">Как это работает</span>
            <h2>Четыре шага до решения.</h2>
          </div>
          <div className="apple-how-grid">
            <div><span>1</span><h3>Выберите объект</h3><p>Из каталога партнеров или укажите стоимость самостоятельно.</p></div>
            <div><span>2</span><h3>Настройте расчет</h3><p>Выберите первоначальный взнос и подходящий срок финансирования.</p></div>
            <div><span>3</span><h3>Оставьте контакты</h3><p>ИИН, номер телефона и согласие на обработку персональных данных.</p></div>
            <div><span>4</span><h3>Получите обратную связь</h3><p>Менеджер Ailat свяжется с вами по предварительной заявке.</p></div>
          </div>
        </div>
      </section>

      <section className="apple-final-cta">
        <div className="apple-container apple-final-inner">
          <span className="apple-section-label">Ailat Mortgage</span>
          <h2>Начните с расчета.<br/>Остальное — проще.</h2>
          <a className="apple-pill apple-pill-large" href="#calculator">Рассчитать финансирование</a>
        </div>
      </section>

      <footer className="apple-footer">
        <div className="apple-container apple-footer-grid">
          <div><AilatLogo dark={false}/><p>Цифровая витрина исламского финансирования недвижимости.</p></div>
          <div><strong>Продукт</strong><a href="#mortgage">Ипотека</a><a href="#calculator">Калькулятор</a><a href="#projects">Жилые комплексы</a><a href="#how-it-works">Как это работает</a></div>
          <div><strong>Компания</strong><a href="https://ailat.kz" target="_blank" rel="noreferrer">Ailat Finance ↗</a><a href="/admin">Администрирование</a></div>
        </div>
        <div className="apple-container apple-footer-bottom"><span>© 2026 Ailat Finance</span><span>Предварительная версия продукта</span></div>
      </footer>

      {modalOpen && (
        <div className="apple-modal-backdrop" onMouseDown={() => setModalOpen(false)}>
          <div className="apple-modal" onMouseDown={(e) => e.stopPropagation()}>
            <button className="apple-modal-close" onClick={() => setModalOpen(false)}>×</button>
            {submitted ? (
              <div className="apple-success">
                <div className="apple-success-icon">✓</div>
                <span className="apple-section-label">Заявка принята</span>
                <h2>Спасибо.</h2>
                <p>Предварительная заявка зарегистрирована. Менеджер свяжется с вами по указанному номеру.</p>
                <button className="apple-pill apple-pill-full" onClick={() => setModalOpen(false)}>Готово</button>
              </div>
            ) : (
              <form onSubmit={submitApplication}>
                <span className="apple-section-label">Предварительная заявка</span>
                <h2>Всего два поля.</h2>
                <p className="apple-modal-lead">Параметры финансирования уже перенесены из вашего расчета.</p>
                <div className="apple-modal-summary"><div><span>Финансирование</span><b>{formatKzt(result.financingAmount)}</b></div><div><span>Платеж</span><b>{formatKzt(result.monthlyPayment)}</b></div></div>
                <label className="apple-form-field"><span>ИИН</span><input maxLength={12} inputMode="numeric" placeholder="000000000000" value={application.iin} onChange={(e) => setApplication({ ...application, iin: digits(e.target.value) })}/></label>
                <label className="apple-form-field"><span>Номер телефона</span><input placeholder="+7 700 000 00 00" value={application.phone} onChange={(e) => setApplication({ ...application, phone: e.target.value })}/></label>
                <label className="apple-consent"><input type="checkbox" checked={application.consent} onChange={(e) => setApplication({ ...application, consent: e.target.checked })}/><span>Я согласен на сбор и обработку персональных данных и подтверждаю ознакомление с условиями.</span></label>
                <button className="apple-pill apple-pill-full" type="submit">Отправить заявку</button>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
