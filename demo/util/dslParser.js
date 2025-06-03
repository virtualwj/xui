// src/dslParser.js
import { parse } from '@vue/compiler-dom'

export function parseTemplateToJson(template) {
  const ast = parse(template)

  function transformNode(node) {
    if (node.type === 1) {
      const props = {}
      for (const prop of node.props) {
        if (prop.type === 6) {
          props[prop.name] = prop.value?.content
        } else if (prop.type === 7) {
          props[`@${prop.name}`] = prop.exp?.content
        }
      }

      return {
        type: node.tag,
        props,
        children: node.children.map(transformNode).filter(Boolean)
      }
    } else if (node.type === 2) {
      return node.content.trim() ? node.content : null
    }
    return null
  }

  const root = ast.children.map(transformNode).filter(Boolean)
  return root.length === 1 ? root[0] : { type: 'div', props: {}, children: root }
}