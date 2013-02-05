#!/usr/local/bin/node

var fs = require('fs');
var util = require('util');

var _ = require('underscore');

var log = require('./logs');
var Screen = require('./screen').Screen;

var things = require('./things');

_(things).extend({
    Player: function(s, x, y, c) {
        things.Thing.call(this, s, x, y, c, 'you');
        this.on('collision', function(thing) {
            this.screen.message(thing.desc+' bumps into you.')
        }.bind(this));
        var move_p = s.move_thing.bind(s, this);
        s.key('h', move_p.bind({}, [-1,0]));
        s.key('j', move_p.bind({}, [0,1]));
        s.key('k', move_p.bind({}, [0,-1]));
        s.key('l', move_p.bind({}, [1, 0]));
        s.key('u', move_p.bind({}, [-1, -1]));
        s.key('i', move_p.bind({}, [1, -1]));
        s.key('n', move_p.bind({}, [-1, 1]));
        s.key('m', move_p.bind({}, [1, 1]));
    },
    Chair: function(s, x, y, c) {
        things.Thing.call(this, s, x, y, c, 'a chair');
    },
    Fireplace: function(s, x, y, c) {
        things.Thing.call(this, s, x, y, c, 'a fireplace');
    },
    Bookcase: function(s, x, y, c)  {
        things.Thing.call(this, s, x,y,c,'a bookcase');
    },
    Door: function(s, x, y, c) {
        things.Thing.call(this, s, x, y, c, 'a door');
    },
    Barrel: function(s, x, y, c) {
        things.Thing.call(this, s, x, y, c, 'a barrel');
    },
    Table: function(s, x, y, c) {
        things.Thing.call(this, s, x, y, c, 'a table');
    },
    Counter: function(s, x, y, c) {
        things.Thing.call(this, s, x, y, c, 'a counter');
    }
});

_(things).functions().forEach(function(fName) {
    util.inherits(things[fName], things.Thing);
});

var filename = process.argv[1];

var map = 'bagend';

var gfx = fs.readFileSync(map + '.nrmap').toString().split('\n');
var key = JSON.parse(fs.readFileSync(map + '.nrkey.json').toString());

var screen = new Screen(null, 550);
screen.charm.setMaxListeners(0);

log('starting parse');
gfx.forEach(function(line, y) {
    log(y, line);
    var x, c, prot, thing;
    for (x = 0; x < line.length; x++) {
        c = line[x];
        if (c.match(/\s/)) { continue; }
        console.log('seeking prot for ' + c);
        prot = key.entities.singular[c];
        console.log(c, prot);
        if (!prot) {
            throw 'unrecognized prototype: ' + prot;
        }
        thing = new things[prot](screen, x, y, c);
        if (prot === 'Player') {
            screen.add_player(thing);
        }
        else {
            screen.add_thing(thing)
        }
    }
});
log('done with parse');

screen.key('Space', screen.clear_message.bind(screen))
screen.key('Return', screen.clear_dialog.bind(screen))
screen.start();
screen.message('welcome to node-roguelike')
