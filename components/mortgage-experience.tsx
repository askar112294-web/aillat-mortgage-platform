'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import PartnersSection from '@/components/partners-section'
import ProjectsCatalog from '@/components/projects-catalog'
import { calculateMortgage, DEFAULT_PRODUCT, formatKzt } from '@/lib/mortgage'
import { DEFAULT_FILTERS, findProjectBySlug, type ProjectFilters } from '@/lib/projects'
import type { Partner, ProductConfig, PropertyProject } from '@/lib/types'
import calculatorStyles from './mortgage-calculator.module.css'

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
  const [propertyPriceInput, setPropertyPriceInput] = useState(formatInputNumber(30_000_000))
  const [downPayment, setDownPayment] = useState(9_000_000)
  const [downPaymentInput, setDownPaymentInput] = useState(formatInputNumber(9_000_000))
  const [term, setTerm] = useState(60)
  const [selectedProject, setSelectedProject] = useState<PropertyProject | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [application, setApplication] = useState<ApplicationState>({ iin: '', phone: '', consent: false })
  const [submitted, setSubmitted] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [projectFilters, setProjectFilters] = useState<ProjectFilters>(DEFAULT_FILTERS)

  useEffect(() => {
    fetch('/api/content', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data: Content) => {
        setContent(data)

        const nextTerm = data.product.terms.includes(term)
          ? term
          : data.product.terms[data.product.terms.length - 1]

        const nextPrice = Math.min(
          Math.max(propertyPrice, data.product.minPropertyPrice),
          data.product.maxPropertyPrice,
        )

        const minDownPayment = Math.round(nextPrice * data.product.minDownPaymentPercent / 100)
        const nextDownPayment = Math.max(downPayment, minDownPayment)

        setTerm(nextTerm)
        setPropertyPrice(nextPrice)
        setPropertyPriceInput(formatInputNumber(nextPrice))
        setDownPayment(nextDownPayment)
        setDownPaymentInput(formatInputNumber(nextDownPayment))
      })
      .catch(() => undefined)
  }, [])

  const product = content.product
  const projects = content.projects.filter((p) => p.active)
  const activePartners = content.partners.filter((p) => p.active)

  const minDownPaymentForCurrentPrice = Math.round(
    propertyPrice * product.minDownPaymentPercent / 100,
  )

  const result = useMemo(
    () => calculateMortgage(propertyPrice, term, downPayment, product),
    [propertyPrice, term, downPayment, product],
  )

  const applyProjectSelection = (project: PropertyProject, openApply = false) => {
    const nextDownPayment = Math.round(project.priceFrom * product.minDownPaymentPercent / 100)

    setSelectedProject(project)
    setPropertyPrice(project.priceFrom)
    setPropertyPriceInput(formatInputNumber(project.priceFrom))
    setDownPayment(nextDownPayment)
    setDownPaymentInput(formatInputNumber(nextDownPayment))

    if (openApply) {
      setModalOpen(true)
      setSubmitted(false)
    }
  }

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
  }, [content.projects, product.minDownPaymentPercent])

  const calculatorIssue = useMemo(() => {
    if (!propertyPrice) return 'Укажите стоимость недвижимости.'

    if (propertyPrice < product.minPropertyPrice) {
      return `Минимальная стоимость недвижимости — ${formatKzt(product.minPropertyPrice)}.`
    }

    if (propertyPrice > product.maxPropertyPrice) {
      return `Максимальная стоимость недвижимости — ${formatKzt(product.maxPropertyPrice)}.`
    }

    if (!downPayment) return 'Укажите первоначальный взнос.'

    if (downPayment < minDownPaymentForCurrentPrice) {
      return `Минимальный первоначальный взнос — ${product.minDownPaymentPercent}% (${formatKzt(minDownPaymentForCurrentPrice)}).`
    }

    if (downPayment >= propertyPrice) {
      return 'Первоначальный взнос должен быть меньше стоимости недвижимости.'
    }

    if (!result.eligible) {
      return result.eligibilityReason || 'Параметры не соответствуют условиям продукта.'
    }

    return null
  }, [
    propertyPrice,
    downPayment,
    product,
    minDownPaymentForCurrentPrice,
    result.eligible,
    result.eligibilityReason,
  ])

  const calculatorEligible = !calculatorIssue && result.eligible

  const onPriceInputChange = (value: string) => {
    const numeric = digits(value)
    const next = numeric ? Number(numeric) : 0

    setPropertyPrice(next)
    setPropertyPriceInput(numeric ? formatInputNumber(next) : '')

    if (selectedProject && next !== selectedProject.priceFrom) {
      setSelectedProject(null)
    }
  }

  const onPriceSliderChange = (value: number) => {
    setPropertyPrice(value)
    setPropertyPriceInput(formatInputNumber(value))

    if (selectedProject && value !== selectedProject.priceFrom) {
      setSelectedProject(null)
    }
  }

  const onDownPaymentInputChange = (value: string) => {
    const numeric = digits(value)
    const next = numeric ? Number(numeric) : 0

    setDownPayment(next)
    setDownPaymentInput(numeric ? formatInputNumber(next) : '')
  }

  const onDownPaymentSliderChange = (value: number) => {
    setDownPayment(value)
    setDownPaymentInput(formatInputNumber(value))
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
    if (!calculatorEligible) return
    setModalOpen(true)
    setSubmitted(false)
  }

  const maxTermMonths = Math.max(...product.terms)

  const submitApplication = async (event: FormEvent) => {
    event.preventDefault()

    if (
      digits(application.iin).length !== 12 ||
      digits(application.phone).length < 10 ||
      !application.consent ||
      !calculatorEligible
    ) return

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
          <h1>Исламская ипотека<br/>Понятно с первого шага</h1>
          <p>Выберите жилье у партнеров Ailat Finance, рассчитайте условия финансирования и получите предварительное решение онлайн</p>
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

      <section id="calculator" className={calculatorStyles.section}>
        <div className="apple-container">
          <div className={calculatorStyles.intro}>
            <span className="apple-section-label">Калькулятор</span>
            <h2>Рассчитайте комфортный платеж</h2>
            <p>Укажите стоимость недвижимости, первоначальный взнос и срок. Все денежные значения можно вводить вручную.</p>
          </div>

          <div className={calculatorStyles.card}>
            <div className={calculatorStyles.controls}>
              {selectedProject ? (
                <div className={calculatorStyles.selectedProject}>
                  <div>
                    <span>Выбран жилой комплекс</span>
                    <strong>{selectedProject.name}</strong>
                  </div>
                  <button type="button" onClick={() => setSelectedProject(null)} aria-label="Убрать выбранный объект">×</button>
                </div>
              ) : null}

              <div className={calculatorStyles.control}>
                <div className={calculatorStyles.controlHeader}>
                  <div>
                    <span>Стоимость недвижимости</span>
                    <small>Введите сумму вручную или используйте ползунок</small>
                  </div>
                </div>

                <label className={calculatorStyles.moneyInput}>
                  <input
                    value={propertyPriceInput}
                    onChange={(e) => onPriceInputChange(e.target.value)}
                    inputMode="numeric"
                    placeholder="30 000 000"
                    aria-label="Стоимость недвижимости"
                  />
                  <span>₸</span>
                </label>

                <input
                  className={calculatorStyles.range}
                  type="range"
                  min={product.minPropertyPrice}
                  max={product.maxPropertyPrice}
                  step="100000"
                  value={Math.min(Math.max(propertyPrice || product.minPropertyPrice, product.minPropertyPrice), product.maxPropertyPrice)}
                  onChange={(e) => onPriceSliderChange(Number(e.target.value))}
                />

                <div className={calculatorStyles.rangeValues}>
                  <span>{formatKzt(product.minPropertyPrice)}</span>
                  <span>{formatKzt(product.maxPropertyPrice)}</span>
                </div>
              </div>

              <div className={calculatorStyles.control}>
                <div className={calculatorStyles.controlHeader}>
                  <div>
                    <span>Первоначальный взнос</span>
                    <small>Минимум {product.minDownPaymentPercent}% от стоимости недвижимости</small>
                  </div>
                  <strong>
                    {propertyPrice > 0 ? `${Math.round((downPayment / propertyPrice) * 100)}%` : '0%'}
                  </strong>
                </div>

                <label className={calculatorStyles.moneyInput}>
                  <input
                    value={downPaymentInput}
                    onChange={(e) => onDownPaymentInputChange(e.target.value)}
                    inputMode="numeric"
                    placeholder="9 000 000"
                    aria-label="Первоначальный взнос"
                  />
                  <span>₸</span>
                </label>

                <input
                  className={calculatorStyles.range}
                  type="range"
                  min={Math.min(minDownPaymentForCurrentPrice, Math.max(propertyPrice, 1))}
                  max={Math.max(propertyPrice, minDownPaymentForCurrentPrice, 1)}
                  step="100000"
                  value={Math.min(
                    Math.max(downPayment || minDownPaymentForCurrentPrice, minDownPaymentForCurrentPrice),
                    Math.max(propertyPrice, minDownPaymentForCurrentPrice),
                  )}
                  onChange={(e) => onDownPaymentSliderChange(Number(e.target.value))}
                  disabled={!propertyPrice}
                />

                <div className={calculatorStyles.rangeValues}>
                  <span>Минимум {formatKzt(minDownPaymentForCurrentPrice)}</span>
                  <span>{propertyPrice ? formatKzt(propertyPrice) : '—'}</span>
                </div>
              </div>

              <div className={`${calculatorStyles.control} ${calculatorStyles.termControl}`}>
                <div className={calculatorStyles.controlHeader}>
                  <div>
                    <span>Срок финансирования</span>
                    <small>Выберите удобный срок</small>
                  </div>
                  <strong>{term} мес.</strong>
                </div>

                <div className={calculatorStyles.terms}>
                  {product.terms.map((months) => (
                    <button
                      type="button"
                      key={months}
                      className={term === months ? calculatorStyles.termActive : ''}
                      onClick={() => setTerm(months)}
                    >
                      <strong>{months}</strong>
                      <span>мес.</span>
                    </button>
                  ))}
                </div>
              </div>

              {calculatorIssue ? (
                <div className={calculatorStyles.validation}>
                  <span>!</span>
                  <p>{calculatorIssue}</p>
                </div>
              ) : (
                <div className={calculatorStyles.valid}>
                  <span>✓</span>
                  <p>Параметры соответствуют текущим условиям продукта</p>
                </div>
              )}
            </div>

            <aside className={calculatorStyles.summary}>
              <div className={calculatorStyles.summaryTop}>
                <span>Ориентировочный платеж</span>
                <strong>{calculatorEligible ? formatKzt(result.monthlyPayment) : '—'}</strong>
                <small>в месяц*</small>
              </div>

              <div className={calculatorStyles.summaryList}>
                <div><span>Стоимость недвижимости</span><strong>{propertyPrice ? formatKzt(propertyPrice) : '—'}</strong></div>
                <div><span>Первоначальный взнос</span><strong>{downPayment ? formatKzt(downPayment) : '—'}</strong></div>
                <div><span>Сумма финансирования</span><strong>{calculatorEligible ? formatKzt(result.financingAmount) : '—'}</strong></div>
                <div><span>Срок</span><strong>{term} мес.</strong></div>
              </div>

              <button className={calculatorStyles.cta} type="button" disabled={!calculatorEligible} onClick={openApplication}>
                {product.applicationCta}
              </button>

              <p className={calculatorStyles.fineprint}>
                *Предварительный расчет. Не является офертой или решением о предоставлении финансирования.
              </p>
            </aside>
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
            <h2>Четыре шага до решения</h2>
          </div>
          <div className="apple-how-grid">
            <div><span>1</span><h3>Выберите объект</h3><p>Из каталога партнеров или укажите стоимость самостоятельно</p></div>
            <div><span>2</span><h3>Настройте расчет</h3><p>Выберите первоначальный взнос и подходящий срок финансирования</p></div>
            <div><span>3</span><h3>Оставьте контакты</h3><p>ИИН, номер телефона и согласие на обработку персональных данных</p></div>
            <div><span>4</span><h3>Получите обратную связь</h3><p>Менеджер Ailat свяжется с вами по предварительной заявке</p></div>
          </div>
        </div>
      </section>

      <section className="apple-final-cta">
        <div className="apple-container apple-final-inner">
          <span className="apple-section-label">Ailat Mortgage</span>
          <h2>Начните с расчета<br/>Остальное — проще</h2>
          <a className="apple-pill apple-pill-large" href="#calculator">Рассчитать финансирование</a>
        </div>
      </section>

      <footer className="apple-footer">
        <div className="apple-container apple-footer-grid">
          <div><AilatLogo dark={false}/><p>Цифровая витрина исламского финансирования недвижимости</p></div>
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
                <div className="apple-modal-summary">
                  <div><span>Финансирование</span><b>{formatKzt(result.financingAmount)}</b></div>
                  <div><span>Платеж</span><b>{formatKzt(result.monthlyPayment)}</b></div>
                </div>
                <label className="apple-form-field">
                  <span>ИИН</span>
                  <input maxLength={12} inputMode="numeric" placeholder="000000000000" value={application.iin} onChange={(e) => setApplication({ ...application, iin: digits(e.target.value) })}/>
                </label>
                <label className="apple-form-field">
                  <span>Номер телефона</span>
                  <input placeholder="+7 700 000 00 00" value={application.phone} onChange={(e) => setApplication({ ...application, phone: e.target.value })}/>
                </label>
                <label className="apple-consent">
                  <input type="checkbox" checked={application.consent} onChange={(e) => setApplication({ ...application, consent: e.target.checked })}/>
                  <span>Я согласен на сбор и обработку персональных данных и подтверждаю ознакомление с условиями.</span>
                </label>
                <button className="apple-pill apple-pill-full" type="submit">Отправить заявку</button>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
