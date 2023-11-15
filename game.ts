// title:   Tablet Shooter
// author:  Hevanafa
// desc:    14-11-2023
// license: MIT License
// version: 0.1
// script:  js

/// <reference types="./tic.d.ts" />

declare global {
  interface Array<T> {
    remove(item: T): void;
  }
}

Array.prototype.remove = function (item) {
  if (!this.includes(item)) return
  this.splice(this.indexOf(item), 1)
}

const rand = Math.random


const b_top = 20
const b_bottom = 126
const b_left = 10
const b_right = 230

/** used in sprites */
const UNITS = {
  male_citizen: 53,
  female_citizen: 54,
  ranger: 55,
  knight: 56,
  guard: 57,
  archer: 58,
  elite_guard: 59
}


// game state
/** player x */
let px = 20
/** player y */
let py = 78

let cam_x = 0

const getRelativeX = (x: number) => x - cam_x;


// 0: left, 1: right
let p_head = 1
let tl_player_bounce = 30
let p_bounce = false

let p_atk_lvl = 1
let p_atk = 1
let p_lives = 1

let xp = 0

let inBase = true

function recalcAtk() {
  p_atk = 1 + p_atk_lvl / 2
}


let last_closest: Enemy | null = null

interface Bullet extends Vector {
  damage: number
}

interface Vector {
  cx: number;
  cy: number;
  vx: number;
  vy: number;
}

const bullets: Array<Vector> = []

interface Enemy extends Vector {
  type: number;
  spr: number;
  hp: number;
  xp: number;
  /** colour */
  particle: number;
}

const enemies: Array<Enemy> = []


// basic pixel particle
interface Particle extends Vector {
  colour: number;
  /** in frames */
  ttl: number;
}

const particles: Array<Particle> = []

let tl_enemy_vel = 0

function recalcEnemyVel() {
  for (const ene of enemies) {
    const dx = ene.cx - px
    const dy = ene.cy - py
  
    // Todo: recalculate once every 0.5 s
    const rads = Math.atan2(dy, dx) + Math.PI / 2
    ene.vx = -Math.sin(rads) / 2
    ene.vy = Math.cos(rads) / 2
  }
}

/** in frames */
let shoot_cooldown = 0


const rad2deg = (rad: number) => rad * 180 / Math.PI;

const get_player_dist = (obj: Vector) =>
  (obj.cx - px) ** 2 + (obj.cy - py) ** 2;

const get_dist = (a: Vector, b: Vector) =>
  (a.cx - b.cx) ** 2 + (a.cy - b.cy) ** 2;



function find_closest() {
  let dist = 6400
  let output = null

  for (const e of enemies) {
    const temp_dist = get_player_dist(e)

    if (temp_dist < dist) {
      dist = temp_dist
      output = e
    }
  }

  return output
}


function shoot_closest() {
  const target = find_closest()

  if (!target) return

  const dx = target["cx"] - px
  const dy = target["cy"] - py

  const rads = Math.atan2(dy, dx) + Math.PI / 2

  bullets.push({
    cx: px,
    cy: py,
    vx: Math.sin(rads) * 2,
    vy: -Math.cos(rads) * 2
  })
}


function emit_particles(x: number, y: number, colour: number) {
  let d = 10

  while (d--)
    particles.push({
      cx: x,
      cy: y,
      vx: rand() - 0.5,
      vy: rand() - 0.5,
      colour,
      // in frames
      ttl: Math.floor((0.5 + rand() / 2) * 60)
    })
}


// init enemies
function spawnEnemy(params: Partial<Enemy>) {
  switch (params.type) {
    case UNITS.male_citizen:
      params.spr = UNITS.male_citizen
      params.hp = 1
      params.xp = 1
      params.particle = 8
  }

  enemies.push(params as Enemy);
}

for (let y = 4; y <= 9; y++) {
  for (let x = 1; x <= 5; x++) {
    spawnEnemy({
      cx: 150 + x * 10,
      cy: y * 10,
      type: UNITS.male_citizen
    })
  }
}



let enemy_count = enemies.length
// trace(enemy_count + "")


function update() {
  if (p_lives <= 0) return

  // movement controls
	if (btn(0)) py = py-1
	if (btn(1)) py = py+1

	if (btn(2)) {
    px--

    if (getRelativeX(px) < 10)
      px = cam_x + 10

    p_head = 0
  }

	if (btn(3)) {
    px++

    if (cam_x < px - 120)
      cam_x = px - 120

    p_head = 1
  }

  // check bounds
  if (px < b_left) px = b_left
  if (px > b_right) px = b_right 
  if (py < b_top) py = b_top
  if (py > b_bottom) py = b_bottom 


  // update particles
  for (const part of particles) {
    part.cx += part.vx
    part.cy += part.vy
    part.ttl -= 1

    if (part.ttl <= 0)
      particles.remove(part)
      // particles.splice(particles.indexOf(part), 1)
  }

  tl_enemy_vel--

  if (tl_enemy_vel <= 0) {
    tl_enemy_vel = 30
    recalcEnemyVel()
  }

  // update enemies
  enemies.forEach(ene => {
    let skip = false
    if (skip || get_player_dist(ene) > 22500) return

    if (get_player_dist(ene) <= 64) {
      p_lives--
      skip = true
      return
    }

    ene.cx += ene.vx
    ene.cy += ene.vy

    // don't allow clipping
    enemies.forEach(ene2 => {
      if (skip || ene == ene2) return

      if (get_dist(ene, ene2) <= 36) {
        ene.cx -= ene.vx
        ene.cy -= ene.vy
        skip = true
        return
      }
    })

    // check bounds
    if (ene.cx < b_left) ene.cx = b_left  
    if (ene.cx > b_right) ene.cx = b_right 
    if (ene.cy < b_top) ene.cy = b_top   
    if (ene.cy > b_bottom) ene.cy = b_bottom
  })

  // bullet hit check
  for (const bul of bullets) {
    bul.cx += bul.vx
    bul.cy += bul.vy

    let skip = false

    if (bul.cx < b_left || bul.cx > b_right ||
      bul.cy < b_top || bul.cy > b_bottom)
      skip = true
    

    if (skip) {
      bullets.remove(bul)
      continue
    }

    for (const ene of enemies) {
      if (skip) continue

      if (get_dist(ene, bul) < 36) {
        ene.hp -= 1
        emit_particles(ene.cx, ene.cy, ene.particle)

        if (ene.hp <= 0) {
          xp += ene.xp
          enemies.remove(ene)
        }

        bullets.remove(bul)
        skip = true
        continue
      }
    }
  }

  shoot_cooldown--

  if (shoot_cooldown <= 0) {
    shoot_cooldown += 30
    last_closest = find_closest()
    shoot_closest()
  }
}


function render() {
  cls(0)

  // player sprite
  // original stick figure
  // spr(32, px - 4, py - 8, 0, 1, 0, 0, 1, 2)

  // blue slime
  if (p_lives <= 0)
    spr(83, getRelativeX(px - 4), py - 4, 0)
  else
    spr((p_bounce ? 67 : 51) + p_head, getRelativeX(px - 4), py - 4, 0)

  tl_player_bounce--

  if (tl_player_bounce <= 0) {
    tl_player_bounce = 30
    p_bounce = !p_bounce
  }


  // bullets
  for (const bul of bullets) {
    const x = getRelativeX(bul.cx)
    pix(x, bul.cy, 12)
    circb(x, bul.cy, 1, 7)
  }

  // enemies
  for (const ene of enemies) {
    spr(ene.spr, getRelativeX(ene.cx - 4), ene.cy - 4, 0)

    if (last_closest == ene)
      circb(getRelativeX(ene.cx - 1), ene.cy - 1, 7, 7)
  }

  // particles
  for (const part of particles)
    pix(getRelativeX(part.cx), part.cy, part.colour)
  

  // progress bar
  let perc = (enemy_count - enemies.length) / enemy_count
  let width = perc * 106.67  // 320 / 3
  spr(49, 52, 0, 0, 1, 0, 0, 2, 2)

  rect(68, 5, 106, 6, 5)
  // fill
  rect(68, 5, width, 6, 3)

  // rectb 68, 5, 106, 6, 7

  let s = (perc * 100).toFixed(0) + "%"
  width = print(s, 0, -100, 0, false, 1, true)
  print(s, 120 - width / 2, 5, 7, false, 1, true)

  if (p_lives <= 0) {
    s = "GAME OVER"
    width = print(s, 0, -100, 7, true, 2)
    print(s, (240 - width) / 2, 10, 7, true, 2)

    s = "Press R to restart"
    width = print(s, 0, -100, 7, true)
    print(s, (240 - width) / 2, 116, 7, true)
  }
}


function TIC() {
  update()

  if (keyp(18)) {
    // todo: restart game
  }

  render()
}
