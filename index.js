'use strict';

const fs = require('hexo-fs');
const path = require('path');
const cheerio = require('cheerio');
const marked = require('marked');
const stripIndent = require('strip-indent');
const util = require('hexo-util');
const highlight = util.highlight;

// copy style file into public folder
const baseDir = hexo.base_dir;
const styleFile = 'demobox.css';
const styleUri = path.resolve(__dirname, styleFile);
fs.copyFile(styleUri, path.resolve(baseDir, hexo.config.public_dir, 'css', styleFile));

// insert the style file before the post content
hexo.extend.filter.register('before_post_render', function(data) {
  const styleLink = `{% raw %}<link rel="stylesheet" href="${hexo.config.root}css/${styleFile}" />{% endraw %}`;
  data.content = styleLink + data.content;
  return data;
});

// register the demo tag
hexo.extend.tag.register('demo', function(args, content) {
  const $content  = cheerio.load(content, { decodeEntities: false });
  const $template = $content('template');
  const $intro    = $content('intro');
  const $script   = $content('script');
  const $style    = $content('style');

  const $result = cheerio.load(`
    <div class="demobox">
      <div class="demobox-result"></div>
      <div class="demobox-meta">
        <span class="collapse" onClick="$(this).parents('.demobox').toggleClass('demobox-expand')"></span>
      </div>
    </div>
  `);

  // demo meta
  if (args[0]) {
    $result('.demobox-meta').append(`<div class="demobox-name">${args[0]}</div>`);
  }
  if ($intro.length) {
    const introcode = stripIndent($intro.html()).trim();
    $result('.demobox-meta').append(`<div class="demobox-intro">${marked(introcode)}</div>`);
  }

  // add code wrap element
  if ($template.length || $script.length || $style.legnth) {
    $result('.demobox').append(`<div class="demobox-code-wrap"></div>`);
  }

  // demo html
  if ($template.length) {
    const htmlcode = stripIndent($template.html()).trim();
    const highlightCode = highlight(htmlcode, { lang: 'html', caption: '<span>html</span>' });
    $result('.demobox-result').append(htmlcode);
    $result('.demobox-code-wrap').append(`<div class="demobox-code demobox-html">${highlightCode}</div>`);
  }

  // demo script
  if ($script.length) {
    const scriptcode = stripIndent($script.html()).trim();
    const highlightCode = highlight(scriptcode, { lang: 'javascript', caption: '<span>javascript</span>' });
    $result('.demobox-result').append(`<script>${scriptcode}</script>`);
    $result('.demobox-code-wrap').append(`<div class="demobox-code demobox-script">${highlightCode}</div>`);
  }

  // demo style
  if ($style.length) {
    const stylecode = stripIndent($style.html()).trim();
    const highlightCode = highlight(stylecode, { lang: 'css', caption: '<span>css</span>' });
    $result('.demobox-result').append(`<style>${stylecode}</style>`);
    $result('.demobox-code-wrap').append(`<div class="demobox-code demobox-style">${highlightCode}</div>`);
  }

  return $result.html();
}, {
  ends: true
});
