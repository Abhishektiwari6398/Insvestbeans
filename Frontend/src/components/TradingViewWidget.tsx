'use client'
import React, { useEffect, useRef, memo } from 'react';
import { useTheme } from "@/controllers/Themecontext";

interface TradingViewWidgetProps {
  symbol?: string;
  theme?: 'light' | 'dark';
  height?: string;
  mode?: 'domestic' | 'global';
}

function TradingViewWidget({
  symbol,
  theme: propTheme,
  height = '600px',
  mode = 'global',
}: TradingViewWidgetProps) {
  const { theme: globalTheme } = useTheme();
  const finalTheme = propTheme || globalTheme || 'dark';

  // Domestic → NSE:NIFTY 50, Global → NASDAQ:AAPL (or caller-supplied symbol)
  const resolvedSymbol = symbol
    ? symbol
    : mode === 'domestic'
      ? 'NSE:NIFTY 50'
      : 'NASDAQ:AAPL';

  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    container.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol: resolvedSymbol,
      interval: 'D',
      timezone: mode === 'domestic' ? 'Asia/Kolkata' : 'Etc/UTC',
      theme: finalTheme,
      style: '1',
      locale: 'en',
      backgroundColor: finalTheme === 'light' ? '#ffffff' : '#0d1b2a',
      gridColor: finalTheme === 'light' ? 'rgba(37,99,235,0.06)' : 'rgba(255,255,255,0.04)',
      allow_symbol_change: true,
      calendar: false,
      details: false,
      hide_side_toolbar: true,
      hide_top_toolbar: false,
      hide_legend: false,
      hide_volume: false,
      hotlist: false,
      save_image: true,
      watchlist: [],
      withdateranges: false,
      compareSymbols: [],
      studies: [],
      autosize: true,
    });

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'height:100%;width:100%';
    container.current.appendChild(wrapper);
    wrapper.appendChild(script);

    return () => {
      if (container.current) container.current.innerHTML = '';
    };
  }, [resolvedSymbol, finalTheme, mode]);

  return (
    <div
      ref={container}
      style={{
        width: '100%',
        height,
        borderRadius: 12,
        overflow: 'hidden',
        border: finalTheme === 'light' ? '1px solid rgba(0,0,0,0.10)' : '1px solid rgba(100,160,210,0.35)',
        boxShadow: finalTheme === 'light' ? '0 2px 12px rgba(0,0,0,0.08), 0 6px 24px rgba(0,0,0,0.06)' : '0 8px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(100,160,210,0.12)',
      }}
    />
  );
}

export default memo(TradingViewWidget);