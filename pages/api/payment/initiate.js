import { v4 as uuid } from 'uuid';
import { requireAuth } from '../../../lib/auth';
import { db } from '../../../lib/db';
import { calcularTotal, generarFirmaWompi, PLANES, METODOS_PAGO } from '../../../lib/payments';

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { planId, metodoPagoId, tipoParticipacion } = req.body;
  // tipoParticipacion: 'individual' | 'grupo' | 'ambos'

  const plan = PLANES[planId];
  if (!plan) return res.status(400).json({ error: 'Plan inválido' });

  const metodo = METODOS_PAGO[metodoPagoId];
  if (!metodo) return res.status(400).json({ error: 'Método de pago inválido' });

  const calculo = calcularTotal(plan.precio, metodoPagoId);

  const referencia = `POLLA-${req.user.id.slice(0,8).toUpperCase()}-${Date.now()}`;

  // Registrar el pago pendiente
  const payment = db.payments.create({
    id:               uuid(),
    userId:           req.user.id,
    userName:         req.user.name,
    userEmail:        req.user.email,
    planId,
    planLabel:        plan.label,
    valorBase:        plan.precio,
    comision:         calculo.comision,
    valorTotal:       calculo.total,
    metodoPago:       metodoPagoId,
    metodoPagoLabel:  metodo.label,
    tipoParticipacion: tipoParticipacion || 'individual',
    referencia,
    estado:           'pendiente',          // pendiente / aprobado / rechazado
    tipo:             metodo.automatico ? 'wompi' : 'manual',
    distribucion:     plan.distribucion,
    comprobante:      null,
    notas:            '',
  });

  // Actualizar el usuario a "pendiente de pago"
  db.users.update(req.user.id, {
    estado:            'pendiente_pago',
    planId,
    tipoParticipacion: tipoParticipacion || 'individual',
    pagoRef:           referencia,
  });

  // Respuesta base
  const response = {
    payment,
    calculo,
    referencia,
  };

  // Si es Wompi, generar la firma de integridad
  if (metodo.wompi) {
    const integritySecret = process.env.WOMPI_INTEGRITY_SECRET || '';
    const firma = generarFirmaWompi(referencia, calculo.total_centavos, 'COP', integritySecret);
    response.wompi = {
      publicKey:     process.env.WOMPI_PUBLIC_KEY || '',
      currency:      'COP',
      amountInCents: calculo.total_centavos,
      reference:     referencia,
      signature:     firma,
      redirectUrl:   `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/pendiente?ref=${referencia}`,
    };
  }

  return res.status(200).json(response);
}

export default requireAuth(handler);
