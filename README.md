# Strapi plugin Validate Relations for Publication

This plugin allows the validation of publication to check whether the relations are PUBLISHED.

# Installation

`npm install strapi-plugin-validate-relations`

`yarn add strapi-plugin-validate-relations`

## Good to know

The populate depth is calculated by strapi built-in capability (i.e. WYSIWYG). Deeper nested relations will not be validated if it's not explored by the `populate`. 
> e.g. the relation chain is: `Homepage` -> `Menu` -> `Link`, when editing `Homepage`, it will not validate if the `Link` connected to a `Menu` is DRAFT since the populate of `Homepage` will not include it, however, if the selected `Menu` is DRAFT, error will be returned. 

Currently the plugin will throw the validation error immediately when a DRAFT relation is found.

# Configuration
## Example configuration

`config/plugins.js`

```
module.exports = ({ env }) => ({
  'strapi-plugin-validate-relations': {
    enabled: true
  },
});
```

## Sample Validation Results
1. Publishing without required relation
![validation failure](public/images/validation%20failure.png)
2. Publishing with a DRAFT relation
![draft relation](public/images/draft%20relation%20not%20allowed.png)
3. Publishing with a published relation successfully
![successfully published](public/images/publish%20successfully.png)
