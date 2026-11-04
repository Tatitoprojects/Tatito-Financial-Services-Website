export type Site = {
  name: string
  tag: string
  letter: string
  color: string
  logo: string
  phone: string
  email: string
  addr: string
  apw: string
  about: string
}

export type Service = { id: string; cat: string; icon: string; name: string; desc: string }
export type Loan = { id: string; name: string; icon: string; rate: number; max: number; desc: string }
export type Fund = { id: string; name: string; cat: string; nav: number; r1: number; risk: string }
export type BlogPost = { id: string; title: string; date: string; body: string }
export type Note = { id: string; title: string; body: string; date: string }
export type Message = { id: string; name: string; contact: string; msg: string; date: string }
export type User = { id: string; name: string; mobile: string; email: string; pw: string }

export type DB = {
  site: Site
  services: Service[]
  loans: Loan[]
  funds: Fund[]
  blogs: BlogPost[]
  notes: Note[]
  msgs: Message[]
  users: User[]
}

/** Demo seed data. Everything here can be edited from the built-in admin panel. */
export const seed: DB = {
  site: {
    name: 'Tatito Financial Services',
    tag: 'Pay bills, repay loans, invest and travel from one place.',
    letter: 'T',
    color: '#0d5c4b',
    logo: '',
    phone: '+91 90000 00000',
    email: 'support@example.com',
    addr: 'Kadapa, Andhra Pradesh, India',
    apw: 'admin123',
    about:
      'Tatito Financial Services is building one place for everyday money: recharges, bills, loan repayments, loans, SIPs, mutual funds and trading. We add each service as partner and regulatory approvals come through.',
  },
  services: [
    { id: 'svc01', cat: 'Daily recharges', icon: '📱', name: 'Mobile recharge', desc: 'Prepaid and postpaid, all operators' },
    { id: 'svc02', cat: 'Daily recharges', icon: '📡', name: 'DTH recharge', desc: 'Tata Play, Airtel, Dish and more' },
    { id: 'svc03', cat: 'Daily recharges', icon: '🚗', name: 'FASTag', desc: 'Recharge your toll tag' },
    { id: 'svc04', cat: 'Bills & utilities', icon: '💡', name: 'Electricity', desc: 'Pay your power bill' },
    { id: 'svc05', cat: 'Bills & utilities', icon: '🚰', name: 'Water bill', desc: 'Municipal water charges' },
    { id: 'svc06', cat: 'Bills & utilities', icon: '🔥', name: 'Gas', desc: 'Cylinder booking and piped gas' },
    { id: 'svc07', cat: 'Bills & utilities', icon: '🌐', name: 'Broadband', desc: 'Internet and landline' },
    { id: 'svc08', cat: 'Bills & utilities', icon: '💳', name: 'Credit card bill', desc: 'Pay any card bill' },
    { id: 'svc09', cat: 'Loan repayments', icon: '👤', name: 'Personal loan EMI', desc: 'Pay and track your EMI' },
    { id: 'svc10', cat: 'Loan repayments', icon: '🪙', name: 'Gold loan EMI', desc: 'Interest and part payments' },
    { id: 'svc11', cat: 'Loan repayments', icon: '🏡', name: 'Home loan EMI', desc: 'Monthly instalments' },
    { id: 'svc12', cat: 'Loan repayments', icon: '🏪', name: 'Business loan EMI', desc: 'Pay on due date' },
    { id: 'svc13', cat: 'Money transfer', icon: '📲', name: 'Send money', desc: 'To mobile, UPI ID or bank' },
    { id: 'svc14', cat: 'Travel', icon: '🚌', name: 'Bus tickets', desc: 'Book seats across routes' },
    { id: 'svc15', cat: 'Travel', icon: '✈️', name: 'Flights', desc: 'Compare and book' },
    { id: 'svc16', cat: 'Travel', icon: '🚕', name: 'Cabs & rides', desc: 'Book a ride' },
    { id: 'svc17', cat: 'Insurance', icon: '🩺', name: 'Health insurance', desc: 'Plans for you and family' },
    { id: 'svc18', cat: 'Chit funds', icon: '🧮', name: 'Join a chit group', desc: 'Monthly savings groups' },
  ],
  loans: [
    { id: 'loan01', name: 'Personal loan', icon: '👤', rate: 14, max: 1000000, desc: 'For any personal need' },
    { id: 'loan02', name: 'Business loan', icon: '🏪', rate: 16, max: 5000000, desc: 'Grow your shop or firm' },
    { id: 'loan03', name: 'Gold loan', icon: '🪙', rate: 11, max: 2000000, desc: 'Quick loan against gold' },
    { id: 'loan04', name: 'Home loan', icon: '🏡', rate: 9, max: 10000000, desc: 'Buy, build or renovate' },
    { id: 'loan05', name: 'Vehicle loan', icon: '🛵', rate: 10, max: 2000000, desc: 'Two-wheeler and car loans' },
  ],
  funds: [
    { id: 'fund01', name: 'Nifty 50 Index Fund', cat: 'Index', nav: 210.4, r1: 12.1, risk: 'Moderate' },
    { id: 'fund02', name: 'Flexi Cap Fund', cat: 'Equity', nav: 88.7, r1: 15.4, risk: 'High' },
    { id: 'fund03', name: 'Liquid Fund', cat: 'Debt', nav: 1254.2, r1: 6.8, risk: 'Low' },
    { id: 'fund04', name: 'ELSS Tax Saver', cat: 'Equity', nav: 64.3, r1: 14.2, risk: 'High' },
  ],
  blogs: [
    {
      id: 'blog01',
      title: '5 ways to start a SIP with ₹500',
      date: '2026-10-01',
      body: 'Small, regular investing beats waiting for a big amount.\nPick a fund, set a date after your salary, and let the amount run for years.',
    },
    {
      id: 'blog02',
      title: 'How loan EMIs work',
      date: '2026-10-05',
      body: 'An EMI has two parts: interest and principal. Early on, more goes to interest.\nA shorter tenure means a higher EMI but much less total interest.',
    },
  ],
  notes: [{ id: 'note01', title: 'Welcome', body: 'Thanks for visiting. More services are coming soon.', date: '2026-10-14' }],
  msgs: [],
  users: [],
}
