var EventEmitter = require('events').EventEmitter
var util = require('util')

var winston = require('winston');
winston.add(winston.transports.File, { filename: 'log.txt' });
winston.remove(winston.transports.Console);
var log = winston.info.bind(winston)
log('starting log')

var Thing = function(screen,x,y,c,desc) {
    this.screen = screen
    this.x = x
    this.y = y
    this.c = c
    this.desc = desc
}
util.inherits(Thing, EventEmitter)
Thing.prototype.update_pos = function(x,y) {
    this.x = x
    this.y = y
}
Thing.prototype.update_char = function(c) { this.c = c }

var Screen = function(charm, speed) {
    this.speed = speed || 150
    this.things = []
    if (!charm) {
        this.charm = require('charm')(process)
        this.charm.cursor(false)
        this.charm.on('^C', process.exit)
        process.on('exit', function() {
            this.charm.cursor(true)
            this.charm.reset()
            this.charm.end()
        }.bind(this))
    }
    else { this.charm = charm }
}
Screen.prototype.handle_input = function(buf) {
    // thanks airportyh
    var s = String(buf)
    var chr = s.charAt(0)
    , i = chr.charCodeAt(0)
    , key = (buf[0] === 27 && buf[1] === 91) ? buf[2] :null

    //log('s: '+s)
    //log('chr: '+chr)
    //log('i: '+i)
    //log('key: '+key)

    if (i === 32) { return 'Space' }

    return chr
}
Screen.prototype.draw_thing = function(thing) {
    log('drawing '+thing.desc+' at '+thing.x+','+thing.y)
    this.charm.position(thing.x, thing.y)
        .write(thing.c)
}
Screen.prototype.key = function(k, cb) {
    this.charm.on('data', function(buf) {
        if (this.drawing) { return }
        var _k = this.handle_input(buf)
        log('handled key: ' + _k)
        if (_k === k) { cb() }
    }.bind(this))
}
Screen.prototype.move_thing = function(thing, delta) {
    var dx = delta[0]
    var dy = delta[1]
    var cx = thing.x
    var cy = thing.y
    var px = cx + dx
    var py = cy + dy

    var blocking = this.things.filter(function(t) {
        return t.x === px && t.y === py
    })
    if (blocking.length === 0) {
        thing.x = px
        thing.y = py
    }
    else {
        var blocked = blocking[0]
        blocked.emit('collision', thing, delta)
    }
}
Screen.prototype.add_thing = function(thing) { this.things.push(thing) }
Screen.prototype.start = function(speed) {
    this.main_loop = setInterval(function() {
        log('pausing to draw screen')
        process.stdin.pause()
        this.drawing = true
        this.charm.reset()
        this.things.forEach(this.draw_thing.bind(this))
        this.charm.position(100,100)
        log('resuming input')
        process.stdin.resume()
        this.drawing = false
    }.bind(this), speed || this.speed)
}
Screen.prototype.remove_thing = function(thing) {
    this.things = this.things.filter(function(o,i) {
        return o !== thing
    })
    return thing
}
Screen.prototype.message = function(msg) {
    this.clear_message()
    var msg_thing = new Thing(this, 0,0,msg)
    this.add_thing(msg_thing)
    this.msg_thing = msg_thing
}
Screen.prototype.clear_message = function() {
    if (!this.msg_thing) { return }
    this.remove_thing(this.msg_thing)
    delete this.msg_thing
}

var screen = new Screen()
var player = new Thing(screen, 6,6,'@')
player.on('collision', function(thing) {
    this.screen.message(thing.desc+' bumps into you.')

}.bind(player))

var Barrel = function(screen, x,y) {
    Thing.call(this, screen, x, y, '#', 'a wall')

    this.on('collision', function() {
        this.screen.message('you bump into a barrel')
    })
}
util.inherits(Barrel, Thing)

var dummy = new Thing(screen, 9, 6, 'd', 'a test dummy')
dummy.health = 5
dummy.on('collision', function(thing) {
    if (thing === player) {
        this.screen.message('you hit the dummy.')
        this.health--
        if (this.health === 0) {
            this.screen.message('you destroy the dummy.')
            this.screen.remove_thing(this)
        }
    }
}.bind(dummy))
screen.add_thing(dummy)

var box = new Thing(screen, 10,6, 'o', 'a box')
box.on('collision', function(thing, force) {
    var who = thing === player ? 'you push' : thing.desc + ' pushes'
    this.screen.message(who +' on the box')
    this.screen.move_thing(this, force)
}.bind(box))
screen.add_thing(box)

var p_f = new Thing(screen, 5, 10, 'p', 'Prontobious Flustko')
p_f.on('collision', function(thing) {
    if (thing === player) {
        this.screen.message('Prontobious says, "Excuse me."')
    }
})
var current_pos = 0
setInterval(function() {
    var movements = [
        [1,0],
        [1,0],
        [0,1],
        [-1,0],
        [-1,0],
        [0,-1]
    ]
    current_pos = (current_pos + 1) % movements.length
    screen.move_thing(p_f, movements[current_pos])
}, 2000)
screen.add_thing(p_f)

// make a tunnel
screen.add_thing(new Barrel(screen, 5,5))
screen.add_thing(new Barrel(screen, 6,5))
screen.add_thing(new Barrel(screen, 7,5))
screen.add_thing(new Barrel(screen, 8,5))
screen.add_thing(new Barrel(screen, 9,5))
screen.add_thing(new Barrel(screen, 5,7))
screen.add_thing(new Barrel(screen, 6,7))
screen.add_thing(new Barrel(screen, 7,7))
screen.add_thing(new Barrel(screen, 8,7))
screen.add_thing(new Barrel(screen, 9,7))

var move_p = screen.move_thing.bind(screen, player)
screen.key('h', move_p.bind({}, [-1,0]))
screen.key('j', move_p.bind({}, [0,1]))
screen.key('k', move_p.bind({}, [0,-1]))
screen.key('l', move_p.bind({}, [1, 0]))
screen.key('u', move_p.bind({}, [-1, -1]))
screen.key('i', move_p.bind({}, [1, -1]))
screen.key('n', move_p.bind({}, [-1, 1]))
screen.key('m', move_p.bind({}, [1, 1]))
screen.add_thing(player)

screen.key('Space', screen.clear_message.bind(screen))

screen.start()

screen.message('welcome to node-roguelike')
