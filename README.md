# Quant Strategy Audit Workflow

A visual checklist for answering one question:

> Is this TradingView strategy actually worth risking money on?

**Live demo:** https://0xtrvkc.github.io/quant-strategy-audit-workflow/

The app turns strategy testing into a clear five-step flow. It does not judge a strategy from net profit or win rate alone. It checks whether the code works, whether the signals are honest, whether the backtest is fair, whether the edge makes mathematical sense, and whether the strategy behaves properly before live deployment.

## Two modes

### Normal Trader — default

Plain language for traders who want a practical process without heavy quant terminology:

1. **Does the code work?**  
   Confirm the script loads, produces trades, and follows its written rules.

2. **Can you trust the signals?**  
   Check for repainting, future data, synthetic prices, and signals that move after reloading.

3. **Run a fair backtest**  
   Use the intended market and timeframe, include different market conditions, and model commission, spread, and slippage.

4. **Do the numbers make sense?**  
   Review win rate together with average win, average loss, reward/risk, expectancy, and maximum drawdown.

5. **Prove it before going live**  
   Stress nearby settings, test unseen data, paper trade, set loss limits, and start at minimum size.

### Quant Mode

A deeper audit covering:

- Pine Script integrity and higher-timeframe data
- Broker-emulator and intrabar fill assumptions
- Trading costs, liquidity, margin, and capacity
- Risk-adjusted performance and trade distributions
- Out-of-sample and walk-forward testing
- Parameter sensitivity and Monte Carlo testing
- Alert reliability, reconciliation, and production risk controls

Use the fixed switch in the top-right corner to change modes.

## Edge calculator

Normal Trader mode includes a quick calculator for:

- Reward/risk ratio
- Break-even win rate after costs
- Expectancy per trade

The calculator uses:

```text
Reward/Risk = Average Win / Average Loss

Break-even Win Rate =
(Average Loss + Cost per Trade) / (Average Win + Average Loss)

Expectancy =
Win Rate × Average Win
− Loss Rate × Average Loss
− Cost per Trade
```

A positive result is not proof that the strategy will remain profitable. It means the supplied backtest numbers have positive expectancy and are worth testing further.

## MT5-style audit report

Select **MT5-style report** after completing an audit to generate a dense Strategy Tester-inspired report containing:

- Test configuration and strategy notes
- Audit verdict and completion rate
- Pass, Review, and Fail gate totals
- User-supplied win rate, reward/risk, break-even rate, and expectancy
- Gate-by-gate results
- Detailed checklist status
- Observed stop signs

The report can be previewed, printed or saved as PDF, and downloaded as a standalone HTML file. Missing trading statistics remain blank instead of being estimated or invented.

This is an MT5-inspired audit layout, not an exported MetaTrader 5 report.

## Features

- Responsive flowchart for desktop and mobile
- Fixed progress indicator while scrolling
- Plain-language and advanced audit modes
- Hover, keyboard, and tap explanations
- Automatic rejection when a stop sign is present
- Pass, Review, or Fail decision for every stage
- Final workflow verdict
- Browser-saved progress
- MT5-style report preview, PDF printing, and standalone HTML download
- Printable checklist
- JSON export
- No dependencies, account, backend, or build step

## Run locally

Clone the repository:

```bash
git clone https://github.com/0xtrvkc/quant-strategy-audit-workflow.git
cd quant-strategy-audit-workflow
```

Then open `index.html` in a browser.

You can also serve it locally:

```bash
python -m http.server 8000
```

Open http://localhost:8000.

## How progress is stored

Checklist state, strategy notes, calculator inputs, and the selected mode are stored in the browser with `localStorage`.

Nothing is sent to a server. Clearing browser storage or using another browser/device starts a new audit. Use **Export JSON** if you want a portable copy.

## Important

This tool is a research workflow, not a profitability guarantee or investment advice. Backtests are simulations. Real fills, fees, liquidity, latency, market regimes, and future performance can differ materially.

A strategy should not reach live trading simply because every box is checked. The evidence behind each answer still matters.
