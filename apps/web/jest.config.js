import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const esmPackages = ['next-intl', 'use-intl', 'icu-minify', '@formatjs', 'intl-messageformat']

const config = createJestConfig({
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
})

export default async function jestConfig() {
  const resolved = await config()
  return {
    ...resolved,
    transformIgnorePatterns: [
      `node_modules/(?!(\\.pnpm/[^/]+/node_modules/)?(${esmPackages.join('|')})/)`,
    ],
  }
}
