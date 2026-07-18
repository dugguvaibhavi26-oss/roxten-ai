import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const { websiteId, message, currentSections, currentTheme } = await req.json();

    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value;
    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const website = await prisma.website.findFirst({
      where: { id: websiteId, businessId }
    });

    if (!website) return NextResponse.json({ error: 'Website not found' }, { status: 404 });

    // Mock AI logic based on natural language command
    let newSections = [...(currentSections || [])];
    let newTheme = { ...(currentTheme || website.theme || {}) };
    let aiResponse = "I've updated the design as you requested!";

    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('dark')) {
      newTheme.colors = { ...newTheme.colors, secondary: '#000000', primary: '#333333' };
      aiResponse = "I've switched the theme to a darker aesthetic.";
    } else if (lowerMessage.includes('light')) {
      newTheme.colors = { ...newTheme.colors, secondary: '#ffffff', primary: '#f3f4f6' };
      aiResponse = "I've switched the theme to a lighter aesthetic.";
    } else if (lowerMessage.includes('red')) {
      newTheme.colors = { ...newTheme.colors, primary: '#ef4444' };
      aiResponse = "I've updated the primary accent color to red.";
    } else if (lowerMessage.includes('blue')) {
      newTheme.colors = { ...newTheme.colors, primary: '#3b82f6' };
      aiResponse = "I've updated the primary accent color to blue.";
    } else if (lowerMessage.includes('add') && lowerMessage.includes('testimonial')) {
      newSections.push({
        id: `sec_${uuidv4()}`,
        name: 'Testimonials',
        type: 'testimonials',
        orderIndex: newSections.length
      });
      aiResponse = "I've appended a Testimonials section to the bottom of the page.";
    } else if (lowerMessage.includes('add') && lowerMessage.includes('hero')) {
      newSections.unshift({
        id: `sec_${uuidv4()}`,
        name: 'Hero Banner',
        type: 'hero',
        orderIndex: 0
      });
      // Update order index for all sections
      newSections = newSections.map((s, i) => ({ ...s, orderIndex: i }));
      aiResponse = "I've added a new Hero Banner at the top of the page.";
    } else if (lowerMessage.includes('remove') || lowerMessage.includes('delete')) {
      // Very basic mock remove logic
      if (newSections.length > 1) {
        const removed = newSections.pop();
        aiResponse = `I removed the last section (${removed?.name}).`;
      } else {
        aiResponse = "You need at least one section!";
      }
    } else {
      aiResponse = "I heard you! I'm just a demo AI so I didn't change the layout, but I am fully wired into the backend now.";
    }

    return NextResponse.json({ 
      success: true, 
      aiResponse,
      updatedTheme: newTheme,
      updatedSections: newSections 
    });
  } catch (error: any) {
    console.error('Editor AI Chat Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
