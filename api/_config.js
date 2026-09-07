export const CATEGORIAS = [
  'Sub 17-18',
  'Sub 16-15',
  'Sub 14-13',
  'Sub 12-11',
  'Sub 10-9',
  'Sub 8-7',
];

export const MENSUALIDAD_POR_CATEGORIA = {
  'Sub 17-18': 50000,
  'Sub 16-15': 50000,
  'Sub 14-13': 40000,
  'Sub 12-11': 40000,
  'Sub 10-9': 30000,
  'Sub 8-7': 30000,
};

export function getMensualidad(categoria) {
  return MENSUALIDAD_POR_CATEGORIA[categoria] || 50000;
}

export const TIPOS_PAGO = ['abono', 'inscripcion', 'uniforme', 'otro'];
