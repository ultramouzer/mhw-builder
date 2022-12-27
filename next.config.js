// next.config.js
const isProd = process.env.NODE_ENV === 'production'

module.exports = {
  assetPrefix: isProd ? '/your-github-repo-name/' : '',
  images: {
    loader: 'akamai',
    path: '',
  },
}