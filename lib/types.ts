export type ProductConfig = {
  heroTitle: string
  heroDescription: string
  productTitle: string
  productDescription: string
  minPropertyPrice: number
  maxPropertyPrice: number
  minFinancingAmount: number
  maxFinancingAmount: number
  minDownPaymentPercent: number
  terms: number[]
  annualMarginPercent: number
  applicationCta: string
  currency: 'KZT'
}

export type Partner = {
  id: string
  name: string
  city: string
  description: string
  website?: string
  logoUrl?: string
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  active: boolean
  createdAt?: string
  updatedAt?: string
}

export type ConstructionStatus = 'ready' | 'building' | 'planned'

export type PropertyProject = {
  id: string
  slug?: string
  partnerId: string
  name: string
  city: string
  district: string
  address?: string
  priceFrom: number
  priceTo?: number
  areaFrom?: number
  areaTo?: number
  completion: string
  completionDate?: string
  constructionStatus?: ConstructionStatus
  badge: string
  accent: string
  description: string
  highlights?: string[]
  latitude?: number
  longitude?: number
  coverImageUrl?: string
  gallery?: string[]
  projectUrl?: string
  active: boolean
  createdAt?: string
  updatedAt?: string
}

export type ApplicationStatus = 'new' | 'in_progress' | 'approved' | 'rejected'

export type Application = {
  id: string
  createdAt: string
  updatedAt?: string
  status: ApplicationStatus
  source?: 'calculator' | 'project'
  iin: string
  phone: string
  selectedProjectId: string | null
  propertyPrice: number
  downPayment: number
  downPaymentPercent?: number
  financingAmount: number
  termMonths: number
  monthlyPayment: number
  totalRepayment: number
  consentAccepted: boolean
  consentVersion: string
  consentAcceptedAt: string
  assignee?: string | null
  managerComment?: string
}

export type Store = {
  schemaVersion: 2
  product: ProductConfig
  partners: Partner[]
  projects: PropertyProject[]
  applications: Application[]
}
