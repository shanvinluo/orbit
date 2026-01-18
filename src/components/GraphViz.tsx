'use client';

import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { GraphData, GraphNode, GraphEdge, EdgeType } from '@/types';
import SpriteText from 'three-spritetext';
import * as THREE from 'three';

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-slate-500 animate-pulse">Loading Constellations...</div>
});

interface Props {
  data: GraphData;
  onNodeClick: (node: GraphNode) => void;
  onLinkClick?: (link: GraphEdge, source: GraphNode, target: GraphNode) => void;
  onBackgroundClick?: () => void;
  highlightNodes: Set<string>;
  highlightEdges: Set<string>;
  focusedNodeId?: string;
  enabledEdgeTypes?: Set<EdgeType>;
  affectedCompanies?: Map<string, 'bullish' | 'bearish' | 'neutral' | 'mixed' | 'uncertain'>;
  pathMode?: boolean;
  watchlist?: Set<string>;
}

// Nebula color palette - celestial blues, cyans, warm oranges/golds
const STAR_COLORS = {
  blue: { core: '#ffffff', inner: '#60a5fa', outer: '#1e40af', glow: '#3b82f6' },
  cyan: { core: '#ffffff', inner: '#22d3ee', outer: '#0891b2', glow: '#06b6d4' },
  gold: { core: '#ffffff', inner: '#fbbf24', outer: '#b45309', glow: '#f59e0b' },
  orange: { core: '#ffffff', inner: '#fb923c', outer: '#c2410c', glow: '#f97316' },
  purple: { core: '#ffffff', inner: '#a78bfa', outer: '#6d28d9', glow: '#8b5cf6' },
  pink: { core: '#ffffff', inner: '#f472b6', outer: '#be185d', glow: '#ec4899' },
  green: { core: '#ffffff', inner: '#4ade80', outer: '#15803d', glow: '#22c55e' },
  red: { core: '#ffffff', inner: '#f87171', outer: '#b91c1c', glow: '#ef4444' },
};

const STAR_PALETTE = ['blue', 'cyan', 'gold', 'orange', 'purple', 'blue', 'cyan', 'gold'];

const NODE_COLOR_HIGHLIGHT = '#fbbf24';
const NODE_COLOR_SELECTED = '#fbbf24';

// Get star color palette based on node id
const getStarPalette = (nodeId: string) => {
  let hash = 0;
  for (let i = 0; i < nodeId.length; i++) {
    hash = nodeId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const paletteKey = STAR_PALETTE[Math.abs(hash) % STAR_PALETTE.length];
  return STAR_COLORS[paletteKey as keyof typeof STAR_COLORS];
};

const getNodeColor = (nodeId: string): string => {
  return getStarPalette(nodeId).glow;
};

// Density cloud calculation for milky effect
interface DensityPoint {
  x: number;
  y: number;
  z: number;
  density: number;
  color: THREE.Color;
}

// Calculate density at a point using Gaussian kernel
const calculateDensity = (
  point: THREE.Vector3,
  nodes: Array<{ x?: number; y?: number; z?: number; id: string }>,
  bandwidth: number
): { density: number; color: THREE.Color } => {
  let density = 0;
  const colorAccum = new THREE.Color(0, 0, 0);
  let colorWeight = 0;

  for (const node of nodes) {
    if (node.x === undefined) continue;
    
    const dx = point.x - (node.x || 0);
    const dy = point.y - (node.y || 0);
    const dz = point.z - (node.z || 0);
    const distSq = dx * dx + dy * dy + dz * dz;
    
    // Gaussian kernel
    const weight = Math.exp(-distSq / (2 * bandwidth * bandwidth));
    density += weight;
    
    // Accumulate color weighted by proximity
    if (weight > 0.01) {
      const palette = getStarPalette(node.id);
      const nodeColor = new THREE.Color(palette.glow);
      colorAccum.r += nodeColor.r * weight;
      colorAccum.g += nodeColor.g * weight;
      colorAccum.b += nodeColor.b * weight;
      colorWeight += weight;
    }
  }

  // Normalize color
  if (colorWeight > 0) {
    colorAccum.r /= colorWeight;
    colorAccum.g /= colorWeight;
    colorAccum.b /= colorWeight;
  }

  return { density, color: colorAccum };
};

// Generate density field sample points
const generateDensityField = (
  nodes: Array<{ x?: number; y?: number; z?: number; id: string }>,
  gridSize: number = 20,
  bandwidth: number = 50
): DensityPoint[] => {
  if (nodes.length === 0) return [];

  // Find bounding box of nodes
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  let validNodes = 0;

  for (const node of nodes) {
    if (node.x === undefined) continue;
    validNodes++;
    minX = Math.min(minX, node.x || 0);
    maxX = Math.max(maxX, node.x || 0);
    minY = Math.min(minY, node.y || 0);
    maxY = Math.max(maxY, node.y || 0);
    minZ = Math.min(minZ, node.z || 0);
    maxZ = Math.max(maxZ, node.z || 0);
  }

  if (validNodes < 3) return [];

  // Expand bounds slightly
  const padding = bandwidth * 2;
  minX -= padding; maxX += padding;
  minY -= padding; maxY += padding;
  minZ -= padding; maxZ += padding;

  const stepX = (maxX - minX) / gridSize;
  const stepY = (maxY - minY) / gridSize;
  const stepZ = (maxZ - minZ) / gridSize;

  const densityPoints: DensityPoint[] = [];

  // Sample density at grid points
  for (let ix = 0; ix <= gridSize; ix++) {
    for (let iy = 0; iy <= gridSize; iy++) {
      for (let iz = 0; iz <= gridSize; iz++) {
        const x = minX + ix * stepX;
        const y = minY + iy * stepY;
        const z = minZ + iz * stepZ;
        
        const { density, color } = calculateDensity(
          new THREE.Vector3(x, y, z),
          nodes,
          bandwidth
        );
        
        // Very low threshold for maximum cloud coverage
        if (density > 0.1) {
          densityPoints.push({ x, y, z, density, color });
        }
      }
    }
  }

  return densityPoints;
};

export default function GraphViz({ data, onNodeClick, onLinkClick, onBackgroundClick, highlightNodes, highlightEdges, focusedNodeId, enabledEdgeTypes, affectedCompanies, pathMode = false, watchlist }: Props) {
  const fgRef = useRef<any>(null);
  const [cameraPosition, setCameraPosition] = useState<THREE.Vector3>(new THREE.Vector3(0, 0, 1000));
  const densityUpdateTimer = useRef<NodeJS.Timeout | null>(null);

  // Filter graph data based on enabled edge types, path mode, and watchlist
  const filteredData = useMemo(() => {
    let filteredLinks = data.links;
    let filteredNodes = data.nodes;
    
    // First filter by watchlist if active
    if (watchlist && watchlist.size > 0) {
      filteredNodes = filteredNodes.filter(node => watchlist.has(node.id));
      
      // Only include edges between watchlist nodes
      filteredLinks = filteredLinks.filter(link => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        return watchlist.has(sourceId) && watchlist.has(targetId);
      });
    }
    
    // Then filter by enabled edge types
    if (enabledEdgeTypes) {
      filteredLinks = filteredLinks.filter(link => enabledEdgeTypes.has(link.type));
    }
    
    if (pathMode && highlightNodes.size > 0) {
      filteredNodes = filteredNodes.filter(node => highlightNodes.has(node.id));
      filteredLinks = filteredLinks.filter(link => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        const edgeId = `${sourceId}-${targetId}`;
        const reverseEdgeId = `${targetId}-${sourceId}`;
        return highlightEdges.has(edgeId) || highlightEdges.has(reverseEdgeId);
      });
    }
    
    return {
      nodes: filteredNodes,
      links: filteredLinks
    };
  }, [data, enabledEdgeTypes, pathMode, highlightNodes, highlightEdges, watchlist]);

  // Track camera
  useEffect(() => {
    if (!fgRef.current) return;
    const updateCameraPosition = () => {
      const camera = fgRef.current.camera();
      if (camera) {
        setCameraPosition(new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z));
      }
    };
    const interval = setInterval(updateCameraPosition, 100);
    return () => clearInterval(interval);
  }, []);

  // Setup nebula scene
  useEffect(() => {
    if (!fgRef.current) return;

    const scene = fgRef.current.scene();
    const renderer = fgRef.current.renderer();
    
    if (scene) {
      // Deep space fog
      scene.fog = new THREE.FogExp2(0x000008, 0.0008);
      
      // Soft ambient light
      const ambientLight = new THREE.AmbientLight(0x1a1a2e, 0.3);
      scene.add(ambientLight);
      
      // Warm directional light (galactic core)
      const sunLight = new THREE.DirectionalLight(0xffd93d, 0.3);
      sunLight.position.set(100, 200, 100);
      scene.add(sunLight);
      
      // Cool rim light
      const rimLight = new THREE.DirectionalLight(0x4fc3f7, 0.2);
      rimLight.position.set(-100, -50, -100);
      scene.add(rimLight);
      
      // Nebula point lights
      const nebulaLight1 = new THREE.PointLight(0x60a5fa, 0.6, 800);
      nebulaLight1.position.set(0, 100, 0);
      scene.add(nebulaLight1);
      
      const nebulaLight2 = new THREE.PointLight(0xfbbf24, 0.4, 600);
      nebulaLight2.position.set(-200, -100, 100);
      scene.add(nebulaLight2);
      
      const nebulaLight3 = new THREE.PointLight(0xa78bfa, 0.3, 500);
      nebulaLight3.position.set(150, 50, -150);
      scene.add(nebulaLight3);
      
      if (renderer) {
        renderer.setClearColor(0x000008, 1);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
      }
      
      // Background star field
      const starGeometry = new THREE.BufferGeometry();
      const starCount = 8000;
      const positions = new Float32Array(starCount * 3);
      const colors = new Float32Array(starCount * 3);
      const sizes = new Float32Array(starCount);
      
      for (let i = 0; i < starCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 5000;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 5000;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 5000;
        
        // Random star colors (blue, white, gold)
        const colorChoice = Math.random();
        if (colorChoice < 0.5) {
          colors[i * 3] = 0.8; colors[i * 3 + 1] = 0.9; colors[i * 3 + 2] = 1.0; // Blue-white
        } else if (colorChoice < 0.8) {
          colors[i * 3] = 1.0; colors[i * 3 + 1] = 1.0; colors[i * 3 + 2] = 1.0; // White
        } else {
          colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.9; colors[i * 3 + 2] = 0.6; // Gold
        }
        
        sizes[i] = Math.random() * 1.5 + 0.3;
      }
      
      starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      
      const starMaterial = new THREE.PointsMaterial({
        size: 1,
        vertexColors: true,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      });
      
      const stars = new THREE.Points(starGeometry, starMaterial);
      scene.add(stars);
      
      // Nebula dust clouds
      const dustGeometry = new THREE.BufferGeometry();
      const dustCount = 3000;
      const dustPositions = new Float32Array(dustCount * 3);
      const dustColors = new Float32Array(dustCount * 3);
      
      for (let i = 0; i < dustCount; i++) {
        const radius = Math.random() * 1500 + 200;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        dustPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        dustPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.3;
        dustPositions[i * 3 + 2] = radius * Math.cos(phi);
        
        // Nebula colors - mix of blue and orange
        const colorMix = Math.random();
        if (colorMix < 0.4) {
          dustColors[i * 3] = 0.2; dustColors[i * 3 + 1] = 0.4; dustColors[i * 3 + 2] = 0.8; // Blue
        } else if (colorMix < 0.7) {
          dustColors[i * 3] = 0.9; dustColors[i * 3 + 1] = 0.5; dustColors[i * 3 + 2] = 0.2; // Orange
        } else {
          dustColors[i * 3] = 0.6; dustColors[i * 3 + 1] = 0.3; dustColors[i * 3 + 2] = 0.7; // Purple
        }
      }
      
      dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
      dustGeometry.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));
      
      const dustMaterial = new THREE.PointsMaterial({
        size: 4,
        vertexColors: true,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      });
      
      const dust = new THREE.Points(dustGeometry, dustMaterial);
      scene.add(dust);
    }

    if (fgRef.current) {
      fgRef.current.d3Force('charge').strength(-80);
    }
  }, []);

  // Store all milky cloud layers for cleanup
  const milkyLayersRef = useRef<THREE.Points[]>([]);

  // Create and update ULTRA milky density clouds
  useEffect(() => {
    if (!fgRef.current) return;
    
    const scene = fgRef.current.scene();
    if (!scene) return;

    const updateMilkyCloud = () => {
      // Remove all existing cloud layers
      for (const layer of milkyLayersRef.current) {
        scene.remove(layer);
        layer.geometry.dispose();
        if (layer.material instanceof THREE.Material) {
          layer.material.dispose();
        }
      }
      milkyLayersRef.current = [];

      // Get current node positions from the graph
      const nodes = filteredData.nodes as Array<{ x?: number; y?: number; z?: number; id: string }>;
      
      // Generate density field - larger bandwidth and finer grid for smooth, thick clouds
      const densityPoints = generateDensityField(nodes, 35, 100);
      
      if (densityPoints.length === 0) return;

      // Find max density for normalization
      const maxDensity = Math.max(...densityPoints.map(p => p.density));
      
      // Helper to create a cloud layer
      const createCloudLayer = (
        particleMultiplier: number,
        scatter: number,
        size: number,
        opacity: number,
        colorMult: number,
        whiteMix: number,
        renderOrder: number
      ) => {
        const count = Math.floor(densityPoints.length * particleMultiplier);
        const pos = new Float32Array(count * 3);
        const col = new Float32Array(count * 3);
        
        for (let i = 0; i < count; i++) {
          const point = densityPoints[i % densityPoints.length];
          const normalizedDensity = point.density / maxDensity;
          const dynamicScatter = scatter * (1 - normalizedDensity * 0.3);
          
          pos[i * 3] = point.x + (Math.random() - 0.5) * dynamicScatter;
          pos[i * 3 + 1] = point.y + (Math.random() - 0.5) * dynamicScatter;
          pos[i * 3 + 2] = point.z + (Math.random() - 0.5) * dynamicScatter;
          
          // Mix original color with white for milky effect
          const variation = 0.8 + Math.random() * 0.4;
          col[i * 3] = Math.min(1, point.color.r * colorMult * variation + whiteMix);
          col[i * 3 + 1] = Math.min(1, point.color.g * colorMult * variation + whiteMix);
          col[i * 3 + 2] = Math.min(1, point.color.b * colorMult * variation + whiteMix);
        }
        
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
        
        const mat = new THREE.PointsMaterial({
          size,
          vertexColors: true,
          transparent: true,
          opacity,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          sizeAttenuation: true,
        });
        
        const cloud = new THREE.Points(geo, mat);
        cloud.renderOrder = renderOrder;
        scene.add(cloud);
        milkyLayersRef.current.push(cloud);
      };

      // === LAYER 1: Ultra-fine dense core particles ===
      createCloudLayer(120, 15, 40, 1.0, 1.3, 0.15, -0.5);
      
      // === LAYER 2: Dense inner cloud ===
      createCloudLayer(100, 25, 60, 1.0, 1.1, 0.18, -1);
      
      // === LAYER 3: Medium cloud layer ===
      createCloudLayer(90, 45, 90, 0.9, 1.0, 0.22, -2);
      
      // === LAYER 4: Soft diffuse cloud ===
      createCloudLayer(80, 70, 130, 0.8, 0.9, 0.26, -3);
      
      // === LAYER 5: Large fluffy cloud ===
      createCloudLayer(70, 100, 180, 0.7, 0.8, 0.3, -4);
      
      // === LAYER 6: Massive outer haze ===
      createCloudLayer(60, 140, 250, 0.55, 0.7, 0.35, -5);
      
      // === LAYER 7: Ultra-wide atmospheric glow ===
      createCloudLayer(50, 200, 350, 0.4, 0.6, 0.4, -6);
      
      // === LAYER 8: Extreme outer envelope ===
      createCloudLayer(40, 280, 500, 0.3, 0.5, 0.45, -7);
      
      // === LAYER 9: Extra diffuse cloud ===
      createCloudLayer(35, 350, 600, 0.2, 0.4, 0.5, -8);
      
      // === LAYER 10: Atmospheric mist ===
      createCloudLayer(30, 450, 750, 0.15, 0.35, 0.55, -9);
      
      // === LAYER 9: Bright white milky highlights ===
      const whiteCount = Math.floor(densityPoints.length * 20);
      const whitePos = new Float32Array(whiteCount * 3);
      const whiteCol = new Float32Array(whiteCount * 3);
      
      // Sort by density and only use top 40%
      const sorted = [...densityPoints].sort((a, b) => b.density - a.density);
      const topPoints = sorted.slice(0, Math.floor(sorted.length * 0.4));
      
      for (let i = 0; i < whiteCount; i++) {
        const point = topPoints[i % topPoints.length];
        const normalizedDensity = point.density / maxDensity;
        
        whitePos[i * 3] = point.x + (Math.random() - 0.5) * 40;
        whitePos[i * 3 + 1] = point.y + (Math.random() - 0.5) * 40;
        whitePos[i * 3 + 2] = point.z + (Math.random() - 0.5) * 40;
        
        // Bright white/cream color with hint of original
        const whiteness = 0.7 + normalizedDensity * 0.3;
        whiteCol[i * 3] = Math.min(1, whiteness + point.color.r * 0.2);
        whiteCol[i * 3 + 1] = Math.min(1, whiteness + point.color.g * 0.15);
        whiteCol[i * 3 + 2] = Math.min(1, whiteness + point.color.b * 0.1);
      }
      
      const whiteGeo = new THREE.BufferGeometry();
      whiteGeo.setAttribute('position', new THREE.BufferAttribute(whitePos, 3));
      whiteGeo.setAttribute('color', new THREE.BufferAttribute(whiteCol, 3));
      
      const whiteMat = new THREE.PointsMaterial({
        size: 55,
        vertexColors: true,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      });
      
      const whiteCloud = new THREE.Points(whiteGeo, whiteMat);
      whiteCloud.renderOrder = -0.3;
      scene.add(whiteCloud);
      milkyLayersRef.current.push(whiteCloud);
      
      // === LAYER 10: Glowing hot cores at densest points ===
      const coreCount = Math.floor(topPoints.length * 8);
      const corePos = new Float32Array(coreCount * 3);
      const coreCol = new Float32Array(coreCount * 3);
      
      for (let i = 0; i < coreCount; i++) {
        const point = topPoints[Math.floor(i / 8)];
        
        corePos[i * 3] = point.x + (Math.random() - 0.5) * 25;
        corePos[i * 3 + 1] = point.y + (Math.random() - 0.5) * 25;
        corePos[i * 3 + 2] = point.z + (Math.random() - 0.5) * 25;
        
        // Intensified original color
        coreCol[i * 3] = Math.min(1, point.color.r * 1.5 + 0.2);
        coreCol[i * 3 + 1] = Math.min(1, point.color.g * 1.5 + 0.2);
        coreCol[i * 3 + 2] = Math.min(1, point.color.b * 1.5 + 0.2);
      }
      
      const coreGeo = new THREE.BufferGeometry();
      coreGeo.setAttribute('position', new THREE.BufferAttribute(corePos, 3));
      coreGeo.setAttribute('color', new THREE.BufferAttribute(coreCol, 3));
      
      const coreMat = new THREE.PointsMaterial({
        size: 80,
        vertexColors: true,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      });
      
      const coreCloud = new THREE.Points(coreGeo, coreMat);
      coreCloud.renderOrder = -0.1;
      scene.add(coreCloud);
      milkyLayersRef.current.push(coreCloud);
    };

    // Initial delay to let nodes settle
    const initialTimer = setTimeout(() => {
      updateMilkyCloud();
      
      // Update periodically as nodes move
      densityUpdateTimer.current = setInterval(updateMilkyCloud, 2500);
    }, 1200);

    return () => {
      clearTimeout(initialTimer);
      if (densityUpdateTimer.current) {
        clearInterval(densityUpdateTimer.current);
      }
      // Clean up all layers
      if (fgRef.current) {
        const scene = fgRef.current.scene();
        if (scene) {
          for (const layer of milkyLayersRef.current) {
            scene.remove(layer);
            layer.geometry.dispose();
            if (layer.material instanceof THREE.Material) {
              layer.material.dispose();
            }
          }
        }
      }
      milkyLayersRef.current = [];
    };
  }, [filteredData.nodes]);

  // Store original positions for restoring when deselecting
  const originalPositions = useRef<Map<string, {x: number, y: number, z: number}>>(new Map());

  // Zoom to focused node and push other nodes to the sides
  useEffect(() => {
    if (!fgRef.current) return;
    
    if (focusedNodeId) {
        const node = filteredData.nodes.find(n => n.id === focusedNodeId) || data.nodes.find(n => n.id === focusedNodeId);
        if (node && typeof node.x === 'number') {
            const centerX = node.x || 0;
            const centerY = node.y || 0;
            const centerZ = node.z || 0;
            
            // Save original positions and move nodes directly (no simulation)
            filteredData.nodes.forEach((n: any) => {
              // Store original position if not already stored
              if (!originalPositions.current.has(n.id)) {
                originalPositions.current.set(n.id, {
                  x: n.x || 0,
                  y: n.y || 0,
                  z: n.z || 0
                });
              }
              
              if (n.id === focusedNodeId) {
                // Fix focused node in place
                n.fx = centerX;
                n.fy = centerY;
                n.fz = centerZ;
                return;
              }
              
              // Calculate direction from focused node to this node
              const dx = (n.x || 0) - centerX;
              const dy = (n.y || 0) - centerY;
              const dz = (n.z || 0) - centerZ;
              const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
              
              // Push nodes outward to minimum distance
              const minDistance = 250;
              if (dist < minDistance) {
                const pushAmount = minDistance - dist;
                const newX = (n.x || 0) + (dx / dist) * pushAmount;
                const newY = (n.y || 0) + (dy / dist) * pushAmount;
                const newZ = (n.z || 0) + (dz / dist) * pushAmount;
                
                // Fix nodes at their new pushed positions (stops wiggling)
                n.fx = newX;
                n.fy = newY;
                n.fz = newZ;
              } else {
                // Fix nodes that don't need pushing at their current positions
                n.fx = n.x;
                n.fy = n.y;
                n.fz = n.z;
              }
            });
            
            // Zoom camera to the focused node
            const nodePos = new THREE.Vector3(centerX, centerY, centerZ);
            const distance = 300;
            const direction = new THREE.Vector3(0.3, 0.5, 0.8).normalize();
            const cameraOffset = direction.multiplyScalar(distance);
            const cameraPos = nodePos.clone().add(cameraOffset);
            
            fgRef.current.cameraPosition(
                { x: cameraPos.x, y: cameraPos.y, z: cameraPos.z },
                node as any,
                1500
            );
        }
    } else {
        // When no node is focused, restore original positions and unfix all nodes
        filteredData.nodes.forEach((n: any) => {
          const original = originalPositions.current.get(n.id);
          if (original) {
            n.x = original.x;
            n.y = original.y;
            n.z = original.z;
          }
          n.fx = undefined;
          n.fy = undefined;
          n.fz = undefined;
        });
        
        // Clear stored positions
        originalPositions.current.clear();
        
        // Gentle reheat to let nodes settle naturally
        if (fgRef.current.d3ReheatSimulation) {
          fgRef.current.d3ReheatSimulation();
        }
    }
  }, [focusedNodeId, data.nodes, filteredData]);

  // Create glowing star mesh
  const createStarMesh = useCallback((node: any, isSelected: boolean, isHighlighted: boolean) => {
    const group = new THREE.Group();
    
    // Get color palette for this star
    let palette = getStarPalette(node.id);
    
    // Override for affected companies
    if (affectedCompanies?.has(node.id)) {
      const impact = affectedCompanies.get(node.id);
      if (impact === 'bullish') palette = STAR_COLORS.green;
      else if (impact === 'bearish') palette = STAR_COLORS.red;
      else if (impact === 'mixed') palette = STAR_COLORS.gold;
    }
    
    // Sizes based on state
    const baseSize = isSelected ? 3 : isHighlighted ? 2.5 : 1.2;
    
    // Layer 1: Outer glow (largest, most transparent)
    const outerGlowGeometry = new THREE.SphereGeometry(baseSize * 8, 16, 16);
    const outerGlowMaterial = new THREE.MeshBasicMaterial({
      color: palette.outer,
      transparent: true,
      opacity: isSelected ? 0.15 : isHighlighted ? 0.12 : 0.06,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
    group.add(outerGlow);
    
    // Layer 2: Middle glow
    const midGlowGeometry = new THREE.SphereGeometry(baseSize * 4, 16, 16);
    const midGlowMaterial = new THREE.MeshBasicMaterial({
      color: palette.glow,
      transparent: true,
      opacity: isSelected ? 0.3 : isHighlighted ? 0.25 : 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const midGlow = new THREE.Mesh(midGlowGeometry, midGlowMaterial);
    group.add(midGlow);
    
    // Layer 3: Inner glow
    const innerGlowGeometry = new THREE.SphereGeometry(baseSize * 2, 16, 16);
    const innerGlowMaterial = new THREE.MeshBasicMaterial({
      color: palette.inner,
      transparent: true,
      opacity: isSelected ? 0.6 : isHighlighted ? 0.5 : 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const innerGlow = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
    group.add(innerGlow);
    
    // Layer 4: Bright core
    const coreGeometry = new THREE.SphereGeometry(baseSize, 12, 12);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: palette.core,
      transparent: true,
      opacity: 1,
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);
    
    // Layer 5: Star flare/spikes (for highlighted/selected)
    if (isSelected || isHighlighted) {
      // Horizontal spike
      const spikeGeometry = new THREE.PlaneGeometry(baseSize * 20, baseSize * 0.8);
      const spikeMaterial = new THREE.MeshBasicMaterial({
        color: palette.core,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const spike1 = new THREE.Mesh(spikeGeometry, spikeMaterial);
      group.add(spike1);
      
      // Vertical spike
      const spike2 = new THREE.Mesh(spikeGeometry, spikeMaterial);
      spike2.rotation.z = Math.PI / 2;
      group.add(spike2);
      
      // Diagonal spikes
      const spike3 = new THREE.Mesh(spikeGeometry, spikeMaterial.clone());
      spike3.material.opacity = 0.2;
      spike3.rotation.z = Math.PI / 4;
      group.add(spike3);
      
      const spike4 = new THREE.Mesh(spikeGeometry, spikeMaterial.clone());
      spike4.material.opacity = 0.2;
      spike4.rotation.z = -Math.PI / 4;
      group.add(spike4);
    }
    
    // Label for selected/highlighted
    if (isSelected || isHighlighted) {
      const sprite = new SpriteText(node.label);
      sprite.color = '#ffffff';
      sprite.textHeight = 5;
      sprite.padding = 1.5;
      sprite.backgroundColor = 'rgba(0, 0, 20, 0.85)';
      sprite.borderRadius = 3;
      sprite.fontFace = 'Arial';
      sprite.fontWeight = '600';
      sprite.position.set(0, baseSize * 12, 0);
      group.add(sprite);
    }
    
    return group;
  }, [affectedCompanies]);

  return (
    <div className="w-full h-full">
      {/* @ts-ignore */}
      <ForceGraph3D
        ref={fgRef}
        graphData={filteredData}
        nodeLabel=""
        nodeColor={(node: any) => getNodeColor(node.id)}
        nodeVal={() => 0.5}
        nodeResolution={8}
        nodeOpacity={0}
        linkColor={(link: any) => {
          const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
          const targetId = typeof link.target === 'object' ? link.target.id : link.target;
          const id = `${sourceId}-${targetId}`;
          const reverseId = `${targetId}-${sourceId}`;
          
          const isHighlighted = highlightEdges.has(id) || highlightEdges.has(reverseId);
          if (isHighlighted) return 'rgba(255, 220, 100, 0.9)';
          
          if (highlightNodes.size > 0) {
            const sourceHighlighted = highlightNodes.has(sourceId);
            const targetHighlighted = highlightNodes.has(targetId);
            if (sourceHighlighted || targetHighlighted) return 'rgba(100, 150, 200, 0.05)';
          }
          
          // Subtle constellation lines
          const sourceColor = getStarPalette(sourceId);
          const targetColor = getStarPalette(targetId);
          
          // Blend colors - use the warmer tone
          if (sourceColor === STAR_COLORS.gold || targetColor === STAR_COLORS.gold) {
            return 'rgba(251, 191, 36, 0.12)';
          } else if (sourceColor === STAR_COLORS.orange || targetColor === STAR_COLORS.orange) {
            return 'rgba(249, 115, 22, 0.12)';
          }
          return 'rgba(96, 165, 250, 0.1)';
        }}
        linkWidth={(link: any) => {
          const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
          const targetId = typeof link.target === 'object' ? link.target.id : link.target;
          const id = `${sourceId}-${targetId}`;
          const reverseId = `${targetId}-${sourceId}`;
          const isHighlighted = highlightEdges.has(id) || highlightEdges.has(reverseId);
          return isHighlighted ? 2.5 : 0.3;
        }}
        linkOpacity={(link: any) => {
          const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
          const targetId = typeof link.target === 'object' ? link.target.id : link.target;
          const id = `${sourceId}-${targetId}`;
          const reverseId = `${targetId}-${sourceId}`;
          const isHighlighted = highlightEdges.has(id) || highlightEdges.has(reverseId);
          
          if (isHighlighted) return 1;
          if (highlightNodes.size > 0) {
            const sourceHighlighted = highlightNodes.has(sourceId);
            const targetHighlighted = highlightNodes.has(targetId);
            if (sourceHighlighted || targetHighlighted) return 0.03;
          }
          return 0.15;
        }}
        onNodeClick={(node) => onNodeClick(node as GraphNode)}
        onLinkClick={(link) => {
          if (onLinkClick) {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            let sourceNode = filteredData.nodes.find(n => n.id === sourceId) || data.nodes.find(n => n.id === sourceId);
            let targetNode = filteredData.nodes.find(n => n.id === targetId) || data.nodes.find(n => n.id === targetId);
            if (sourceNode && targetNode) {
              const edge: GraphEdge = {
                source: sourceId,
                target: targetId,
                type: link.type || EdgeType.Partnership,
                description: link.description,
                data: link.data
              };
              onLinkClick(edge, sourceNode, targetNode);
            }
          }
        }}
        onBackgroundClick={onBackgroundClick}
        nodeThreeObjectExtend={false}
        nodeThreeObject={(node: any) => {
          const isSelected = focusedNodeId === node.id;
          const isHighlighted = highlightNodes.has(node.id);
          return createStarMesh(node, isSelected, isHighlighted);
        }}
        backgroundColor="#000008"
        showNavInfo={false}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        maxZoom={800}
        minZoom={0.1}
      />
    </div>
  );
}
