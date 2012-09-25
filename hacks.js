var fs = require('fs')

var charm = require('charm')(process)
charm.reset()
charm.cursor(false)
charm.on('^C', process.exit)

var log = fs.createWriteStream('log.txt')
log.say = function(s) { this.write(s+"\n") }
log.say('logging input')

var handle_input = function(buf) {
    var s = String(buf)
    var chr = s.charAt(0)
    , i = chr.charCodeAt(0)
    , key = (buf[0] === 27 && buf[1] === 91) ? buf[2] :null

    log.say('s: '+s)
    log.say('chr: '+chr)
    log.say('i: '+i)
    log.say('key: '+key)

    return chr
}

var Thing = {
    init: function(x,y,c) {
        this.x = x;
        this.y = y;
        this.c = c;
        return this;
    },
    draw: function() {
        charm.move(this.x, this.y)
            .write(this.c)
    },
    on: function(k, cb) {
        var self = this
        charm.on('data', function(buf) {
            var c = handle_input(buf)
            if (c == k) { cb.call(self) }
        })
    }
}

var player = Thing.init(6,6,'@')

player.on('k', function() { this.y -= 1 })
player.on('j', function() { this.y += 1 })
player.on('h', function() { this.x -= 1 })
player.on('l', function() { this.x += 1 })
player.on('u', function() {
    this.x -= 1
    this.y -= 1
})
player.on('i', function() {
    this.x += 1
    this.y -= 1
})
player.on('n', function() {
    this.x -= 1
    this.y += 1
})
player.on('m', function() {
    this.x += 1
    this.y += 1
})

var things = [player]

setInterval(function() {
    charm.reset()
    things.forEach(function(x) {
        x.draw()
    })
}, 100)
