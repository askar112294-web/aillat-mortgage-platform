'use client'

import { useEffect, useMemo, useState } from 'react'
import type {
  Application,
  Partner,
  ProductConfig,
  ProjectAttribute,
  ProjectFeature,
  PropertyProject,
} from '@/lib/types'
import { DEFAULT_PRODUCT, formatKzt } from '@/lib/mortgage'
import uploadStyles from './admin-project-upload.module.css'

type Tab = 'overview' | 'product' | 'partners' | 'projects' | 'applications' | 'account'
type Content = { product: ProductConfig; partners: Partner[]; projects: PropertyProject[] }

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
const inputNum = (value: string) => Number(value.replace(/\D/g, '')) || 0

const navItems: { id: Tab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Обзор', icon: '⌂' },
  { id: 'product', label: 'Продукт', icon: '◫' },
  { id: 'partners', label: 'Партнеры', icon: '◇' },
  { id: 'projects', label: 'Жилые комплексы', icon: '▦' },
  { id: 'applications', label: 'Заявки', icon: '◎' },
  { id: 'account', label: 'Аккаунт', icon: '⚙' },
]

export default function AdminPanel() {

  const [tab, setTab] = useState<Tab>('overview')

  const [content, setContent] = useState<Content>({

    product: DEFAULT_PRODUCT,

    partners: [],

    projects: [],

  })

  const [termsInput, setTermsInput] = useState(DEFAULT_PRODUCT.terms.join(', '))

  const [apps, setApps] = useState<Application[]>([])

  const [saving, setSaving] = useState(false)

  const [saved, setSaved] = useState(false)
  
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
const [confirmPassword, setConfirmPassword] = useState('')
const [passwordMessage, setPasswordMessage] = useState('')
const [passwordError, setPasswordError] = useState('')
const [passwordSaving, setPasswordSaving] = useState(false)

  const [uploadingProjectId, setUploadingProjectId] = useState<string | null>(null)

  const [uploadingGalleryProjectId, setUploadingGalleryProjectId] = useState<string | null>(null)

  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({})

  const load = async () => {

    const [c, a] = await Promise.all([

      fetch('/api/content', { cache: 'no-store' }).then((r) => r.json()),

      fetch('/api/applications', { cache: 'no-store' }).then((r) => r.json()),

    ])

    setContent(c)

    setTermsInput(c.product.terms.join(', '))

    setApps(a)

  }

  useEffect(() => {

    load()

  }, [])

  const save = async () => {

    setSaving(true)

    setSaved(false)

    await fetch('/api/content', {

      method: 'PUT',

      headers: {

        'Content-Type': 'application/json',

      },

      body: JSON.stringify(content),

    })

    setSaving(false)

    setSaved(true)

    setTimeout(() => {

      setSaved(false)

    }, 1800)

  }

  const logout = async () => {

    const response = await fetch('/api/auth/logout', {

      method: 'POST',

    })

    if (response.ok) {

      window.location.href = '/admin/login'

    }

  }
  const changePassword = async () => {
    setPasswordError('')
    setPasswordMessage('')
  
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Заполните все поля')
      return
    }
  
    if (newPassword !== confirmPassword) {
      setPasswordError('Новые пароли не совпадают')
      return
    }
  
    if (newPassword.length < 8) {
      setPasswordError('Новый пароль должен содержать минимум 8 символов')
      return
    }
  
    setPasswordSaving(true)
  
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })
  
      const data = await response.json()
  
      if (!response.ok) {
        setPasswordError(data.error || 'Не удалось изменить пароль')
        return
      }
  
      setPasswordMessage('Пароль успешно изменен')
  
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
  
      await fetch('/api/auth/logout', {
        method: 'POST',
      })
  
      setTimeout(() => {
        window.location.href = '/admin/login'
      }, 1200)
    } catch {
      setPasswordError('Не удалось изменить пароль')
    } finally {
      setPasswordSaving(false)
    }
  }

  const activeProjects = content.projects.filter((p) => p.active).length
  const newApps = apps.filter((a) => a.status === 'new').length
  const approvedApps = apps.filter((a) => a.status === 'approved').length
  const averageTicket = apps.length
    ? Math.round(apps.reduce((sum, app) => sum + app.financingAmount, 0) / apps.length)
    : 0

  const partnerProjects = useMemo(
    () => Object.fromEntries(
      content.partners.map((p) => [
        p.id,
        content.projects.filter((x) => x.partnerId === p.id).length,
      ]),
    ),
    [content],
  )

  const addPartner = () => setContent((c) => ({
    ...c,
    partners: [
      ...c.partners,
      {
        id: uid('partner'),
        name: 'Новый партнер',
        city: 'Астана',
        description: '',
        website: '',
        logoUrl: '',
        active: true,
      },
    ],
  }))

  const addProject = () => setContent((c) => ({
    ...c,
    projects: [
      ...c.projects,
      {
        id: uid('project'),
        partnerId: c.partners[0]?.id || '',
        name: 'Новый ЖК',
        city: 'Астана',
        district: '',
        address: '',
        priceFrom: 25_000_000,
        priceTo: undefined,
        areaFrom: undefined,
        areaTo: undefined,
        completion: '',
        badge: 'Новый проект',
        accent: 'lime',
        description: '',
        coverImageUrl: '',
        gallery: [],
        housingClass: '',
        buildingType: '',
        floors: undefined,
        ceilingHeight: undefined,
        attributes: [],
        features: [],
        active: true,
      },
    ],
  }))

  const uploadFile = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/uploads/projects', {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Ошибка загрузки изображения')
    }

    return data.url as string
  }

  const uploadProjectCover = async (projectId: string, file: File) => {
    setUploadingProjectId(projectId)
    setUploadErrors((current) => ({ ...current, [projectId]: '' }))

    try {
      const url = await uploadFile(file)
      updateProject(projectId, { coverImageUrl: url }, setContent)
    } catch (error) {
      setUploadErrors((current) => ({
        ...current,
        [projectId]: error instanceof Error ? error.message : 'Ошибка загрузки изображения',
      }))
    } finally {
      setUploadingProjectId(null)
    }
  }

  const uploadProjectGallery = async (projectId: string, files: File[]) => {
    if (!files.length) return

    setUploadingGalleryProjectId(projectId)
    setUploadErrors((current) => ({ ...current, [projectId]: '' }))

    try {
      const urls: string[] = []

      for (const file of files.slice(0, 10)) {
        urls.push(await uploadFile(file))
      }

      setContent((current) => ({
        ...current,
        projects: current.projects.map((project) =>
          project.id === projectId
            ? { ...project, gallery: [...(project.gallery || []), ...urls] }
            : project,
        ),
      }))
    } catch (error) {
      setUploadErrors((current) => ({
        ...current,
        [projectId]: error instanceof Error ? error.message : 'Ошибка загрузки галереи',
      }))
    } finally {
      setUploadingGalleryProjectId(null)
    }
  }

  const removeGalleryImage = (projectId: string, url: string) => {
    setContent((current) => ({
      ...current,
      projects: current.projects.map((project) =>
        project.id === projectId
          ? { ...project, gallery: (project.gallery || []).filter((item) => item !== url) }
          : project,
      ),
    }))
  }

  const addAttribute = (projectId: string) => {
    const next: ProjectAttribute = {
      id: uid('attribute'),
      label: '',
      value: '',
    }

    setContent((current) => ({
      ...current,
      projects: current.projects.map((project) =>
        project.id === projectId
          ? { ...project, attributes: [...(project.attributes || []), next] }
          : project,
      ),
    }))
  }

  const updateAttribute = (
    projectId: string,
    attributeId: string,
    patch: Partial<ProjectAttribute>,
  ) => {
    setContent((current) => ({
      ...current,
      projects: current.projects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              attributes: (project.attributes || []).map((item) =>
                item.id === attributeId ? { ...item, ...patch } : item,
              ),
            }
          : project,
      ),
    }))
  }

  const removeAttribute = (projectId: string, attributeId: string) => {
    setContent((current) => ({
      ...current,
      projects: current.projects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              attributes: (project.attributes || []).filter((item) => item.id !== attributeId),
            }
          : project,
      ),
    }))
  }

  const addFeature = (projectId: string) => {
    const next: ProjectFeature = {
      id: uid('feature'),
      icon: '✓',
      title: '',
      description: '',
    }

    setContent((current) => ({
      ...current,
      projects: current.projects.map((project) =>
        project.id === projectId
          ? { ...project, features: [...(project.features || []), next] }
          : project,
      ),
    }))
  }

  const updateFeature = (
    projectId: string,
    featureId: string,
    patch: Partial<ProjectFeature>,
  ) => {
    setContent((current) => ({
      ...current,
      projects: current.projects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              features: (project.features || []).map((item) =>
                item.id === featureId ? { ...item, ...patch } : item,
              ),
            }
          : project,
      ),
    }))
  }

  const removeFeature = (projectId: string, featureId: string) => {
    setContent((current) => ({
      ...current,
      projects: current.projects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              features: (project.features || []).filter((item) => item.id !== featureId),
            }
          : project,
      ),
    }))
  }

  const setStatus = async (id: string, status: Application['status']) => {
    await fetch('/api/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })

    setApps((items) =>
      items.map((item) => item.id === id ? { ...item, status } : item),
    )
  }

  const title = {
    overview: 'Обзор',
    product: 'Ипотечный продукт',
    partners: 'Партнеры',
    projects: 'Жилые комплексы',
    applications: 'Заявки',
    account: 'Аккаунт',
  }[tab]

  return (
    <div className="apple-admin-shell">
      <aside className="apple-admin-sidebar">
        <a href="/" className="admin-logo">
          <span className="admin-logo-mark">a</span>
          <span>ailat<span>.</span></span>
        </a>

        <div className="admin-product-name">Mortgage</div>

        <nav>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={tab === item.id ? 'active' : ''}
              onClick={() => setTab(item.id)}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.id === 'applications' && newApps > 0 ? <b>{newApps}</b> : null}
            </button>
          ))}
        </nav>

        <div className="admin-side-footer">
  <a href="/" target="_blank" rel="noreferrer">
    Открыть сайт <span>↗</span>
  </a>

  <button
    type="button"
    onClick={logout}
    className="admin-logout-button"
  >
    Выйти
  </button>

  <small>Ailat Mortgage CMS · v1.4</small>
</div>
      </aside>

      <main className="apple-admin-main">
        <header className="apple-admin-topbar">
          <div>
            <span>Ailat Mortgage</span>
            <h1>{title}</h1>
          </div>

          <div className="admin-top-actions">
            <button className="admin-icon-button" onClick={load} title="Обновить">↻</button>

            {tab !== 'overview' && tab !== 'applications' ? (
              <button className="admin-primary-button" onClick={save} disabled={saving}>
                {saved ? 'Сохранено ✓' : saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            ) : null}
          </div>
        </header>

        {tab === 'overview' && (
          <section className="admin-view">
            <div className="admin-welcome">
              <div>
                <span>Сегодня</span>
                <h2>Система готова к работе.</h2>
                <p>Управляйте ипотечным продуктом, объектами и заявками в одном месте.</p>
              </div>
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

                <button className="admin-secondary-button" onClick={() => setTab('product')}>
                  Редактировать продукт
                </button>
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

                <Field
  label="Сроки финансирования, мес. (через запятую)"
  value={termsInput}
  onChange={(v) => {
    setTermsInput(v)

    const terms = v
      .split(',')
      .map((x) => Number(x.trim()))
      .filter((x) => Number.isFinite(x) && x > 0)

    setContent((c) => ({
      ...c,
      product: {
        ...c.product,
        terms,
      },
    }))
  }}
/>

                <div className="admin-info-box">
                  <span>i</span>
                  <p>Формула расчета пока используется как UX-прототип. Перед production ее нужно заменить на утвержденную продуктовую методологию.</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {tab === 'partners' && (
          <section className="admin-view">
            <div className="admin-list-toolbar">
              <div>
                <h2>Застройщики</h2>
                <p>Партнеры, которые отображаются на клиентской витрине.</p>
              </div>

              <button className="admin-primary-button" onClick={addPartner}>+ Новый партнер</button>
            </div>

            <div className="admin-entity-list">
              {content.partners.map((partner, index) => (
                <div className="admin-partner-row" key={partner.id}>
                  <div className="admin-partner-logo">{partner.name.slice(0, 1).toUpperCase()}</div>

                  <div className="admin-partner-main">
                    <span>Партнер {String(index + 1).padStart(2, '0')}</span>
                    <Field label="Название" value={partner.name} onChange={(v) => updatePartner(partner.id, { name: v }, setContent)}/>
                  </div>

                  <div className="admin-partner-fields">
                    <Field label="Город" value={partner.city} onChange={(v) => updatePartner(partner.id, { city: v }, setContent)}/>
                    <Field label="Сайт" value={partner.website || ''} onChange={(v) => updatePartner(partner.id, { website: v }, setContent)}/>
                  </div>

                  <div className="admin-partner-description">
                    <TextArea label="Описание" value={partner.description} onChange={(v) => updatePartner(partner.id, { description: v }, setContent)}/>
                  </div>

                  <div className="admin-row-actions">
                    <span>{partnerProjects[partner.id] || 0} ЖК</span>

                    <label className="admin-switch">
                      <input
                        type="checkbox"
                        checked={partner.active}
                        onChange={(e) => updatePartner(partner.id, { active: e.target.checked }, setContent)}
                      />
                      <i/>
                    </label>

                    <button
                      className="admin-trash"
                      onClick={() =>
                        setContent((c) => ({
                          ...c,
                          partners: c.partners.filter((x) => x.id !== partner.id),
                          projects: c.projects.filter((x) => x.partnerId !== partner.id),
                        }))
                      }
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === 'projects' && (
          <section className="admin-view">
            <div className="admin-list-toolbar">
              <div>
                <h2>Жилые комплексы</h2>
                <p>Контент, паспорт проекта, характеристики и преимущества.</p>
              </div>

              <button
                className="admin-primary-button"
                onClick={addProject}
                disabled={!content.partners.length}
              >
                + Новый ЖК
              </button>
            </div>

            <div className="admin-project-grid">
              {content.projects.map((project) => (
                <div className="admin-project-card" key={project.id}>
                  <div className={uploadStyles.imageManager}>
                    <div className={uploadStyles.cover}>
                      {project.coverImageUrl?.trim() ? (
                        <img
                          className={uploadStyles.coverImage}
                          src={project.coverImageUrl}
                          alt={project.name}
                        />
                      ) : (
                        <div className={uploadStyles.placeholder}>
                          <span>Фото отсутствует</span>
                        </div>
                      )}

                      {project.badge ? (
                        <span className={uploadStyles.badge}>{project.badge}</span>
                      ) : null}
                    </div>

                    <div className={uploadStyles.actions}>
                      <label className={`${uploadStyles.uploadButton} ${uploadingProjectId === project.id ? uploadStyles.uploadButtonDisabled : ''}`}>
                        {uploadingProjectId === project.id
                          ? 'Загрузка...'
                          : project.coverImageUrl
                            ? 'Заменить обложку'
                            : 'Загрузить обложку'}

                        <input
                          className={uploadStyles.fileInput}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          disabled={uploadingProjectId === project.id}
                          onChange={(event) => {
                            const file = event.target.files?.[0]
                            if (file) uploadProjectCover(project.id, file)
                            event.target.value = ''
                          }}
                        />
                      </label>

                      {project.coverImageUrl ? (
                        <button
                          type="button"
                          className={uploadStyles.removeButton}
                          onClick={() => updateProject(project.id, { coverImageUrl: '' }, setContent)}
                        >
                          Удалить
                        </button>
                      ) : null}

                      <small className={uploadStyles.hint}>
                        Обложка · JPG, PNG или WebP · до 5 МБ
                      </small>
                    </div>

                    <div className={uploadStyles.galleryBlock}>
                      <div className={uploadStyles.galleryHeader}>
                        <strong>Галерея ЖК</strong>
                        <span>{(project.gallery || []).length} фото</span>
                      </div>

                      {(project.gallery || []).length ? (
                        <div className={uploadStyles.galleryGrid}>
                          {(project.gallery || []).map((url) => (
                            <div className={uploadStyles.galleryItem} key={url}>
                              <img src={url} alt={project.name} />

                              <button
                                type="button"
                                className={uploadStyles.galleryDelete}
                                onClick={() => removeGalleryImage(project.id, url)}
                                aria-label="Удалить фотографию"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className={uploadStyles.galleryEmpty}>
                          Дополнительные фотографии еще не загружены
                        </div>
                      )}

                      <div className={uploadStyles.actions}>
                        <label className={`${uploadStyles.uploadButton} ${uploadingGalleryProjectId === project.id ? uploadStyles.uploadButtonDisabled : ''}`}>
                          {uploadingGalleryProjectId === project.id
                            ? 'Загрузка галереи...'
                            : '+ Добавить фотографии'}

                          <input
                            className={uploadStyles.fileInput}
                            type="file"
                            multiple
                            accept="image/jpeg,image/png,image/webp"
                            disabled={uploadingGalleryProjectId === project.id}
                            onChange={(event) => {
                              const files = Array.from(event.target.files || [])
                              if (files.length) uploadProjectGallery(project.id, files)
                              event.target.value = ''
                            }}
                          />
                        </label>

                        <small className={uploadStyles.hint}>
                          Можно выбрать несколько файлов одновременно · максимум 10 за загрузку
                        </small>
                      </div>
                    </div>

                    {uploadErrors[project.id] ? (
                      <div className={uploadStyles.error}>{uploadErrors[project.id]}</div>
                    ) : null}
                  </div>

                  <div className="admin-project-form">
                    <PanelHead
                      eyebrow="Основное"
                      title={project.name || 'Новый ЖК'}
                      subtitle="Базовые данные проекта."
                    />

                    <Field label="Название ЖК" value={project.name} onChange={(v) => updateProject(project.id, { name: v }, setContent)}/>

                    <SelectField
                      label="Застройщик"
                      value={project.partnerId}
                      options={content.partners.map((x) => ({ value: x.id, label: x.name }))}
                      onChange={(v) => updateProject(project.id, { partnerId: v }, setContent)}
                    />

                    <div className="admin-field-grid">
                      <Field label="Город" value={project.city} onChange={(v) => updateProject(project.id, { city: v }, setContent)}/>
                      <Field label="Район" value={project.district} onChange={(v) => updateProject(project.id, { district: v }, setContent)}/>
                    </div>

                    <Field label="Адрес" value={project.address || ''} onChange={(v) => updateProject(project.id, { address: v }, setContent)}/>

                    <div className="admin-field-grid">
                      <NumberField label="Стоимость от, ₸" value={project.priceFrom} onChange={(v) => updateProject(project.id, { priceFrom: v }, setContent)}/>
                      <OptionalNumberField label="Стоимость до, ₸" value={project.priceTo} onChange={(v) => updateProject(project.id, { priceTo: v }, setContent)}/>
                    </div>

                    <div className="admin-field-grid">
                      <OptionalNumberField label="Площадь от, м²" value={project.areaFrom} onChange={(v) => updateProject(project.id, { areaFrom: v }, setContent)}/>
                      <OptionalNumberField label="Площадь до, м²" value={project.areaTo} onChange={(v) => updateProject(project.id, { areaTo: v }, setContent)}/>
                    </div>

                    <div className="admin-field-grid">
                      <Field label="Срок сдачи" value={project.completion} onChange={(v) => updateProject(project.id, { completion: v }, setContent)}/>
                      <SelectField
                        label="Статус строительства"
                        value={project.constructionStatus || 'building'}
                        options={[
                          { value: 'ready', label: 'Сдан' },
                          { value: 'building', label: 'Строится' },
                          { value: 'planned', label: 'Планируется' },
                        ]}
                        onChange={(v) => updateProject(project.id, { constructionStatus: v as PropertyProject['constructionStatus'] }, setContent)}
                      />
                    </div>

                    <Field label="Бейдж" value={project.badge} onChange={(v) => updateProject(project.id, { badge: v }, setContent)}/>
                    <TextArea label="Описание" value={project.description} onChange={(v) => updateProject(project.id, { description: v }, setContent)}/>

                    <div style={{ borderTop: '1px solid #eceeef', paddingTop: 24, marginTop: 8 }}>
                      <PanelHead
                        eyebrow="Паспорт ЖК"
                        title="Общая информация"
                        subtitle="Ключевые параметры жилого комплекса без детализации по квартирам."
                      />

                      <div className="admin-field-grid">
                        <Field
                          label="Класс жилья"
                          value={project.housingClass || ''}
                          onChange={(v) => updateProject(project.id, { housingClass: v }, setContent)}
                        />

                        <Field
                          label="Тип дома"
                          value={project.buildingType || ''}
                          onChange={(v) => updateProject(project.id, { buildingType: v }, setContent)}
                        />
                      </div>

                      <div className="admin-field-grid">
                        <OptionalNumberField
                          label="Этажность"
                          value={project.floors}
                          onChange={(v) => updateProject(project.id, { floors: v }, setContent)}
                        />

                        <OptionalDecimalField
                          label="Высота потолков, м"
                          value={project.ceilingHeight}
                          onChange={(v) => updateProject(project.id, { ceilingHeight: v }, setContent)}
                        />
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid #eceeef', paddingTop: 24, marginTop: 8 }}>
                      <PanelHead
                        eyebrow="Характеристики"
                        title="Дополнительные параметры"
                        subtitle="Любые пары «название — значение», которые нужны конкретному ЖК."
                        action={
                          <button type="button" onClick={() => addAttribute(project.id)}>
                            + Добавить
                          </button>
                        }
                      />

                      {(project.attributes || []).length ? (
                        <div style={{ display: 'grid', gap: 12 }}>
                          {(project.attributes || []).map((attribute) => (
                            <div
                              key={attribute.id}
                              style={{
                                padding: 14,
                                border: '1px solid #eceeef',
                                borderRadius: 14,
                              }}
                            >
                              <div className="admin-field-grid">
                                <Field
                                  label="Название"
                                  value={attribute.label}
                                  onChange={(v) => updateAttribute(project.id, attribute.id, { label: v })}
                                />

                                <Field
                                  label="Значение"
                                  value={attribute.value}
                                  onChange={(v) => updateAttribute(project.id, attribute.id, { value: v })}
                                />
                              </div>

                              <button
                                type="button"
                                className="admin-trash"
                                onClick={() => removeAttribute(project.id, attribute.id)}
                              >
                                Удалить характеристику
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="admin-info-box">
                          <span>i</span>
                          <p>Например: «Паркинг — Подземный», «Отделка — White Box», «Лифты — 4».</p>
                        </div>
                      )}
                    </div>

                    <div style={{ borderTop: '1px solid #eceeef', paddingTop: 24, marginTop: 8 }}>
                      <PanelHead
                        eyebrow="Преимущества"
                        title="Особенности проекта"
                        subtitle="Преимущества отображаются отдельными карточками."
                        action={
                          <button type="button" onClick={() => addFeature(project.id)}>
                            + Добавить
                          </button>
                        }
                      />

                      {(project.features || []).length ? (
                        <div style={{ display: 'grid', gap: 12 }}>
                          {(project.features || []).map((feature) => (
                            <div
                              key={feature.id}
                              style={{
                                padding: 14,
                                border: '1px solid #eceeef',
                                borderRadius: 14,
                              }}
                            >
                              <div className="admin-field-grid">
                                <Field
                                  label="Иконка / символ"
                                  value={feature.icon}
                                  onChange={(v) => updateFeature(project.id, feature.id, { icon: v })}
                                />

                                <Field
                                  label="Название"
                                  value={feature.title}
                                  onChange={(v) => updateFeature(project.id, feature.id, { title: v })}
                                />
                              </div>

                              <TextArea
                                label="Короткое описание"
                                value={feature.description || ''}
                                onChange={(v) => updateFeature(project.id, feature.id, { description: v })}
                              />

                              <button
                                type="button"
                                className="admin-trash"
                                onClick={() => removeFeature(project.id, feature.id)}
                              >
                                Удалить преимущество
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="admin-info-box">
                          <span>i</span>
                          <p>Например: «🚗 Подземный паркинг», «🛡 Закрытая территория», «🌳 Благоустроенный двор».</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="admin-project-footer">
                    <label>
                      <span>Публикация</span>

                      <div className="admin-switch">
                        <input
                          type="checkbox"
                          checked={project.active}
                          onChange={(e) => updateProject(project.id, { active: e.target.checked }, setContent)}
                        />
                        <i/>
                      </div>
                    </label>

                    <button
                      className="admin-trash"
                      onClick={() =>
                        setContent((c) => ({
                          ...c,
                          projects: c.projects.filter((x) => x.id !== project.id),
                        }))
                      }
                    >
                      Удалить ЖК
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

{tab === 'applications' && (
  <section className="admin-view">
    <div className="admin-list-toolbar">
      <div>
        <h2>Входящие заявки</h2>
        <p>Предварительные заявки с клиентской витрины.</p>
      </div>

      <button className="admin-secondary-button" onClick={load}>
        ↻ Обновить
      </button>
    </div>

    <div className="admin-panel admin-table-panel">
      <ApplicationTable
        apps={apps}
        projects={content.projects}
        onStatus={setStatus}
      />
    </div>
  </section>
)}

{tab === 'account' && (
  <section className="admin-view">
    <div
      className="admin-panel admin-form-panel"
      style={{ maxWidth: 620 }}
    >
      <PanelHead
        eyebrow="Безопасность"
        title="Учетная запись администратора"
        subtitle="Измените пароль для доступа к панели управления."
      />

      <div className="admin-form-body">
        <label className="admin-field-new">
          <span>Пользователь</span>
          <input value="admin" readOnly />
        </label>

        <PasswordField
          label="Текущий пароль"
          value={currentPassword}
          onChange={setCurrentPassword}
        />

        <PasswordField
          label="Новый пароль"
          value={newPassword}
          onChange={setNewPassword}
        />

        <PasswordField
          label="Повторите новый пароль"
          value={confirmPassword}
          onChange={setConfirmPassword}
        />

        {passwordError ? (
          <div className="admin-password-error">
            {passwordError}
          </div>
        ) : null}

        {passwordMessage ? (
          <div className="admin-password-success">
            {passwordMessage}
          </div>
        ) : null}

        <button
          type="button"
          className="admin-primary-button"
          onClick={changePassword}
          disabled={passwordSaving}
          style={{ marginTop: 20 }}
        >
          {passwordSaving ? 'Изменение...' : 'Изменить пароль'}
        </button>
      </div>
    </div>
  </section>
)}

      </main>
    </div>
  )
}

function updatePartner(
  id: string,
  patch: Partial<Partner>,
  setter: React.Dispatch<React.SetStateAction<Content>>,
) {
  setter((c) => ({
    ...c,
    partners: c.partners.map((item) => item.id === id ? { ...item, ...patch } : item),
  }))
}

function updateProject(
  id: string,
  patch: Partial<PropertyProject>,
  setter: React.Dispatch<React.SetStateAction<Content>>,
) {
  setter((c) => ({
    ...c,
    projects: c.projects.map((item) => item.id === id ? { ...item, ...patch } : item),
  }))
}

function shortMoney(value: number) {
  return value >= 1_000_000
    ? `${(value / 1_000_000).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} млн ₸`
    : formatKzt(value)
}

function Metric({
  label,
  value,
  note,
  tone,
}: {
  label: string
  value: string
  note: string
  tone: string
}) {
  return (
    <div className={`admin-metric admin-metric-${tone}`}>
      <div className="admin-metric-dot"/>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  )
}

function PanelHead({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow: string
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="admin-panel-head">
      <div>
        <span>{eyebrow}</span>
        <h3>{title}</h3>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {action}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="admin-field-new">
      <span>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}
function PasswordField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="admin-field-new">
      <span>{label}</span>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="new-password"
      />
    </label>
  )
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="admin-field-new">
      <span>{label}</span>
      <textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)}/>
    </label>
  )
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <label className="admin-field-new">
      <span>{label}</span>
      <input
        inputMode="numeric"
        value={value.toLocaleString('ru-RU')}
        onChange={(e) => onChange(inputNum(e.target.value))}
      />
    </label>
  )
}

function OptionalNumberField({
  label,
  value,
  onChange,
}: {
  label: string
  value?: number
  onChange: (v: number | undefined) => void
}) {
  const display = typeof value === 'number' ? value.toLocaleString('ru-RU') : ''

  return (
    <label className="admin-field-new">
      <span>{label}</span>
      <input
        inputMode="numeric"
        value={display}
        onChange={(e) => {
          const raw = e.target.value.replace(/\D/g, '')
          onChange(raw ? Number(raw) : undefined)
        }}
      />
    </label>
  )
}

function OptionalDecimalField({
  label,
  value,
  onChange,
}: {
  label: string
  value?: number
  onChange: (v: number | undefined) => void
}) {
  return (
    <label className="admin-field-new">
      <span>{label}</span>
      <input
        inputMode="decimal"
        value={typeof value === 'number' ? String(value) : ''}
        onChange={(e) => {
          const normalized = e.target.value.replace(',', '.').replace(/[^\d.]/g, '')
          const next = normalized ? Number(normalized) : undefined
          onChange(next !== undefined && Number.isFinite(next) ? next : undefined)
        }}
      />
    </label>
  )
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  return (
    <label className="admin-field-new">
      <span>{label}</span>

      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option value={o.value} key={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  )
}

function ApplicationTable({
  apps,
  projects,
  onStatus,
}: {
  apps: Application[]
  projects: PropertyProject[]
  onStatus: (id: string, status: Application['status']) => void
}) {
  const label: Record<Application['status'], string> = {
    new: 'Новая',
    in_progress: 'В работе',
    approved: 'Одобрена',
    rejected: 'Отказ',
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-table-new">
        <thead>
          <tr>
            <th>Заявка</th>
            <th>Клиент</th>
            <th>Объект</th>
            <th>Финансирование</th>
            <th>Дата</th>
            <th>Статус</th>
          </tr>
        </thead>

        <tbody>
          {apps.length ? apps.map((app) => (
            <tr key={app.id}>
              <td>
                <strong>{app.id}</strong>
                <span>{app.source === 'project' ? 'из карточки ЖК' : 'из калькулятора'}</span>
              </td>

              <td>
                <strong>{app.iin}</strong>
                <span>{app.phone}</span>
              </td>

              <td>
                <strong>{projects.find((p) => p.id === app.selectedProjectId)?.name || 'Не выбран'}</strong>
                <span>{formatKzt(app.propertyPrice)}</span>
              </td>

              <td>
                <strong>{formatKzt(app.financingAmount)}</strong>
                <span>
                  {app.termMonths} мес. · ПВ {app.downPaymentPercent || Math.round(app.downPayment / app.propertyPrice * 100)}%
                </span>
              </td>

              <td>
                <strong>{new Date(app.createdAt).toLocaleDateString('ru-RU')}</strong>
                <span>{new Date(app.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
              </td>

              <td>
                <select
                  className={`admin-status admin-status-${app.status}`}
                  value={app.status}
                  onChange={(e) => onStatus(app.id, e.target.value as Application['status'])}
                >
                  {Object.entries(label).map(([value, text]) => (
                    <option value={value} key={value}>{text}</option>
                  ))}
                </select>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={6} className="admin-empty">
                Заявок пока нет. Отправьте тестовую заявку с клиентской витрины.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
