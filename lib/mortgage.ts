import type { ProductConfig } from './types'

export const DEFAULT_PRODUCT: ProductConfig = {
  heroTitle: 'Дом, который становится вашим.',
  heroDescription: 'Исламское финансирование недвижимости с прозрачной структурой сделки. Рассчитайте условия и оставьте заявку онлайн.',
  productTitle: 'Финансирование без классической процентной модели.',
  productDescription: 'Ailat Finance строит продукт на принципах исламского финансирования.',
  minPropertyPrice: 10_000_000,
  maxPropertyPrice: 100_000_000,
  minFinancingAmount: 5_000_000,
  maxFinancingAmount: 50_000_000,
  minDownPaymentPercent: 30,
  terms: [12, 24, 36, 48, 60],
  annualMarginPercent: 18,
  applicationCta: 'Получить предварительное решение',
  currency: 'KZT',
}

export function calculateMortgage(propertyPrice: number, termMonths: number, downPayment: number | undefined, product: ProductConfig) {
  const minDownPayment = Math.round(propertyPrice * product.minDownPaymentPercent / 100)
  const effectiveDownPayment = Math.max(downPayment ?? minDownPayment, minDownPayment)
  const financingAmount = Math.max(propertyPrice - effectiveDownPayment, 0)
  const years = termMonths / 12
  const totalMarkup = financingAmount * (product.annualMarginPercent / 100) * years
  const totalRepayment = financingAmount + totalMarkup
  const monthlyPayment = termMonths > 0 ? Math.round(totalRepayment / termMonths) : 0
  const downPaymentPercent = propertyPrice > 0 ? Math.round((effectiveDownPayment / propertyPrice) * 1000) / 10 : 0
  const eligible = financingAmount >= product.minFinancingAmount && financingAmount <= product.maxFinancingAmount && product.terms.includes(termMonths)
  const eligibilityReason = financingAmount < product.minFinancingAmount
    ? `Минимальная сумма финансирования — ${formatKzt(product.minFinancingAmount)}`
    : financingAmount > product.maxFinancingAmount
      ? `Максимальная сумма финансирования — ${formatKzt(product.maxFinancingAmount)}`
      : null

  return {
    propertyPrice,
    minDownPayment,
    downPayment: effectiveDownPayment,
    downPaymentPercent,
    financingAmount,
    termMonths,
    monthlyPayment,
    totalRepayment: Math.round(totalRepayment),
    eligible,
    eligibilityReason,
  }
}

export const formatKzt = (value: number) => `${Math.round(value).toLocaleString('ru-RU')} ₸`
