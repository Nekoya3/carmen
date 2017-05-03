// Test geocoder_tokens

var tape = require('tape');
var Carmen = require('..');
var context = require('../lib/context');
var mem = require('../lib/api-mem');
var addFeature = require('../lib/util/addfeature'),
    queueFeature = addFeature.queueFeature,
    buildQueued = addFeature.buildQueued;

(() => {
    var conf = {
        address: new mem({
            maxzoom: 6,
            geocoder_tokens: {"Street": "St"}
        }, () => {})
    };
    var c = new Carmen(conf);
    tape('geocoder token test', (t) => {
        var address = {
            id:1,
            properties: {
                'carmen:text':'fake street',
                'carmen:center':[0,0],
            },
            geometry: {
                type: "Point",
                coordinates: [0,0]
            }
        };
        queueFeature(conf.address, address, () => { buildQueued(conf.address, t.end) });
    });
    tape('test address index for relev', (t) => {
        c.geocode('fake st', { limit_verify: 1 }, (err, res) => {
            t.ifError(err);
            t.equals(res.features[0].relevance, 0.99, 'token replacement test, fake st');
            t.end();
        });
    });
})();

(() => {
    var conf = {
        address: new mem({
            maxzoom: 6
        }, () => {})
    };
    var opts = {
        tokens: {"dix-huitième": "18e"}
    };
    var c = new Carmen(conf, opts);
    tape('geocoder token test', (t) => {
        var address = {
            id:1,
            properties: {
                'carmen:text':'avenue du 18e régiment',
                'carmen:center':[0,0],
            },
            geometry: {
                type: "Point",
                coordinates: [0,0]
            }
        };
        queueFeature(conf.address, address, () => { buildQueued(conf.address, t.end) });
    });
    tape('test address index for relev', (t) => {
        c.geocode('avenue du 18e régiment', { limit_verify: 1 }, (err, res) => {
            t.ifError(err);
            t.equals(res.features[0].relevance, 0.99, 'avenue du 18e');
            t.end();
        });
    });
    tape('test address index for relev', (t) => {
        c.geocode('avenue du dix-huitième régiment', { limit_verify: 1 }, (err, res) => {
            t.ifError(err);
            t.equals(res.features[0].relevance, 0.99, 'avenue du dix-huitième régiment');
            t.end();
        });
    });
})();

// RegExp captures have been put on hiatus per https://github.com/mapbox/carmen/pull/283.
(() => {
    var conf = {
        address: new mem({
            maxzoom: 6,
            geocoder_tokens: {'q([a-z])([a-z])([a-z])': "$3$2$1"}
        }, () => {})
    };
    var c = new Carmen(conf);
    tape('geocoder token test', (t) => {
        var address = {
            id:1,
            properties: {
                'carmen:text':'cba',
                'carmen:center':[0,0],
            },
            geometry: {
                type: "Point",
                coordinates: [0,0]
            }
        };
        queueFeature(conf.address, address, () => { buildQueued(conf.address, t.end) });
    });
    tape('test token replacement', (t) => {
        c.geocode('qabc', { limit_verify: 1 }, (err, res) => {
            t.ifError(err);
            t.equals(res.features[0].relevance, 0.99, 'token regex numbered group test, qabc => qcba');
            t.end();
        });
    });
})();

(() => {
    var conf = {
        address: new mem({
            maxzoom: 6,
            geocoder_tokens: {
                "Road": "Rd",
                "Street": "St"
            }
        }, () => {})
    };
    var opts = {
        tokens: {
            'Suite [0-9]+': '',
            'Lot [0-9]+': ''
        }
    }
    var c = new Carmen(conf, opts);
    tape('set opts', (t) => {
        addFeature.setOptions(opts);
        t.end();
    });
    tape('geocoder token test', (t) => {
        var address = {
            id:1,
            properties: {
                'carmen:text':'fake street',
                'carmen:zxy':['6/32/32'],
                'carmen:center':[0,0],
            },
            geometry: {
                type: "Point",
                coordinates: [0,0]
            }
        };
        queueFeature(conf.address, address, t.end);
    });
    tape('geocoder token test', (t) => {
        var address = {
            id:2,
            properties: {
                'carmen:text':'main road lot 42 suite 432',
                'carmen:center':[0,0],
            },
            geometry: {
                type: "Point",
                coordinates: [0,0]
            }
        };
        queueFeature(conf.address, address, () => { buildQueued(conf.address, t.end) });
    });
    tape('unset opts', (t) => {
        addFeature.setOptions({});
        t.end();
    });
    tape('test address index for relev', (t) => {
        c.geocode('fake st lot 34 Suite 43', { limit_verify: 1 }, (err, res) => {
            t.ifError(err);
            t.deepEquals(res.query, ['fake', 'st'], 'global tokens removed');
            t.equals(res.features[0].place_name, 'fake street');
            t.end();
        });
    });
    tape('test address index for relev', (t) => {
        c.geocode('main road lot 34 Suite 43', { limit_verify: 1 }, (err, res) => {
            t.ifError(err);
            t.deepEquals(res.query, ['main', 'road'], 'global tokens removed');
            t.equals(res.features[0].place_name, 'main road lot 42 suite 432');
            t.end();
        });
    });
})();

(() => {
    var conf = {
        address: new mem({
            maxzoom: 6,
            geocoder_tokens: {'strasse':'str'}
        }, () => {})
    };
    var opts = {
        tokens: {
            '\\b(.+)(strasse|str)\\b': "$1 str"
        }
    };

    var c = new Carmen(conf, opts);
    tape('set opts', (t) => {
        addFeature.setOptions(opts);
        t.end();
    });
    tape('geocoder token test', (t) => {
        var address = {
            id:1,
            properties: {
                'carmen:text':'Talstrasse ',
                'carmen:center':[0,0],
            },
            geometry: {
                type: "Point",
                coordinates: [0,0]
            }
        };
        queueFeature(conf.address, address, () => { buildQueued(conf.address, t.end) });
    });
    tape('test token replacement', (t) => {
        c.geocode('Talstrasse', { limit_verify: 1 }, (err, res) => {
            t.ifError(err);
            t.equals(res.features[0].relevance, 0.99, 'token replacement for str -> strasse');
            t.end();
        });
    });
    tape('test token replacement', (t) => {
        c.geocode('Talstr ', { limit_verify: 1 }, (err, res) => {
            t.ifError(err);
            t.equals(res.features[0].relevance, 0.99, 'token replacement for str -> strasse');
            t.end();
        });
    });
    tape('test token replacement', (t) => {
        c.geocode('Tal str ', { limit_verify: 1 }, (err, res) => {
            t.ifError(err);
            t.equals(res.features[0].relevance, 0.99, 'token replacement for str -> strasse');
            t.end();
        });
    });
    tape('test token replacement', (t) => {
        c.geocode('Talstrassesomthing', { limit_verify: 1 }, (err, res) => {
            t.ifError(err);
            t.deepEquals(res.features, [], 'strasse token is not replaced when present in between a word');
            t.end();
        });
    });
    tape('unset opts', (t) => {
        addFeature.setOptions({});
        t.end();
    });
})();

tape('teardown', (t) => {
    context.getTile.cache.reset();
    t.end();
});
