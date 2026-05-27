export interface Camera3D {
  yaw: number;
  pitch: number;
  zoom: number;
}

export interface Renderable {
  type: 'line' | 'polygon' | 'circle' | 'text';
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  cx?: number;
  cy?: number;
  r?: number;
  x?: number;
  y?: number;
  points?: { x: number; y: number }[];
  depth: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  opacity?: number;
  filter?: string;
  fontWeight?: string;
  fontSize?: number;
  text?: string;
  textAnchor?: string;
  fontFamily?: string;
  className?: string;
}

export const mathProj = (x: number, y: number, z: number, camera: Camera3D) => {
  const rYaw = (camera.yaw * Math.PI) / 180;
  const rPitch = (camera.pitch * Math.PI) / 180;

  const cosY = Math.cos(rYaw);
  const sinY = Math.sin(rYaw);
  const rx = x * cosY - y * sinY;
  const ry = x * sinY + y * cosY;

  const cosP = Math.cos(rPitch);
  const sinP = Math.sin(rPitch);

  const sx = rx;
  const sy = -ry * sinP - z * cosP;

  const depth = ry * cosP - z * sinP;

  return {
    x: 500 + sx * camera.zoom,
    y: 285 + sy * camera.zoom,
    depth
  };
};

export const helperBox = (
  cx: number, cy: number, cz: number,
  dx: number, dy: number, dz: number,
  fCol: string, sCol: string, op: number, sW: number = 1,
  camera: Camera3D,
  listRenderables: Renderable[]
) => {
  const hx = dx / 2;
  const hy = dy / 2;
  const v = [
    { x: cx - hx, y: cy - hy, z: cz },
    { x: cx + hx, y: cy - hy, z: cz },
    { x: cx + hx, y: cy + hy, z: cz },
    { x: cx - hx, y: cy + hy, z: cz },
    { x: cx - hx, y: cy - hy, z: cz + dz },
    { x: cx + hx, y: cy - hy, z: cz + dz },
    { x: cx + hx, y: cy + hy, z: cz + dz },
    { x: cx - hx, y: cy + hy, z: cz + dz }
  ];
  const faces = [
    { idxs: [0, 1, 5, 4], name: 'front' },
    { idxs: [1, 2, 6, 5], name: 'right' },
    { idxs: [2, 3, 7, 6], name: 'back' },
    { idxs: [3, 0, 4, 7], name: 'left' },
    { idxs: [4, 5, 6, 7], name: 'top' },
    { idxs: [3, 2, 1, 0], name: 'bottom' }
  ];
  faces.forEach(face => {
    const projCoords = face.idxs.map(idx => mathProj(v[idx].x, v[idx].y, v[idx].z, camera));
    const dSum = projCoords.reduce((acc, p) => acc + p.depth, 0) / 4;
    listRenderables.push({
      type: 'polygon',
      points: projCoords,
      depth: dSum,
      fill: fCol,
      stroke: sCol,
      strokeWidth: sW,
      opacity: op
    });
  });
};

export const helperCylinder = (
  cx: number, cy: number, cz: number,
  r: number, h: number, segs: number,
  fCol: string, sCol: string, op: number, sW: number = 1,
  camera: Camera3D,
  listRenderables: Renderable[]
) => {
  const step = (2 * Math.PI) / segs;
  const topVerts = [];
  for (let i = 0; i < segs; i++) {
    topVerts.push({
      x: cx + r * Math.cos(i * step),
      y: cy + r * Math.sin(i * step),
      z: cz + h
    });
  }
  const projTop = topVerts.map(v => mathProj(v.x, v.y, v.z, camera));
  const dTop = projTop.reduce((acc, p) => acc + p.depth, 0) / segs;
  listRenderables.push({
    type: 'polygon',
    points: projTop,
    depth: dTop - 2,
    fill: fCol,
    stroke: sCol,
    strokeWidth: sW,
    opacity: op
  });

  for (let i = 0; i < segs; i++) {
    const a1 = i * step;
    const a2 = ((i + 1) % segs) * step;
    const vSide = [
      { x: cx + r * Math.cos(a1), y: cy + r * Math.sin(a1), z: cz },
      { x: cx + r * Math.cos(a2), y: cy + r * Math.sin(a2), z: cz },
      { x: cx + r * Math.cos(a2), y: cy + r * Math.sin(a2), z: cz + h },
      { x: cx + r * Math.cos(a1), y: cy + r * Math.sin(a1), z: cz + h }
    ];
    const projSide = vSide.map(v => mathProj(v.x, v.y, v.z, camera));
    const dSide = projSide.reduce((acc, p) => acc + p.depth, 0) / 4;

    const midAngle = (a1 + a2) / 2;
    const dot = Math.cos(midAngle + Math.PI / 4);
    const normFactor = (dot + 1) / 2;

    let specFill = fCol;
    if (fCol === 'url(#tankBodyShading)') {
      const sVal = Math.floor(40 + normFactor * 45);
      specFill = `rgb(${sVal}, ${sVal + 10}, ${sVal + 20})`;
    } else if (fCol === 'url(#steelColumnGrad)') {
      const metalVal = Math.floor(75 + normFactor * 130);
      specFill = `rgb(${metalVal}, ${Math.floor(metalVal * 1.05)}, ${Math.floor(metalVal * 1.15)})`;
    } else if (fCol.startsWith('rgba')) {
      const matches = fCol.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([0-9.]+)\)/);
      if (matches) {
        const rB = matches[1];
        const gB = matches[2];
        const bB = matches[3];
        const basicAlpha = parseFloat(matches[4]);
        const fAlpha = basicAlpha * (0.35 + (1.0 - Math.max(0, dot)) * 0.85);
        specFill = `rgba(${rB}, ${gB}, ${bB}, ${fAlpha.toFixed(2)})`;
      }
    }

    listRenderables.push({
      type: 'polygon',
      points: projSide,
      depth: dSide,
      fill: specFill,
      stroke: sCol,
      strokeWidth: sW * 0.5,
      opacity: op
    });
  }
};

const hashPts = (pts: readonly { readonly x: number; readonly y: number; readonly z: number }[]) => {
  if (pts.length === 0) return 0;
  return Math.abs(Math.sin(pts[0].x * 12 + pts[0].y * 8) * 100);
};

export const getBubble3D = (pts: readonly { readonly x: number; readonly y: number; readonly z: number }[], sp: number, animationTick: number) => {
  const progress = ((animationTick + hashPts(pts)) * 0.0075 * sp) % 1.0;
  const segments = pts.length - 1;
  const rawVal = progress * segments;
  const sIdx = Math.min(segments - 1, Math.floor(rawVal));
  const f = rawVal - sIdx;
  const start = pts[sIdx];
  const end = pts[sIdx + 1];
  return {
    x: start.x + (end.x - start.x) * f,
    y: start.y + (end.y - start.y) * f,
    z: start.z + (end.z - start.z) * f
  };
};

export const helperPipeline = (
  pts: readonly { readonly x: number; readonly y: number; readonly z: number }[],
  bCol: string, gCol: string, th: number, sp: number,
  camera: Camera3D,
  animationTick: number,
  listRenderables: Renderable[]
) => {
  for (let i = 0; i < pts.length - 1; i++) {
    const p1 = mathProj(pts[i].x, pts[i].y, pts[i].z, camera);
    const p2 = mathProj(pts[i + 1].x, pts[i + 1].y, pts[i + 1].z, camera);
    const avgD = (p1.depth + p2.depth) / 2;

    listRenderables.push({
      type: 'line',
      x1: p1.x, y1: p1.y,
      x2: p2.x, y2: p2.y,
      depth: avgD - 12,
      stroke: '#0b1329',
      strokeWidth: th + 2.5,
      opacity: 0.9
    });
    listRenderables.push({
      type: 'line',
      x1: p1.x, y1: p1.y,
      x2: p2.x, y2: p2.y,
      depth: avgD - 13,
      stroke: gCol,
      strokeWidth: th * 0.5,
      opacity: 0.95
    });
  }

  const bPos = getBubble3D(pts, sp, animationTick);
  const bProj = mathProj(bPos.x, bPos.y, bPos.z, camera);
  listRenderables.push({
    type: 'circle',
    cx: bProj.x,
    cy: bProj.y,
    r: th * 0.6 + 1.0,
    depth: bProj.depth - 22,
    fill: '#ffffff',
    stroke: gCol,
    strokeWidth: 0.8,
    opacity: 0.95,
    filter: 'url(#glow)'
  });
};

export const helperHUDLabel = (
  ax: number, ay: number, az: number,
  title: string, l1: string, l2: string,
  thmColor: string,
  camera: Camera3D,
  listRenderables: Renderable[]
) => {
  const rootP = mathProj(ax, ay, az, camera);

  listRenderables.push({
    type: 'circle',
    cx: rootP.x, cy: rootP.y, r: 3.5,
    depth: rootP.depth - 150,
    fill: thmColor,
    stroke: '#ffffff',
    strokeWidth: 0.8,
    opacity: 0.95
  });

  const lineEndX = rootP.x + 36;
  const lineEndY = rootP.y - 32;
  listRenderables.push({
    type: 'line',
    x1: rootP.x, y1: rootP.y,
    x2: lineEndX, y2: lineEndY,
    depth: rootP.depth - 151,
    stroke: thmColor,
    strokeWidth: 0.9,
    opacity: 0.75,
    strokeDasharray: '2 3'
  });

  const underlineWidth = 114;
  listRenderables.push({
    type: 'line',
    x1: lineEndX, y1: lineEndY,
    x2: lineEndX + underlineWidth, y2: lineEndY,
    depth: rootP.depth - 151,
    stroke: thmColor,
    strokeWidth: 1.2,
    opacity: 0.8
  });

  listRenderables.push({
    type: 'text',
    x: lineEndX + 4, y: lineEndY - 11,
    text: title,
    depth: rootP.depth - 160,
    fill: '#f1f5f9',
    fontSize: 10,
    fontWeight: 'bold'
  });

  listRenderables.push({
    type: 'text',
    x: lineEndX + 4, y: lineEndY - 2,
    text: l1,
    depth: rootP.depth - 160,
    fill: '#94a3b8',
    fontSize: 8.5
  });

  listRenderables.push({
    type: 'text',
    x: lineEndX + 4, y: lineEndY + 10,
    text: l2,
    depth: rootP.depth - 160,
    fill: thmColor,
    fontSize: 8,
    fontWeight: 'semibold'
  });
};
