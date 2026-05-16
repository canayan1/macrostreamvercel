/* Algo Interactive — per-stock sayfa için lightweight-charts handler.

   Pencere filtresi (6A / 1Y / 3Y / 5Y) chart zoom + trade görünürlüğünü senkron yönetir.
   Strateji butonu badge'leri seçili pencereye göre canlı güncellenir.
*/
(function () {
  'use strict';

  if (!window.ALGO_DATA) {
    console.warn('ALGO_DATA yok — interaktif panel başlatılmadı.');
    return;
  }
  if (typeof LightweightCharts === 'undefined') {
    console.warn('LightweightCharts yüklenmemiş.');
    return;
  }

  const data = window.ALGO_DATA;
  const chartEl = document.getElementById('lwc-chart');
  if (!chartEl) return;

  // Tema renkleri (Amber Terminal)
  const COLORS = {
    bg: '#0d0c0a',
    grid: '#1d1816',
    text: '#ebe3d3',
    accent: '#ffa630',
    up: '#4ade80',
    dn: '#ef4444',
    muted: '#8a7f6c'
  };

  // Chart oluştur
  const chart = LightweightCharts.createChart(chartEl, {
    layout: {
      background: { type: 'solid', color: COLORS.bg },
      textColor: COLORS.text,
      fontFamily: 'Geist Mono, monospace',
    },
    grid: {
      vertLines: { color: COLORS.grid },
      horzLines: { color: COLORS.grid },
    },
    timeScale: {
      borderColor: COLORS.grid,
      timeVisible: true,
    },
    rightPriceScale: { borderColor: COLORS.grid },
    crosshair: { mode: 1 },
  });

  // Candle series
  const candleSeries = chart.addCandlestickSeries({
    upColor: COLORS.up, downColor: COLORS.dn,
    borderUpColor: COLORS.up, borderDownColor: COLORS.dn,
    wickUpColor: COLORS.up, wickDownColor: COLORS.dn,
  });
  candleSeries.setData(data.ohlc);

  // State
  let activeStrategy = null;  // updateActiveStrategyForWindow tarafından kurulur
  let commissionPct = data.cost_defaults.commission_pct;
  let spreadPct = data.cost_defaults.spread_pct;
  const bsmvRate = data.cost_defaults.bsmv_rate;
  // Default pencere = 3Y (1095 gün)
  let windowDays = 1095;

  // Helpers
  function roundTripCost() {
    return ((commissionPct * (1 + bsmvRate)) + spreadPct) / 100 * 2;
  }
  function getStrategy(slug) {
    return data.strategies.find(s => s.slug === slug);
  }
  function formatPct(v, signed) {
    if (v === null || v === undefined || isNaN(v)) return '—';
    const sign = (signed && v > 0) ? '+' : '';
    return sign + (v * 100).toFixed(2) + '%';
  }
  function formatTL(v) {
    if (!isFinite(v)) return '—';
    return '~' + Math.round(v).toLocaleString('tr-TR') + ' TL';
  }
  function setPnlValue(elId, value, signed) {
    const el = document.getElementById(elId);
    if (!el) return;
    el.textContent = formatPct(value, signed);
    el.classList.remove('up', 'dn', 'neu');
    if (value === null || isNaN(value)) el.classList.add('neu');
    else if (value > 0.0001) el.classList.add('up');
    else if (value < -0.0001) el.classList.add('dn');
    else el.classList.add('neu');
  }

  // Pencere içindeki trade'leri filtrele
  function tradesInWindow(strat) {
    if (!strat || !strat.trades) return [];
    if (data.ohlc.length === 0) return [];
    const lastDate = new Date(data.ohlc[data.ohlc.length - 1].time);
    const cutoffDate = new Date(lastDate.getTime() - windowDays * 24 * 3600 * 1000);
    const cutoffStr = cutoffDate.toISOString().slice(0, 10);
    return strat.trades.filter(t => t.exit_date >= cutoffStr);
  }

  // Chart zoom'u pencereye göre ayarla
  function applyChartRange() {
    if (data.ohlc.length === 0) return;
    const lastDate = data.ohlc[data.ohlc.length - 1].time;
    const lastTs = new Date(lastDate).getTime();
    const fromTs = lastTs - windowDays * 24 * 3600 * 1000;
    const fromStr = new Date(fromTs).toISOString().slice(0, 10);
    chart.timeScale().setVisibleRange({ from: fromStr, to: lastDate });
  }

  function updateCostUI() {
    document.getElementById('commission-val').textContent = '%' + commissionPct.toFixed(2);
    document.getElementById('spread-val').textContent = '%' + spreadPct.toFixed(2);
    const rt = roundTripCost();
    document.getElementById('rt-cost').textContent = '%' + (rt * 100).toFixed(2);
  }

  // Pencere değişince aktif stratejiyi pencerede en çok trade'i olana güncelle
  function pickActiveStrategyForWindow() {
    const ranked = data.strategies.map(s => ({
      slug: s.slug,
      n: tradesInWindow(s).length,
    })).sort((a, b) => b.n - a.n);
    // En çok trade'i olan (en az 1) → o
    const best = ranked.find(r => r.n > 0);
    if (best) {
      activeStrategy = best.slug;
    } else if (ranked.length > 0) {
      // Hiçbiri pencerede trade yapmıyor → 5Y'de en çok trade'i olana fallback
      const fallback = data.strategies.slice().sort(
        (a, b) => (b.trades || []).length - (a.trades || []).length
      )[0];
      activeStrategy = fallback ? fallback.slug : null;
    }
    // UI: aktif buton class'ı
    document.querySelectorAll('.algo-int .tabs button').forEach(btn => {
      if (btn.getAttribute('data-strategy') === activeStrategy) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // Strateji butonlarındaki (N) badge'lerini pencereye göre güncelle
  function updateStrategyBadges() {
    document.querySelectorAll('.algo-int .tabs button').forEach(btn => {
      const slug = btn.getAttribute('data-strategy');
      const strat = getStrategy(slug);
      if (!strat) return;
      const n = tradesInWindow(strat).length;
      const cntEl = btn.querySelector('.cnt');
      if (cntEl) cntEl.textContent = '(' + n + ')';
      if (n === 0) {
        btn.classList.add('muted');
        btn.style.opacity = '0.55';
      } else {
        btn.classList.remove('muted');
        btn.style.opacity = '';
      }
    });
  }

  function updateMarkersAndCommentary() {
    const strat = getStrategy(activeStrategy);
    if (!strat) return;
    const trades = tradesInWindow(strat);

    // Markers
    const markers = [];
    trades.forEach(t => {
      markers.push({
        time: t.entry_date,
        position: 'belowBar',
        color: COLORS.up,
        shape: 'arrowUp',
        text: '▲ Giriş',
      });
      if (!t.is_open) {
        markers.push({
          time: t.exit_date,
          position: 'aboveBar',
          color: COLORS.dn,
          shape: 'arrowDown',
          text: '▼ Çıkış',
        });
      }
    });
    markers.sort((a, b) => a.time.localeCompare(b.time));
    candleSeries.setMarkers(markers);

    // Commentary
    const cmtEl = document.getElementById('strategy-commentary');
    if (cmtEl) {
      let prefix = '';
      if (trades.length === 0 && strat.context) {
        const ctx = strat.context;
        const tickerName = data.ticker;
        const windowLabel = windowDays >= 1825 ? '5 yıl' :
                            windowDays >= 1095 ? '3 yıl' :
                            windowDays >= 365 ? '1 yıl' : '6 ay';
        if (ctx.total_trades_full > 0) {
          const lastEntryStr = ctx.last_entry ? `son giriş: <b>${ctx.last_entry}</b>` : '';
          prefix = (
            '<div style="background:rgba(155,144,124,.08);padding:10px 12px;' +
            'border-left:3px solid var(--muted);margin-bottom:10px;' +
            'font-size:12px;color:var(--text-dim);line-height:1.6">' +
            '<b style="color:var(--text)">◇ Bu strateji ' + tickerName + ' hissesini ' +
            'son ' + windowLabel + ' içinde hiç seçmedi.</b> ' +
            '5 yıllık backtest boyunca <b style="color:var(--accent)">' + ctx.total_trades_full +
            ' kez</b> tutuldu, ortalama ' + ctx.avg_hold_days + ' gün; ' +
            'sürenin %' + ctx.holding_pct_time + '\'inde pozisyondaydı' +
            (lastEntryStr ? '; ' + lastEntryStr : '') + '.</div>'
          );
        } else {
          prefix = (
            '<div style="background:rgba(239,68,68,.06);padding:10px 12px;' +
            'border-left:3px solid var(--red);margin-bottom:10px;' +
            'font-size:12px;color:var(--text-dim);line-height:1.6">' +
            '<b style="color:var(--text)">◇ Bu strateji ' + tickerName + ' hissesini ' +
            '5 yıllık backtest boyunca hiç seçmedi.</b> ' +
            'Strateji kriterleri bu hisseyi tarihsel olarak filtre dışında bıraktı.</div>'
          );
        }
      }
      const cmt = strat.commentary_html || ('<p>' + (strat.short_desc || '') + '</p>');
      cmtEl.innerHTML = prefix + cmt;
    }

    recomputePnl(trades);
  }

  function recomputePnl(trades) {
    const rt = roundTripCost();
    let cumGross = 1.0, cumNet = 1.0;
    let nTrades = 0;
    trades.forEach(t => {
      const g = 1 + (t.gross_return || 0);
      const netRet = g * (1 - rt);
      cumGross *= g;
      cumNet *= netRet;
      nTrades += 1;
    });
    const grossTotal = cumGross - 1.0;
    const netTotal = cumNet - 1.0;
    const drag = grossTotal - netTotal;

    setPnlValue('gross-pnl', grossTotal, true);
    setPnlValue('net-pnl', netTotal, true);
    setPnlValue('cost-drag', -drag, true);

    const tcEl = document.getElementById('trade-count');
    tcEl.textContent = nTrades.toString();
    tcEl.classList.remove('up', 'dn');
    tcEl.classList.add('neu');

    // 100K hesapta yıllık tahmini maliyet (seçili pencereye göre)
    let annualCostTL = 0;
    if (nTrades > 0) {
      const years = windowDays / 365.25;
      const tradesPerYear = years > 0 ? (nTrades / years) : 0;
      annualCostTL = tradesPerYear * 100000 * rt;
    }
    const acEl = document.getElementById('annual-cost-tl');
    acEl.textContent = formatTL(annualCostTL);
    acEl.classList.remove('up', 'dn');
    acEl.classList.add('neu');
  }

  // ─── Event handlers ─────────────────────────────────────────────────────
  document.querySelectorAll('.algo-int .tabs button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.algo-int .tabs button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeStrategy = btn.getAttribute('data-strategy');
      updateMarkersAndCommentary();
    });
  });

  document.querySelectorAll('.algo-int .range-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.algo-int .range-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      windowDays = parseInt(btn.getAttribute('data-days'), 10);
      applyChartRange();
      // Pencere değişince eğer mevcut aktif strateji bu pencerede 0 trade ise,
      // dolu olan başka birine geç. Mevcut aktif dolu ise dokunma.
      const currentStrat = getStrategy(activeStrategy);
      const currentInWindow = currentStrat ? tradesInWindow(currentStrat).length : 0;
      if (currentInWindow === 0) {
        pickActiveStrategyForWindow();
      }
      updateStrategyBadges();
      updateMarkersAndCommentary();
    });
  });

  const commissionSlider = document.getElementById('commission-slider');
  const spreadSlider = document.getElementById('spread-slider');
  if (commissionSlider) {
    commissionSlider.addEventListener('input', () => {
      commissionPct = parseFloat(commissionSlider.value);
      updateCostUI();
      const strat = getStrategy(activeStrategy);
      if (strat) recomputePnl(tradesInWindow(strat));
    });
  }
  if (spreadSlider) {
    spreadSlider.addEventListener('input', () => {
      spreadPct = parseFloat(spreadSlider.value);
      updateCostUI();
      const strat = getStrategy(activeStrategy);
      if (strat) recomputePnl(tradesInWindow(strat));
    });
  }

  // ─── Initial render ─────────────────────────────────────────────────────
  updateCostUI();
  applyChartRange();
  pickActiveStrategyForWindow();
  updateStrategyBadges();
  updateMarkersAndCommentary();

  // Resize handler
  window.addEventListener('resize', () => {
    chart.applyOptions({ width: chartEl.clientWidth });
  });
  chart.applyOptions({ width: chartEl.clientWidth });
})();
