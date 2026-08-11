'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Application, Partner, ProductConfig, PropertyProject } from '@/lib/types'
import { DEFAULT_PRODUCT, formatKzt } from '@/lib/mortgage'

type Tab = 'overview' | 'product' | 'partners' | 'projects' | 'applications'
type Content = { product: ProductConfig; partners: Partner[]; projects: PropertyProject[] }

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
const inputNum = (value: string) => Number(value.replace(/\D/g, '')) || 0

const navItems: { id: Tab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Обзор', icon: '⌂' },
  { id: 'product', label: 'Продукт', icon: '◫' },
  { id: 'partners', label: 'Партнеры', icon: '◇' },
  { id: 'projects', label: 'Жилые комплексы', icon: '▦' },
  { id: 'applications', label: 'Заявки', icon: '◎' },
]

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>('overview')
  const [content, setContent] = useState<Content>({ product: DEFAULT_PRODUCT, partners: [], projects: [] })
  const [apps, setApps] = useState<Application[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const load = async () => {
    const [c, a] = await Promise.all([
      fetch('/api/content', { cache: 'no-store' }).then((r) => r.json()),
      fetch('/api/applications', { cache: 'no-store' }).then((r) => r.json()),
    ])
    setContent(c)
    setApps(a)
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    setSaving(true)
    setSaved(false)
    await fetch('/api/content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(content),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  const activeProjects = content.projects.filter((p) => p.active).length
  const newApps = apps.filter((a) => a.status === 'new').length
  const approvedApps = apps.filter((a) => a.status === 'approved').length
  const averageTicket = apps.length ? Math.round(apps.reduce((sum, app) => sum + app.financingAmount, 0) / apps.length) : 0
  const partnerProjects = useMemo(
    () => Object.fromEntries(content.partners.map((p) => [p.id, content.projects.filter((x) => x.partnerId === p.id).length])),
    [content],
  )

  const addPartner = () => setContent((c) => ({
    ...c,
    partners: [...c.partners, { id: uid('partner'), name: 'Новый партнер', city: 'Астана', description: '', website: '', logoUrl: '', active: true }],
  }))

  const addProject = () => setContent((c) => ({
    ...c,
    projects: [...c.projects, {
      id: uid('project'), partnerId: c.partners[0]?.id || '', name: 'Новый ЖК', city: 'Астана', district: '', address: '',
      priceFrom: 25_000_000, priceTo: undefined, areaFrom: undefined, areaTo: undefined, completion: '', badge: 'Новый проект',
      accent: 'lime', description: '', coverImageUrl: '', gallery: [], active: true,
    }],
  }))

  const setStatus = async (id: string, status: Application['status']) => {
    await fetch('/api/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    setApps((items) => items.map((item) => item.id === id ? { ...item, status } : item))
  }

  const title = {
    overview: 'Обзор',
    product: 'Ипотечный продукт',
    partners: 'Партнеры',
    projects: 'Жилые комплексы',
    applications: 'Заявки',
  }[tab]

  return (
    <div className="apple-admin-shell">
      <aside className="apple-admin-sidebar">
        <a href="/" className="admin-logo"><span className="admin-logo-mark">a</span><span>ailat<span>.</span></span></a>
        <div className="admin-product-name">Mortgage</div>
        <nav>
          {navItems.map((item) => (
            <button key={item.id} className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}>
              <span className="admin-nav-icon">{item.icon}</span><span>{item.label}</span>
              {item.id === 'applications' && newApps > 0 ? <b>{newApps}</b> : null}
            </button>
          ))}
        </nav>
        <div className="admin-side-footer">
          <a href="/" target="_blank">Открыть сайт <span>↗</span></a>
          <small>Ailat Mortgage CMS · v1.2</small>
        </div>
      </aside>

      <main className="apple-admin-main">
        <header className="apple-admin-topbar">
          <div><span>Ailat Mortgage</span><h1>{title}</h1></div>
          <div className="admin-top-actions">
            <button className="admin-icon-button" onClick={load} title="Обновить">↻</button>
            {tab !== 'overview' && tab !== 'applications' ? (
              <button className="admin-primary-button" onClick={save} disabled={saving}>{saved ? 'Сохранено ✓' : saving ? 'Сохранение...' : 'Сохранить'}</button>
            ) : null}
          </div>
        </header>

        {tab === 'overview' && (
          <section className="admin-view">
            <div className="admin-welcome">
              <div><span>Сегодня</span><h2>Система готова к работе.</h2><p>Управляйте ипотечным продуктом, объектами и заявками в одном месте.</p></div>
              <a href="/" target="_blank">Перейти на витрину <span>↗</span></a>
            </div>
            <div className="admin-metrics-grid">
              <Metric label="Всего заявок" value={String(apps.length)} note={`${newApps} новых`} tone="blue"/>
              <Metric label="Одобрено" value={String(approvedApps)} note={apps.length ? `${Math.round(approvedApps / apps.length * 100)}% от заявок` : 'пока нет данных'} tone="green"/>
              <Metric label="Средний чек" value={averageTicket ? shortMoney(averageTicket) : '—'} note="сумма финансирования" tone="violet"/>
              <Metric label="Активные ЖК" value={String(activeProjects)} note={`${content.partners.filter((p) => p.active).length} партнеров`} tone="orange"/>
            </div>
            <div className="admin-dashboard-grid">
              <div className="admin-panel admin-panel-wide">
                <PanelHead eyebrow="Последние заявки" title="Новые обращения" action={<button onClick={() => setTab('applications')}>Все заявки →</button>}/>
                <ApplicationTable apps={apps.slice(0, 5)} projects={content.projects} onStatus={setStatus}/>
              </div>
              <div className="admin-panel admin-product-snapshot">
                <PanelHead eyebrow="Продукт" title="Текущие условия" />
                <div className="admin-condition-list">
                  <div><span>Первоначальный взнос</span><strong>от {content.product.minDownPaymentPercent}%</strong></div>
                  <div><span>Финансирование</span><strong>{shortMoney(content.product.minFinancingAmount)} — {shortMoney(content.product.maxFinancingAmount)}</strong></div>
                  <div><span>Срок</span><strong>до {Math.max(...content.product.terms)} мес.</strong></div>
                  <div><span>Доступных сроков</span><strong>{content.product.terms.length}</strong></div>
                </div>
                <button className="admin-secondary-button" onClick={() => setTab('product')}>Редактировать продукт</button>
              </div>
            </div>
          </section>
        )}

        {tab === 'product' && (
          <section className="admin-view admin-two-column">
            <div className="admin-panel admin-form-panel">
              <PanelHead eyebrow="Контент" title="Витрина продукта" subtitle="Тексты главного экрана и блока о продукте." />
              <div className="admin-form-body">
                <Field label="Заголовок Hero" value={content.product.heroTitle} onChange={(v) => setContent((c) => ({ ...c, product: { ...c.product, heroTitle: v } }))}/>
                <TextArea label="Описание Hero" value={content.product.heroDescription} onChange={(v) => setContent((c) => ({ ...c, product: { ...c.product, heroDescription: v } }))}/>
                <Field label="Заголовок продукта" value={content.product.productTitle} onChange={(v) => setContent((c) => ({ ...c, product: { ...c.product, productTitle: v } }))}/>
                <TextArea label="Описание продукта" value={content.product.productDescription} onChange={(v) => setContent((c) => ({ ...c, product: { ...c.product, productDescription: v } }))}/>
                <Field label="Текст основной кнопки" value={content.product.applicationCta} onChange={(v) => setContent((c) => ({ ...c, product: { ...c.product, applicationCta: v } }))}/>
              </div>
            </div>
            <div className="admin-panel admin-form-panel">
              <PanelHead eyebrow="Параметры" title="Условия финансирования" subtitle="Эти значения напрямую влияют на калькулятор клиентской витрины." />
              <div className="admin-form-body">
                <div className="admin-field-grid">
                  <NumberField label="Мин. стоимость недвижимости, ₸" value={content.product.minPropertyPrice} onChange={(v) => setContent((c) => ({ ...c, product: { ...c.product, minPropertyPrice: v } }))}/>
                  <NumberField label="Макс. стоимость недвижимости, ₸" value={content.product.maxPropertyPrice} onChange={(v) => setContent((c) => ({ ...c, product: { ...c.product, maxPropertyPrice: v } }))}/>
                  <NumberField label="Мин. сумма финансирования, ₸" value={content.product.minFinancingAmount} onChange={(v) => setContent((c) => ({ ...c, product: { ...c.product, minFinancingAmount: v } }))}/>
                  <NumberField label="Макс. сумма финансирования, ₸" value={content.product.maxFinancingAmount} onChange={(v) => setContent((c) => ({ ...c, product: { ...c.product, maxFinancingAmount: v } }))}/>
                  <NumberField label="Минимальный ПВ, %" value={content.product.minDownPaymentPercent} onChange={(v) => setContent((c) => ({ ...c, product: { ...c.product, minDownPaymentPercent: v } }))}/>
                  <NumberField label="Демо-наценка, % в год" value={content.product.annualMarginPercent} onChange={(v) => setContent((c) => ({ ...c, product: { ...c.product, annualMarginPercent: v } }))}/>
                </div>
                <Field label="Сроки финансирования, мес. (через запятую)" value={content.product.terms.join(', ')} onChange={(v) => setContent((c) => ({ ...c, product: { ...c.product, terms: v.split(',').map((x) => Number(x.trim())).filter(Boolean) } }))}/>
                <div className="admin-info-box"><span>i</span><p>Формула расчета пока используется как UX-прототип. Перед production ее нужно заменить на утвержденную продуктовую методологию.</p></div>
              </div>
            </div>
          </section>
        )}

        {tab === 'partners' && (
          <section className="admin-view">
            <div className="admin-list-toolbar"><div><h2>Застройщики</h2><p>Партнеры, которые отображаются на клиентской витрине.</p></div><button className="admin-primary-button" onClick={addPartner}>+ Новый партнер</button></div>
            <div className="admin-entity-list">
              {content.partners.map((partner, index) => (
                <div className="admin-partner-row" key={partner.id}>
                  <div className="admin-partner-logo">{partner.name.slice(0, 1).toUpperCase()}</div>
                  <div className="admin-partner-main"><span>Партнер {String(index + 1).padStart(2, '0')}</span><Field label="Название" value={partner.name} onChange={(v) => updatePartner(partner.id, { name: v }, setContent)}/></div>
                  <div className="admin-partner-fields"><Field label="Город" value={partner.city} onChange={(v) => updatePartner(partner.id, { city: v }, setContent)}/><Field label="Сайт" value={partner.website || ''} onChange={(v) => updatePartner(partner.id, { website: v }, setContent)}/></div>
                  <div className="admin-partner-description"><TextArea label="Описание" value={partner.description} onChange={(v) => updatePartner(partner.id, { description: v }, setContent)}/></div>
                  <div className="admin-row-actions"><span>{partnerProjects[partner.id] || 0} ЖК</span><label className="admin-switch"><input type="checkbox" checked={partner.active} onChange={(e) => updatePartner(partner.id, { active: e.target.checked }, setContent)}/><i/></label><button className="admin-trash" onClick={() => setContent((c) => ({ ...c, partners: c.partners.filter((x) => x.id !== partner.id), projects: c.projects.filter((x) => x.partnerId !== partner.id) }))}>Удалить</button></div>
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === 'projects' && (
          <section className="admin-view">
            <div className="admin-list-toolbar"><div><h2>Жилые комплексы</h2><p>Добавляйте проекты и связывайте их с застройщиками.</p></div><button className="admin-primary-button" onClick={addProject} disabled={!content.partners.length}>+ Новый ЖК</button></div>
            <div className="admin-project-grid">
              {content.projects.map((project) => (
                <div className="admin-project-card" key={project.id}>
                  <div className={`admin-project-cover project-${project.accent}`}><span>{project.badge}</span><strong>{project.name}</strong><div/><i/></div>
                  <div className="admin-project-form">
                    <Field label="Название ЖК" value={project.name} onChange={(v) => updateProject(project.id, { name: v }, setContent)}/>
                    <SelectField label="Застройщик" value={project.partnerId} options={content.partners.map((x) => ({ value: x.id, label: x.name }))} onChange={(v) => updateProject(project.id, { partnerId: v }, setContent)}/>
                    <div className="admin-field-grid"><Field label="Город" value={project.city} onChange={(v) => updateProject(project.id, { city: v }, setContent)}/><Field label="Район" value={project.district} onChange={(v) => updateProject(project.id, { district: v }, setContent)}/></div>
                    <Field label="Адрес" value={project.address || ''} onChange={(v) => updateProject(project.id, { address: v }, setContent)}/>
                    <div className="admin-field-grid"><NumberField label="Стоимость от, ₸" value={project.priceFrom} onChange={(v) => updateProject(project.id, { priceFrom: v }, setContent)}/><Field label="Срок сдачи" value={project.completion} onChange={(v) => updateProject(project.id, { completion: v }, setContent)}/></div>
                    <Field label="Бейдж" value={project.badge} onChange={(v) => updateProject(project.id, { badge: v }, setContent)}/>
                    <TextArea label="Описание" value={project.description} onChange={(v) => updateProject(project.id, { description: v }, setContent)}/>
                  </div>
                  <div className="admin-project-footer"><label><span>Публикация</span><div className="admin-switch"><input type="checkbox" checked={project.active} onChange={(e) => updateProject(project.id, { active: e.target.checked }, setContent)}/><i/></div></label><button className="admin-trash" onClick={() => setContent((c) => ({ ...c, projects: c.projects.filter((x) => x.id !== project.id) }))}>Удалить ЖК</button></div>
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === 'applications' && (
          <section className="admin-view">
            <div className="admin-list-toolbar"><div><h2>Входящие заявки</h2><p>Предварительные заявки с клиентской витрины.</p></div><button className="admin-secondary-button" onClick={load}>↻ Обновить</button></div>
            <div className="admin-panel admin-table-panel"><ApplicationTable apps={apps} projects={content.projects} onStatus={setStatus}/></div>
          </section>
        )}
      </main>
    </div>
  )
}

function updatePartner(id: string, patch: Partial<Partner>, setter: React.Dispatch<React.SetStateAction<Content>>) {
  setter((c) => ({ ...c, partners: c.partners.map((item) => item.id === id ? { ...item, ...patch } : item) }))
}
function updateProject(id: string, patch: Partial<PropertyProject>, setter: React.Dispatch<React.SetStateAction<Content>>) {
  setter((c) => ({ ...c, projects: c.projects.map((item) => item.id === id ? { ...item, ...patch } : item) }))
}
function shortMoney(value: number) { return value >= 1_000_000 ? `${(value / 1_000_000).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} млн ₸` : formatKzt(value) }
function Metric({ label, value, note, tone }: { label: string; value: string; note: string; tone: string }) { return <div className={`admin-metric admin-metric-${tone}`}><div className="admin-metric-dot"/><span>{label}</span><strong>{value}</strong><small>{note}</small></div> }
function PanelHead({ eyebrow, title, subtitle, action }: { eyebrow: string; title: string; subtitle?: string; action?: React.ReactNode }) { return <div className="admin-panel-head"><div><span>{eyebrow}</span><h3>{title}</h3>{subtitle ? <p>{subtitle}</p> : null}</div>{action}</div> }
function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) { return <label className="admin-field-new"><span>{label}</span><input value={value} onChange={(e) => onChange(e.target.value)}/></label> }
function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) { return <label className="admin-field-new"><span>{label}</span><textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)}/></label> }
function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) { return <label className="admin-field-new"><span>{label}</span><input inputMode="numeric" value={value.toLocaleString('ru-RU')} onChange={(e) => onChange(inputNum(e.target.value))}/></label> }
function SelectField({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) { return <label className="admin-field-new"><span>{label}</span><select value={value} onChange={(e) => onChange(e.target.value)}>{options.map((o) => <option value={o.value} key={o.value}>{o.label}</option>)}</select></label> }
function ApplicationTable({ apps, projects, onStatus }: { apps: Application[]; projects: PropertyProject[]; onStatus: (id: string, status: Application['status']) => void }) {
  const label: Record<Application['status'], string> = { new: 'Новая', in_progress: 'В работе', approved: 'Одобрена', rejected: 'Отказ' }
  return <div className="admin-table-wrap"><table className="admin-table-new"><thead><tr><th>Заявка</th><th>Клиент</th><th>Объект</th><th>Финансирование</th><th>Дата</th><th>Статус</th></tr></thead><tbody>{apps.length ? apps.map((app) => <tr key={app.id}><td><strong>{app.id}</strong><span>{app.source === 'project' ? 'из карточки ЖК' : 'из калькулятора'}</span></td><td><strong>{app.iin}</strong><span>{app.phone}</span></td><td><strong>{projects.find((p) => p.id === app.selectedProjectId)?.name || 'Не выбран'}</strong><span>{formatKzt(app.propertyPrice)}</span></td><td><strong>{formatKzt(app.financingAmount)}</strong><span>{app.termMonths} мес. · ПВ {app.downPaymentPercent || Math.round(app.downPayment / app.propertyPrice * 100)}%</span></td><td><strong>{new Date(app.createdAt).toLocaleDateString('ru-RU')}</strong><span>{new Date(app.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span></td><td><select className={`admin-status admin-status-${app.status}`} value={app.status} onChange={(e) => onStatus(app.id, e.target.value as Application['status'])}>{Object.entries(label).map(([value, text]) => <option value={value} key={value}>{text}</option>)}</select></td></tr>) : <tr><td colSpan={6} className="admin-empty">Заявок пока нет. Отправьте тестовую заявку с клиентской витрины.</td></tr>}</tbody></table></div>
}
