import { Vector3 } from "../util/math.js";

export class Player {
  constructor(pos, rot)
  {
    this.pos = pos;
    this.rot = rot;
    this.moveSpeed = 4.0;
    this.xBox = 0.1;
    this.yBox = 0.1;
    this.time = 0.0;
  }
  
  lookMove(delta, userCommand, map)
  {
    this.time += delta;
    this.rot = userCommand.rot;
    
    if (userCommand.side || userCommand.forward) {
      const moveDir = new Vector3(userCommand.side, userCommand.forward, 0.0);
      moveDir.rotateZ(userCommand.rot);
      moveDir.normalize();
      moveDir.mulf(this.moveSpeed * delta);
      
      if (map)
        this.clipMoveDir(moveDir, map);
      
      this.pos.add(moveDir);
      this.pos.z = 0.1 + Math.cos(this.time * 10) * 0.03;
    } else {
      this.pos.z = 0.1;
    }
  }
  
  clipMoveDir(moveDir, map)
  {
    const oldPosX = this.pos.x;
    const oldPosY = this.pos.y;
    const newPosX = this.pos.x + moveDir.x;
    const newPosY = this.pos.y + moveDir.y;
    
    if (map.collide(newPosX, newPosY, this.xBox, this.yBox)) {
      if (!map.collide(oldPosX, newPosY, this.xBox, this.yBox))
        moveDir.x = 0.0;
      else if (!map.collide(newPosX, oldPosY, this.xBox, this.yBox))
        moveDir.y = 0.0;
      else {
        moveDir.x = 0.0;
        moveDir.y = 0.0;
      }
    }
  }
};
