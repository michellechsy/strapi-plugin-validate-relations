const lodash = require('lodash')
const utils = require('@strapi/utils')
const { Actions, errorMsg } = require('./consts')
const ctxHandler = require('./ctxHandler')

const { ValidationError, NotFoundError } = utils.errors
const ignoreFields = ['createdBy', 'updatedBy', 'versions']

/**
 * Validate whether the relations are published when publishing an entry, incl. the update after the entry is published
 * Note: the depth of nested relations will rely on the built-in populate from Strapi.
 * 
 * @param {*} strapi 
 * @param {*} event the API request event
 * @throws Validation Error once there's a DRAFT relation is detected
 */
const validatePublication = async (strapi, event) => {
  const requestAction = ctxHandler.getRequestAction(strapi)
  if (!requestAction) {
    return
  }

  const { model, params = {} } = event
  const { data, populate, where } = params
  if (!populate) {
    return
  }
  // validate relations before publishing
  const item = await queryEntry({ strapi, uid: model.uid, where, populate })
  switch(requestAction) {
    case Actions.publish:
      validatePopulation({ strapi, data: item, populate })
      break
    case Actions.update:
      if (item.publishedAt) {
        await validateUpdateAfterPublished({ strapi, data, populate, attributes: model.attributes, dbRecord: item })
      }
      break
    default:
      // do nothing
  }
}

const queryEntry = async ({ strapi, uid, where, populate }) => {
  const item = await strapi.db.query(uid).findOne({
    where, populate
  })

  return item
}

/**
 * Updating a published entry should validate whether the to-be-update relations are published.
 * @param {*} strapi 
 * @param {*} data to be updated record
 * @param {*} populate relations of the `field`
 * @param {*} model 
 * @returns 
 */
const validateUpdateAfterPublished = async ({ strapi, data, populate, attributes, dbRecord }) => {
  if (Array.isArray(populate)) {
    // medias in the populate will be like `populate: ['folder']`, which won't have publishedAt
    return
  }

  await validateInput({ strapi, data, populate, attributes })
  await validatePopulation({ strapi, data: dbRecord, populate })
}

const validateInput = async ({ strapi, data, populate, attributes }) => {
  for (const field of Object.keys(populate)) {
    if (ignoreFields.includes(field)) {
      continue
    } 
    const popField = getPopulateFieldValue(populate, field)
    const { target } = lodash.get(attributes, field)
    const fieldValue = data[field]
    let relations = []
    if (Array.isArray(fieldValue) && fieldValue.length > 0) {
      relations = fieldValue
    } else if (lodash.get(fieldValue, 'connect', []).length > 0) {
      relations = fieldValue.connect
    }
    
    for (const relation of relations) {
      const relationData = await queryEntry({
        strapi,
        uid: target,
        where: { id: relation.id },
        populate: popField
      })
      
      if (!relationData) {
        throw new NotFoundError(`data ${fieldValue.id} of relation "${field}" inside the entry is not found`)
      }
      
      validatePublishedAt(relationData, field)
      validatePopulation({ data: relationData, populate: popField })
    }
  }
}

const validatePopulation = ({ data, populate, pathIndex = ''}) => {
  if (!data || !populate) {
    return
  }
  if (Array.isArray(data)) {
    data.forEach((item, i) => validate({
      data: item, 
      populate, 
      index: getPathIndex(pathIndex, i+1)
    }))
  } else {
    validate({ data, populate, index: pathIndex })
  }
}

const validate = ({ data, populate, index }) => {
  if (!data || Array.isArray(populate)) {
    // medias in the populate will be like `populate: ['folder']`, which won't have publishedAt
    return
  }

  Object.keys(populate).forEach(field => {
    if (ignoreFields.includes(field)) {
      return
    } 
    const popField = getPopulateFieldValue(populate, field)
    const pathIndex = getPathIndex(index, field)

    if (typeof popField !== 'boolean') {
      return validatePopulation({
        data: data[field], 
        populate: popField, 
        pathIndex 
      })
    } else {
      const item = data[field]
      if (Array.isArray(item)) {
        item.forEach((rel, i) => validatePublishedAt(rel, `${pathIndex}.${i+1}`))
      } else {
        validatePublishedAt(item, pathIndex)
      }
    }
  })
}

const validatePublishedAt = (item, pathIndex) => {
  // only validate when the item has value
  if (item && item.publishedAt !== undefined && !item.publishedAt) {
    throw new ValidationError(`${errorMsg}: ${pathIndex}`)
  }
}

const getPopulateFieldValue = (populate = {}, field) => {
  return typeof populate[field] !== 'boolean'
    ? lodash.get(populate, `${field}.populate`)
    : populate[field]
}

const getPathIndex = (path, index) => {
  return `${path ? path + '.': ''}${index}`
}

module.exports = {
  validatePublication
}
