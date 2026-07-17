(function () {
  'use strict'

  var defaults = {
    apiBaseUrl: 'https://openada.us',
    directoryUrl: 'https://openada.us/directory',
    position: 'bottom-right',
    auto: true
  }

  function init(options) {
    var config = Object.assign({}, defaults, options || {})
    if (config.auto === false) return

    var run = function () {
      var url = window.location.href
      if (!/^https?:$/.test(window.location.protocol)) return
      fetch(String(config.apiBaseUrl).replace(/\/$/, '') + '/api/v1/scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url, title: document.title })
      }).then(function (response) {
        return response.json().then(function (data) { return { response: response, data: data } })
      }).then(function (result) {
        if (!result.response.ok || !result.data.ada) return
        renderBadge(config, result.data)
      }).catch(function () {
        // A public page should never fail because the optional widget is unavailable.
      })
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', run, { once: true })
    } else {
      run()
    }
  }

  function renderBadge(config, data) {
    var existing = document.getElementById('openada-widget')
    if (existing) existing.remove()
    var score = Number(data.ada.score)
    var siteId = data.directory && data.directory.site && data.directory.site.id
    var directoryUrl = String(config.directoryUrl).replace(/\/$/, '') + (siteId ? '?site=' + encodeURIComponent(siteId) : '')
    var badge = document.createElement('a')
    badge.id = 'openada-widget'
    badge.href = directoryUrl
    badge.target = '_blank'
    badge.rel = 'noreferrer'
    badge.setAttribute('aria-label', 'OpenADA accessibility score ' + score + ' out of 100')
    badge.textContent = 'OpenADA ' + (data.grade || data.ada.grade) + ' · ' + score
    badge.style.cssText = 'position:fixed;z-index:2147483000;' + (config.position === 'bottom-left' ? 'left:16px;' : 'right:16px;') + 'bottom:16px;display:inline-flex;align-items:center;min-height:34px;padding:0 12px;border:1px solid #172033;border-radius:6px;background:#b8e7d9;color:#172033;box-shadow:3px 3px 0 #172033;font:800 13px/1 system-ui,sans-serif;text-decoration:none;'
    document.body.appendChild(badge)
  }

  window.OpenADA = window.OpenADA || {}
  window.OpenADA.init = init

  var currentScript = document.currentScript
  if (currentScript && currentScript.getAttribute('data-openada-auto') !== 'false') {
    init({
      apiBaseUrl: currentScript.getAttribute('data-openada-api') || defaults.apiBaseUrl,
      directoryUrl: currentScript.getAttribute('data-openada-directory') || defaults.directoryUrl
    })
  }
}())
