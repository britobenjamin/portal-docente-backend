// Datos de ejemplo: admins, categorías, niveles y 8 leyes con PDFs placeholder.
// Es idempotente: borra las leyes existentes (y sus PDFs) y las vuelve a crear.
import PDFDocument from 'pdfkit';
import { pool } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import { uploadPdf, deletePdf } from '../src/services/storage.service.js';
import { uniqueSlug } from '../src/services/slug.service.js';
import { seedAdmins } from './seed-admins.js';

const CATEGORIAS = [
  'Licencias',
  'Salario',
  'Jubilación',
  'Concursos',
  'Estatuto',
  'Titularizaciones',
  'Calificaciones',
  'Traslados',
  'Otros',
];
const NIVELES = ['Inicial', 'Primario', 'Secundario', 'Superior', 'Todos los niveles'];

// Todas marcadas como [EJEMPLO]: se reemplazan por la normativa real más adelante.
const LEYES = [
  {
    jurisdiccion: 'provincial',
    tipo: 'estatuto',
    numero: '1001',
    titulo: '[EJEMPLO] Estatuto del Docente de la Provincia',
    resumen:
      'Regula los derechos y deberes del personal docente, el ingreso a la carrera, la estabilidad, los ascensos, traslados y el régimen disciplinario.',
    palabras_clave: 'estatuto, derechos, deberes, carrera docente, estabilidad',
    anio: 1985,
    categorias: ['Estatuto', 'Concursos', 'Traslados'],
    niveles: ['Todos los niveles'],
  },
  {
    jurisdiccion: 'provincial',
    tipo: 'ley',
    numero: '1002',
    titulo: '[EJEMPLO] Régimen de Licencias Docentes',
    resumen:
      'Establece las licencias ordinarias y extraordinarias: enfermedad, maternidad, paternidad, estudio, cuidado de familiar y actividad gremial.',
    palabras_clave: 'licencia, enfermedad, maternidad, paternidad, estudio, familiar enfermo, art 40',
    anio: 2010,
    categorias: ['Licencias'],
    niveles: ['Todos los niveles'],
  },
  {
    jurisdiccion: 'provincial',
    tipo: 'decreto',
    numero: '2001/3',
    titulo: '[EJEMPLO] Reglamento de Juntas de Clasificación',
    resumen:
      'Reglamenta el funcionamiento de las Juntas de Clasificación, la valoración de antecedentes y la confección de listados de orden de mérito.',
    palabras_clave: 'junta de clasificacion, puntaje, antecedentes, orden de merito, listados',
    anio: 2015,
    categorias: ['Concursos', 'Calificaciones'],
    niveles: ['Primario', 'Secundario'],
  },
  {
    jurisdiccion: 'provincial',
    tipo: 'resolucion',
    numero: '3001/5',
    titulo: '[EJEMPLO] Titularización de Docentes Interinos',
    resumen: 'Fija el procedimiento y los requisitos para la titularización de docentes interinos con antigüedad en el cargo.',
    palabras_clave: 'titularizacion, interinos, antiguedad, cargo titular',
    anio: 2022,
    categorias: ['Titularizaciones'],
    niveles: ['Inicial', 'Primario', 'Secundario'],
  },
  {
    jurisdiccion: 'provincial',
    tipo: 'ley',
    numero: '1003',
    titulo: '[EJEMPLO] Régimen Previsional Docente (anterior)',
    resumen: 'Régimen previsional docente anterior, reemplazado por una norma posterior.',
    palabras_clave: 'jubilacion, prevision, haber jubilatorio, aportes',
    anio: 1998,
    categorias: ['Jubilación'],
    niveles: ['Todos los niveles'],
    estado: 'derogada',
    derogada_por: '[EJEMPLO] Ley 1004',
  },
  {
    jurisdiccion: 'nacional',
    tipo: 'ley',
    numero: '90.001',
    titulo: '[EJEMPLO] Ley de Educación Nacional',
    resumen:
      'Regula el ejercicio del derecho de enseñar y aprender, la estructura del sistema educativo y los derechos y obligaciones de los docentes.',
    palabras_clave: 'educacion nacional, sistema educativo, obligatoriedad, derechos docentes',
    anio: 2006,
    categorias: ['Estatuto', 'Otros'],
    niveles: ['Todos los niveles'],
  },
  {
    jurisdiccion: 'nacional',
    tipo: 'ley',
    numero: '90.002',
    titulo: '[EJEMPLO] Fondo Nacional de Incentivo Docente',
    resumen: 'Crea un fondo para el mejoramiento de la remuneración de los docentes de todo el país.',
    palabras_clave: 'fonid, incentivo, salario, remuneracion, fondo',
    anio: 1998,
    categorias: ['Salario'],
    niveles: ['Todos los niveles'],
  },
  {
    jurisdiccion: 'nacional',
    tipo: 'decreto',
    numero: '900/01',
    titulo: '[EJEMPLO] Régimen Especial de Jubilación Docente (anterior)',
    resumen: 'Régimen especial de jubilación docente anterior, reemplazado por una ley posterior.',
    palabras_clave: 'jubilacion, regimen especial, 82%, movil',
    anio: 2001,
    categorias: ['Jubilación'],
    niveles: ['Todos los niveles'],
    estado: 'derogada',
    derogada_por: '[EJEMPLO] Ley 90.003',
  },
];

/** Genera un PDF placeholder simple con pdfkit. */
function generarPdfPlaceholder(ley) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 72 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const tipo = { ley: 'Ley', decreto: 'Decreto', resolucion: 'Resolución', estatuto: 'Estatuto' }[ley.tipo];
    doc.fontSize(10).fillColor('#A8841A').text('DOCUMENTO DE EJEMPLO — NO ES NORMATIVA REAL', { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(20).fillColor('#2B2B2B').text(`${tipo} N° ${ley.numero}`, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(14).text(ley.titulo.replace('[EJEMPLO] ', ''), { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#555').text(`${ley.jurisdiccion === 'provincial' ? 'Provincia de Tucumán' : 'República Argentina'} — ${ley.anio}`, {
      align: 'center',
    });
    doc.moveDown(2);
    doc.fontSize(12).fillColor('#2B2B2B').text(ley.resumen, { align: 'justify' });
    doc.moveDown();
    for (let i = 1; i <= 4; i++) {
      doc.font('Helvetica-Bold').text(`Artículo ${i}°.`, { continued: true }).font('Helvetica').text(
        ' Texto de ejemplo del artículo. Este PDF es un placeholder que se reemplazará por el documento oficial desde el panel de administración.',
        { align: 'justify' },
      );
      doc.moveDown(0.5);
    }
    doc.end();
  });
}

async function main() {
  console.log(`Almacenamiento de PDFs: ${env.storage.driver}\n`);

  const adminIds = await seedAdmins();
  const autorId = adminIds[0] ?? null;

  for (const nombre of CATEGORIAS) await pool.query('INSERT IGNORE INTO categorias (nombre) VALUES (?)', [nombre]);
  for (const nombre of NIVELES) await pool.query('INSERT IGNORE INTO niveles (nombre) VALUES (?)', [nombre]);
  const [cats] = await pool.query('SELECT id, nombre FROM categorias');
  const [nivs] = await pool.query('SELECT id, nombre FROM niveles');
  const catId = Object.fromEntries(cats.map((c) => [c.nombre, c.id]));
  const nivId = Object.fromEntries(nivs.map((n) => [n.nombre, n.id]));
  console.log(`✔ ${cats.length} categorías y ${nivs.length} niveles`);

  // Limpieza de leyes previas (y sus PDFs)
  const [previas] = await pool.query('SELECT pdf_public_id FROM leyes WHERE pdf_public_id IS NOT NULL');
  for (const { pdf_public_id } of previas) {
    await deletePdf(pdf_public_id).catch((e) => console.warn(`⚠ No se pudo borrar ${pdf_public_id}: ${e.message}`));
  }
  await pool.query('DELETE FROM leyes');

  for (const ley of LEYES) {
    const slug = await uniqueSlug(ley.titulo.replace('[EJEMPLO] ', ''));
    let pdf = { url: null, publicId: null };
    try {
      pdf = await uploadPdf(await generarPdfPlaceholder(ley), slug);
    } catch (e) {
      console.warn(`⚠ No se pudo subir el PDF de "${ley.titulo}": ${e.message}`);
    }
    const [res] = await pool.query(
      `INSERT INTO leyes (slug, jurisdiccion, tipo, numero, titulo, resumen, palabras_clave, anio,
                          pdf_url, pdf_public_id, estado, derogada_por, creado_por, actualizado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        slug,
        ley.jurisdiccion,
        ley.tipo,
        ley.numero,
        ley.titulo,
        ley.resumen,
        ley.palabras_clave,
        ley.anio,
        pdf.url,
        pdf.publicId,
        ley.estado || 'vigente',
        ley.derogada_por || null,
        autorId,
        autorId,
      ],
    );
    for (const c of ley.categorias) {
      await pool.query('INSERT INTO leyes_categorias (ley_id, categoria_id) VALUES (?, ?)', [res.insertId, catId[c]]);
    }
    for (const n of ley.niveles) {
      await pool.query('INSERT INTO leyes_niveles (ley_id, nivel_id) VALUES (?, ?)', [res.insertId, nivId[n]]);
    }
    console.log(`✔ ${ley.estado === 'derogada' ? '(derogada) ' : ''}${ley.titulo}`);
  }

  console.log(`\nListo: ${LEYES.length} leyes de ejemplo.`);
}

try {
  await main();
} catch (err) {
  console.error('✖ Error en el seed:', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
