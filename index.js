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
  if ((/{%\s*demo/).test(data.content)) {
    const styleLink = `{% raw %}<link rel="stylesheet" href="${hexo.config.root}css/${styleFile}" />{% endraw %}`;
    data.content = styleLink + data.content;
    return data;
  }
});

// register the demo tag
hexo.extend.tag.register('demo', function(args, content) {
  const _wrapName = `wrap-${Math.random().toString(32).substr(2, 4)}`;
  const $ = cheerio.load(`<div class="${_wrapName}">${content}</div>`, { decodeEntities: false });;
  const $content = $(`.${_wrapName}`);

  const $intro = $content.find('intro');
  let $templateForShow = $content.find(`> template[for-show]`);
  let $templateForRun  = $content.find(`> template[for-run]`);
  let $scriptForShow   = $content.find(`> script[for-show]`);
  let $scriptForRun    = $content.find(`> script[for-run]`);
  let $styleForShow    = $content.find(`> style[for-show]`);
  let $styleForRun     = $content.find(`> style[for-run]`);

  if (!$templateForShow.length && !$templateForRun.length) {
    $templateForShow = $templateForRun = $content.find('> template');
  }
  if (!$scriptForShow.length && !$scriptForRun.length) {
    $scriptForShow = $scriptForRun = $content.find('> script');
  }
  if (!$styleForShow.length && !$styleForRun.length) {
    $styleForShow = $styleForRun = $content.find('> style');
  }

  const $result = cheerio.load(`
    <div class="demobox">
      <div class="demobox-result"></div>
    </div>
  `);

  // expand
  if (args[0] || $intro.length || $templateForShow.length || $scriptForShow.length || $styleForShow.length) {
    $result('.demobox').append('<div class="demobox-meta"></div>');

    if (args[0]) {
      $result('.demobox-meta').append(`<div class="demobox-name">${args[0]}</div>`);
    }

    if ($intro.length) {
      const introcode = stripIndent($intro.html()).trim();
      $result('.demobox-meta').append(`<div class="demobox-intro">${marked(introcode)}</div>`);
    }

    // code for show
    if ($templateForShow.length || $scriptForShow.length || $styleForShow.length) {
      $result('.demobox-meta').prepend('<span class="demobox-meta-collapse" onClick="jQuery(this).parents(\'.demobox\').toggleClass(\'demobox-expand\')"></span>');
      $result('.demobox').append('<div class="demobox-code-wrap"></div>');

      // html for show
      if ($templateForShow.length) {
        const code = stripIndent($templateForShow.html()).trim();
        const highlightCode = highlight(code, { lang: 'html', caption: '<span>html</span>' });
        $result('.demobox-code-wrap').append(`<div class="demobox-code demobox-html">${highlightCode}</div>`);
      }

      // script for show
      if ($scriptForShow.length) {
        const code = stripIndent($scriptForShow.html()).trim();
        const highlightCode = highlight(code, { lang: 'javascript', caption: '<span>javascript</span>' });
        $result('.demobox-code-wrap').append(`<div class="demobox-code demobox-script">${highlightCode}</div>`);
      }

      // style for show
      if ($styleForShow.length) {
        const code = stripIndent($styleForShow.html()).trim();
        const highlightCode = highlight(code, { lang: 'css', caption: '<span>css</span>' });
        $result('.demobox-code-wrap').append(`<div class="demobox-code demobox-style">${highlightCode}</div>`);
      }
    }
  }

  // html for run
  if ($templateForRun.length) {
    $result('.demobox-result').append($templateForRun.html());
  }

  // script for run
  if ($scriptForRun.length) {
    $result('.demobox-result').append(`<script>(function(){${$scriptForRun.html()}})();</script>`);
  }

  // style for run
  if ($styleForRun.length) {
    $result('.demobox-result').append(`<style>${$styleForRun.html()}</style>`);
  }

  return $result.html();
}, {
  ends: true
});
