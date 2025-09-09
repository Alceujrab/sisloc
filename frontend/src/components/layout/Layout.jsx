import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import CookieConsent from '../CookieConsent';
import WhatsAppButton from '../WhatsAppButton';

function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <Outlet />
      </main>
      
      <Footer />
  <CookieConsent />
  <WhatsAppButton />
    </div>
  );
}

export default Layout;
