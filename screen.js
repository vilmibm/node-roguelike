var log = require('./logs')
var Thing = require('./things').Thing

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
    if (chr === '\r') { return 'Return' }

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
Screen.prototype.add_player = function(player) {
    this.player = player
    this.add_thing(player)
}
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
Screen.prototype.pause = function() {
    log('pausing animation loop')
    clearInterval(this.main_loop)
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
Screen.prototype.dialog = function(text) {
    this.pause()
    process.stdin.pause()
    // IDEA modes; wherein classes of key listeners are disabled/enabled.
    // want a scrollable msg box. for now, just display the text.
    for (var x = 10; x < 51; x++) {
        this.charm.position(x, 10)
        this.charm.write('-')
    }
    for (var y = 10; y < 21; y++) {
        this.charm.position(10, y)
        this.charm.write('|')
    }
    for (var x = 10; x < 51; x++) {
        this.charm.position(x, 20)
        this.charm.write('-')
    }
    for (var y = 10; y < 21; y++) {
        this.charm.position(50, y)
        this.charm.write('|')
    }
    [[10,10], [10,20], [50,10], [50, 20]].forEach(function(p) {
        this.charm.position(p[0], p[1])
        this.charm.write('*')
    }.bind(this))
    this.charm.position(11,11)
    var width = 38
    var words = text.split(' ')

    var self = this
    var write = function(words, line_num, line) {
        if (words.length === 0) {
            log('DONE')
            self.charm.position(11, line_num)
            self.charm.write(line)
        }
        else if ((line + words[0]).length > width) {
            log('NEXT LINE')
            self.charm.position(11, line_num)
            self.charm.write(line)
            return write(words, line_num + 1, '')
        }
        else {
            line += ' '+words.shift()
            log(line)

            return write(words, line_num, line)
        }
    }
    write(words, 11, '')
    process.stdin.resume()
    //console.log(this)
    //write.bind(this, words, 11, '')()
    //this.charm.write(text)
}

module.exports = {
    Screen: Screen
}
