import './globals.css'
export const metadata = { title: 'Sang Music Cloud', description: 'Personal Music Library' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html><body>{children}</body></html>)
}
