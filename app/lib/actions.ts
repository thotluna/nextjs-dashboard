'use server'

import { z } from 'zod'
import { db } from '@vercel/postgres'
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { saveNewInvoice, updateInvoice as updateDbInvoice } from './data';

const client = await db.connect();

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
})

const CreateInvoice = FormSchema.omit({ id: true, date: true });

const PATH = '/dashboard/invoices'

export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoice.parse( {
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  })
   const amountInCents = amount * 100
   const [date] = new Date().toISOString().split('T')

   saveNewInvoice({
    customerId: customerId,
    amount: amountInCents,
    status: status,
    date: date
   })

  revalidatePath(PATH)
  redirect(PATH)
}

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse( {
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  })
   const amountInCents = amount * 100

  updateDbInvoice({
    customerId: customerId,
    amount: amountInCents,
    status: status,
    id: id
  })

  revalidatePath(PATH)
  redirect(PATH)
} 

export async function deleteInvoice(id: string) {
  await client.sql`DELETE FROM invoices WHERE id = ${id}`;
  revalidatePath('/dashboard/invoices');
}