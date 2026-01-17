'use client';

import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { GraphData, GraphNode, EDGE_COLORS, EdgeType } from '@/types';
import SpriteText from 'three-spritetext';
import * as THREE from 'three';

// Dynamically import ForceGraph3D to avoid SSR issues
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-slate-500 animate-pulse">Loading Constellations...</div>
});

interface Props {
  data: GraphData;
  onNodeClick: (node: GraphNode) => void;
  onBackgroundClick?: () => void;
  highlightNodes: Set<string>;
  highlightEdges: Set<string>;
  focusedNodeId?: string;
  enabledEdgeTypes?: Set<EdgeType>;
  affectedCompanies?: Map<string, 'positive' | 'negative' | 'neutral' | 'mixed'>;
}

// Cosmic nebula color palette: distinct clusters of blue/cyan and amber/gold
const NODE_COLORS = [
  '#60a5fa', // Blue 400 - soft blue (primary cool color)
  '#3b82f6', // Blue 500 - medium blue
  '#38bdf8', // Cyan 400 - light cyan
  '#06b6d4', // Cyan 500 - cyan
  '#fbbf24', // Amber 400 - gold (primary warm color)
  '#f59e0b', // Amber 500 - deeper gold/orange
  '#fb923c', // Orange 400 - warm orange
  '#818cf8', // Indigo 400 - soft purple (blend)
  '#a78bfa', // Violet 400 - faint purple (blend)
];

const NODE_COLOR_HIGHLIGHT = '#fbbf24'; // Bright gold for highlighted
const NODE_COLOR_SELECTED = '#fbbf24'; // Bright gold for selected

// Get node color based on id (for consistency, creating distinct color clusters)
const getNodeColor = (nodeId: string): string => {
  let hash = 0;
  for (let i = 0; i < nodeId.length; i++) {
    hash = nodeId.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Use hash to create distinct clusters - favor blues and ambers
  const colorIndex = Math.abs(hash) % NODE_COLORS.length;
  return NODE_COLORS[colorIndex];
};


export default function GraphViz({ data, onNodeClick, onBackgroundClick, highlightNodes, highlightEdges, focusedNodeId, enabledEdgeTypes, affectedCompanies }: Props) {
  const fgRef = useRef<any>();
  const [cameraDistance, setCameraDistance] = useState(1000);

  // Filter graph data based on enabled edge types
  const filteredData = useMemo(() => {
    if (!enabledEdgeTypes) return data;
    
    const filteredLinks = data.links.filter(link => enabledEdgeTypes.has(link.type));
    return {
      nodes: data.nodes,
      links: filteredLinks
    };
  }, [data, enabledEdgeTypes]);

  // Track camera position for distance-based effects
  useEffect(() => {
    if (!fgRef.current) return;

    const updateCameraDistance = () => {
      const camera = fgRef.current.camera();
      if (camera) {
        const distance = Math.hypot(camera.position.x, camera.position.y, camera.position.z);
        setCameraDistance(distance);
      }
    };

    const interval = setInterval(updateCameraDistance, 100);
    return () => clearInterval(interval);
  }, []);

  // Store camera position for per-node distance calculation
  const [cameraPosition, setCameraPosition] = useState<THREE.Vector3>(new THREE.Vector3(0, 0, 1000));

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

  // Setup scene with lighting, fog, and constellation atmosphere
  useEffect(() => {
    if (!fgRef.current) return;

    const scene = fgRef.current.scene();
    const renderer = fgRef.current.renderer();
    
    if (scene) {
      // Add atmospheric fog for depth (Milky Way dust clouds)
      scene.fog = new THREE.FogExp2(0x000011, 0.0012); // Deep space blue-black fog
      
      // Ambient light for base illumination (starlight)
      const ambientLight = new THREE.AmbientLight(0x2a2a4e, 0.25); // Subtle starlight
      scene.add(ambientLight);
      
      // Directional light from above (galactic center glow)
      const directionalLight = new THREE.DirectionalLight(0xfbbf24, 0.4); // Warm gold galactic center
      directionalLight.position.set(50, 100, 50);
      directionalLight.castShadow = false;
      scene.add(directionalLight);
      
      // Point light at origin (central cluster illumination)
      const pointLight1 = new THREE.PointLight(0x60a5fa, 0.5, 1000); // Blue glow
      pointLight1.position.set(0, 0, 0);
      scene.add(pointLight1);
      
      // Additional point lights for depth (distant stars)
      const pointLight2 = new THREE.PointLight(0xfbbf24, 0.3, 800); // Gold glow
      pointLight2.position.set(-200, 150, -200);
      scene.add(pointLight2);
      
      const pointLight3 = new THREE.PointLight(0xa78bfa, 0.2, 600); // Purple glow
      pointLight3.position.set(200, -100, 200);
      scene.add(pointLight3);
      
      // Enable renderer features for better visuals
      if (renderer) {
        renderer.setClearColor(0x000011, 1);
        renderer.shadowMap.enabled = false; // Shadows disabled for performance
      }
      
      // Add star field background (distant stars)
      const starGeometry = new THREE.BufferGeometry();
      const starCount = 5000;
      const positions = new Float32Array(starCount * 3);
      
      for (let i = 0; i < starCount * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 4000; // Spread stars far out
      }
      
      starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      
      const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.5,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
      });
      
      const stars = new THREE.Points(starGeometry, starMaterial);
      scene.add(stars);
    }

    // Initial force settings
    if (fgRef.current) {
       fgRef.current.d3Force('charge').strength(-120);
    }
  }, []);

  // Zoom to focused node and unscatter (organize nodes around it)
  useEffect(() => {
    if (focusedNodeId && fgRef.current) {
        const node = data.nodes.find(n => n.id === focusedNodeId);
        if (node && typeof node.x === 'number') {
            fgRef.current.d3Force('center', null);
            fgRef.current.d3Force('customCenter', (alpha: number) => {
              filteredData.nodes.forEach((d: any) => {
                if (d.id !== focusedNodeId) {
                  d.vx += (node.x! - d.x) * alpha * 0.1;
                  d.vy += ((node.y! || 0) - d.y) * alpha * 0.1;
                  d.vz += ((node.z || 0) - (d.z || 0)) * alpha * 0.1;
                } else {
                  d.vx *= 0.8;
                  d.vy *= 0.8;
                  d.vz *= 0.8;
                  const maxZ = Math.max(...filteredData.nodes.filter(n => n.id !== focusedNodeId).map(n => n.z || 0));
                  if ((d.z || 0) <= maxZ) {
                    d.z = maxZ + 150;
                  }
                }
              });
            });

            const distance = 300;
            const distRatio = 1 + distance/Math.hypot(node.x, node.y! || 0, (node.z || 0));
            fgRef.current.cameraPosition(
                { x: node.x * distRatio, y: (node.y! || 0) * distRatio, z: ((node.z || 0) + 150) * distRatio },
                node as any,
                2000
            );
        }
    } else if (!focusedNodeId && fgRef.current) {
      fgRef.current.d3Force('customCenter', null);
      fgRef.current.d3Force('center');
    }
  }, [focusedNodeId, data.nodes, filteredData]);

  // Calculate node size based on distance (smaller when further away)
  const getNodeSize = (node: any) => {
    const baseSize = (node.val || 1) * 0.4; // Smaller base size for particle-like feel
    
    if (node.x !== undefined && node.y !== undefined && node.z !== undefined) {
      const nodePos = new THREE.Vector3(node.x, node.y || 0, node.z || 0);
      const distanceToNode = nodePos.distanceTo(cameraPosition);
      const scaleFactor = Math.max(0.15, Math.min(1, 250 / Math.max(distanceToNode, 100)));
      return baseSize * scaleFactor;
    }
    
    const scaleFactor = Math.max(0.15, Math.min(1, 250 / Math.max(cameraDistance, 100)));
    return baseSize * scaleFactor;
  };

  // Get edge color based on connected nodes
  const getEdgeColor = useCallback((link: any, defaultColor: string): string => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    
    // Get node colors
    const sourceColor = getNodeColor(sourceId);
    const targetColor = getNodeColor(targetId);
    
    // If same color family, use that color for the edge
    const sourceIsWarm = sourceColor.includes('fb') || sourceColor.includes('f59');
    const targetIsWarm = targetColor.includes('fb') || targetColor.includes('f59');
    
    if (sourceIsWarm && targetIsWarm) {
      return 'rgba(251, 191, 36, 0.2)'; // Amber/gold
    } else if (!sourceIsWarm && !targetIsWarm) {
      return 'rgba(96, 165, 250, 0.2)'; // Blue/cyan
    } else {
      // Mixed - use a blended color or default
      return 'rgba(251, 191, 36, 0.15)'; // Slight amber tint
    }
  }, []);

  // Calculate edge opacity based on distance (fade with distance)
  const getEdgeOpacity = (link: any, baseOpacity: number) => {
    const source = typeof link.source === 'object' ? link.source : filteredData.nodes.find(n => n.id === link.source);
    const target = typeof link.target === 'object' ? link.target : filteredData.nodes.find(n => n.id === link.target);
    
    if (source && target && source.x !== undefined && target.x !== undefined) {
      const sourcePos = new THREE.Vector3(source.x, source.y || 0, source.z || 0);
      const targetPos = new THREE.Vector3(target.x, target.y || 0, target.z || 0);
      const midPoint = new THREE.Vector3().addVectors(sourcePos, targetPos).multiplyScalar(0.5);
      const distanceToMid = midPoint.distanceTo(cameraPosition);
      
      // Fade edges with distance
      const distanceFactor = Math.max(0.1, Math.min(1, 400 / Math.max(distanceToMid, 200)));
      return baseOpacity * distanceFactor;
    }
    
    return baseOpacity;
  };

  return (
    <div className="w-full h-full">
      <ForceGraph3D
        ref={fgRef}
        graphData={filteredData}
        nodeLabel="label"
        nodeColor={(node: any) => {
          // Color by impact type if in news mode
          if (affectedCompanies && affectedCompanies.has(node.id)) {
            const impactType = affectedCompanies.get(node.id);
            switch (impactType) {
              case 'positive': return '#10b981'; // Green
              case 'negative': return '#ef4444'; // Red
              case 'neutral': return '#6b7280'; // Gray
              case 'uncertain': return '#f59e0b'; // Yellow/Amber
              default: return NODE_COLOR_HIGHLIGHT;
            }
          }
          // Default colors
          if (focusedNodeId === node.id) return NODE_COLOR_SELECTED;
          if (highlightNodes.has(node.id)) return NODE_COLOR_HIGHLIGHT;
          return getNodeColor(node.id);
        }}
        nodeVal={getNodeSize}
        nodeResolution={12} // Lower resolution for more particle-like feel
        nodeOpacity={1} // Full opacity, controlled by material
        linkColor={(link: any) => {
            const id = typeof link.source === 'object' 
                ? `${link.source.id}-${link.target.id}`
                : `${link.source}-${link.target}`;
            
            if (highlightEdges.has(id)) {
                return 'rgba(251, 191, 36, 0.6)'; // Bright gold when highlighted
            }
            
            if (highlightNodes.size > 0 && !highlightEdges.has(id)) {
                return 'rgba(251, 191, 36, 0.03)'; // Very faint when other nodes highlighted
            }
            
            // Use edge color based on connected nodes
            return getEdgeColor(link, 'rgba(251, 191, 36, 0.15)');
        }}
        linkWidth={(link: any) => {
            const id = typeof link.source === 'object' 
                ? `${link.source.id}-${link.target.id}`
                : `${link.source}-${link.target}`;
            return highlightEdges.has(id) ? 2 : 0.5; // Thin edges
        }}
        linkOpacity={(link: any) => {
            const id = typeof link.source === 'object' 
                ? `${link.source.id}-${link.target.id}`
                : `${link.source}-${link.target}`;
            
            let baseOpacity = 0.15;
            if (highlightEdges.has(id)) baseOpacity = 0.8;
            else if (highlightNodes.size > 0 && !highlightEdges.has(id)) baseOpacity = 0.05;
            
            return getEdgeOpacity(link, baseOpacity);
        }}
        onNodeClick={(node) => {
            onNodeClick(node as GraphNode);
        }}
        onBackgroundClick={onBackgroundClick}
        nodeThreeObjectExtend={true}
        nodeThreeObject={(node: any) => {
            const isSelected = focusedNodeId === node.id;
            const isHighlighted = highlightNodes.has(node.id);
            
            const nodeColor = isSelected ? NODE_COLOR_SELECTED : (isHighlighted ? NODE_COLOR_HIGHLIGHT : getNodeColor(node.id));
            const size = getNodeSize(node);
            
            // Create constellation star with reflection, lighting, and glow
            const coreSize = size;
            const glowSize = size * 3;
            
            // Outer glow halo - additive blending for bloom effect
            const outerGlowMaterial = new THREE.MeshBasicMaterial({
                color: nodeColor,
                transparent: true,
                opacity: isSelected || isHighlighted ? 0.25 : 0.12,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            });
            const outerGlowGeometry = new THREE.SphereGeometry(glowSize, 12, 12);
            const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
            
            // Middle glow layer - soft transition
            const middleGlowMaterial = new THREE.MeshBasicMaterial({
                color: nodeColor,
                transparent: true,
                opacity: isSelected || isHighlighted ? 0.35 : 0.2,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            });
            const middleGlowGeometry = new THREE.SphereGeometry(size * 1.8, 12, 12);
            const middleGlow = new THREE.Mesh(middleGlowGeometry, middleGlowMaterial);
            
            // Main star core with reflection and lighting (MeshStandardMaterial for realistic look)
            const coreMaterial = new THREE.MeshStandardMaterial({
                color: nodeColor,
                emissive: nodeColor,
                emissiveIntensity: isSelected || isHighlighted ? 0.8 : 0.5, // Strong emission for star glow
                metalness: 0.2, // Subtle metallic reflection
                roughness: 0.1, // Smooth, reflective surface (like a polished star)
                transparent: true,
                opacity: 1.0,
            });
            const coreGeometry = new THREE.SphereGeometry(coreSize, 16, 16);
            const core = new THREE.Mesh(coreGeometry, coreMaterial);
            
            // Add reflective sphere for enhanced shine (like star twinkling)
            const reflectionMaterial = new THREE.MeshPhongMaterial({
                color: nodeColor,
                emissive: nodeColor,
                emissiveIntensity: 0.3,
                shininess: 100, // High shininess for reflection
                specular: new THREE.Color(nodeColor),
                transparent: true,
                opacity: 0.6,
            });
            const reflectionGeometry = new THREE.SphereGeometry(coreSize * 0.9, 16, 16);
            const reflection = new THREE.Mesh(reflectionGeometry, reflectionMaterial);
            
            const group = new THREE.Group();
            group.add(outerGlow); // Outermost
            group.add(middleGlow); // Middle glow
            group.add(core); // Main body with lighting
            group.add(reflection); // Inner reflective layer
            
            // Show text for highlighted/selected nodes
            if (isSelected || isHighlighted) {
                const sprite = new SpriteText(node.label);
                sprite.color = '#fbbf24'; // Gold text
                sprite.textHeight = 6;
                sprite.padding = 2;
                sprite.backgroundColor = 'rgba(0, 0, 17, 0.8)'; // Dark space background
                sprite.borderRadius = 4;
                group.add(sprite);
                sprite.position.set(0, size * 2.5 + 8, 0);
            }
            
            return group;
        }}
        linkThreeObjectExtend={true}
        linkThreeObject={(link: any) => {
            // Create edge with additive blending for cosmic feel
            const source = typeof link.source === 'object' ? link.source : filteredData.nodes.find(n => n.id === link.source);
            const target = typeof link.target === 'object' ? link.target : filteredData.nodes.find(n => n.id === link.target);
            
            if (!source || !target || source.x === undefined || target.x === undefined) {
                return null;
            }
            
            const id = typeof link.source === 'object' 
                ? `${link.source.id}-${link.target.id}`
                : `${link.source}-${link.target}`;
            
            const isHighlighted = highlightEdges.has(id);
            let colorStr = isHighlighted ? 'rgba(251, 191, 36, 0.6)' : getEdgeColor(link, 'rgba(251, 191, 36, 0.15)');
            
            // Handle highlight fade
            if (highlightNodes.size > 0 && !highlightEdges.has(id)) {
                colorStr = 'rgba(251, 191, 36, 0.03)';
            }
            
            // Parse color string (handles both rgba and hex)
            let r, g, b, a;
            if (colorStr.startsWith('rgba')) {
                const matches = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
                if (matches) {
                    r = parseInt(matches[1]) / 255;
                    g = parseInt(matches[2]) / 255;
                    b = parseInt(matches[3]) / 255;
                    a = matches[4] ? parseFloat(matches[4]) : 1;
                } else {
                    r = g = b = 251 / 255; a = 0.15;
                }
            } else {
                r = parseInt(colorStr.slice(1, 3), 16) / 255;
                g = parseInt(colorStr.slice(3, 5), 16) / 255;
                b = parseInt(colorStr.slice(5, 7), 16) / 255;
                a = 1;
            }
            
            const sourcePos = new THREE.Vector3(source.x, source.y || 0, source.z || 0);
            const targetPos = new THREE.Vector3(target.x, target.y || 0, target.z || 0);
            const distance = sourcePos.distanceTo(targetPos);
            
            // Create thin cylinder for edge
            const geometry = new THREE.CylinderGeometry(0.3, 0.3, distance, 4, 1);
            const material = new THREE.MeshBasicMaterial({
                color: new THREE.Color(r, g, b),
                transparent: true,
                opacity: a * getEdgeOpacity(link, 1),
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            });
            
            const cylinder = new THREE.Mesh(geometry, material);
            
            // Position and orient cylinder
            const midPoint = new THREE.Vector3().addVectors(sourcePos, targetPos).multiplyScalar(0.5);
            cylinder.position.copy(midPoint);
            
            const direction = new THREE.Vector3().subVectors(targetPos, sourcePos).normalize();
            const up = new THREE.Vector3(0, 1, 0);
            const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction);
            cylinder.quaternion.copy(quaternion);
            
            return cylinder;
        }}
        backgroundColor="#000011" // Deep space blue-black
        showNavInfo={false}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        maxZoom={1000}
        minZoom={0.1}
      />
    </div>
  );
}
