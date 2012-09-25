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

    if (i === 32) { return 'Space' }

    return chr
}
Screen.prototype.draw_thing = function(thing) {
    log(thing.x, thing.y)
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
    this.message('moving '+ delta.join(','))
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
    var msg_thing = new Thing(0,0,msg)
    this.add_thing(msg_thing)
    this.msg_thing = msg_thing
}
Screen.prototype.clear_message = function() {
    if (!this.msg_thing) { return }
    this.remove_thing(this.msg_thing)
    delete this.msg_thing
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
