const firstNames = [
  'Ava',
  'Noah',
  'Liam',
  'Mia',
  'Olivia',
  'Ethan',
  'Lucas',
  'Ella',
  'Zoe',
  'Kai',
  'Ivy',
  'Leo',
  'Ezra',
  'Nora',
  'Aiden',
  'Maya',
  'Sofia',
  'Mason',
  'Aria',
  'Elena'
]

const lastNames = [
  'Nguyen',
  'Johnson',
  'Garcia',
  'Patel',
  'Khan',
  'Osei',
  'Martinez',
  'Kim',
  'Schmidt',
  'Silva',
  'Hernandez',
  'Williams',
  'Lopez',
  'Singh',
  'Brown',
  'Li',
  'Chen',
  'Wilson',
  'Davis',
  'Clark'
]

const jobTitles = [
  'Frontend Engineer',
  'Backend Engineer',
  'Fullstack Developer',
  'Product Manager',
  'Data Scientist',
  'ML Engineer',
  'DevOps Engineer',
  'QA Analyst',
  'UI/UX Designer',
  'Technical Writer',
  'Solutions Architect',
  'Security Engineer',
  'Mobile Developer',
  'Growth Manager',
  'Customer Success Lead',
  'People Operations Partner',
  'Support Engineer',
  'Site Reliability Engineer',
  'Research Scientist',
  'Hardware Engineer'
]

const jobTags = [
  'Remote',
  'Hybrid',
  'Onsite',
  'Contract',
  'Full-time',
  'Equity',
  'Urgent',
  'Diversity',
  'Graduate',
  'Leadership',
  'Staff',
  'Junior',
  'Design',
  'Engineering',
  'Product'
]

const domains = [
  'example.com',
  'talentflow.dev',
  'mail.com',
  'workmail.co',
  'hireme.org'
]

const phonePrefixes = ['202', '303', '415', '512', '617', '718', '917']

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

export function randomName(): string {
  return `${randomItem(firstNames)} ${randomItem(lastNames)}`
}

export function randomEmail(name: string): string {
  const safeName = name.toLowerCase().replace(/[^a-z0-9]+/g, '.')
  return `${safeName}@${randomItem(domains)}`
}

export function randomJobTitle(): string {
  return randomItem(jobTitles)
}

export function randomTags(): string[] {
  const count = randomInt(2, 4)
  const tags = new Set<string>()
  while (tags.size < count) {
    tags.add(randomItem(jobTags))
  }
  return Array.from(tags)
}

export function randomHexColor(): string {
  const hue = randomInt(0, 360)
  return `hsl(${hue}, 70%, 60%)`
}

export function randomPhone(): string {
  const prefix = randomItem(phonePrefixes)
  const middle = randomInt(100, 999)
  const last = randomInt(1000, 9999)
  return `${prefix}-${middle}-${last}`
}
