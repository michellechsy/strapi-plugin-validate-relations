'use strict'
const { Actions } = require('./consts')

const getRequestAction = (strapi) => {
  const ctx = strapi.requestContext.get()
  if (!ctx) {
    return
  }
  const method = ctx.request.method
  const path = ctx._matchedRoute
  switch(method.toLowerCase()) {
    case 'post':
      if (path.includes('content-manager')) {
        if (path.toLowerCase().includes('actions/publish')) {
          return Actions.publish
        }
      }
      break
    case 'put':
      if (path.includes('content-manager')) {
        return Actions.update
      }
      break
    default: 
      return
  }
}

module.exports = {
  getRequestAction
}
