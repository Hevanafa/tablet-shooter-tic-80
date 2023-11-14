// title:   Tablet Shooter
// author:  Hevanafa
// desc:    14-11-2023
// license: MIT License
// version: 0.1
// script:  js

Array.prototype.remove = function (item) {
  if (!this.includes(item)) return
  this.splice(this.indexOf(item), 1)
}

const rand = Math.random


const b_top = 20
const b_bottom = 126
const b_left = 10
const b_right = 230

// game state
/** player x */
let px = 20
/** player y */
let py = 78

// 0: left, 1: right
let p_head = 1

let lives = 1

// let last_deg = 0
let last_closest = null

const bullets = []
/** @type { Array<{ cx: number, cy: number, vx: number, vy: number }> } */
const enemies = []
// basic pixel particle
const particles = []

/** in frames */
let shoot_cooldown = 0


const rad2deg = rad => rad * 180 / Math.PI;

const get_player_dist = obj =>
  (obj.cx - px) ** 2 + (obj.cy - py) ** 2;

const get_dist = (a, b) =>
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


function emit_particles(x, y, colour) {
  let d = 10

  while (d--)
    particles.push({
      cx: x,
      cy: y,
      vx: rand() - 0.5,
      vy: rand() - 0.5,
      colour: colour,
      // in frames
      ttl: Math.floor((0.5 + rand() / 2) * 60)
    })
}


// init enemies
// (1..12).each{|y|
//   (1..13).each{|x|
//     enemies += [{
//       "cx" => 100 + x * 10,
//       "cy" => y * 10,

//       "spr" => 35,
//       "hp" => 1
//     }]
//   }
// }

for (let y = 4; y <= 12; y++) {
  for (let x = 1; x <= 5; x++) {
    enemies.push({
      cx: 150 + x * 10,
      cy: y * 10,
  
      spr: x == 5 ? 37 : 35,
      hp: x == 5 ? 3 : 1,

      particle: x == 5 ? 9 : 8
    })
  }
}

let enemy_count = enemies.length
// trace(enemy_count + "")


function update() {
  if (lives <= 0) return

  // movement controls
	if (btn(0)) py = py-1
	if (btn(1)) py = py+1

	if (btn(2)) {
    px = px-1
    p_head = 0
  }

	if (btn(3)) {
    px = px+1
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


  // update enemies
  enemies.forEach(ene => {
    let skip = false
    if (skip || get_player_dist(ene) > 22500) return

    if (get_player_dist(ene) <= 64) {
      lives--
      skip = true
      return
    }

    const dx = ene.cx - px
    const dy = ene.cy - py
  
    // Todo: recalculate once every 0.5 s
    const rads = Math.atan2(dy, dx) + Math.PI / 2
    const vx = -Math.sin(rads) / 2
    const vy = Math.cos(rads) / 2

    ene.cx += vx
    ene.cy += vy


    // don't allow clipping
    enemies.forEach(ene2 => {
      if (skip || ene == ene2) return

      if (get_dist(ene, ene2) <= 36) {
        ene.cx -= vx
        ene.cy -= vy
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

    skip = false

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

        if (ene.hp <= 0) enemies.remove(ene)

        bullets.remove(bul)
        skip = true
        continue
      }
    }
  }

  shoot_cooldown--

  if (shoot_cooldown <= 0) {
    shoot_cooldown += 6
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
  if (lives <= 0)
    spr(67, px - 4, py - 4, 0)
  else
    spr(51 + p_head, px - 4, py - 4, 0)

  // bullets
  for (const bul of bullets) {
    pix(bul.cx, bul.cy, 12)
    circb(bul.cx, bul.cy, 1, 7)
  }

  // enemies
  for (const ene of enemies) {
    spr(ene.spr, ene.cx - 4, ene.cy - 4, 0)

    if (last_closest == ene)
      circb(ene.cx - 1, ene.cy - 1, 7, 7)
  }

  // particles
  for (const part of particles)
    pix(part.cx, part.cy, part.colour)
  

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

  if (lives <= 0) {
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
