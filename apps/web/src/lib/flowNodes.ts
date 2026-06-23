import type { FlowNode, FlowNodeType, GroupNodeData, MediaNodeData } from '@repo/shared'

export function createNodeId() {
  return `node-${crypto.randomUUID()}`
}

export function createDefaultNodeData(type: FlowNodeType, index: number): MediaNodeData | GroupNodeData {
  if (type === 'group') {
    return {
      title: `Series ${index}`,
      description: 'Drop works here to group them',
    }
  }

  const labels: Record<Exclude<FlowNodeType, 'group'>, string> = {
    book: 'Untitled Book',
    movie: 'Untitled Film',
    game: 'Untitled Game',
  }

  return {
    mediaType: type,
    title: `${labels[type]} ${index}`,
  }
}

export function defaultNodePosition(index: number) {
  return {
    x: 120 + index * 48,
    y: 100 + index * 36,
  }
}

export function createFlowNode(type: FlowNodeType, index: number, overrides?: Partial<FlowNode>): FlowNode {
  const node: FlowNode = {
    id: createNodeId(),
    type,
    position: defaultNodePosition(index),
    data: createDefaultNodeData(type, index),
    ...overrides,
  }

  if (type === 'group') {
    node.style = {
      width: '300px',
      height: '200px',
      ...(typeof overrides?.style === 'object' ? overrides.style : {}),
    }
  }

  return node
}

type VueFlowNodeLike = FlowNode & {
  computedPosition?: { x: number; y: number }
}

/** Strip Vue Flow internals and keep only serializable graph fields. */
export function toStoreNode(node: VueFlowNodeLike): FlowNode {
  return {
    id: node.id,
    type: node.type,
    position: {
      x: node.position?.x ?? node.computedPosition?.x ?? 0,
      y: node.position?.y ?? node.computedPosition?.y ?? 0,
    },
    data: node.data ? { ...node.data } : undefined,
    parentNode: node.parentNode,
    extent: node.extent,
    style: node.style ? { ...node.style } : undefined,
  }
}

export function toStoreNodes(nodes: VueFlowNodeLike[]) {
  return nodes.map(toStoreNode)
}
