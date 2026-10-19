import { NextResponse } from 'next/server';
import { calculateShippingRates, sanitizePostalCode } from '@/lib/melhor-envio';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { zipCode, totalPieces, fromPostalCode } = body;

    const cleanCep = sanitizePostalCode(zipCode);
    if (!cleanCep || cleanCep.length !== 8) {
      return NextResponse.json(
        { error: 'CEP inválido. Forneça um CEP brasileiro com 8 dígitos numéricos.' },
        { status: 400 }
      );
    }

    const pieces = Math.max(1, Number(totalPieces) || 1);

    const result = await calculateShippingRates({
      toPostalCode: cleanCep,
      totalPieces: pieces,
      fromPostalCode,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro na rota de cálculo de frete:', error);
    return NextResponse.json(
      { error: 'Não foi possível calcular o frete para o CEP informado.' },
      { status: 500 }
    );
  }
}
