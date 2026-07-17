import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Get the first business (since this is a single-tenant OS demo currently)
    const business = await prisma.business.findFirst({
      include: {
        departments: {
          include: {
            employees: {
              include: {
                tasks: {
                  where: { status: 'IN_PROGRESS' }
                }
              }
            }
          }
        },
        employees: {
          where: { departmentId: null },
          include: {
            tasks: {
              where: { status: 'IN_PROGRESS' }
            }
          }
        }
      }
    });

    if (!business) {
      return NextResponse.json({ error: 'No business found' }, { status: 404 });
    }

    return NextResponse.json(business);
  } catch (error: any) {
    console.error('Error fetching galaxy data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
