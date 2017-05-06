/*
COPYRIGHT 2017 - LOREN HOWARD
*/

//(function() {
  var strType = 2;

  var GRID_SIZE = 300,
      MAX_DIST = 1350,
      MAX_MIL = 1570,
      PRECISION = 1,

      KP_MAP = [
        [0,2],[1,2],[2,2],
        [0,1],[1,1],[2,1],
        [0,0],[1,0],[2,0],
      ],

      INPUT_RE = /^([a-z])([12][0-9](?=(?:[k\s-]))|[1-9])((?:(?:\s+|-)?(?:kp?)?[1-9])*)(?:\s|-)?(?:kp?)?$/i,

      REPLACE_RE = /[^1-9]/g,

      MIN_ATOM = {},
      MAX_ATOM = {},
      MIN_X = 50,
      MAX_X = 1250,
      MIN_Y = 1579,
      MAX_Y = 800,

      C = [
        [50, 1579],
        [100, 1558],
        [150, 1538],
        [200, 1517],
        [250, 1496],
        [300, 1475],
        [350, 1453],
        [400, 1431],
        [450, 1409],
        [500, 1387],
        [550, 1364],
        [600, 1341],
        [650, 1317],
        [700, 1292],
        [750, 1267],
        [800, 1240],
        [850, 1212],
        [900, 1183],
        [950, 1152],
        [1000, 1118],
        [1050, 1081],
        [1100, 1039],
        [1150, 988],
        [1200, 918],
        [1250, 800]
      ],

      DR = 180/Math.PI
  ;

  var interpolator = function(d) {
    if (d < MIN_X) {
      return MIN_ATOM;
    } else if (d > MAX_X) {
      return MAX_ATOM;
    }
    var i, c, n, cx, cy, nx, ny, vx, vy, dx;
    for (i=0; i<C.length; i++) {
      c = C[i];
      n = C[i+1];
      cx = c[0];
      cy = c[1];

      if (d === cx) {
        return cy;
      }

      nx = n[0];

      if (nx <= d) { continue; }

      ny = n[1];

      vx = nx-cx;
      vy = ny-cy;

      dx = d-cx;

      return Math.round((vy/vx)*dx+cy);
    }
  };

  var milradian = function(d) {
    return (
      C.map(function(c,i) {
        return c*Math.pow(d,i);
      })
      .reduce(function(a,c) {
        return a+c;
      })
    );
  };

  function pretty(values) {
    var c = values[0].toUpperCase(),
        r = values[1],
        kp1 = values[2],
        kps = values.slice(3),
        grid = c + r,
        kp1str
    ;


    if (!kp1) { return grid; }

    kp1str = grid + '-KP' + kp1;

    if (!kps.length) { return kp1str; }

    return kp1str + '-' + kps.join('-');
  }


  var heading = function(p1,p2) {
    var x1 = p1[0],
        y1 = p1[1],
        x2 = p2[0],
        y2 = p2[1],
        dx = x2-x1,
        dy = y2-y1,
        m = Math.hypot(dx,dy),
        ux = dx / m,
        uy = dy / m,
        rad = Math.atan2(uy, ux),
        deg = rad * DR
    ;

    if (ux === 0 && uy === 1) { return 180; }

    if (x2>x1 && y2>=y1) {
      return deg+90;
    }
    //w
    if (x2>=x1 && y2<y1) {
      return deg+90;
    }
    //w
    if (x2<x1 && y2>=y1) {
      return deg+90;
    }
    //w
    if (x2<=x1 && y2<y1) {
      return (180-Math.abs(deg))+270;
    }
    //if (x2
  };

  var tl = function(p) {
    return [p[0], p[1]];
  };

  var tr = function(p) {
    return [p[0]+p[2], p[1]];
  };

  var br = function(p) {
    return [p[0]+p[2], p[1]+p[2]];
  };

  var bl = function(p) {
    return [p[0], p[1]+p[2]];
  };

  var pcontains = function(tl,br,p) {
    if (tl[0]<p[0] && br[0]>p[0] && tl[1]<p[1] && br[1]>p[1]) { return true; }
    return false;
  };

  var contains = function(tl1,br1, tl2,br2) {
    return (
      // tl
      pcontains(tl1,br1, tl2) ||
      // tr
      pcontains(tl1,br1, [br2[0],tl2[1]]) ||
      // br
      pcontains(tl1,br1, br2) ||
      // bl
      pcontains(tl1,br1, [tl2[0],br2[1]])
    );
  };

  var bearingwc = function(p1,p2) {
    var x1 = p1[0],
        y1 = p1[1],
        x2 = p2[0],
        y2 = p2[1],
        br1 = [x1+p1[2], y1+p1[2]],
        br2 = [x2+p2[2], y2+p2[2]],
    
        dx = x2-x1,
        dy = y2-y1,
        w // worst
    ;

    if (
        (x1===x2 && y1===y2) ||
        contains(p1,br1, p2,br2) ||
        contains(p2,br2, p1,br1)) {
      return null;
    }

    var c;
    if (dx===0 && dy<0)       { c=1; w = [[tr(p1), bl(p2)], [tl(p1), br(p2)]]; }
    else if (dx>0 && dy<0)    { c=2; w = [[br(p1), tl(p2)], [tl(p1), br(p2)]]; }
    else if (dx>0 && dy===0)  { c=3; w = [[br(p1), tl(p2)], [tr(p1), bl(p2)]]; }
    else if (dx>0 && dy>0)    { c=4; w = [[bl(p1), tr(p2)], [tr(p1), bl(p2)]]; }
    else if (dx===0 && dy>0)  { c=5; w = [[bl(p1), tr(p2)], [br(p1), tl(p2)]]; }
    else if (dx<0 && dy>0)    { c=6; w = [[tl(p1), br(p2)], [br(p1), tl(p2)]]; }
    else if (dx<0 && dy===0)  { c=7; w = [[tl(p1), br(p2)], [bl(p1), tr(p2)]]; }
    else                      { c=8; w = [[tr(p1), bl(p2)], [bl(p1), tr(p2)]]; }
    //console.log(dx,dy, c, ''+w);

    return [heading(w[0][0], w[0][1]), heading(w[1][0], w[1][1])];
  };


  var strs = function(str, re) {
    return str.match(re).slice(1);
   };

  function pvalues(str) {
    var pstrs = strs(str, INPUT_RE),
        gxs = pstrs[0],
        gys = pstrs[1],
        kps = pstrs[2],
        kp = kps.replace(REPLACE_RE,'').split('')
    ;

    return [gxs, gys].concat(kp);
  }

  function pos(values) {
    var gxs = values[0],
        gys = values[1],
        kps = values.slice(2)
    ;
    
    var gx = parseInt(gxs,36)-10,
        gy = parseInt(gys)-1,
        kp = (
          kps
            .map(function(ks){ return parseInt(ks); })
            .map(function(k){ return [KP_MAP[k-1][0], KP_MAP[k-1][1]]; })
            .map(function(k,i) {
              var e = Math.pow(1/3,i+1);
              return [k[0]*e, k[1]*e];
            })
        )
    ;

    var kpxa, kpya, kpx, kpy;
    if (kp.length) {
      kpxa = kp.map(function(k){ return k[0]; });
      kpya = kp.map(function(k){ return k[1]; });
      kpx = kpxa.reduce(function(a,c){ return a+c; });
      kpy = kpya.reduce(function(a,c){ return a+c; });
    } else {
      kpx = 0;
      kpy = 0;
    }

    
    var px = gx + kpx,
        py = gy + kpy
    ;

    var err = Math.pow((1/3), kp.length);
    console.log(err);
    
    return [px*GRID_SIZE, py*GRID_SIZE, err*GRID_SIZE];
  }

  function dist(pos1, pos2) {
    var x1 = pos1[0],
        y1 = pos1[1],
        e1 = pos1[2],
        x2 = pos2[0],
        y2 = pos2[1],
        e2 = pos2[2]
    ;
    
    return [
      Math.hypot(x2-x1, y2-y1),
      Math.hypot(e1, e2)
    ];
  }

  var i1el = document.getElementById('i1'),
      i2el = document.getElementById('i2'),
      oel = document.getElementById('output'),
      p1el = document.getElementById('p1'),
      p2el = document.getElementById('p2')
  ;

  var minMaxStr = function(m0,m1) {
    m0 = m0 === MAX_ATOM ? MAX_Y : m0;
    m1 = m1 === MIN_ATOM ? MIN_Y : m1;
    m0 = m0 < 0 ? 0 : m0;

    return '(min: ' + m0 + ', max: ' + m1 + ')';
  };

  var update = function() {
    var pretty1, pretty2;

    try {
      var iv1 = i1el.value,
          iv2 = i2el.value
      ;
     
      var v1, v2, pos1, pos2
      ;

      var pos1e = false,
          pos2e = false
      ;
      try {
        v1 = pvalues(iv1);
        pos1 = pos(v1);
        pretty1 = pretty(v1);
      } catch(e) {
        pos1e = true;
      }

      try {
        v2 = pvalues(iv2);
        pos2 = pos(v2);
        pretty2 = pretty(v2);
      } catch(e) {
        pos2e = true;
      }

      console.log(pos1e, pos2e);

      if (pos1e || pos2e) { throw new Error(); }

      var disterr = dist(pos1,pos2),

          distance = disterr[0],

          err = disterr[1],

          distStr = distance.toFixed(PRECISION),
          dist0 = distance-err,
          dist1 = distance+err,
          dist0s = dist0.toFixed(PRECISION),
          dist1s = dist1.toFixed(PRECISION),

          milrad0 = interpolator(dist1),
          milrad = interpolator(distance),
          milrad1 = interpolator(dist0),

          head = distance ? parseInt(heading(pos1, pos2)) : 0,
          berr = bearingwc(pos1, pos2)
      ;

      var ms;
      if (milrad !== MIN_ATOM && milrad !== MAX_ATOM) {
        ms = milrad + '</strong> <span>' + minMaxStr(milrad0,milrad1) + '</span>';
      } else {
        if (milrad === MAX_ATOM) {
          ms = 'Out of Range</strong>';
        } else {
          ms = 'Too Close</strong>';
        }
      }

      var bs;
      if (berr) {
        berr[0] = Math.floor(berr[0]) % 360;
        berr[1] = Math.ceil(berr[1]) % 360;

        bs = head + ' degrees</strong> <span>' + minMaxStr(berr[0],berr[1]) + '</span>';
      } else {
        bs = head + ' degrees</strong> <span>(high error)</span>';
      }
      
      var line1 = 'Distance: <strong>' + distStr + 'm</strong> <span>' + minMaxStr(dist0s,dist1s) + '</span>',
          line2 = 'Milliradian: <strong>' + ms,
          line3 = 'Bearing: <strong>' + bs
      ;

      oel.innerHTML = line1 + '<br>' + line2 + '<br>' + line3;
      p1el.innerHTML = '<pre>' + pretty1 + '</pre>';
      p2el.innerHTML = '<pre>' + pretty2 + '</pre>';
    } catch(_) {
      oel.innerHTML = '&nbsp;<br>&nbsp;<br>&nbsp;';
      p1el.innerHTML = pretty1 ? '<pre>' + pretty1 + '</pre>' : '';
      p2el.innerHTML = pretty2 ? '<pre>' + pretty2 + '</pre>' : '';
    }
  };

  var ilistener = function(e) {
    update();
  };

  i1el.addEventListener('input', ilistener);
  i2el.addEventListener('input', ilistener);

//})();
