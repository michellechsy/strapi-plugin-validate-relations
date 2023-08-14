'use strict';
const { validatePublication } = require('./helpers/publication')

module.exports = ({ strapi }) => {
  strapi.db.lifecycles.subscribe(async (event) => {
    if (event.action === 'beforeUpdate') {
      await validatePublication(strapi, event)
    }
  })
};
