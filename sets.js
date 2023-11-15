// set 1
(1..12).each{|y|
  (1..13).each{|x|
    enemies.push({
      cx: 100 + x * 10,
      cy: y * 10,

      spr: 35,
      hp: 1
    })
  }
}

// set 2
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