import { NextResponse } from 'next/server';

const TEMPLATES = [
  {
    id: 'luxury-real-estate',
    name: 'Luxury Real Estate',
    type: 'real-estate',
    category: 'Real Estate',
    description: 'A premium, high-converting real estate template designed for luxury agencies and brokers.',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800',
    pages: ['Home', 'Properties', 'Agents', 'Contact'],
    dashboard: ['properties', 'agents', 'leads'],
    editableSections: ['hero', 'properties', 'testimonials', 'footer'],
    features: ['Blog', 'Analytics', 'SEO', 'Contact Forms', 'Appointment Booking', 'WhatsApp Integration'],
    aiFeatures: ['AI Content Generator', 'AI SEO Assistant', 'AI Property Descriptions', 'AI Image Suggestions']
  },
  {
    id: 'modern-ecommerce',
    name: 'Modern E-Commerce',
    type: 'ecommerce',
    category: 'E-Commerce',
    description: 'A sleek, conversion-optimized storefront designed for modern D2C brands.',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800',
    pages: ['Home', 'Products', 'Categories', 'Cart', 'Checkout'],
    dashboard: ['products', 'orders', 'customers', 'coupons'],
    editableSections: ['hero', 'featuredProducts', 'categories', 'newsletter', 'footer'],
    features: ['Stripe Integration', 'Cart Recovery', 'Reviews', 'Analytics', 'Live Chat'],
    aiFeatures: ['AI Product Descriptions', 'AI Review Summaries', 'AI Upsell Suggestions']
  },
  {
    id: 'bistro-restaurant',
    name: 'Bistro Restaurant',
    type: 'restaurant',
    category: 'Restaurant',
    description: 'An elegant template for restaurants, cafes, and bistros with built-in reservation systems.',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800',
    pages: ['Home', 'Menu', 'Reservations', 'About Us', 'Contact'],
    dashboard: ['menu', 'reservations', 'reviews'],
    editableSections: ['hero', 'specials', 'menuHighlights', 'reservationForm', 'footer'],
    features: ['Online Reservations', 'Interactive Menu', 'Google Maps', 'Analytics'],
    aiFeatures: ['AI Menu Translator', 'AI Review Responses', 'AI Social Media Posts']
  },
  {
    id: 'digital-agency',
    name: 'Digital Agency',
    type: 'agency',
    category: 'Digital Agency',
    description: 'Showcase your portfolio and services with this award-winning agency template.',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
    pages: ['Home', 'Services', 'Work', 'About', 'Contact'],
    dashboard: ['projects', 'clients', 'leads'],
    editableSections: ['hero', 'services', 'portfolioGrid', 'team', 'contact'],
    features: ['Case Studies', 'Dark Mode', 'Animations', 'Analytics', 'CRM Integration'],
    aiFeatures: ['AI Case Study Writer', 'AI Proposal Generator', 'AI SEO Assistant']
  }
];

export async function GET() {
  return NextResponse.json(TEMPLATES);
}
