'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
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
import styles from './project-detail-view.module.css'

type ProjectDetailViewProps = {
  project: PropertyProject
  partner?: Partner
  product: ProductConfig
}

export default function ProjectDetailView({
  project,
  partner,
  product,
}: ProjectDetailViewProps) {
  const payment = useMemo(() => getProjectPayment(project, product), [project, product])
  const area = formatProjectArea(project)
  const highlights = getProjectHighlights(project)
  const slug = getProjectSlug(project)
  const calcHref = `/?select=${encodeURIComponent(slug)}#calculator`
  const applyHref = `/?select=${encodeURIComponent(slug)}&apply=1#calculator`

  const images = useMemo(() => {
    const items = [
      project.coverImageUrl?.trim() || '',
      ...(project.gallery || []).map((item) => item.trim()),
    ].filter(Boolean)
    return Array.from(new Set(items))
  }, [project.coverImageUrl, project.gallery])

  const [activeImage, setActiveImage] = useState(0)
  const activeUrl = images[activeImage] || project.coverImageUrl || ''
  const sideImages = images.filter((_, index) => index !== activeImage).slice(0, 3)

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.brand} href="/" aria-label="Ailat Finance">
            <span className={styles.brandMark}>a</span>
            <span className={styles.brandText}>ailat<span>.</span></span>
          </Link>

          <div className={styles.headerActions}>
            <Link className={styles.backLink} href="/#projects">Все ЖК</Link>
            <Link className={styles.headerCta} href={calcHref}>Рассчитать</Link>
          </div>
        </div>
      </header>

      <section className={styles.hero}>
        {images.length ? (
          <>
            <div className={styles.gallery}>
              <button className={styles.mainImageButton} type="button">
                <img className={styles.mainImage} src={activeUrl} alt={project.name} />
                <div className={styles.badges}>
                  <span>{getConstructionStatusLabel(project)}</span>
                  {project.badge ? <span>{project.badge}</span> : null}
                </div>
              </button>

              <div className={styles.thumbRail}>
                {sideImages.length ? sideImages.map((url, sideIndex) => {
                  const realIndex = images.indexOf(url)
                  return (
                    <button
                      className={`${styles.thumbButton} ${realIndex === activeImage ? styles.thumbButtonActive : ''}`}
                      type="button"
                      key={url}
                      onClick={() => setActiveImage(realIndex)}
                    >
                      <img src={url} alt={`${project.name} — фото ${realIndex + 1}`} />
                      {sideIndex === 2 && images.length > 4 ? (
                        <span className={styles.morePhotos}>+{images.length - 4} фото</span>
                      ) : null}
                    </button>
                  )
                }) : (
                  <>
                    <div className={styles.thumbButton} />
                    <div className={styles.thumbButton} />
                    <div className={styles.thumbButton} />
                  </>
                )}
              </div>
            </div>

            {images.length > 1 ? (
              <div className={styles.mobileThumbs}>
                {images.map((url, index) => (
                  <button type="button" key={url} onClick={() => setActiveImage(index)}>
                    <img src={url} alt={`${project.name} — фото ${index + 1}`} />
                  </button>
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <div className={styles.gallery}>
            <div className={styles.mainImageButton}>
              <ProjectImage project={project} className={styles.mainImage} />
              <div className={styles.badges}>
                <span>{getConstructionStatusLabel(project)}</span>
                {project.badge ? <span>{project.badge}</span> : null}
              </div>
            </div>
            <div className={styles.thumbRail}>
              <div className={styles.thumbButton} />
              <div className={styles.thumbButton} />
              <div className={styles.thumbButton} />
            </div>
          </div>
        )}

        <div className={styles.heroMeta}>
          <div className={styles.heroCopy}>
            <p className={styles.partner}>{partner?.name ?? 'Партнер Ailat'}</p>
            <h1>{project.name}</h1>
            <p className={styles.address}>{formatProjectAddress(project)}</p>
          </div>

          <div className={styles.priceBlock}>
            <span>Стоимость от</span>
            <strong>{formatProjectPrice(project)}</strong>
          </div>
        </div>
      </section>

      <section className={styles.quickFacts}>
        <div><span>Город</span><strong>{project.city}</strong></div>
        <div><span>Срок сдачи</span><strong>{project.completion || '—'}</strong></div>
        {area ? <div><span>Площадь</span><strong>{area}</strong></div> : null}
        <div><span>Статус</span><strong>{getConstructionStatusLabel(project)}</strong></div>
      </section>

      <section className={styles.contentGrid}>
        <div className={styles.content}>
          <div className={styles.sectionIntro}>
            <span>О проекте</span>
            <h2>{project.name}</h2>
          </div>

          <p className={styles.description}>
            {project.description || 'Информация о жилом комплексе скоро появится.'}
          </p>

          {highlights.length ? (
            <div className={styles.highlights}>
              <h3>Преимущества</h3>
              <div className={styles.highlightsGrid}>
                {highlights.map((item) => (
                  <div className={styles.highlight} key={item}>
                    <span>✓</span><p>{item}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <aside className={styles.financeCard}>
          <div className={styles.financeHeading}>
            <span>Финансирование Ailat</span>
            <h3>Условия для этого проекта</h3>
          </div>

          <div className={styles.payment}>
            <span>Ориентировочный платеж от</span>
            <strong>{formatKzt(payment.monthlyPayment)}</strong>
            <small>в месяц · {Math.max(...product.terms)} мес.</small>
          </div>

          <div className={styles.financeFacts}>
            <div><span>Стоимость</span><strong>{formatProjectPrice(project)}</strong></div>
            <div><span>Первоначальный взнос</span><strong>от {product.minDownPaymentPercent}%</strong></div>
            <div><span>Максимальный срок</span><strong>{Math.max(...product.terms)} мес.</strong></div>
          </div>

          <Link className={styles.primaryCta} href={calcHref}>Рассчитать финансирование</Link>
          <Link className={styles.secondaryCta} href={applyHref}>Получить предварительное решение</Link>

          <p className={styles.disclaimer}>
            Расчет предварительный и не является офертой или окончательным решением о предоставлении финансирования.
          </p>
        </aside>
      </section>

      <section className={styles.finalCta}>
        <div>
          <span>Ailat Finance</span>
          <h2>Выбрали квартиру?<br/>Рассчитайте финансирование.</h2>
        </div>
        <Link className={styles.finalButton} href={applyHref}>Получить решение</Link>
      </section>
    </main>
  )
}
