# title:   Tablet Shooter
# author:  Hevanafa
# desc:    14-11-2023
# license: MIT License
# version: 0.1
# script:  ruby

$b_top = 20
$b_bottom = 126
$b_left = 10
$b_right = 230

# game state
$px = 20
$py = 78

# 0: left, 1: right
$p_head = 1

$lives = 1

$last_deg = 0
$last_closest = nil

$bullets = []
$enemies = []
# basic pixel particle
$particles = []

$shoot_cooldown = 0


def rad2deg(rad)
  rad * 180 / Math::PI
end


def get_player_dist(obj)
  (obj["cx"] - $px) ** 2 + (obj["cy"] - $py) ** 2
end


def get_dist(a, b)
  (a["cx"] - b["cx"]) ** 2 + (a["cy"] - b["cy"]) ** 2
end


def find_closest
  dist = 6400
  output = nil

  $enemies.each{|e|
    temp_dist = get_player_dist(e)

    if temp_dist < dist
      dist = temp_dist
      output = e
    end
  }

  output
end


def shoot_closest
  target = find_closest

  if !target then return end

  dx = target["cx"] - $px
  dy = target["cy"] - $py

  rads = Math.atan2(dy, dx) + Math::PI / 2.0

  $bullets += [{
    "cx" => $px,
    "cy" => $py,
    "vx" => Math.sin(rads) * 2,
    "vy" => -Math.cos(rads) * 2
  }]
end


def emit_particles(x, y, colour)
  10.times do
    $particles += [{
      "cx" => x,
      "cy" => y,
      "vx" => rand - 0.5,
      "vy" => rand - 0.5,
      "colour" => colour,
      # in frames
      "ttl" => ((0.5 + rand / 2) * 60).to_i
    }]
  end
end


# init enemies
# (1..12).each{|y|
#   (1..13).each{|x|
#     $enemies += [{
#       "cx" => 100 + x * 10,
#       "cy" => y * 10,

#       "spr" => 35,
#       "hp" => 1
#     }]
#   }
# }

(4..12).each{|y|
  (1..5).each{|x|
    $enemies += [{
      "cx" => 150 + x * 10, # rand(100),
      "cy" => y * 10,  # rand(100)
  
      "spr" => x == 5 ? 37 : 35,
      "hp" => x == 5 ? 3 : 1,

      "particle" => x == 5 ? 9 : 8
    }]
  }
}


$enemy_count = $enemies.size

# trace "#{ $enemies[0].keys }"


def update()
  return if $lives <= 0

  # movement controls
	$py = $py-1 if btn(0)
	$py = $py+1 if btn(1)

	if btn(2) then
    $px = $px-1
    $p_head = 0
  end

	if btn(3) then
    $px = $px+1
    $p_head = 1
  end

  # check bounds
  $px = $b_left if $px < $b_left
  $px = $b_right if $px > $b_right
  $py = $b_top if $py < $b_top
  $py = $b_bottom if $py > $b_bottom


  # update particles
  $particles.each do |part|
    part["cx"] += part["vx"]
    part["cy"] += part["vy"]
    part["ttl"] -= 1

    if part["ttl"] <= 0 then
      $particles -= [part]
    end
  end


  # update enemies
  $enemies.each_with_index do |ene, idx|
    skip = false
    next if skip || get_player_dist(ene) > 22500

    if get_player_dist(ene) <= 64 then
      $lives -= 1
      skip = true
      next
    end

    # trace "Outer: #{idx}"
    dx = ene["cx"] - $px
    dy = ene["cy"] - $py
  
    # Todo: recalculate once every 0.5 s
    rads = Math.atan2(dy, dx) + Math::PI / 2.0
    vx = -Math.sin(rads) / 2
    vy = Math.cos(rads) / 2

    ene["cx"] += vx
    ene["cy"] += vy


    # don't allow clipping
    $enemies.each_with_index do |ene2, idx|
      next if skip || ene == ene2

      if get_dist(ene, ene2) <= 36 then
        ene["cx"] -= vx
        ene["cy"] -= vy
        skip = true
        next
      end
    end

    # check bounds
    ene["cx"] = $b_left if ene["cx"] < $b_left
    ene["cx"] = $b_right if ene["cx"] > $b_right
    ene["cy"] = $b_top if ene["cy"] < $b_top
    ene["cy"] = $b_bottom if ene["cy"] > $b_bottom
  end

  # bullet hit check
  $bullets.each do |bul|
    bul["cx"] += bul["vx"]
    bul["cy"] += bul["vy"]

    skip = false

    if bul["cx"] < $b_left || bul["cx"] > $b_right ||
      bul["cy"] < $b_top || bul["cy"] > $b_bottom  then
      skip = true
    end

    if skip then
      $bullets -= [bul]
      next
    end

    $enemies.each do |ene|
      next if skip

      if get_dist(ene, bul) < 36 then
        ene["hp"] -= 1
        emit_particles ene["cx"], ene["cy"], ene["particle"]

        $enemies -= [ene] if ene["hp"] <= 0

        $bullets -= [bul]
        skip = true
        next
      end
    end
  end

  $shoot_cooldown -= 1

  if $shoot_cooldown <= 0 then
    $shoot_cooldown += 6
    $last_closest = find_closest
    shoot_closest
  end
end


def render()
  cls 0

  # player sprite
  # spr 32, $px - 4, $py - 8, 0, 1, 0, 0, 1, 2
  if $lives <= 0 then
    spr 67, $px - 4, $py - 4, 0
  else
    spr 51 + $p_head, $px - 4, $py - 4, 0
  end

  # bullets
  $bullets.each do |bul|
    pix bul["cx"], bul["cy"], 12
    circb bul["cx"], bul["cy"], 1, 7
  end

  # enemies
  $enemies.each do |ene|
    spr ene["spr"], ene["cx"] - 4, ene["cy"] - 4, 0

    if $last_closest == ene then
      circb ene["cx"] - 1, ene["cy"] - 1, 7, 7
    end
  end

  # particles
  $particles.each do |part|
    pix part["cx"], part["cy"], part["colour"]
  end

  # progress bar
  perc = ($enemy_count - $enemies.size) / $enemy_count.to_f
  width = perc * 106.67  # 320 / 3
  spr 49, 52, 0, 0, 1, 0, 0, 2, 2

  rect 68, 5, 106, 6, 5
  # fill
  rect 68, 5, width, 6, 3

  # rectb 68, 5, 106, 6, 7

  s = "%.f%%" % [perc * 100]
  width = print s, 0, -100, 0, false, 1, true
  print s, 120 - width / 2, 5, 7, false, 1, true

  if $lives <= 0 then
    s = "GAME OVER"
    width = print s, 0, -100, 7, true, 2
    print s, (240 - width) / 2, 10, 7, true, 2

    s = "Press R to restart"
    width = print s, 0, -100, 7, true
    print s, (240 - width) / 2, 116, 7, true
  end
end


def TIC()
  update

  if keyp(18) then
    # todo: restart game
  end

  render
end
