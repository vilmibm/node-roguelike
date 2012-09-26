var EventEmitter = require('events').EventEmitter
var util = require('util')

var Thing = function(screen,x,y,c,desc) {
    this.screen = screen
    this.x = x
    this.y = y
    this.c = c
    this.desc = desc
}
util.inherits(Thing, EventEmitter)

var Wall = function(screen, x,y) {
    Thing.call(this, screen, x, y, '#', 'a wall')

    this.on('collision', function() {
        this.screen.message('you bump into the wall')
    })
}
util.inherits(Wall, Thing)

var Dummy = function(screen, x,y) {
    this.health = 5
    Thing.call(this, screen, x, y, 'd', 'a dummy')
    this.on('collision', function(thing) {
        if (thing === screen.player) {
            this.screen.message('you hit the dummy.')
            this.health--
            if (this.health === 0) {
                this.screen.message('you destroy the thing.')
                this.screen.remove_thing(this)
            }
        }
    }.bind(this))
}
util.inherits(Dummy, Thing)

var Box = function(screen, x, y) {
    Thing.call(this, screen, x, y, 'o', 'a box')
    this.on('collision', function(thing, force) {
        var who = thing === screen.player ? 'you push' : thing.desc + ' pushes'
        this.screen.message(who +' on the box')
        this.screen.move_thing(this, force)
    }.bind(this))
}
util.inherits(Box, Thing)

var Pontobious = function(screen, x, y) {
    Thing.call(this, screen, x, y, 'p', 'Pontobious Flavicus')
    this.on('collision', function(thing) {
        if (thing === screen.player) {
            this.screen.message('Prontobious says, "Excuse me."')
        }
    })
    this.current_move = 0
    this.movements = [
        [1,0],
        [1,0],
        [0,1],
        [-1,0],
        [-1,0],
        [0,-1]
    ]
}
util.inherits(Pontobious, Thing)
Pontobious.prototype.start_pacing = function() {
    this.pace_interval = setInterval(function() {
        this.current_move = (this.current_move + 1) % this.movements.length
        this.screen.move_thing(this, this.movements[this.current_move])
    }.bind(this), 2000)
}

module.exports = {
    Thing:Thing,
    Box:Box,
    Dummy:Dummy,
    Pontobious:Pontobious,
    Wall:Wall
}
