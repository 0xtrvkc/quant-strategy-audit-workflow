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

A deeper audit covering Pine Script integrity, execution assumptions, trading costs, risk-adjusted performance, out-of-sample testing, parameter sensitivity, Monte Carlo analysis, and production risk controls.

Use the fixed switch in the top-right corner to change modes.

## Pine Script syntax checker

Paste a complete Pine Script or open/drop a `.pine` or `.txt` file. The private browser-side preflight detects:

- Missing or duplicate Pine version directives
- Missing or duplicate `indicator()`, `strategy()`, or `library()` declarations
- Unclosed or mismatched brackets and strings
- Unsupported smart punctuation and block comments
- Strategy orders used without `strategy()`
- Literal array index errors and empty-array access
- Plotting calls that appear inside local scope
- Common future-leak and repaint-risk patterns

Every finding includes a line number. Select it to jump to that location. Source code is not stored in `localStorage`.

### Local preflight versus compiler verification

The local checker is intentionally labeled **preflight**. It cannot reproduce every Pine type, overload, scope, or compiler rule.

Optional TradingView verification uses the facade request pattern from [erevus-cn/pinescript_syntax_checker](https://github.com/erevus-cn/pinescript_syntax_checker). Because browsers cannot safely supply TradingView's required request headers, compiler verification needs the included server-side proxy:

```text
worker/tradingview-compiler.js
```

Deploy the Worker, set `ALLOWED_ORIGIN=https://0xtrvkc.github.io`, and paste its HTTPS URL into **Optional: verify with TradingView compiler**. The TradingView facade is undocumented and may change without notice. Attribution is recorded in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Evidence Lab

The Evidence Lab prevents a single attractive chart from being mistaken for a robust strategy. Run the same setup across several markets and enter both winning and losing results.

For each market it records:

- Symbol, timeframe, test period, trade count and net return
- Maximum drawdown and profit factor
- Buy-and-hold or other benchmark return
- Typical holding period
- Whether the result used genuinely unseen data
- Whether exit activity continued through the end of the test
- An optional TradingView screenshot

The table can be filled manually or imported from CSV. Select **Download CSV example** in the Evidence Lab for a ready-to-edit file. Accepted headers are:

```text
symbol,timeframe,period,trades,return,maxdd,pf,benchmark,avghold,oos,exits
```

The app automatically calculates profitable-market count, median return, benchmark wins and out-of-sample coverage. It warns about fewer than 30 trades, missing benchmarks, no unseen test, a non-positive median, and weak transferability.

If a strategy stops exiting before the test ends, the audit is rejected because the result may have silently become buy-and-hold. A small-live verdict also requires at least three complete markets, a positive median, at least one unseen test, continuing exits and no weak trade sample.

Evidence screenshots are kept only in the current page session. Their filenames remain in saved progress as a reminder to reattach them after reloading. Attached screenshots are embedded in reports generated during that session.

## Edge calculator

Normal Trader mode calculates:

```text
Reward/Risk = Average Win / Average Loss

Break-even Win Rate =
(Average Loss + Cost per Trade) / (Average Win + Average Loss)

Expectancy =
Win Rate × Average Win
− Loss Rate × Average Loss
− Cost per Trade
```

A positive result is not proof that the strategy will remain profitable. It means the supplied numbers have positive expectancy and are worth testing further.

## MT5-style audit report

Select **MT5-style report** to generate a Strategy Tester-inspired report containing:

- Pine syntax findings and verification source
- Multi-market evidence summary and result matrix
- Evidence warnings and attached screenshots
- Test configuration and strategy notes
- Audit verdict and completion rate
- User-supplied win rate, reward/risk, break-even rate and expectancy
- Gate-by-gate decisions, detailed checks and observed stop signs

The report can be previewed, printed or saved as PDF, and downloaded as a standalone HTML file. Missing statistics remain blank instead of being estimated or invented.

This is an MT5-inspired audit layout, not an exported MetaTrader 5 report.

## Features

- Browser-native Pine Script preflight with line-specific findings
- Optional TradingView compiler verification through a configurable proxy
- Manual entry and CSV import for multi-market backtests
- Automatic robustness, sample-quality, benchmark and exit-integrity checks
- Optional evidence screenshots
- Responsive flowchart and horizontally scrollable evidence table
- Fixed progress indicator while scrolling
- Plain-language and advanced audit modes
- Automatic rejection when a hard failure is present
- Browser-saved progress and JSON export
- MT5-style report preview, PDF printing and standalone HTML download
- No dependencies, account, backend or build step

## Run locally

```bash
git clone https://github.com/0xtrvkc/quant-strategy-audit-workflow.git
cd quant-strategy-audit-workflow
python -m http.server 8000
```

Open http://localhost:8000.

## How progress is stored

Checklist state, strategy notes, calculator inputs, evidence rows and the selected mode are stored in the browser with `localStorage`. Pine source and screenshot image data are not persisted.

Clearing browser storage or using another browser/device starts a new audit. Use **Export JSON** if you want a portable copy.

## Methodology note

The multi-market and exit-integrity workflow was informed by the testing ideas documented in [trustdan/trend-following-backtesting-strategies](https://github.com/trustdan/trend-following-backtesting-strategies). No source code, documentation text, datasets or strategy rankings were copied. The source repository did not expose a license file when reviewed, so this project uses only the general research concepts.

## Important

This tool is a research workflow, not a profitability guarantee or investment advice. Backtests are simulations. Real fills, fees, liquidity, latency, market regimes and future performance can differ materially.

A strategy should not reach live trading simply because every box is checked. The evidence behind each answer still matters.
