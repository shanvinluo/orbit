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
  affectedCompanies?: Map<string, 'positive' | 'negative' | 'neutral' | 'mixed' | 'uncertain'>;
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
  const [cameraPosition, setCameraPosition] = useState<THREE.Vector3>(new THREE.Vector3(0, 0, 5000));
  const initialCameraSetRef = useRef(false);
  const densityUpdateTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const graphReadyRef = useRef(false);
  const cloudsReadyRef = useRef(false);

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

  // Check if everything is loaded
  useEffect(() => {
    if (graphReadyRef.current && cloudsReadyRef.current && isLoading) {
      // Small delay to ensure smooth transition
      setTimeout(() => setIsLoading(false), 200);
    }
  }, [isLoading, loadingProgress]);
  
  // Set initial zoomed out camera position
  useEffect(() => {
    if (!fgRef.current || initialCameraSetRef.current) return;
    
    const setInitialCamera = () => {
      if (fgRef.current && !initialCameraSetRef.current) {
        fgRef.current.cameraPosition({ x: 0, y: 0, z: 5000 }, { x: 0, y: 0, z: 0 }, 0);
        initialCameraSetRef.current = true;
      }
    };
    
    // Try immediately and after a short delay
    setInitialCamera();
    const timer = setTimeout(setInitialCamera, 500);
    return () => clearTimeout(timer);
  }, []);
  
  // Track when graph nodes have positions
  useEffect(() => {
    if (graphReadyRef.current) return;
    
    const checkGraphReady = () => {
      const nodes = filteredData.nodes as Array<{ x?: number; y?: number; z?: number }>;
      const validNodes = nodes.filter(n => n.x !== undefined);
      
      if (validNodes.length >= 2) {
        graphReadyRef.current = true;
        setLoadingProgress(prev => Math.max(prev, 50));
      } else {
        setTimeout(checkGraphReady, 100);
      }
    };
    
    checkGraphReady();
  }, [filteredData.nodes]);
  
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
  const milkyLayersRef = useRef<THREE.Object3D[]>([]);
  const cloudTextureRef = useRef<THREE.CanvasTexture | null>(null);
  
  // Create a VERY BRIGHT circular cloud texture
  const getCloudTexture = useCallback((): THREE.CanvasTexture => {
    if (cloudTextureRef.current) return cloudTextureRef.current;
    
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    
    // VERY bright gradient - stays opaque longer
    const gradient = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    );
    
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.5)');
    gradient.addColorStop(0.85, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    cloudTextureRef.current = texture;
    return texture;
  }, []);

  // Track if clouds have been created
  const cloudsCreatedRef = useRef(false);
  
  // Create POINT CLOUD based milky nebula effect - ONCE only
  useEffect(() => {
    let mounted = true;
    
    // Skip if clouds already exist
    if (cloudsCreatedRef.current && milkyLayersRef.current.length > 0) {
      return;
    }
    
    const waitForScene = () => {
      if (!mounted) return;
      
      if (!fgRef.current) {
        setTimeout(waitForScene, 200);
        return;
      }
      
      const scene = fgRef.current.scene?.();
      if (!scene) {
        setTimeout(waitForScene, 200);
        return;
      }
      
      // Wait for nodes to have positions
      const nodes = filteredData.nodes as Array<{ x?: number; y?: number; z?: number; id: string }>;
      const validNodes = nodes.filter(n => n.x !== undefined);
      if (validNodes.length < 2) {
        setTimeout(waitForScene, 300);
        return;
      }
      
      console.log('Scene ready, creating clouds once...');
      createClouds(scene, validNodes);
    };
    
    const createClouds = (scene: THREE.Scene, validNodes: Array<{ x?: number; y?: number; z?: number; id: string }>) => {
      if (cloudsCreatedRef.current) return;
      cloudsCreatedRef.current = true;
      
      // Get cloud texture
      const cloudTexture = getCloudTexture();
      
      // Gaussian random for natural distribution around each node
      const gaussianRandom = () => {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
      };

      // Create cloud particles ONLY around actual nodes
      const createNodeCenteredCloud = (
        particlesPerNode: number,
        particleSize: number,
        opacity: number,
        radius: number // How far particles spread from each node
      ) => {
        const totalParticles = validNodes.length * particlesPerNode;
        const positions = new Float32Array(totalParticles * 3);
        const colors = new Float32Array(totalParticles * 3);
        
        let particleIndex = 0;
        
        for (const node of validNodes) {
          const nodeX = node.x || 0;
          const nodeY = node.y || 0;
          const nodeZ = node.z || 0;
          
          // Get this node's color
          const palette = getStarPalette(node.id);
          const nodeColor = new THREE.Color(palette.glow);
          
          // Create particles around this node
          for (let i = 0; i < particlesPerNode; i++) {
            // Gaussian distribution around the node position
            const offsetX = gaussianRandom() * radius;
            const offsetY = gaussianRandom() * radius;
            const offsetZ = gaussianRandom() * radius;
            
            const px = nodeX + offsetX;
            const py = nodeY + offsetY;
            const pz = nodeZ + offsetZ;
            
            positions[particleIndex * 3] = px;
            positions[particleIndex * 3 + 1] = py;
            positions[particleIndex * 3 + 2] = pz;
            
            // Color based on the node, mixed with white for milky effect
            colors[particleIndex * 3] = Math.min(1, nodeColor.r * 0.7 + 0.3);
            colors[particleIndex * 3 + 1] = Math.min(1, nodeColor.g * 0.7 + 0.3);
            colors[particleIndex * 3 + 2] = Math.min(1, nodeColor.b * 0.7 + 0.3);
            
            particleIndex++;
          }
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
          size: particleSize,
          map: cloudTexture,
          vertexColors: true,
          transparent: true,
          opacity: opacity,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          sizeAttenuation: true,
        });
        
        const cloud = new THREE.Points(geometry, material);
        cloud.renderOrder = -1;
        scene.add(cloud);
        milkyLayersRef.current.push(cloud);
      };

      // === CREATE CLOUDS ONLY AROUND NODES ===
      // Each layer creates particles around every node
      
      // Inner dense layer (close to nodes)
      createNodeCenteredCloud(30, 8, 0.06, 15);
      
      // Mid layer
      createNodeCenteredCloud(25, 12, 0.05, 25);
      
      // Outer layer
      createNodeCenteredCloud(20, 18, 0.04, 40);
      
      // Mark clouds as ready
      cloudsReadyRef.current = true;
      setLoadingProgress(100);
    };
    
    // Start waiting for scene
    waitForScene();

    return () => {
      mounted = false;
      if (densityUpdateTimer.current) {
        clearInterval(densityUpdateTimer.current);
      }
    };
  }, [filteredData.nodes, getCloudTexture]);
  
  // Cleanup clouds on unmount only
  useEffect(() => {
    return () => {
      if (fgRef.current) {
        const scene = fgRef.current.scene?.();
        if (scene) {
          for (const layer of milkyLayersRef.current) {
            scene.remove(layer);
            if ((layer as any).geometry) (layer as any).geometry.dispose();
            if ((layer as any).material) (layer as any).material.dispose();
          }
        }
      }
      milkyLayersRef.current = [];
      cloudsCreatedRef.current = false;
    };
  }, []);

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
      if (impact === 'positive') palette = STAR_COLORS.green;
      else if (impact === 'negative') palette = STAR_COLORS.red;
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
    outerGlow.raycast = () => {}; // Disable raycasting so edges behind are clickable
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
    midGlow.raycast = () => {}; // Disable raycasting so edges behind are clickable
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
    innerGlow.raycast = () => {}; // Disable raycasting so edges behind are clickable
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
      spike1.raycast = () => {}; // Disable raycasting so edges behind are clickable
      group.add(spike1);
      
      // Vertical spike
      const spike2 = new THREE.Mesh(spikeGeometry, spikeMaterial);
      spike2.rotation.z = Math.PI / 2;
      spike2.raycast = () => {}; // Disable raycasting so edges behind are clickable
      group.add(spike2);
      
      // Diagonal spikes
      const spike3 = new THREE.Mesh(spikeGeometry, spikeMaterial.clone());
      spike3.material.opacity = 0.2;
      spike3.rotation.z = Math.PI / 4;
      spike3.raycast = () => {}; // Disable raycasting so edges behind are clickable
      group.add(spike3);
      
      const spike4 = new THREE.Mesh(spikeGeometry, spikeMaterial.clone());
      spike4.material.opacity = 0.2;
      spike4.rotation.z = -Math.PI / 4;
      spike4.raycast = () => {}; // Disable raycasting so edges behind are clickable
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
    <div className="w-full h-full relative">
      {/* Loading overlay - fully opaque, centered */}
      {isLoading && (
        <div 
          className="fixed top-0 left-0 w-screen h-screen z-[9999]" 
          style={{ backgroundColor: '#000008' }}
        >
          {/* Centered content container */}
          <div 
            className="absolute top-1/2 left-1/2 flex flex-col items-center"
            style={{ transform: 'translate(-50%, -50%)' }}
          >
            {/* Title */}
            <div className="text-white text-2xl mb-6 font-light tracking-[0.3em] uppercase">
              ORBIT
            </div>
            
            {/* Progress bar */}
            <div className="w-72 h-1.5 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-amber-500 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            
            {/* Status text */}
            <div className="text-white/50 text-sm mt-4 font-light tracking-wide">
              {loadingProgress < 50 ? 'Positioning stars...' : 'Creating nebula...'}
            </div>
          </div>
        </div>
      )}
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
