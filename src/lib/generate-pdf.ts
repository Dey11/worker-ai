import puppeteer from "puppeteer";
// @ts-ignore
import MarkdownIt from "markdown-it";

const markdownToHtml = (markdown: string): string => {
  const md = new MarkdownIt({
    html: true,
    typographer: true,
    breaks: true,
    linkify: true,
  });

  return md.render(markdown);
};

const generatePdf = async (html: string, outputPath: string): Promise<void> => {
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/chromium-browser",
    args: [
      // "--disable-gpu",
      // "--disable-setuid-sandbox",
      // "--no-sandbox",
      // "--no-zygote",
    ],
  });
  const page = await browser.newPage();

  await page.setBypassCSP(true);
  await page.setContent(html, {
    waitUntil: ["load", "networkidle0"],
    timeout: 30000,
  });

  await page.pdf({
    path: outputPath,
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
  });

  await browser.close();
};

export async function generatePdfFromMarkdown(
  markdown: string,
  outputPath: string
): Promise<string> {
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
    await generatePdf(html, outputPath);
    return outputPath;
  } catch (error) {
    console.error("Failed to generate PDF:", error);
    throw new Error("PDF generation failed");
  }
}
