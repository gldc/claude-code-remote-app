import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Line as SvgLine } from 'react-native-svg';
import { useColors, useThemedStyles, type ColorPalette, Spacing, FontSize, BorderRadius } from '../constants/theme';

interface DAGNode {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  dependsOn: string[];
}

interface DAGViewProps {
  nodes: DAGNode[];
  onNodePress?: (id: string) => void;
}

function assignLayers(nodes: DAGNode[]): Map<string, number> {
  const layers = new Map<string, number>();
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  function getLayer(id: string): number {
    if (layers.has(id)) return layers.get(id)!;
    const node = nodeMap.get(id);
    if (!node || node.dependsOn.length === 0) {
      layers.set(id, 0);
      return 0;
    }
    const maxParentLayer = Math.max(...node.dependsOn.map(dep => getLayer(dep)));
    const layer = maxParentLayer + 1;
    layers.set(id, layer);
    return layer;
  }

  nodes.forEach(n => getLayer(n.id));
  return layers;
}

const NODE_W = 100;
const NODE_H = 40;
const COL_GAP = 40;
const ROW_GAP = 20;

export const DAGView = React.memo(function DAGView({ nodes, onNodePress }: DAGViewProps) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);

  if (!nodes.length) return null;

  const layers = assignLayers(nodes);
  const maxLayer = Math.max(...layers.values(), 0);

  const layerGroups: DAGNode[][] = Array.from({ length: maxLayer + 1 }, () => []);
  nodes.forEach(n => {
    const layer = layers.get(n.id) ?? 0;
    layerGroups[layer].push(n);
  });

  const maxNodesInLayer = Math.max(...layerGroups.map(g => g.length), 1);
  const totalWidth = (maxLayer + 1) * (NODE_W + COL_GAP);
  const totalHeight = maxNodesInLayer * (NODE_H + ROW_GAP) + ROW_GAP;

  const positions = new Map<string, { x: number; y: number }>();
  layerGroups.forEach((group, layerIdx) => {
    group.forEach((node, rowIdx) => {
      const x = layerIdx * (NODE_W + COL_GAP) + COL_GAP / 2;
      const yOffset = (totalHeight - group.length * (NODE_H + ROW_GAP)) / 2;
      const y = yOffset + rowIdx * (NODE_H + ROW_GAP) + ROW_GAP / 2;
      positions.set(node.id, { x, y });
    });
  });

  const statusColors: Record<string, string> = {
    pending: colors.textMuted,
    running: colors.primary,
    completed: colors.success,
    error: colors.error,
  };

  const edges: { x1: number; y1: number; x2: number; y2: number }[] = [];
  nodes.forEach(node => {
    const to = positions.get(node.id);
    if (!to) return;
    node.dependsOn.forEach(depId => {
      const from = positions.get(depId);
      if (from) {
        edges.push({ x1: from.x + NODE_W, y1: from.y + NODE_H / 2, x2: to.x, y2: to.y + NODE_H / 2 });
      }
    });
  });

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
      <View style={{ width: totalWidth, height: totalHeight }}>
        <Svg width={totalWidth} height={totalHeight} style={StyleSheet.absoluteFill}>
          {edges.map((e, i) => (
            <SvgLine key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke={colors.cardBorder} strokeWidth={1.5} />
          ))}
        </Svg>
        {nodes.map(node => {
          const pos = positions.get(node.id);
          if (!pos) return null;
          const nodeColor = statusColors[node.status] || colors.textMuted;
          return (
            <TouchableOpacity
              key={node.id}
              style={[styles.node, { left: pos.x, top: pos.y, borderColor: nodeColor }]}
              activeOpacity={onNodePress ? 0.7 : 1}
              onPress={() => onNodePress?.(node.id)}
            >
              <View style={[styles.statusDot, { backgroundColor: nodeColor }]} />
              <Text style={styles.nodeLabel} numberOfLines={1}>{node.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
});

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  container: { minHeight: 80 },
  node: {
    position: 'absolute', width: NODE_W, height: NODE_H,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.sm, borderRadius: BorderRadius.sm,
    backgroundColor: c.card, borderWidth: 1.5,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  nodeLabel: { fontSize: FontSize.xs, color: c.text, flex: 1 },
});
