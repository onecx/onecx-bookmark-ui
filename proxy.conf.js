const onProxyRes = function (proxyRes, req, res) {
  if (req.method.toUpperCase() === 'OPTIONS') {
    res.setHeader('Allow', 'GET, POST, HEAD, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', '*')
    res.setHeader('Access-Control-Allow-Headers', '*')
    return res.send('')
  }
}

const PROXY_CONFIG = {
  '/bff': {
    target: 'http://onecx-bookmark-bff',
    secure: false,
    pathRewrite: {
      '^.*/bff': ''
    },
    changeOrigin: true,
    logLevel: 'debug',
    onProxyRes
  }
}

module.exports = PROXY_CONFIG
