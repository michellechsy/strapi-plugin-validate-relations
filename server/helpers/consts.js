const Actions = {
  update: 'update',
  publish: 'publish',
  unpublish: 'unpublish'
}

const pluginName = require('../../package.json').strapi.name
const errorMsg = 'There\'re DRAFT relations inside the data, please ensure they are PUBLISHED before publishing'

module.exports = {
  Actions,
  pluginName,
  errorMsg
}