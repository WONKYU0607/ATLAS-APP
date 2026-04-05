#!/usr/bin/env node
// 50m GeoJSON을 다운로드 → Douglas-Peucker 간소화 → public/countries.json 저장
// 사용법: node simplify-geo.js

const https = require('https');
const fs = require('fs');
const path = require('path');

const URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson';
const OUTPUT = path.join(__dirname, 'public', 'countries.json');
const TOLERANCE = 0.05; // 간소화 강도 (작을수록 정밀, 클수록 경량)

// Douglas-Peucker 간소화 알고리즘
function perpendicularDistance(point, lineStart, lineEnd) {
  const dx = lineEnd[0] - lineStart[0];
  const dy = lineEnd[1] - lineStart[1];
  const mag = Math.sqrt(dx * dx + dy * dy);
  if (mag === 0) return Math.sqrt((point[0] - lineStart[0]) ** 2 + (point[1] - lineStart[1]) ** 2);
  const u = ((point[0] - lineStart[0]) * dx + (point[1] - lineStart[1]) * dy) / (mag * mag);
  const closestX = lineStart[0] + u * dx;
  const closestY = lineStart[1] + u * dy;
  return Math.sqrt((point[0] - closestX) ** 2 + (point[1] - closestY) ** 2);
}

function douglasPeucker(points, tolerance) {
  if (points.length <= 2) return points;
  
  let maxDist = 0;
  let maxIdx = 0;
  const end = points.length - 1;
  
  for (let i = 1; i < end; i++) {
    const dist = perpendicularDistance(points[i], points[0], points[end]);
    if (dist > maxDist) { maxDist = dist; maxIdx = i; }
  }
  
  if (maxDist > tolerance) {
    const left = douglasPeucker(points.slice(0, maxIdx + 1), tolerance);
    const right = douglasPeucker(points.slice(maxIdx), tolerance);
    return left.slice(0, -1).concat(right);
  }
  return [points[0], points[end]];
}

function simplifyRing(ring, tolerance) {
  const simplified = douglasPeucker(ring, tolerance);
  // 최소 4개 좌표 유지 (유효한 폴리곤)
  if (simplified.length < 4) return ring.length >= 4 ? ring : simplified;
  return simplified;
}

console.log('📥 50m GeoJSON 다운로드 중...');

https.get(URL, (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; process.stdout.write('.'); });
  res.on('end', () => {
    console.log('\n✅ 다운로드 완료! 간소화 중...');
    
    const geojson = JSON.parse(data);
    const originalSize = data.length;
    
    const features = geojson.features.map(feat => {
      const geom = feat.geometry;
      let newGeom;
      
      if (geom.type === 'Polygon') {
        // 첫 번째 링만 유지 (구멍 제거) + 간소화
        newGeom = {
          type: 'Polygon',
          coordinates: [simplifyRing(geom.coordinates[0], TOLERANCE)]
        };
      } else if (geom.type === 'MultiPolygon') {
        // 각 폴리곤의 첫 번째 링만 유지 + 간소화
        // 너무 작은 섬은 제거 (좌표 10개 미만)
        const simplified = geom.coordinates
          .map(poly => [simplifyRing(poly[0], TOLERANCE)])
          .filter(poly => poly[0].length >= 4);
        newGeom = {
          type: 'MultiPolygon',
          coordinates: simplified.length > 0 ? simplified : [[simplifyRing(geom.coordinates[0][0], TOLERANCE)]]
        };
      } else {
        newGeom = geom;
      }
      
      return {
        type: 'Feature',
        properties: {
          NAME: feat.properties.NAME || feat.properties.ADMIN,
          LABEL_X: feat.properties.LABEL_X,
          LABEL_Y: feat.properties.LABEL_Y,
        },
        geometry: newGeom
      };
    });
    
    const output = JSON.stringify({ type: 'FeatureCollection', features });
    
    // public 폴더 확인
    const dir = path.dirname(OUTPUT);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    fs.writeFileSync(OUTPUT, output);
    
    const newSize = output.length;
    console.log(`\n🎉 완료!`);
    console.log(`   원본: ${(originalSize / 1024 / 1024).toFixed(1)}MB`);
    console.log(`   결과: ${(newSize / 1024 / 1024).toFixed(1)}MB (${Math.round(newSize/originalSize*100)}%)`);
    console.log(`   저장: ${OUTPUT}`);
    console.log(`\n💡 App.jsx에서 fetch('/countries.json')으로 로드됩니다.`);
  });
}).on('error', (err) => {
  console.error('❌ 다운로드 실패:', err.message);
  process.exit(1);
});
