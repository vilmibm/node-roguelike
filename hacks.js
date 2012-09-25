var winston = require('winston');
winston.add(winston.transports.File, { filename: 'log.txt' });
winston.remove(winston.transports.Console);

var log = winston.info.bind(winston)
log('starting log')

var Thing = function(x,y,c) {
    this.x = x
    this.y = y
    this.c = c
}
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

    return chr
}
Screen.prototype.draw_thing = function(thing) {
    log(thing.x, thing.y)
    this.charm.position(thing.x, thing.y)
        .write(thing.c)
}
Screen.prototype.key = function(k, cb) {
    this.charm.on('data', function(buf) {
        var _k = this.handle_input(buf)
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

    var blocked = this.things.filter(function(t) {
        return t.x === px && t.y === py
    }).length !== 0
    if (!blocked) {
        thing.x = px
        thing.y = py
    }
}
Screen.prototype.add_thing = function(thing) { this.things.push(thing) }
Screen.prototype.start = function(speed) {
    this.main_loop = setInterval(function() {
        log(this.things)
        this.charm.reset()
        this.things.forEach(this.draw_thing.bind(this))
    }.bind(this), speed || this.speed)
}

var screen = new Screen()
var player = new Thing(6,6,'@')

// make a tunnel
screen.add_thing(new Thing(5,5, '#'))
screen.add_thing(new Thing(6,5, '#'))
screen.add_thing(new Thing(7,5, '#'))
screen.add_thing(new Thing(8,5, '#'))
screen.add_thing(new Thing(9,5, '#'))
screen.add_thing(new Thing(5,7, '#'))
screen.add_thing(new Thing(6,7, '#'))
screen.add_thing(new Thing(7,7, '#'))
screen.add_thing(new Thing(8,7, '#'))
screen.add_thing(new Thing(9,7, '#'))

//screen.add_thing(new Thing(x,y+2, '#'))

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

screen.start()
