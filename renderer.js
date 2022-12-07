import { clamp, Vector2 } from "./math.js";

export class Renderer {
  constructor(bitmap)
  {
    this.bitmap = bitmap;
    this.halfWidth = this.bitmap.width / 2.0;
    this.halfHeight = this.bitmap.height / 2.0;
    this.zBuffer = new Float32Array(this.bitmap.width);
  }
  
  renderSprite(pos, camPos, camDir)
  {
    const cosDir = Math.cos(-camDir);
    const sinDir = Math.sin(-camDir);
    
    const xCam = pos.x - camPos.x;
    const yCam = pos.y - camPos.y;
    
    const xRot = xCam * cosDir - yCam * sinDir;
    const yRot = xCam * sinDir + yCam * cosDir;
    
    const xScreen = xRot / yRot * this.bitmap.width + this.halfWidth;
    const spriteSize = this.bitmap.width / yRot;
    
    const texStep = 1.0 / spriteSize;
    
    let xPixel0 = xScreen - 0.5 * spriteSize;
    let xPixel1 = xScreen + 0.5 * spriteSize;
    let yPixel0 = this.halfHeight - 0.5 * spriteSize;
    let yPixel1 = this.halfHeight + 0.5 * spriteSize;
    
    let xTex = 0;
    
    if (xPixel0 < 0) {
      xTex = -xPixel0 / spriteSize;
      xPixel0 = 0;
    }
    
    if (xPixel1 >= this.bitmap.width) {
      xTex = (xPixel1 - this.bitmap.width) / spriteSize;
      xPixel1 = this.bitmap.width - 1;
    }
    
    let yTexStart = 0;
    if (yPixel0 < 0) {
      yTexStart = -yPixel0 / spriteSize;
      yPixel0 = 0;
    }
    
    if (yPixel1 >= this.bitmap.height) {
      yTexStart = (yPixel1 - this.bitmap.height) / spriteSize;
      yPixel1 = this.bitmap.height - 1;
    }
    
    const xp0 = Math.floor(xPixel0);
    const xp1 = Math.floor(xPixel1);
    
    const yp0 = Math.floor(yPixel0);
    const yp1 = Math.floor(yPixel1);
    
    for (let x = xp0; x < xp1; x++) {
      xTex += texStep;
      
      if (this.zBuffer[x] < yRot)
        continue;
      
      this.zBuffer[x] = yRot;
      
      let yTex = yTexStart;
      for (let y = yp0; y < yp1; y++) {
        yTex += texStep;
        
        const R = xTex * 255;
        const G = yTex * 255;
        const B = 255;
        
        this.putRGBShade(x, y, yRot, R, G, B);
      }
    }
  }
  
  renderMap(map, pos, dir)
  {
    const cosDir = Math.cos(dir);
    const sinDir = Math.sin(dir);
    
    for (let x = 0; x < this.bitmap.width; x++) {
      const xCam = (x - this.halfWidth) / this.bitmap.width;
      
      // near_plane: Vector3(0, 1)
      //   Vector2(0, 1).rotate(dir) + Vector2(xCam, 0).rotate(dir)
      // = Vector2(xCam, 1).rotate(dir)
      const xRayDir = xCam * cosDir - sinDir;
      const yRayDir = xCam * sinDir + cosDir;
      
      const rayHit = map.rayCast(pos, new Vector2(xRayDir, yRayDir));
      
      let wallDist, xWall;
      if (rayHit.side) {
        wallDist = rayHit.xDist;
        xWall = Math.abs(pos.y + wallDist * yRayDir - rayHit.yMap);
      } else {
        wallDist = rayHit.yDist;
        xWall = Math.abs(pos.x + wallDist * xRayDir - rayHit.xMap);
      }
      
      this.zBuffer[x] = wallDist;
      
      const wallHeight = 0.5 / wallDist * this.bitmap.width;
      
      const yPixel0 = Math.floor(this.halfHeight - wallHeight);
      const yPixel1 = Math.ceil(this.halfHeight + wallHeight);
      
      let yWall = 0;
      if (yPixel0 < 0)
        yWall = -yPixel0 / wallHeight;
      
      const yWallStep = 0.5 / wallHeight;
      
      for (let y = 0; y < this.bitmap.height; y++) {
        if (y > yPixel0 && y < yPixel1) {
          yWall += yWallStep;
          
          const R = Math.floor(xWall * 255);
          const G = Math.floor(yWall * 255);
          const B = 255;
          
          this.putRGBShade(x, y, wallDist, R, G, B);
        } else {
          const yCam = (y - this.halfHeight) / this.bitmap.width;
          const zDepth = Math.abs(0.5 / yCam);
          
          const xDepth = xCam * zDepth;
          
          const xPixel = xDepth * cosDir - zDepth * sinDir + pos.x;
          const yPixel = xDepth * sinDir + zDepth * cosDir + pos.y;
          
          const xp = Math.floor(xPixel * 256) & 255;
          const yp = Math.floor(yPixel * 256) & 255;
          
          const R = xp;
          const G = yp;
          const B = 255;
          
          this.putRGBShade(x, y, zDepth, R, G, B);
        }
      }
    }
  }
  
  putRGBShade(x, y, zDepth, R, G, B)
  {
    const brightness = Math.min(1.0 / zDepth, 1.0);
    
    const shadeR = clamp(Math.floor(R * brightness), 0, 255);
    const shadeG = clamp(Math.floor(G * brightness), 0, 255);
    const shadeB = clamp(Math.floor(B * brightness), 0, 255);
    
    this.bitmap.putRGB(x, y, shadeR, shadeG, shadeB);
  }
};