import React, { useRef, useEffect } from 'react';

interface Glass3DCanvasProps {
  type: 'btc' | 'sol' | 'eth' | 'usd' | 'ngn';
  size: 'sm' | 'md' | 'lg';
  isLightMode?: boolean;
  animationStyle?: 'y' | 'x' | 'diagonal';
  style?: React.CSSProperties;
  className?: string;
}

const VERTEX_SHADER_SOURCE = `
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const getFragmentShaderSource = (logoType: string, animStyle: string) => {
  let logoDefine = '#define LOGO_BTC';
  if (logoType === 'sol') logoDefine = '#define LOGO_SOL';
  if (logoType === 'eth') logoDefine = '#define LOGO_ETH';
  if (logoType === 'usd') logoDefine = '#define LOGO_USD';
  if (logoType === 'ngn') logoDefine = '#define LOGO_NGN';

  let animDefine = '';
  if (animStyle === 'x') animDefine = '#define ANIM_X';
  if (animStyle === 'diagonal') animDefine = '#define ANIM_DIAG';

  return `
    #ifdef GL_ES
    precision highp float;
    #endif
    
    varying vec2 vUv;
    uniform float u_time;
    uniform float u_lightmode; // 0.0 = dark, 1.0 = light
    
    ${logoDefine}
    ${animDefine}

    float smin(float a, float b, float k) {
      float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
      return mix(b, a, h) - k * h * (1.0 - h);
    }

    float smax(float a, float b, float k) {
      float h = clamp(0.5 - 0.5 * (b - a) / k, 0.0, 1.0);
      return mix(b, a, h) + k * h * (1.0 - h);
    }

    float sdBox(vec3 p, vec3 b) {
      vec3 q = abs(p) - b;
      return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
    }

    float sdOctahedron(vec3 p, float s) {
      p = abs(p);
      float m = p.x + p.y + p.z - s;
      vec3 q;
      if( 3.0*p.x < p.x+p.y+p.z ) q = p.xyz;
      else if( 3.0*p.y < p.x+p.y+p.z ) q = p.yzx;
      else if( 3.0*p.z < p.x+p.y+p.z ) q = p.zxy;
      else return m*0.57735027;
      float k = clamp(0.5*(q.z-q.y+s),0.0,s); 
      return length(vec3(q.x,q.y-s+k,q.z-k)); 
    }

    float sdBox2d(vec2 p, vec2 b) {
      vec2 d = abs(p) - b;
      return length(max(d,0.0)) + min(max(d.x,d.y),0.0);
    }
    
    float opExtrude(float d2d, float z, float h) {
      vec2 w = vec2(d2d, abs(z) - h);
      return min(max(w.x, w.y), 0.0) + length(max(w, 0.0));
    }
    
    mat3 transposeMat3(mat3 m) {
      return mat3(
        vec3(m[0][0], m[1][0], m[2][0]),
        vec3(m[0][1], m[1][1], m[2][1]),
        vec3(m[0][2], m[1][2], m[2][2])
      );
    }

    mat3 rotateY(float theta) {
      float c = cos(theta);
      float s = sin(theta);
      return mat3(
        c, 0.0, s,
        0.0, 1.0, 0.0,
        -s, 0.0, c
      );
    }
    
    mat3 rotateX(float theta) {
      float c = cos(theta);
      float s = sin(theta);
      return mat3(
        1.0, 0.0, 0.0,
        0.0, c, -s,
        0.0, s, c
      );
    }
    
    float getLogoDist(vec3 p) {
      #if defined(LOGO_BTC)
        vec2 pRot = p.xy;
        pRot.x -= pRot.y * 0.12; // Bitcoin slant
        float spine = sdBox2d(pRot - vec2(-0.05, 0.0), vec2(0.035, 0.20));
        
        // loops smoothly clipped at x = -0.05 using smax
        float loop1 = abs(length(pRot - vec2(-0.02, 0.08)) - 0.075) - 0.03;
        loop1 = smax(loop1, -0.05 - pRot.x, 0.02);
        
        float loop2 = abs(length(pRot - vec2(-0.02, -0.08)) - 0.085) - 0.03;
        loop2 = smax(loop2, -0.05 - pRot.x, 0.02);
        
        float t1 = sdBox2d(pRot - vec2(-0.02, 0.22), vec2(0.012, 0.03));
        float t2 = sdBox2d(pRot - vec2(0.02, 0.22), vec2(0.012, 0.03));
        float t3 = sdBox2d(pRot - vec2(-0.02, -0.22), vec2(0.012, 0.03));
        float t4 = sdBox2d(pRot - vec2(0.02, -0.22), vec2(0.012, 0.03));
        
        // smin union to merge spine, loops, and serifs without creases
        float loops = smin(loop1, loop2, 0.02);
        float serifs = smin(smin(t1, t2, 0.02), smin(t3, t4, 0.02), 0.02);
        float d2d = smin(spine, smin(loops, serifs, 0.02), 0.02);
        
        return (opExtrude(d2d, p.z, 0.06) - 0.015) * 0.9;
      #elif defined(LOGO_SOL)
        float shear = 0.55;
        vec2 p1 = p.xy - vec2(0.03, 0.14);
        p1.x -= p1.y * shear;
        float bar1 = sdBox2d(p1, vec2(0.14, 0.032));
        
        vec2 p2 = p.xy - vec2(0.0, 0.0);
        p2.x -= p2.y * shear;
        float bar2 = sdBox2d(p2, vec2(0.14, 0.032));
        
        vec2 p3 = p.xy - vec2(-0.03, -0.14);
        p3.x -= p3.y * shear;
        float bar3 = sdBox2d(p3, vec2(0.14, 0.032));
        
        // smin union
        float d2d = smin(bar1, smin(bar2, bar3, 0.02), 0.02);
        return (opExtrude(d2d, p.z, 0.06) - 0.015) * 0.8; // conservative factor for sheared space
      #elif defined(LOGO_ETH)
        vec3 pTop = p - vec3(0.0, 0.07, 0.0);
        pTop.y /= 1.4;
        pTop.z /= 0.7;
        float topPart = sdOctahedron(pTop, 0.22) * 0.7;
        
        vec3 pBot = p - vec3(0.0, -0.11, 0.0);
        pBot.y /= 1.3;
        pBot.z /= 0.7;
        float botPart = sdOctahedron(pBot, 0.16) * 0.7;
        
        // smin union for octahedrons
        return smin(topPart, botPart, 0.02) - 0.015;
      #elif defined(LOGO_USD)
        float line = sdBox2d(p.xy, vec2(0.015, 0.22));
        
        // S loops smoothly clipped without conditional jumps
        float topArc = abs(length(p.xy - vec2(-0.01, 0.08)) - 0.07) - 0.028;
        topArc = smax(topArc, smin(0.08 - p.y, p.x + 0.01, 0.02), 0.02);
        
        float botArc = abs(length(p.xy - vec2(0.01, -0.08)) - 0.07) - 0.028;
        botArc = smax(botArc, smin(p.y + 0.08, -0.01 - p.x, 0.02), 0.02);
        
        vec2 pDiag = p.xy;
        float c = cos(-0.5), s = sin(-0.5);
        pDiag = vec2(pDiag.x * c - pDiag.y * s, pDiag.x * s + pDiag.y * c);
        float diag = sdBox2d(pDiag, vec2(0.06, 0.028));
        
        // smin union
        float d2d = smin(line, smin(diag, smin(topArc, botArc, 0.02), 0.02), 0.02);
        return (opExtrude(d2d, p.z, 0.06) - 0.015) * 0.95;
      #elif defined(LOGO_NGN)
        float v1 = sdBox2d(p.xy - vec2(-0.10, 0.0), vec2(0.022, 0.18));
        float v2 = sdBox2d(p.xy - vec2(0.10, 0.0), vec2(0.022, 0.18));
        
        // diagonal smoothly clipped between vertical bounds
        vec2 pDiag = p.xy;
        float cN = cos(-1.05), sN = sin(-1.05);
        pDiag = vec2(pDiag.x * cN - pDiag.y * sN, pDiag.x * sN + pDiag.y * cN);
        float diag = sdBox2d(pDiag, vec2(0.20, 0.022));
        diag = smax(diag, smax(-0.10 - p.x, p.x - 0.10, 0.02), 0.02);
        
        float c1 = sdBox2d(p.xy - vec2(0.0, 0.04), vec2(0.13, 0.02));
        float c2 = sdBox2d(p.xy - vec2(0.0, -0.04), vec2(0.13, 0.02));
        
        // smin union
        float d2d = smin(v1, smin(v2, smin(diag, smin(c1, c2, 0.02), 0.02), 0.02), 0.02);
        return (opExtrude(d2d, p.z, 0.06) - 0.015) * 0.95;
      #endif
    }
    
    float getSceneDist(vec3 p) {
      return getLogoDist(p) * 0.85; // Global conservative factor to prevent raymarching edge glitches
    }
    
    vec3 getNormal(vec3 p) {
      vec2 e = vec2(0.001, 0.0);
      return normalize(vec3(
        getSceneDist(p + e.xyy) - getSceneDist(p - e.xyy),
        getSceneDist(p + e.yxy) - getSceneDist(p - e.yxy),
        getSceneDist(p + e.yyx) - getSceneDist(p - e.yyx)
      ));
    }
    
    vec3 getBg(vec2 uv) {
      // Smooth anti-aliased grid using smoothstep sin waves
      vec2 g = abs(sin(uv * 10.0 * 3.14159265));
      float lineX = smoothstep(0.0, 0.08, g.x);
      float lineY = smoothstep(0.0, 0.08, g.y);
      float gridPattern = 1.0 - lineX * lineY;
      
      if (u_lightmode > 0.5) {
        vec3 bgBase = vec3(0.96, 0.97, 0.99);
        return mix(bgBase, vec3(0.0, 0.0, 0.0), gridPattern * 0.045);
      } else {
        vec3 bgBase = vec3(0.01, 0.012, 0.018);
        float glow = 1.0 - length(uv) * 0.5;
        glow = clamp(glow, 0.0, 1.0);
        vec3 glowColor = vec3(0.04, 0.08, 0.22) * glow;
        return mix(bgBase + glowColor, vec3(1.0, 1.0, 1.0), gridPattern * 0.065);
      }
    }

    void main() {
      vec2 uv = vUv - 0.5;
      
      vec3 ro = vec3(0.0, 0.0, 1.8);
      vec3 rd = normalize(vec3(uv, -1.2));
      
      float timeAngle = u_time * 0.35;
      
      #if defined(ANIM_X)
        mat3 rot = rotateX(timeAngle) * rotateY(0.2);
      #elif defined(ANIM_DIAG)
        mat3 rot = rotateX(timeAngle * 0.7) * rotateY(timeAngle);
      #else
        mat3 rot = rotateY(timeAngle) * rotateX(0.25);
      #endif
      
      float t = 0.0;
      bool hit = false;
      
      // Transform ray to local space of rotated object (eliminates expensive matrix multiplication inside loop)
      vec3 roLocal = rot * ro;
      vec3 rdLocal = rot * rd;
      vec3 pLocal;
      
      for (int i = 0; i < 36; i++) {
        pLocal = roLocal + rdLocal * t;
        float d = getSceneDist(pLocal);
        if (d < 0.0008) {
          hit = true;
          break;
        }
        t += d;
        if (t > 4.0) break;
      }
      
      vec3 color = vec3(0.0);
      float alpha = 0.0;
      if (hit) {
        vec3 normalLocal = getNormal(pLocal);
        vec3 N = transposeMat3(rot) * normalLocal;
        vec3 V = -rd;
        vec3 pWorld = ro + rd * t;
        
        // Chromatic Dispersion Refraction (Optimized: compute green channel and offset R/B for 3x speedup)
        vec3 rdIn = refract(rd, N, 1.0 / 1.45);
        vec3 pExit = pWorld + rdIn * 0.16;
        vec3 rdOut = refract(rdIn, -N, 1.45 / 1.0);
        if (length(rdOut) < 0.1) rdOut = reflect(rdIn, -N);
        float tBg = 2.0;
        if (rdOut.z < -0.05) {
          tBg = clamp((-1.2 - pExit.z) / rdOut.z, 0.0, 5.0);
        }
        vec2 bgPos = pExit.xy + rdOut.xy * tBg;
        
        // Fast chromatic dispersion offsets in texture UV space
        vec2 dispOffset = rdOut.xy * 0.012;
        float rCol = getBg(bgPos - dispOffset).r;
        float gCol = getBg(bgPos).g;
        float bCol = getBg(bgPos + dispOffset).b;
        
        vec3 refColor = vec3(rCol, gCol, bCol);
        
        vec3 L1 = normalize(vec3(1.5, 2.0, 2.0));
        vec3 L2 = normalize(vec3(-1.5, -1.0, 2.0));
        
        vec3 H1 = normalize(L1 + V);
        vec3 H2 = normalize(L2 + V);
        
        // Sparkling Phong Highlights (highly concentrated to glitter on rotation)
        float spec1 = pow(max(dot(N, H1), 0.0), 128.0) * 1.5;
        float spec2 = pow(max(dot(N, H2), 0.0), 64.0) * 0.8;
        vec3 specHighlight = vec3(1.0, 1.0, 1.0) * (spec1 + spec2);
        
        // Micro-glitter sparkles that flash on rotation
        float sparkleNoise = sin(pLocal.x * 250.0) * cos(pLocal.y * 250.0) * sin(pLocal.z * 250.0);
        float sparkleMask = smoothstep(0.65, 1.0, sparkleNoise);
        // Only sparkle near specular highlights
        float glitter = sparkleMask * pow(max(dot(N, H1), 0.0), 40.0) * 3.5;
        glitter += sparkleMask * pow(max(dot(N, H2), 0.0), 40.0) * 2.0;
        vec3 glitterHighlight = vec3(1.0, 1.0, 1.0) * glitter;
        
        float fresnel = 0.12 + 0.88 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
        
        vec3 glassTint;
        if (u_lightmode > 0.5) {
          glassTint = vec3(0.82, 0.90, 0.98); // soft blue glass tint in light mode
          color = mix(refColor * glassTint, vec3(1.0, 1.0, 1.0), fresnel * 0.45) + specHighlight * 0.8 + glitterHighlight * 1.0;
          color += vec3(0.12, 0.22, 0.45) * (1.0 - N.z) * 0.45; // Soft blue/grey outer rim reflection in light mode
        } else {
          glassTint = vec3(0.28, 0.38, 0.55) * (N.z * 0.5 + 0.5) + vec3(0.08, 0.12, 0.18);
          color = mix(refColor * glassTint, vec3(1.0, 1.0, 1.0), fresnel * 0.65) + specHighlight * 1.3 + glitterHighlight * 2.0;
          color += vec3(0.08, 0.15, 0.25) * (1.0 - N.z);
        }
        
        alpha = 0.95;
      }
      
      gl_FragColor = vec4(color, alpha);
    }
  `;
};

export const Glass3DCanvas: React.FC<Glass3DCanvasProps> = ({
  type,
  size,
  isLightMode = false,
  animationStyle = 'y',
  style,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', { 
      alpha: true, 
      antialias: true, 
      powerPreference: 'high-performance', 
      premultipliedAlpha: false 
    }) || canvas.getContext('webgl', { 
      alpha: true, 
      antialias: true, 
      powerPreference: 'high-performance', 
      premultipliedAlpha: false 
    });
    if (!gl) {
      console.error('WebGL is not supported on this device');
      return;
    }

    gl.clearColor(0.0, 0.0, 0.0, 0.0);

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    if (!vertexShader) return;
    gl.shaderSource(vertexShader, VERTEX_SHADER_SOURCE);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      console.error('Error compiling vertex shader:', gl.getShaderInfoLog(vertexShader));
      return;
    }

    const fragSource = getFragmentShaderSource(type, animationStyle);
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    if (!fragmentShader) return;
    gl.shaderSource(fragmentShader, fragSource);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      console.error('Error compiling fragment shader:', gl.getShaderInfoLog(fragmentShader));
      return;
    }

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Error linking program:', gl.getProgramInfoLog(program));
      return;
    }

    const vertices = new Float32Array([
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
      -1.0,  1.0,
       1.0, -1.0,
       1.0,  1.0,
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.useProgram(program);

    const timeLocation = gl.getUniformLocation(program, 'u_time');
    const lightmodeLocation = gl.getUniformLocation(program, 'u_lightmode');

    let animationFrameId: number | null = null;
    const startTime = performance.now();
    let isVisible = true;

    const render = () => {
      const currentTime = performance.now();
      const elapsedSeconds = (currentTime - startTime) / 1000.0;

      // Ensure viewport is set correctly
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);
      gl.uniform1f(timeLocation, elapsedSeconds);
      gl.uniform1f(lightmodeLocation, isLightMode ? 1.0 : 0.0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      if (isVisible) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        animationFrameId = null;
      }
    };

    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      isVisible = false;
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          const prevVisible = isVisible;
          isVisible = entry.isIntersecting;
          if (isVisible && !prevVisible && !animationFrameId) {
            animationFrameId = requestAnimationFrame(render);
          }
        },
        { threshold: 0.0 }
      );
      observer.observe(canvas);
    } else {
      render();
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, [type, isLightMode, animationStyle]);

  const baseDimensions = {
    sm: 240,
    md: 320,
    lg: 420,
  }[size];

  // Render at 1.5x base size to reduce pixel load by 75% on GPU, scaled to 3x display dimensions
  const displayDimensions = baseDimensions * 3;
  const renderDimensions = Math.round(baseDimensions * 1.5);

  return (
    <canvas
      ref={canvasRef}
      width={renderDimensions}
      height={renderDimensions}
      style={{
        width: `${displayDimensions}px`,
        height: `${displayDimensions}px`,
        pointerEvents: 'none',
        display: 'block',
        ...style,
      }}
      className={className}
    />
  );
};
