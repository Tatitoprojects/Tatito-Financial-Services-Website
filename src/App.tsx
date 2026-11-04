import { HashRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { StoreProvider } from './lib/store'
import Home from './pages/Home'
import Services from './pages/Services'
import Loans from './pages/Loans'
import Sip from './pages/Sip'
import Funds from './pages/Funds'
import Trading from './pages/Trading'
import { Blog, BlogPost } from './pages/Blog'
import About from './pages/About'
import Contact from './pages/Contact'
import { Login, Register } from './pages/Auth'
import Notifications from './pages/Notifications'
import Search from './pages/Search'
import Admin from './pages/Admin'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="services" element={<Services />} />
            <Route path="loans" element={<Loans />} />
            <Route path="sip" element={<Sip />} />
            <Route path="funds" element={<Funds />} />
            <Route path="trading" element={<Trading />} />
            <Route path="blog" element={<Blog />} />
            <Route path="blog/:id" element={<BlogPost />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="search/:q" element={<Search />} />
            <Route path="admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </HashRouter>
    </StoreProvider>
  )
}
