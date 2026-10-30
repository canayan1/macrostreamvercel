// Dependency-free XLSX writer for the sample result workbooks: named cell styles, merged cells,
// frozen panes, auto filters and native Excel charts (bar, column, line). Uncompressed (stored) ZIP
// plus the smallest OOXML parts Excel, Numbers, Google Sheets and LibreOffice accept.
//
// workbook({ title, sheets: [sheet] }) → Uint8Array
// sheet:  { name, rows: cell[][], cols?: number[], heights?: { [row]: points }, merges?: ['A1:C1'],
//           freeze?: { rows, cols }, filter?: 'A3:F20', charts?: [chart], tab?: 'RRGGBB', grid?: false }
// cell:   null | '' | string | number | { v, s } | { date: excelSerial, s? } | { time: dayFraction, s? }
//         s is a style name from STYLES (or a style object).
// chart:  { type: 'bar' | 'column' | 'line', title, from: [col, row], to: [col, row], numFmt?,
//           series: [{ name, cat: { sheet, ref }, val: { sheet, ref }, color, pointColors?, cats, vals }],
//           legend?: boolean }   (cats and vals are cached values so viewers can draw before recalculating)

export const PALETTE = { blue: '4E79A7', orange: 'F28E2B', red: 'E15759', teal: '76B7B2', green: '59A14F', yellow: 'EDC948', purple: 'B07AA1', grey: 'BAB0AC' };
const INK = '1F2937', MUTED = '6B7280', LINE = 'E5E7EB', PANEL = 'F7F8FA', HEAD = 'EEF1F5';

const PNL0 = '[Color10]+#,##0;[Red]-#,##0;0';
const PNL2 = '[Color10]+#,##0.00;[Red]-#,##0.00;0.00';

// Named styles. Keys: font { b, i, sz, color }, fill, border { top, bottom, left }, fmt, align { h, v, wrap, indent }.
export const STYLES = {
  text: {},
  muted: { font: { color: MUTED } },
  note: { font: { i: true, color: MUTED, sz: 9 }, align: { wrap: true, v: 'top' } },
  title: { font: { b: true, sz: 18, color: INK } },
  subtitle: { font: { sz: 10, color: MUTED } },
  section: { font: { b: true, sz: 12, color: INK }, border: { bottom: LINE } },
  header: { font: { b: true, sz: 10, color: INK }, fill: HEAD, border: { bottom: 'C7CDD6' }, align: { v: 'center', wrap: true } },
  headerNum: { font: { b: true, sz: 10, color: INK }, fill: HEAD, border: { bottom: 'C7CDD6' }, align: { h: 'right', v: 'center', wrap: true } },
  kpiLabel: { font: { sz: 9, color: MUTED }, fill: PANEL, border: { top: LINE, left: PALETTE.blue }, align: { indent: 1, v: 'bottom' } },
  kpiValue: { font: { b: true, sz: 18, color: INK }, fill: PANEL, border: { bottom: LINE, left: PALETTE.blue }, align: { indent: 1, v: 'top', h: 'left' }, fmt: '#,##0' },
  kpiPnl: { font: { b: true, sz: 18 }, fill: PANEL, border: { bottom: LINE, left: PALETTE.blue }, align: { indent: 1, v: 'top', h: 'left' }, fmt: PNL0 },
  kpiPnl2: { font: { b: true, sz: 18 }, fill: PANEL, border: { bottom: LINE, left: PALETTE.blue }, align: { indent: 1, v: 'top', h: 'left' }, fmt: PNL2 },
  kpiPct: { font: { b: true, sz: 18, color: INK }, fill: PANEL, border: { bottom: LINE, left: PALETTE.blue }, align: { indent: 1, v: 'top', h: 'left' }, fmt: '0.0%' },
  kpiRatio: { font: { b: true, sz: 18, color: INK }, fill: PANEL, border: { bottom: LINE, left: PALETTE.blue }, align: { indent: 1, v: 'top', h: 'left' }, fmt: '0.00' },
  kpiText: { font: { b: true, sz: 18, color: INK }, fill: PANEL, border: { bottom: LINE, left: PALETTE.blue }, align: { indent: 1, v: 'top', h: 'left' } },
  kpiPanel: { fill: PANEL },
  int: { fmt: '#,##0' },
  money: { fmt: '#,##0.00' },
  pnl: { fmt: PNL0 },
  pnl2: { fmt: PNL2 },
  pct: { fmt: '0.0%' },
  rate: { fmt: '0.0000' },
  ratio: { fmt: '0.00' },
  date: { fmt: 'yyyy-mm-dd', align: { h: 'left' } },
  dateTr: { fmt: 'dd.mm.yyyy', align: { h: 'left' } },
  time: { fmt: 'hh:mm:ss', align: { h: 'left' } },
  totalText: { font: { b: true }, border: { top: '9CA3AF' } },
  totalInt: { font: { b: true }, border: { top: '9CA3AF' }, fmt: '#,##0' },
  totalPnl: { font: { b: true }, border: { top: '9CA3AF' }, fmt: PNL0 },
  totalPnl2: { font: { b: true }, border: { top: '9CA3AF' }, fmt: PNL2 },
  good: { font: { b: true, color: '2E7D32' } },
  bad: { font: { b: true, color: 'C62828' } },
  label: { font: { color: INK } },
};

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const colName = i => { let s = ''; i++; while (i) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
export const cellRef = (c, r) => `${colName(c)}${r + 1}`;
export const absRange = (c1, r1, c2, r2) => `$${colName(c1)}$${r1 + 1}:$${colName(c2)}$${r2 + 1}`;

// ---------------------------------------------------------------- style table
function styleTable() {
  const fonts = [], fills = ['<fill><patternFill patternType="none"/></fill>', '<fill><patternFill patternType="gray125"/></fill>'], borders = ['<border><left/><right/><top/><bottom/><diagonal/></border>'];
  const numFmts = [], xfs = [], index = new Map();
  const add = (list, xml) => { let i = list.indexOf(xml); if (i < 0) { list.push(xml); i = list.length - 1; } return i; };
  const fontXml = (f = {}) => `<font>${f.b ? '<b/>' : ''}${f.i ? '<i/>' : ''}<sz val="${f.sz ?? 10}"/><color rgb="FF${f.color ?? INK}"/><name val="Calibri"/><family val="2"/></font>`;
  add(fonts, fontXml());
  const side = (n, c) => (c ? `<${n} style="${n === 'left' ? 'thick' : 'thin'}"><color rgb="FF${c}"/></${n}>` : `<${n}/>`);
  const fmtId = code => {
    if (!code) return 0;
    const builtin = { '0': 1, '0.00': 2, '#,##0': 3, '#,##0.00': 4, '0%': 9, '0.00%': 10 };
    if (code in builtin) return builtin[code];
    let i = numFmts.indexOf(code); if (i < 0) { numFmts.push(code); i = numFmts.length - 1; }
    return 164 + i;
  };
  const xfOf = st => {
    const key = JSON.stringify(st);
    if (index.has(key)) return index.get(key);
    const font = add(fonts, fontXml(st.font));
    const fill = st.fill ? add(fills, `<fill><patternFill patternType="solid"><fgColor rgb="FF${st.fill}"/><bgColor indexed="64"/></patternFill></fill>`) : 0;
    const b = st.border ?? {};
    const border = st.border ? add(borders, `<border>${side('left', b.left)}<right/>${side('top', b.top)}${side('bottom', b.bottom)}<diagonal/></border>`) : 0;
    const numFmt = fmtId(st.fmt);
    const a = st.align;
    const align = a ? `<alignment${a.h ? ` horizontal="${a.h}"` : ''}${a.v ? ` vertical="${a.v}"` : ''}${a.wrap ? ' wrapText="1"' : ''}${a.indent ? ` indent="${a.indent}"` : ''}/>` : '';
    xfs.push(`<xf numFmtId="${numFmt}" fontId="${font}" fillId="${fill}" borderId="${border}" xfId="0"${numFmt ? ' applyNumberFormat="1"' : ''} applyFont="1"${fill ? ' applyFill="1"' : ''}${border ? ' applyBorder="1"' : ''}${align ? ' applyAlignment="1">' + align + '</xf>' : '/>'}`);
    index.set(key, xfs.length - 1);
    return xfs.length - 1;
  };
  xfOf({}); // 0 = default
  const xml = () => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">`
    + (numFmts.length ? `<numFmts count="${numFmts.length}">${numFmts.map((c, i) => `<numFmt numFmtId="${164 + i}" formatCode="${esc(c)}"/>`).join('')}</numFmts>` : '')
    + `<fonts count="${fonts.length}">${fonts.join('')}</fonts><fills count="${fills.length}">${fills.join('')}</fills><borders count="${borders.length}">${borders.join('')}</borders>`
    + `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="${xfs.length}">${xfs.join('')}</cellXfs>`
    + '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
  return { xfOf, xml };
}

// ---------------------------------------------------------------- sheet
function sheetXml(sh, styles, hasDrawing) {
  const style = s => (s === undefined ? 0 : styles.xfOf(typeof s === 'string' ? (STYLES[s] ?? {}) : s));
  const cell = (v, ref) => {
    if (v === null || v === undefined || v === '') return '';
    if (typeof v === 'number') return Number.isFinite(v) ? `<c r="${ref}"><v>${v}</v></c>` : '';
    if (typeof v === 'string') return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${esc(v)}</t></is></c>`;
    const s = style(v.s);
    const sa = s ? ` s="${s}"` : '';
    if ('date' in v) return `<c r="${ref}"${sa}><v>${v.date}</v></c>`;
    if ('time' in v) return `<c r="${ref}"${sa}><v>${v.time}</v></c>`;
    if (v.v === null || v.v === undefined || v.v === '') return s ? `<c r="${ref}"${sa}/>` : '';
    if (typeof v.v === 'number') return Number.isFinite(v.v) ? `<c r="${ref}"${sa}><v>${v.v}</v></c>` : `<c r="${ref}"${sa}/>`;
    return `<c r="${ref}"${sa} t="inlineStr"><is><t xml:space="preserve">${esc(v.v)}</t></is></c>`;
  };
  const heights = sh.heights ?? {};
  const rows = sh.rows.map((row, r) => `<row r="${r + 1}"${heights[r] ? ` ht="${heights[r]}" customHeight="1"` : ''}>${row.map((v, c) => cell(v, cellRef(c, r))).join('')}</row>`).join('');
  const width = Math.max(1, ...sh.rows.map(r => r.length));
  const f = sh.freeze;
  const pane = f && (f.rows || f.cols)
    ? `<pane${f.cols ? ` xSplit="${f.cols}"` : ''}${f.rows ? ` ySplit="${f.rows}"` : ''} topLeftCell="${cellRef(f.cols ?? 0, f.rows ?? 0)}" activePane="${f.rows && f.cols ? 'bottomRight' : f.rows ? 'bottomLeft' : 'topRight'}" state="frozen"/>`
    : '';
  const views = `<sheetViews><sheetView workbookViewId="0"${sh.grid === false ? ' showGridLines="0"' : ''}${sh.first ? ' tabSelected="1"' : ''}>${pane}</sheetView></sheetViews>`;
  const cols = sh.cols?.length ? `<cols>${sh.cols.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>` : '';
  const merges = sh.merges?.length ? `<mergeCells count="${sh.merges.length}">${sh.merges.map(m => `<mergeCell ref="${m}"/>`).join('')}</mergeCells>` : '';
  const filter = sh.filter ? `<autoFilter ref="${sh.filter}"/>` : '';
  const tab = sh.tab ? `<sheetPr><tabColor rgb="FF${sh.tab}"/></sheetPr>` : '';
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">`
    + `${tab}<dimension ref="A1:${cellRef(width - 1, Math.max(0, sh.rows.length - 1))}"/>${views}<sheetFormatPr defaultRowHeight="15"/>${cols}<sheetData>${rows}</sheetData>${filter}${merges}`
    + `<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>${hasDrawing ? '<drawing r:id="rId1"/>' : ''}</worksheet>`;
}

// ---------------------------------------------------------------- charts
const quoteSheet = name => `'${String(name).replace(/'/g, "''")}'`;
const txPr = (sz, color, bold = false) => `<c:txPr><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="${sz}" b="${bold ? 1 : 0}"><a:solidFill><a:srgbClr val="${color}"/></a:solidFill></a:defRPr></a:pPr><a:endParaRPr lang="en-US"/></a:p></c:txPr>`;
const fillXml = c => `<c:spPr><a:solidFill><a:srgbClr val="${c}"/></a:solidFill></c:spPr>`;
const lineXml = (c, w = 22225) => `<c:spPr><a:ln w="${w}" cap="rnd"><a:solidFill><a:srgbClr val="${c}"/></a:solidFill><a:round/></a:ln></c:spPr>`;

function chartXml(ch) {
  const isLine = ch.type === 'line';
  const strCache = list => `<c:strCache><c:ptCount val="${list.length}"/>${list.map((v, i) => `<c:pt idx="${i}"><c:v>${esc(v)}</c:v></c:pt>`).join('')}</c:strCache>`;
  const numCache = list => `<c:numCache><c:formatCode>General</c:formatCode><c:ptCount val="${list.length}"/>${list.map((v, i) => (Number.isFinite(v) ? `<c:pt idx="${i}"><c:v>${v}</c:v></c:pt>` : '')).join('')}</c:numCache>`;
  const series = ch.series.map((s, i) => {
    const catNum = list => `<c:numCache><c:formatCode>yyyy-mm-dd</c:formatCode><c:ptCount val="${list.length}"/>${list.map((v, i) => `<c:pt idx="${i}"><c:v>${v}</c:v></c:pt>`).join('')}</c:numCache>`;
    const cat = !s.cat ? '' : ch.dates
      ? `<c:cat><c:numRef><c:f>${esc(`${quoteSheet(s.cat.sheet)}!${s.cat.ref}`)}</c:f>${catNum(s.cats ?? [])}</c:numRef></c:cat>`
      : `<c:cat><c:strRef><c:f>${esc(`${quoteSheet(s.cat.sheet)}!${s.cat.ref}`)}</c:f>${strCache((s.cats ?? []).map(String))}</c:strRef></c:cat>`;
    const val = `<c:val><c:numRef><c:f>${esc(`${quoteSheet(s.val.sheet)}!${s.val.ref}`)}</c:f>${numCache(s.vals ?? [])}</c:numRef></c:val>`;
    const points = (s.pointColors ?? []).map((c, j) => (c ? `<c:dPt><c:idx val="${j}"/><c:invertIfNegative val="0"/><c:bubble3D val="0"/>${fillXml(c)}</c:dPt>` : '')).join('');
    const look = isLine ? `${lineXml(s.color ?? PALETTE.blue)}<c:marker><c:symbol val="none"/></c:marker>` : `${fillXml(s.color ?? PALETTE.blue)}<c:invertIfNegative val="0"/>`;
    // Value labels on bars, as Tableau shows them; lines stay unlabelled.
    const hasNegative = (s.vals ?? []).some(v => v < 0);
    const showLabels = !isLine && ch.labels !== false && (s.vals ?? []).length <= 12;
    const labels = !showLabels ? '' : `<c:dLbls><c:numFmt formatCode="${esc(ch.labelFmt ?? ch.numFmt ?? '#,##0')}" sourceLinked="0"/><c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr>${hasNegative ? txPr(800, 'FFFFFF', true) : txPr(800, INK)}<c:dLblPos val="${hasNegative ? 'inEnd' : 'outEnd'}"/><c:showLegendKey val="0"/><c:showVal val="1"/><c:showCatName val="0"/><c:showSerName val="0"/><c:showPercent val="0"/><c:showBubbleSize val="0"/></c:dLbls>`;
    return `<c:ser><c:idx val="${i}"/><c:order val="${i}"/><c:tx><c:v>${esc(s.name ?? '')}</c:v></c:tx>${look}${points}${labels}${cat}${val}${isLine ? '<c:smooth val="0"/>' : ''}</c:ser>`;
  }).join('');
  const grid = `<c:majorGridlines><c:spPr><a:ln w="6350"><a:solidFill><a:srgbClr val="${LINE}"/></a:solidFill></a:ln></c:spPr></c:majorGridlines>`;
  const axisLine = `<c:spPr><a:ln w="6350"><a:solidFill><a:srgbClr val="D1D5DB"/></a:solidFill></a:ln></c:spPr>`;
  const noLine = '<c:spPr><a:ln><a:noFill/></a:ln></c:spPr>';
  const barDir = ch.type === 'bar' ? 'bar' : 'col';
  const plot = isLine
    ? `<c:lineChart><c:grouping val="standard"/><c:varyColors val="0"/>${series}<c:marker val="1"/><c:axId val="5001"/><c:axId val="5002"/></c:lineChart>`
    : `<c:barChart><c:barDir val="${barDir}"/><c:grouping val="clustered"/><c:varyColors val="0"/>${series}<c:gapWidth val="55"/><c:axId val="5001"/><c:axId val="5002"/></c:barChart>`;
  const catPos = ch.type === 'bar' ? 'l' : 'b', valPos = ch.type === 'bar' ? 'b' : 'l';
  const dateAx = `<c:dateAx><c:axId val="5001"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="b"/><c:numFmt formatCode="${esc(ch.dateFmt ?? 'mmm yyyy')}" sourceLinked="0"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="low"/>${axisLine}${txPr(900, MUTED)}<c:crossAx val="5002"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblOffset val="100"/><c:baseTimeUnit val="days"/><c:majorUnit val="1"/><c:majorTimeUnit val="months"/></c:dateAx>`;
  const catAx = `<c:catAx><c:axId val="5001"/><c:scaling><c:orientation val="${ch.type === 'bar' ? 'maxMin' : 'minMax'}"/></c:scaling><c:delete val="0"/><c:axPos val="${catPos}"/><c:numFmt formatCode="General" sourceLinked="1"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="low"/>${axisLine}${txPr(900, MUTED)}<c:crossAx val="5002"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/>${ch.skip ? `<c:tickLblSkip val="${ch.skip}"/><c:tickMarkSkip val="${ch.skip}"/>` : ''}<c:noMultiLvlLbl val="0"/></c:catAx>`;
  const valAx = `<c:valAx><c:axId val="5002"/><c:scaling><c:orientation val="minMax"/>${Number.isFinite(ch.min) ? `<c:min val="${ch.min}"/>` : ''}</c:scaling><c:delete val="0"/><c:axPos val="${valPos}"/>${grid}<c:numFmt formatCode="${esc(ch.numFmt ?? '#,##0')}" sourceLinked="0"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/>${noLine}${txPr(900, MUTED)}<c:crossAx val="5001"/><c:crosses val="${ch.type === 'bar' ? 'max' : 'autoZero'}"/><c:crossBetween val="between"/></c:valAx>`;
  const title = ch.title ? `<c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="1100" b="1"><a:solidFill><a:srgbClr val="${INK}"/></a:solidFill></a:defRPr></a:pPr><a:r><a:rPr lang="en-US" sz="1100" b="1"><a:solidFill><a:srgbClr val="${INK}"/></a:solidFill></a:rPr><a:t>${esc(ch.title)}</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title><c:autoTitleDeleted val="0"/>` : '<c:autoTitleDeleted val="1"/>';
  const legend = ch.legend ? `<c:legend><c:legendPos val="t"/><c:overlay val="0"/>${txPr(900, MUTED)}</c:legend>` : '';
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">`
    + `<c:roundedCorners val="0"/><c:chart>${title}<c:plotArea><c:layout/>${plot}${ch.dates ? dateAx : catAx}${valAx}<c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr></c:plotArea>${legend}<c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart>`
    + `<c:spPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:ln w="9525"><a:solidFill><a:srgbClr val="${LINE}"/></a:solidFill></a:ln></c:spPr><c:txPr><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="900"><a:latin typeface="Calibri"/></a:defRPr></a:pPr><a:endParaRPr lang="en-US"/></a:p></c:txPr></c:chartSpace>`;
}

function drawingXml(charts, firstChartNo) {
  const anchor = (ch, i) => `<xdr:twoCellAnchor editAs="oneCell"><xdr:from><xdr:col>${ch.from[0]}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${ch.from[1]}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:to><xdr:col>${ch.to[0]}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${ch.to[1]}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to>`
    + `<xdr:graphicFrame macro=""><xdr:nvGraphicFramePr><xdr:cNvPr id="${i + 2}" name="Chart ${firstChartNo + i}"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr><xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm>`
    + `<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" r:id="rId${i + 1}"/></a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:twoCellAnchor>`;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">${charts.map(anchor).join('')}</xdr:wsDr>`;
}

// ---------------------------------------------------------------- workbook
export function workbook({ title = 'Kalibre Markets', created = '2026-10-30T00:00:00Z', sheets }) {
  const styles = styleTable();
  const parts = {};
  const overrides = [];
  let chartNo = 1, drawingNo = 1;
  sheets.forEach((sh, i) => {
    const n = i + 1;
    const charts = sh.charts ?? [];
    parts[`xl/worksheets/sheet${n}.xml`] = sheetXml({ ...sh, first: i === 0 }, styles, charts.length > 0);
    overrides.push(`<Override PartName="/xl/worksheets/sheet${n}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`);
    if (!charts.length) return;
    const d = drawingNo++;
    parts[`xl/worksheets/_rels/sheet${n}.xml.rels`] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing${d}.xml"/></Relationships>`;
    parts[`xl/drawings/drawing${d}.xml`] = drawingXml(charts, chartNo);
    overrides.push(`<Override PartName="/xl/drawings/drawing${d}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>`);
    const rels = charts.map((ch, j) => {
      const c = chartNo++;
      parts[`xl/charts/chart${c}.xml`] = chartXml(ch);
      overrides.push(`<Override PartName="/xl/charts/chart${c}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>`);
      return `<Relationship Id="rId${j + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/chart${c}.xml"/>`;
    });
    parts[`xl/drawings/_rels/drawing${d}.xml.rels`] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels.join('')}</Relationships>`;
  });
  parts['xl/styles.xml'] = styles.xml();
  parts['[Content_Types].xml'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${overrides.join('')}<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`;
  parts['_rels/.rels'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`;
  parts['docProps/core.xml'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${esc(title)}</dc:title><dc:creator>Kalibre Markets</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${created}</dcterms:created></cp:coreProperties>`;
  parts['xl/workbook.xml'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView activeTab="0"/></bookViews><sheets>${sheets.map((s, i) => `<sheet name="${esc(s.name.slice(0, 31))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets>`
    + `${sheets.some(s => s.filter) ? `<definedNames>${sheets.map((s, i) => (s.filter ? `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">${esc(quoteSheet(s.name))}!${s.filter.replace(/([A-Z]+)(\d+)/g, '$$$1$$$2')}</definedName>` : '')).join('')}</definedNames>` : ''}</workbook>`;
  parts['xl/_rels/workbook.xml.rels'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
  const order = ['[Content_Types].xml', '_rels/.rels', 'docProps/core.xml', 'xl/workbook.xml', 'xl/_rels/workbook.xml.rels', 'xl/styles.xml'];
  const names = [...order, ...Object.keys(parts).filter(k => !order.includes(k)).sort()];
  return zip(names.map(n => [n, new TextEncoder().encode(parts[n])]));
}

// Uncompressed ZIP (method 0) with CRC-32.
const CRC = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = b => { let c = 0xFFFFFFFF; for (const x of b) c = CRC[(c ^ x) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
function zip(files) {
  const chunks = [], central = [];
  let offset = 0;
  const DOS_DATE = ((2026 - 1980) << 9) | (10 << 5) | 30, DOS_TIME = 0;
  for (const [name, data] of files) {
    const nameBytes = new TextEncoder().encode(name);
    const crc = crc32(data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true); local.setUint16(4, 20, true); local.setUint16(6, 0x0800, true); local.setUint16(8, 0, true);
    local.setUint16(10, DOS_TIME, true); local.setUint16(12, DOS_DATE, true); local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true); local.setUint32(22, data.length, true); local.setUint16(26, nameBytes.length, true); local.setUint16(28, 0, true);
    chunks.push(new Uint8Array(local.buffer), nameBytes, data);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
    c.setUint16(12, DOS_TIME, true); c.setUint16(14, DOS_DATE, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true);
    c.setUint16(28, nameBytes.length, true); c.setUint32(42, offset, true);
    central.push(new Uint8Array(c.buffer), nameBytes);
    offset += 30 + nameBytes.length + data.length;
  }
  const centralSize = central.reduce((t, b) => t + b.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
  end.setUint32(12, centralSize, true); end.setUint32(16, offset, true);
  const all = [...chunks, ...central, new Uint8Array(end.buffer)];
  const out = new Uint8Array(all.reduce((t, b) => t + b.length, 0));
  let p = 0; for (const b of all) { out.set(b, p); p += b.length; }
  return out;
}
