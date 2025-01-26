"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePdfFromMarkdown = generatePdfFromMarkdown;
const puppeteer_1 = __importDefault(require("puppeteer"));
// @ts-ignore
const markdown_it_1 = __importDefault(require("markdown-it"));
const markdownToHtml = (markdown) => {
    const md = new markdown_it_1.default({
        html: true,
        typographer: true,
        breaks: true,
        linkify: true,
    });
    return md.render(markdown);
};
const generatePdf = (html, outputPath) => __awaiter(void 0, void 0, void 0, function* () {
    const browser = yield puppeteer_1.default.launch();
    const page = yield browser.newPage();
    yield page.setBypassCSP(true);
    yield page.setContent(html, {
        waitUntil: ["load", "networkidle0"],
        timeout: 30000,
    });
    yield page.pdf({
        path: outputPath,
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
    });
    yield browser.close();
});
function generatePdfFromMarkdown(markdown, outputPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <!-- Remove KaTeX references -->
  <!-- Add MathJax -->
  <script>
    window.MathJax = {
      tex: { inlineMath: [['$', '$'], ['\\(', '\\)']] },
      svg: { scale: 1 }
    };
  </script>
  <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js"></script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      line-height: 1.6;
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
      color: #24292e;
    }
    
    h1 {
      font-size: 2.5em;
      margin-bottom: 1em;
      padding-bottom: 0.3em;
      border-bottom: 1px solid #eaecef;
    }
    
    h2 {
      font-size: 2em;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
    }
    
    h3 {
      font-size: 1.5em;
      margin-top: 1.2em;
    }
    
    p {
      margin: 1em 0;
      font-size: 16px;
    }
    
    .katex-display {
      display: block;
      margin: 1.5em 0;
      text-align: center;
      font-size: 1.21em;
    }
    
    .katex-display > .katex {
      display: inline-block;
      text-align: center;
    }
    
    code {
      background-color: #f6f8fa;
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
      font-size: 85%;
    }
    
    pre code {
      display: block;
      padding: 1em;
      overflow: auto;
      line-height: 1.45;
    }
    
    blockquote {
      margin: 1em 0;
      padding-left: 1em;
      color: #6a737d;
      border-left: 0.25em solid #dfe2e5;
    }
    
    ul, ol {
      padding-left: 2em;
      margin: 1em 0;
    }
    
    img {
      max-width: 100%;
      height: auto;
    }
    
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
    }
    
    th, td {
      padding: 0.5em 1em;
      border: 1px solid #dfe2e5;
    }
    
    th {
      background-color: #f6f8fa;
      font-weight: 600;
    }
  </style>
</head>
<body>
  ${markdownToHtml(markdown)}
</body>
</html>
`;
        try {
            yield generatePdf(html, outputPath);
            return outputPath;
        }
        catch (error) {
            console.error("Failed to generate PDF:", error);
            throw new Error("PDF generation failed");
        }
    });
}
