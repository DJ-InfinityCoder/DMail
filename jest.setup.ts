import '@testing-library/jest-dom'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/mail/inbox',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ folder: 'inbox', emailId: '1' }),
}))
