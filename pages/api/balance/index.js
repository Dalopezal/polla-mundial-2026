import { v4 as uuid } from 'uuid';
import { requireAuth } from '../../../lib/auth';
import { db } from '../../../lib/db';
import { calcularTotal, generarFirmaWompi, METODOS_PAGO, IA_BET } from '../../../lib/payments';

async function handler(req, res) {
  const user = db.users.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  if (req.method === 'GET') {
    const bets = db.aiBets.findByUser(req.user.id);
    return res.status(200).json({
      saldoIA:        user.saldoIA || 0,
      incluye_ia:     user.incluye_ia || false,
      estado:         user.estado || 'activo',
      planId:         user.planId || 'basico',
      apuestas:       bets.length,
      apuestasGanadas:bets.filter(b=>b.resultado==='ganada').length,
      apuestasPerdidas:bets.filter(b=>b.resultado==='perdida').length,
    });
  }

  // POST: iniciar recarga de saldo IA
  if (req.method === 'POST') {
    const { monto, metodoPagoId } = req.body;

    // También permite activar IA ($20,000) si no lo tenía
    const accion = req.body.accion || 'recargar';

    const montoNum = parseInt(monto);
    if (!montoNum || montoNum < 1000) return res.status(400).json({ error: 'Monto mínimo: $1,000 COP' });
    if (montoNum > IA_BET.maximo_por_recarga) {
      return res.status(400).json({ error: `Máximo por recarga: $${IA_BET.maximo_por_recarga.toLocaleString('es-CO')} COP` });
    }

    const metodo = METODOS_PAGO[metodoPagoId];
    if (!metodo) return res.status(400).json({ error: 'Método de pago inválido' });

    const calculo = calcularTotal(montoNum, metodoPagoId);
    const referencia = `IA-${req.user.id.slice(0,6).toUpperCase()}-${Date.now()}`;

    // Registrar pago de recarga
    const payment = db.payments.create({
      id:           uuid(),
      userId:       req.user.id,
      userName:     user.name,
      userEmail:    user.email,
      planId:       'recarga_ia',
      planLabel:    accion === 'activar_ia' ? 'Activación IA' : 'Recarga IA',
      valorBase:    montoNum,
      comision:     calculo.comision,
      valorTotal:   calculo.total,
      metodoPago:   metodoPagoId,
      metodoPagoLabel: metodo.label,
      referencia,
      estado:       'pendiente',
      tipo:         metodo.automatico ? 'wompi' : 'manual',
      distribucion: { admin: 0, premios: 0, ia: montoNum },
      es_recarga:   true,
      accion,
    });

    const response = { payment, calculo, referencia };

    if (metodo.wompi) {
      const firma = generarFirmaWompi(referencia, calculo.total_centavos, 'COP', process.env.WOMPI_INTEGRITY_SECRET || '');
      response.wompi = {
        publicKey:     process.env.WOMPI_PUBLIC_KEY || '',
        currency:      'COP',
        amountInCents: calculo.total_centavos,
        reference:     referencia,
        signature:     firma,
        redirectUrl:   `${process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000'}/saldo?ref=${referencia}`,
      };
    }

    return res.status(200).json(response);
  }

  return res.status(405).json({ error: 'Método no permitido' });
}

export default requireAuth(handler);
