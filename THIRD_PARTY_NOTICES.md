# Third-party notices

## PineScript Syntax Checker

Parts of the Pine syntax-checking integration were adapted from:

- Project: [erevus-cn/pinescript_syntax_checker](https://github.com/erevus-cn/pinescript_syntax_checker)
- License: MIT
- Copyright: © 2024 PineScript Syntax Checker

The original project provides a Python MCP wrapper around TradingView's Pine facade. This repository adapts the request contract and adds a dependency-free browser preflight checker suitable for a static GitHub Pages app.

### MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## TradingView compiler endpoint

The optional compiler proxy uses an undocumented TradingView facade endpoint. It may change, reject requests, or become unavailable without notice. A successful response is not a guarantee that a script is profitable, non-repainting, or safe to trade.
